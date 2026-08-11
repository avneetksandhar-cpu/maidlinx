"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui";
import type { AdminBookingDetail } from "@/lib/admin/bookings";
import type { AdminCleanerOption } from "@/lib/admin/cleaners";
import type { AdminMatchSuggestion } from "@/lib/admin/matches";
import type { BookingEventRecord } from "@/lib/bookings/events";
import {
  BOOKING_STATUS_LABELS,
  BOOKING_STATUSES,
  type BookingStatus,
} from "@/lib/bookings/status";
import { formatAdminCurrency, formatAdminDate, getServiceLabel } from "@/lib/admin/display";
import { opsMarketLabel, normalizeOpsMarketKey } from "@/lib/admin/market-ids";

interface BookingDetailPanelProps {
  bookingId: string | null;
  onClose: () => void;
}

export function BookingDetailPanel({ bookingId, onClose }: BookingDetailPanelProps) {
  const router = useRouter();
  const [booking, setBooking] = useState<AdminBookingDetail | null>(null);
  const [events, setEvents] = useState<BookingEventRecord[]>([]);
  const [cleaners, setCleaners] = useState<AdminCleanerOption[]>([]);
  const [matches, setMatches] = useState<AdminMatchSuggestion[]>([]);
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [cleanerId, setCleanerId] = useState("");

  useEffect(() => {
    if (!bookingId) return;

    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError(null);
      setMatches([]);
      setEvents([]);

      try {
        const [bookingRes, cleanersRes, matchesRes] = await Promise.all([
          fetch(`/api/admin/bookings/${bookingId}`).then((r) => r.json()),
          fetch("/api/admin/cleaners").then((r) => r.json()),
          fetch(`/api/admin/bookings/${bookingId}/matches`).then((r) => r.json()),
        ]);

        if (cancelled) return;
        if (bookingRes.error) throw new Error(bookingRes.error);

        const detail = bookingRes.data.booking as AdminBookingDetail;
        setBooking(detail);
        setStatus(detail.status);
        setCleanerId(detail.professionalProfileId ?? "");
        setEvents((bookingRes.data.events as BookingEventRecord[]) ?? []);
        setCleaners(
          (cleanersRes.data?.cleaners ?? [])
            .filter((c: { isActive: boolean }) => c.isActive)
            .map(
              (c: {
                profileId: string;
                firstName: string | null;
                lastName: string | null;
              }) => ({
                profileId: c.profileId,
                name: [c.firstName, c.lastName].filter(Boolean).join(" ") || "Unnamed",
                isActive: true,
              }),
            ),
        );
        if (!matchesRes.error && Array.isArray(matchesRes.data?.matches)) {
          setMatches(matchesRes.data.matches as AdminMatchSuggestion[]);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load booking.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  if (!bookingId) return null;

  async function patch(body: Record<string, unknown>) {
    if (!bookingId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "Update failed.");
      setBooking(payload.data.booking);
      setStatus(payload.data.booking.status);
      setCleanerId(payload.data.booking.professionalProfileId ?? "");
      setEvents(payload.data.events ?? []);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-ink/40"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-elevated">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">Booking detail</h2>
            {booking && (
              <p className="font-mono text-xs text-ink-muted">{booking.id.slice(0, 8)}</p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          {loading && <p className="text-sm text-ink-muted">Loading…</p>}
          {error && <p className="mb-4 text-sm text-error">{error}</p>}

          {booking && !loading && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={booking.status} />
                <span className="text-sm text-ink-muted">
                  {getServiceLabel(booking.serviceType)}
                </span>
                <span className="text-sm text-ink-muted">
                  {opsMarketLabel(normalizeOpsMarketKey(booking.marketId))}
                </span>
              </div>

              <DetailSection title="Customer">
                <DetailRow label="Name" value={booking.customerName ?? "—"} />
                <DetailRow label="Email" value={booking.customerEmail ?? "—"} />
                <DetailRow label="Phone" value={booking.customerPhone ?? "—"} />
              </DetailSection>

              <DetailSection title="Schedule">
                <DetailRow label="When" value={formatAdminDate(booking.scheduledAt)} />
                <DetailRow
                  label="Address"
                  value={
                    [booking.addressLine1, booking.addressCity, booking.addressState]
                      .filter(Boolean)
                      .join(", ") || "—"
                  }
                />
                <DetailRow
                  label="Total"
                  value={formatAdminCurrency(booking.totalCents, booking.currency)}
                />
              </DetailSection>

              <DetailSection title="Assignment">
                <DetailRow label="Assigned" value={booking.professionalName ?? "Unassigned"} />
                <DetailRow
                  label="Status"
                  value={
                    BOOKING_STATUS_LABELS[booking.status as BookingStatus] ?? booking.status
                  }
                />
              </DetailSection>

              {booking.payments.length > 0 && (
                <DetailSection title="Payments">
                  {booking.payments.map((p) => (
                    <DetailRow
                      key={p.id}
                      label={p.paymentType}
                      value={`${formatAdminCurrency(p.amountCents)} · ${p.status}`}
                    />
                  ))}
                </DetailSection>
              )}

              <DetailSection title="Event timeline">
                {events.length === 0 ? (
                  <p className="text-sm text-ink-muted">No events logged yet.</p>
                ) : (
                  <ol className="space-y-2 border-l border-border pl-3">
                    {events.map((event) => (
                      <li key={event.id} className="relative text-sm">
                        <span className="absolute -left-[17px] top-1.5 h-2 w-2 rounded-full bg-navy" />
                        <p className="font-medium text-ink">{event.eventType}</p>
                        <p className="text-xs text-ink-muted">
                          {formatAdminDate(event.createdAt)}
                          {event.actorRole ? ` · ${event.actorRole}` : ""}
                        </p>
                      </li>
                    ))}
                  </ol>
                )}
              </DetailSection>

              <div className="space-y-3 border-t border-border pt-4">
                <label className="block text-sm">
                  <span className="font-medium text-ink">Change status</span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="mt-1 h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm"
                  >
                    {BOOKING_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {BOOKING_STATUS_LABELS[s as BookingStatus]}
                      </option>
                    ))}
                  </select>
                </label>
                <Button
                  size="sm"
                  disabled={saving || status === booking.status}
                  onClick={() => void patch({ status })}
                >
                  Update status
                </Button>
              </div>

              <div className="space-y-3 border-t border-border pt-4">
                {matches.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-ink">Eligible cleaners</p>
                    <p className="text-xs text-ink-muted">
                      Ranked by match score with factor explanation. Select, then assign.
                    </p>
                    <ul className="max-h-64 space-y-2 overflow-y-auto">
                      {matches.map((match) => {
                        const selected = cleanerId === match.profileId;
                        const open = expandedMatch === match.profileId;
                        return (
                          <li key={match.profileId}>
                            <button
                              type="button"
                              onClick={() => {
                                setCleanerId(match.profileId);
                                setExpandedMatch(open ? null : match.profileId);
                              }}
                              className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
                                selected
                                  ? "border-accent bg-accent-muted"
                                  : "border-border bg-surface hover:border-accent/40"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-sm font-medium text-ink">{match.name}</span>
                                <span className="shrink-0 font-mono text-xs font-semibold text-navy">
                                  {match.score}
                                </span>
                              </div>
                              {match.reasonChips.length > 0 && (
                                <p className="mt-1.5 text-[11px] leading-snug text-ink-subtle">
                                  {match.reasonChips.join(" · ")}
                                </p>
                              )}
                              {open && match.factors?.length > 0 && (
                                <ul className="mt-2 space-y-1 border-t border-border/70 pt-2">
                                  {match.factors.map((factor) => (
                                    <li
                                      key={factor.key}
                                      className="flex justify-between gap-2 text-[11px] text-ink-muted"
                                    >
                                      <span>
                                        {factor.label}
                                        {factor.skipped ? " (neutral)" : ""}
                                      </span>
                                      <span className="font-mono">
                                        {factor.points > 0 ? "+" : ""}
                                        {factor.points.toFixed(1)}/{factor.weight}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                <label className="block text-sm">
                  <span className="font-medium text-ink">Assign / reassign cleaner</span>
                  <select
                    value={cleanerId}
                    onChange={(e) => setCleanerId(e.target.value)}
                    className="mt-1 h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm"
                  >
                    <option value="">Select cleaner…</option>
                    {cleaners.map((c) => (
                      <option key={c.profileId} value={c.profileId}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    disabled={saving || !cleanerId}
                    onClick={() =>
                      void patch({ action: "assign", professionalProfileId: cleanerId })
                    }
                  >
                    {booking.professionalProfileId ? "Reassign cleaner" : "Assign cleaner"}
                  </Button>
                  {booking.professionalProfileId && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={saving}
                      onClick={() => void patch({ action: "cancel_assignment" })}
                    >
                      Cancel assignment
                    </Button>
                  )}
                  {booking.status !== "cancelled" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={saving}
                      onClick={() => void patch({ action: "cancel" })}
                    >
                      Cancel booking
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-subtle">
        {title}
      </h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-ink-muted">{label}</span>
      <span className="text-right font-medium text-ink">{value}</span>
    </div>
  );
}
