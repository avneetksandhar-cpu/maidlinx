import { getServiceById } from "@/config/services";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  emitBookingEvent,
  eventTypeForStatusTransition,
} from "@/lib/bookings/events";
import {
  ACTIVE_JOB_STATUSES,
  AVAILABLE_JOB_STATUSES,
  normalizeBookingStatus,
  type BookingStatus,
} from "@/lib/bookings/status";
import { isCleanerEligibleForJob } from "@/lib/cleaners/eligibility";
import type { Database, Json } from "@/types/database.types";
import {
  getChecklistForService,
  parseChecklist,
  type ChecklistItem,
} from "@/lib/pro/dashboard/checklist";
import { estimateJobDurationMinutes } from "@/lib/pro/dashboard/duration";
import { sanitizeAvailableJob } from "@/lib/pro/dashboard/pii";
import { getCleanerCapabilities } from "@/lib/pro/dashboard/capabilities";
import { validateCleanerStatusTransition } from "@/lib/pro/job-transitions";
import { checkEligibility, type EligibilityCleaner } from "@/lib/matching/eligibility";
import { resolveDistance } from "@/lib/matching/geo";
import type { MatchBooking, MatchContext } from "@/lib/matching/types";

export interface ProJob {
  id: string;
  status: string;
  serviceType: string;
  serviceId: string | null;
  scheduledAt: string;
  arrivalWindowStart: string | null;
  arrivalWindowEnd: string | null;
  subtotalCents: number;
  platformFeeCents: number;
  totalCents: number;
  currency: string;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number | null;
  extras: string[];
  notes: string | null;
  customerFirstName: string | null;
  customerLastName: string | null;
  customerPhone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressPostalCode: string | null;
  addressLatitude: number | null;
  addressLongitude: number | null;
  professionalProfileId: string | null;
  marketId: string | null;
  zoneId: string | null;
  jobChecklist: ChecklistItem[];
  startedAt: string | null;
  completedAt: string | null;
  beforePhotoCount: number;
  afterPhotoCount: number;
  estimatedDurationMinutes: number;
  distanceKm: number | null;
  travelMinutes: number | null;
  /** False for marketplace listings until accept/assign. */
  addressRevealed: boolean;
}

export interface JobPhoto {
  id: string;
  photoType: "before" | "after";
  publicUrl: string;
  createdAt: string;
}

export { sanitizeAvailableJob } from "@/lib/pro/dashboard/pii";

function mapJob(
  row: Record<string, unknown>,
  photoCounts?: { before: number; after: number },
  extras?: { distanceKm?: number | null; travelMinutes?: number | null; addressRevealed?: boolean },
): ProJob {
  const serviceType = String(row.service_type);
  const bedrooms = Number(row.bedrooms);
  const bathrooms = Number(row.bathrooms);
  const squareFootage = row.square_footage ? Number(row.square_footage) : null;
  const extrasList = Array.isArray(row.extras) ? (row.extras as string[]) : [];
  const serviceId = row.service_id ? String(row.service_id) : null;

  return {
    id: String(row.id),
    status: String(row.status),
    serviceType,
    serviceId,
    scheduledAt: String(row.scheduled_at),
    arrivalWindowStart: row.arrival_window_start ? String(row.arrival_window_start) : null,
    arrivalWindowEnd: row.arrival_window_end ? String(row.arrival_window_end) : null,
    subtotalCents: Number(row.subtotal_cents),
    platformFeeCents: Number(row.platform_fee_cents),
    totalCents: Number(row.total_cents),
    currency: String(row.currency),
    bedrooms,
    bathrooms,
    squareFootage,
    extras: extrasList,
    notes: row.notes ? String(row.notes) : null,
    customerFirstName: row.customer_first_name ? String(row.customer_first_name) : null,
    customerLastName: row.customer_last_name ? String(row.customer_last_name) : null,
    customerPhone: row.customer_phone ? String(row.customer_phone) : null,
    addressLine1: row.address_line1 ? String(row.address_line1) : null,
    addressLine2: row.address_line2 ? String(row.address_line2) : null,
    addressCity: row.address_city ? String(row.address_city) : null,
    addressState: row.address_state ? String(row.address_state) : null,
    addressPostalCode: row.address_postal_code ? String(row.address_postal_code) : null,
    addressLatitude: row.address_latitude ? Number(row.address_latitude) : null,
    addressLongitude: row.address_longitude ? Number(row.address_longitude) : null,
    professionalProfileId: row.professional_profile_id
      ? String(row.professional_profile_id)
      : null,
    marketId: row.market_id ? String(row.market_id) : null,
    zoneId: row.zone_id ? String(row.zone_id) : null,
    jobChecklist: parseChecklist(row.job_checklist),
    startedAt: row.started_at ? String(row.started_at) : null,
    completedAt: row.completed_at ? String(row.completed_at) : null,
    beforePhotoCount: photoCounts?.before ?? 0,
    afterPhotoCount: photoCounts?.after ?? 0,
    estimatedDurationMinutes: estimateJobDurationMinutes({
      serviceType,
      serviceId,
      bedrooms,
      bathrooms,
      squareFootage,
      extrasCount: extrasList.length,
    }),
    distanceKm: extras?.distanceKm ?? null,
    travelMinutes: extras?.travelMinutes ?? null,
    addressRevealed: extras?.addressRevealed ?? Boolean(row.professional_profile_id),
  };
}

const jobSelect = "*";

async function getCleanerIdForUser(userId: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("cleaners")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data?.id ? String(data.id) : null;
}

async function recordCleanerAssignment(params: {
  bookingId: string;
  cleanerId: string;
  source: "self_accept" | "admin_manual";
  assignedBy?: string | null;
}): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("cleaner_assignments").insert({
    booking_id: params.bookingId,
    cleaner_id: params.cleanerId,
    assigned_by: params.assignedBy ?? null,
    source: params.source,
    status: "active",
  });

  if (error) throw new Error(error.message);
}

function emptyMatchContext(
  availabilityByProfileId: MatchContext["availabilityByProfileId"],
): MatchContext {
  return {
    availabilityByProfileId,
    serviceAreaPostalCodes: new Set(),
    serviceAreaCityStates: new Set(),
    completedJobsByProfileId: new Map(),
    cancelledJobsByProfileId: new Map(),
    favoriteProfileIds: new Set(),
    repeatProfileIds: new Set(),
    existingJobsByProfileId: new Map(),
    requireVerified: false,
  };
}

async function loadCleanerMatchContext(profileId: string): Promise<{
  cleaner: EligibilityCleaner | null;
  context: MatchContext;
}> {
  const supabase = createAdminClient();
  const capabilities = await getCleanerCapabilities(profileId);

  const { data: pro } = await supabase
    .from("professionals")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();

  const { data: availability } = await supabase
    .from("professional_availability")
    .select("day_of_week, arrival_window, is_available")
    .eq("professional_profile_id", profileId);

  const { data: existingJobs } = await supabase
    .from("bookings")
    .select("id, scheduled_at, bedrooms, bathrooms, square_footage, extras, service_type")
    .eq("professional_profile_id", profileId)
    .in("status", ACTIVE_JOB_STATUSES);

  const proRow = (pro ?? {}) as Record<string, unknown>;
  const availabilityByProfileId = new Map<
    string,
    Array<{ dayOfWeek: number; arrivalWindow: string; isAvailable: boolean }>
  >();
  availabilityByProfileId.set(
    profileId,
    (availability ?? []).map((row) => ({
      dayOfWeek: Number((row as { day_of_week: number }).day_of_week),
      arrivalWindow: String((row as { arrival_window: string }).arrival_window),
      isAvailable: Boolean((row as { is_available: boolean }).is_available),
    })),
  );

  const existingJobsByProfileId = new Map<
    string,
    Array<{ bookingId: string; scheduledAt: string; durationMinutes: number }>
  >();
  existingJobsByProfileId.set(
    profileId,
    (existingJobs ?? []).map((row) => {
      const record = row as Record<string, unknown>;
      const extras = Array.isArray(record.extras) ? (record.extras as string[]) : [];
      return {
        bookingId: String(record.id),
        scheduledAt: String(record.scheduled_at),
        durationMinutes: estimateJobDurationMinutes({
          serviceType: String(record.service_type),
          bedrooms: Number(record.bedrooms ?? 0),
          bathrooms: Number(record.bathrooms ?? 1),
          squareFootage: record.square_footage ? Number(record.square_footage) : null,
          extrasCount: extras.length,
        }),
      };
    }),
  );

  const context = {
    ...emptyMatchContext(availabilityByProfileId),
    existingJobsByProfileId,
  };

  if (!pro && !capabilities) {
    return { cleaner: null, context };
  }

  const offeredServiceTypes =
    capabilities && capabilities.serviceIds.length > 0
      ? capabilities.serviceIds.flatMap((id) => {
          const svc = getServiceById(id);
          return svc ? [svc.legacyServiceType, svc.id] : [id];
        })
      : undefined;

  const cleaner: EligibilityCleaner = {
    profileId,
    cleanerId: capabilities?.cleanerId ?? String(proRow.id ?? profileId),
    name: [proRow.first_name, proRow.last_name].filter(Boolean).join(" ") || "Cleaner",
    isActive: proRow.is_active !== false,
    isVerified: Boolean(proRow.is_verified),
    yearsExperience: Number(proRow.years_experience ?? 0),
    ratingAverage: Number(proRow.rating_average ?? 0),
    ratingCount: Number(proRow.rating_count ?? 0),
    serviceRadiusKm: Number(capabilities?.travelRadiusKm ?? proRow.service_radius_km ?? 25),
    latitude: proRow.latitude != null ? Number(proRow.latitude) : null,
    longitude: proRow.longitude != null ? Number(proRow.longitude) : null,
    postalCode: proRow.postal_code ? String(proRow.postal_code) : null,
    city: proRow.city ? String(proRow.city) : null,
    state: proRow.state ? String(proRow.state) : null,
    offeredServiceTypes,
    zoneIds: capabilities?.zoneIds,
    hasVehicle: capabilities?.hasVehicle,
    qualifications: capabilities?.qualifications,
  };

  return { cleaner, context };
}

function enrichDistance(
  job: ProJob,
  cleaner: EligibilityCleaner | null,
): Pick<ProJob, "distanceKm" | "travelMinutes"> {
  if (!cleaner) return { distanceKm: null, travelMinutes: null };

  const distance = resolveDistance({
    bookingLat: job.addressLatitude,
    bookingLng: job.addressLongitude,
    cleanerLat: cleaner.latitude,
    cleanerLng: cleaner.longitude,
    bookingPostal: job.addressPostalCode,
    cleanerPostal: cleaner.postalCode,
    bookingCity: job.addressCity,
    bookingState: job.addressState,
    cleanerCity: cleaner.city,
    cleanerState: cleaner.state,
  });

  if (distance.kind === "unknown") {
    return { distanceKm: null, travelMinutes: null };
  }

  const distanceKm = Math.round(distance.distanceKm * 10) / 10;
  // ~30 km/h urban average for travel estimate (no Maps API).
  const travelMinutes = Math.max(5, Math.round((distance.distanceKm / 30) * 60));
  return { distanceKm, travelMinutes };
}

export async function getAvailableJobs(profileId?: string): Promise<ProJob[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(jobSelect)
    .in("status", AVAILABLE_JOB_STATUSES)
    .is("professional_profile_id", null)
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(50);

  if (error) throw new Error(error.message);

  const { cleaner, context } = profileId
    ? await loadCleanerMatchContext(profileId)
    : { cleaner: null, context: null };
  const capabilities = profileId ? await getCleanerCapabilities(profileId) : null;

  const jobs = (data ?? [])
    .map((row) => mapJob(row as Record<string, unknown>, undefined, { addressRevealed: false }))
    .filter((job) => {
      if (capabilities) {
        // Capability catalog gate (services/zones). Verification is soft on the feed.
        const capabilityOk = isCleanerEligibleForJob(
          {
            cleanerId: capabilities.cleanerId,
            approved: true,
            active: cleaner?.isActive ?? true,
            services: capabilities.serviceIds,
            serviceZones: capabilities.zoneIds,
            travelRadiusKm: capabilities.travelRadiusKm ?? cleaner?.serviceRadiusKm ?? 25,
            qualifications: capabilities.qualifications,
            yearsExperience: cleaner?.yearsExperience ?? null,
          },
          {
            serviceType: job.serviceType,
            serviceId: job.serviceId,
            marketId: job.marketId,
            serviceZoneId: job.zoneId,
            zoneId: job.zoneId,
          },
        );
        if (!capabilityOk) return false;
      }

      if (!cleaner || !context) return true;

      const booking: MatchBooking = {
        id: job.id,
        customerId: null,
        serviceType: job.serviceType,
        serviceId: job.serviceId,
        marketId: job.marketId,
        zoneId: job.zoneId,
        scheduledAt: job.scheduledAt,
        arrivalWindowStart: job.arrivalWindowStart,
        arrivalWindowEnd: job.arrivalWindowEnd,
        durationMinutes: job.estimatedDurationMinutes,
        notes: null,
        bedrooms: job.bedrooms,
        bathrooms: job.bathrooms,
        subtotalCents: job.subtotalCents,
        platformFeeCents: job.platformFeeCents,
        totalCents: job.totalCents,
        addressCity: job.addressCity,
        addressState: job.addressState,
        addressPostalCode: job.addressPostalCode,
        addressLatitude: job.addressLatitude,
        addressLongitude: job.addressLongitude,
        extrasKeys: job.extras,
      };

      const result = checkEligibility(booking, cleaner, {
        ...context,
        requireVerified: false,
      });

      const hardBlocks = result.reasons.filter(
        (r) =>
          r === "inactive" ||
          r === "service_not_offered" ||
          r === "zone_not_covered" ||
          r === "cannot_reach" ||
          r === "unavailable" ||
          r === "schedule_conflict" ||
          r === "requirements_not_met",
      );
      return hardBlocks.length === 0;
    })
    .map((job) => {
      const travel = enrichDistance(job, cleaner);
      return sanitizeAvailableJob({ ...job, ...travel, addressRevealed: false });
    });

  return jobs;
}

export async function getJobHistory(profileId: string, limit = 50): Promise<ProJob[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(jobSelect)
    .eq("professional_profile_id", profileId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) =>
    mapJob(row as Record<string, unknown>, undefined, { addressRevealed: true }),
  );
}

function dayBounds(reference = new Date()): { start: Date; end: Date } {
  const start = new Date(reference);
  start.setHours(0, 0, 0, 0);
  const end = new Date(reference);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export async function getTodaySchedule(profileId: string): Promise<ProJob[]> {
  const supabase = createAdminClient();
  const { start, end } = dayBounds();

  const { data, error } = await supabase
    .from("bookings")
    .select(jobSelect)
    .eq("professional_profile_id", profileId)
    .gte("scheduled_at", start.toISOString())
    .lte("scheduled_at", end.toISOString())
    .in("status", [...ACTIVE_JOB_STATUSES, "completed"])
    .order("scheduled_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) =>
    mapJob(row as Record<string, unknown>, undefined, { addressRevealed: true }),
  );
}

export async function getMyJobs(profileId: string): Promise<ProJob[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(jobSelect)
    .eq("professional_profile_id", profileId)
    .in("status", ACTIVE_JOB_STATUSES)
    .order("scheduled_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) =>
    mapJob(row as Record<string, unknown>, undefined, { addressRevealed: true }),
  );
}

/** Assigned jobs scheduled after today (or later today already covered by TODAY). */
export async function getUpcomingJobs(profileId: string): Promise<ProJob[]> {
  const supabase = createAdminClient();
  const { end } = dayBounds();

  const { data, error } = await supabase
    .from("bookings")
    .select(jobSelect)
    .eq("professional_profile_id", profileId)
    .in("status", ACTIVE_JOB_STATUSES)
    .gt("scheduled_at", end.toISOString())
    .order("scheduled_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) =>
    mapJob(row as Record<string, unknown>, undefined, { addressRevealed: true }),
  );
}

/**
 * Authorization gate: only the assigned cleaner may load private job details.
 * Returns null for other cleaners (including assigned-to-someone-else).
 */
export async function getJobForProfessional(
  jobId: string,
  profileId: string,
): Promise<ProJob | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(jobSelect)
    .eq("id", jobId)
    .eq("professional_profile_id", profileId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  if (String(data.professional_profile_id) !== profileId) {
    return null;
  }

  const photos = await getJobPhotos(jobId, profileId);
  const before = photos.filter((p) => p.photoType === "before").length;
  const after = photos.filter((p) => p.photoType === "after").length;

  return mapJob(data as Record<string, unknown>, { before, after }, { addressRevealed: true });
}

/** Explicit denial helper for tests / API — never returns another cleaner's job. */
export async function assertCanAccessAssignedJob(
  jobId: string,
  profileId: string,
): Promise<ProJob> {
  const job = await getJobForProfessional(jobId, profileId);
  if (!job) {
    throw new Error("You do not have access to this job.");
  }
  return job;
}

export async function transitionJobStatus(
  jobId: string,
  profileId: string,
  toStatus: BookingStatus,
): Promise<void> {
  const supabase = createAdminClient();

  const { data: job, error: fetchError } = await supabase
    .from("bookings")
    .select("id, status, professional_profile_id, service_type")
    .eq("id", jobId)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!job) throw new Error("Job not found.");

  const fromStatus = normalizeBookingStatus(String(job.status)) as BookingStatus;
  const normalizedTo = normalizeBookingStatus(toStatus) as BookingStatus;

  if (normalizedTo === "accepted" || normalizedTo === "assigned") {
    if (job.professional_profile_id) {
      throw new Error("You do not have access to this job.");
    }
  } else if (String(job.professional_profile_id) !== profileId) {
    throw new Error("You do not have access to this job.");
  }

  const validation = validateCleanerStatusTransition(fromStatus, normalizedTo);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  if (normalizedTo === "completed") {
    const existing = await getJobForProfessional(jobId, profileId);
    if (!existing) throw new Error("Job not found.");

    const incomplete = existing.jobChecklist.filter((item) => !item.completed);
    if (incomplete.length > 0) {
      throw new Error("Complete the job checklist before marking done.");
    }

    if (existing.beforePhotoCount < 1 || existing.afterPhotoCount < 1) {
      throw new Error("Upload at least one before and one after photo.");
    }
  }

  const updatePayload: Database["public"]["Tables"]["bookings"]["Update"] = {
    status: normalizedTo,
  };
  let acceptedCleanerId: string | null = null;
  const isClaim = normalizedTo === "accepted" || normalizedTo === "assigned";

  if (isClaim) {
    acceptedCleanerId = await getCleanerIdForUser(profileId);
    if (!acceptedCleanerId) {
      throw new Error("Cleaner profile not found.");
    }

    updatePayload.professional_profile_id = profileId;
    updatePayload.professional_id = profileId;
    updatePayload.cleaner_id = acceptedCleanerId;
    updatePayload.job_checklist = getChecklistForService(
      String(job.service_type),
    ) as unknown as Json;
  }
  if (normalizedTo === "in_progress") {
    updatePayload.started_at = new Date().toISOString();
  }
  if (normalizedTo === "completed") {
    updatePayload.completed_at = new Date().toISOString();
  }

  let query = supabase.from("bookings").update(updatePayload).eq("id", jobId);

  if (isClaim) {
    query = query
      .in("status", ["awaiting_assignment", "offered"])
      .is("professional_profile_id", null);
  } else {
    query = query
      .eq("professional_profile_id", profileId)
      .eq("status", fromStatus as BookingStatus);
  }

  const { data: updated, error } = await query.select("id").maybeSingle();

  if (error) throw new Error(error.message);
  if (!updated) {
    throw new Error("Status update failed. The job may have changed.");
  }

  await emitBookingEvent({
    bookingId: jobId,
    type: eventTypeForStatusTransition(normalizedTo),
    actor: { id: profileId, role: "cleaner" },
    metadata: { fromStatus, toStatus: normalizedTo },
  });

  // Privacy: drop live GPS when leaving en-route / arrived.
  try {
    const { clearLiveLocationIfNeeded } = await import("@/lib/location/live-location");
    await clearLiveLocationIfNeeded(jobId, normalizedTo);
  } catch {
    // Non-fatal — status transition already succeeded.
  }

  if (isClaim) {
    if (acceptedCleanerId) {
      await recordCleanerAssignment({
        bookingId: jobId,
        cleanerId: acceptedCleanerId,
        source: "self_accept",
        assignedBy: profileId,
      });
    }
    await notifyJobStatusForBooking(jobId, normalizedTo);
    return;
  }

  await notifyJobStatusForBooking(jobId, normalizedTo);
}

export async function acceptJob(jobId: string, profileId: string): Promise<void> {
  await transitionJobStatus(jobId, profileId, "accepted");
}

export async function cleanerOnWayJob(jobId: string, profileId: string): Promise<void> {
  await transitionJobStatus(jobId, profileId, "on_the_way");
}

export async function cleanerArrivedJob(jobId: string, profileId: string): Promise<void> {
  await transitionJobStatus(jobId, profileId, "arrived");
}

/** @deprecated Use cleanerOnWayJob */
export const onTheWayJob = cleanerOnWayJob;

export async function startJob(jobId: string, profileId: string): Promise<void> {
  await transitionJobStatus(jobId, profileId, "in_progress");
}

export async function completeJob(jobId: string, profileId: string): Promise<void> {
  await transitionJobStatus(jobId, profileId, "completed");
}

async function notifyJobStatusForBooking(jobId: string, toStatus: string): Promise<void> {
  try {
    const { getBookingById } = await import("@/lib/bookings/repository");
    const { notifyJobStatusChange } = await import("@/lib/notifications");
    const booking = await getBookingById(jobId);
    if (!booking) return;
    await notifyJobStatusChange(booking, toStatus);
  } catch (error) {
    console.error("[jobs] status notification failed:", error);
  }
}

export async function updateJobChecklist(
  jobId: string,
  profileId: string,
  checklist: ChecklistItem[],
): Promise<void> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .update({ job_checklist: checklist as unknown as Json })
    .eq("id", jobId)
    .eq("professional_profile_id", profileId)
    .in("status", ACTIVE_JOB_STATUSES)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("You do not have access to this job.");
}

export async function getJobPhotos(jobId: string, profileId?: string): Promise<JobPhoto[]> {
  if (profileId) {
    const owned = await createAdminClient()
      .from("bookings")
      .select("id")
      .eq("id", jobId)
      .eq("professional_profile_id", profileId)
      .maybeSingle();
    if (owned.error) throw new Error(owned.error.message);
    if (!owned.data) return [];
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("booking_job_photos")
    .select("*")
    .eq("booking_id", jobId)
    .order("created_at", { ascending: true });

  if (error) {
    if (error.message.includes("booking_job_photos")) return [];
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const record = row as Record<string, unknown>;
    return {
      id: String(record.id),
      photoType: record.photo_type as "before" | "after",
      publicUrl: String(record.public_url),
      createdAt: String(record.created_at),
    };
  });
}

export async function uploadJobPhoto(
  jobId: string,
  profileId: string,
  photoType: "before" | "after",
  file: Buffer,
  fileName: string,
  contentType: string,
): Promise<JobPhoto> {
  const job = await getJobForProfessional(jobId, profileId);
  if (!job) throw new Error("You do not have access to this job.");
  if (!ACTIVE_JOB_STATUSES.includes(job.status as (typeof ACTIVE_JOB_STATUSES)[number])) {
    throw new Error("Photos can only be uploaded for active jobs.");
  }

  const supabase = createAdminClient();
  const ext = fileName.split(".").pop() ?? "jpg";
  const storagePath = `${jobId}/${photoType}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("job-photos")
    .upload(storagePath, file, { contentType, upsert: false });

  if (uploadError) throw new Error(uploadError.message);

  const { data: publicData } = supabase.storage.from("job-photos").getPublicUrl(storagePath);

  const { data, error } = await supabase
    .from("booking_job_photos")
    .insert({
      booking_id: jobId,
      professional_profile_id: profileId,
      photo_type: photoType,
      storage_path: storagePath,
      public_url: publicData.publicUrl,
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to save photo record.");

  const record = data as Record<string, unknown>;
  return {
    id: String(record.id),
    photoType: record.photo_type as "before" | "after",
    publicUrl: String(record.public_url),
    createdAt: String(record.created_at),
  };
}
