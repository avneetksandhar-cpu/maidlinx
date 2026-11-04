import { VERIFICATION_GATES, type VerificationGate, type WingmanStatus } from "@/lib/marketplace/constants";

export type VerificationChecklist = Record<VerificationGate, boolean>;

export function emptyChecklist(): VerificationChecklist {
  return {
    consent: false,
    identity: false,
    phone: false,
    email: false,
    inventory_authority: false,
    agreement: false,
    payout: false,
    media: false,
    policy: false,
    test_booking: false,
    gov_id: false,
    selfie_liveness: false,
    screening_manual: false,
    code_of_conduct: false,
    emergency_contact: false,
    service_boundary: false,
    no_show_policy: false,
    payment_auth: false,
  };
}

export function checklistComplete(checklist: VerificationChecklist): boolean {
  return VERIFICATION_GATES.every((gate) => checklist[gate] === true);
}

export function canPublishWingman(args: {
  checklist: VerificationChecklist;
  status: WingmanStatus;
}): boolean {
  return args.status === "verified" && checklistComplete(args.checklist);
}

export function canSetVerified(checklist: VerificationChecklist): boolean {
  return checklistComplete(checklist);
}

export function publicWingmanPayload<T extends Record<string, unknown>>(row: T) {
  return {
    id: row.id,
    displayName: row.display_name ?? row.displayName,
    photoUrl: row.photo_url ?? row.photoUrl ?? null,
    verificationStatus: row.verification_status ?? row.verificationStatus,
    areas: row.areas ?? [],
    specialties: row.specialties ?? [],
    languages: row.languages ?? [],
    responseWindowMinutes: row.response_window_minutes ?? row.responseWindowMinutes ?? null,
    biography: row.biography ?? null,
  };
}
