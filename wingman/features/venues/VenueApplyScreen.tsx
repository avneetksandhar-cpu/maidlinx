"use client";

import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { VENUE_CATEGORIES, VENUE_CATEGORY_LABEL } from "@/lib/venues/types";
import Link from "next/link";
import { useState } from "react";

const emptyForm = {
  venueName: "",
  venueType: "club",
  neighborhood: "",
  address: "",
  website: "",
  instagram: "",
  description: "",
  logoUrl: "",
  heroPhotoUrl: "",
  hoursText: "",
  musicGenres: "",
  dressCode: "",
  guestProfile: "",
  reservationUrl: "",
  ticketUrl: "",
  tableMinimums: "",
  upcomingEvents: "",
  legalName: "",
  licenseNumber: "",
  contactName: "",
  contactTitle: "",
  businessEmail: "",
  phone: "",
  authorityAttested: false,
  accuracyAttested: false,
  mediaRightsAttested: false,
};

export function VenueApplyScreen() {
  const { user, loading } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit() {
    if (!user) return;
    setBusy(true);
    setError(null);
    const response = await fetch("/api/venues/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const payload = (await response.json()) as { error?: string; note?: string };
    setBusy(false);
    if (!response.ok) {
      setError(payload.error ?? "Could not send the application.");
      return;
    }
    setDone(payload.note ?? "Application received.");
  }

  return (
    <AppShell showNav>
      <AppHeader title="List your venue" showBack backHref="/venues" />
      <h1 className="font-display text-4xl text-ink">Build your brand profile.</h1>
      <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-ink-muted">
        Clubs and restaurants verify everything before they join. Nothing is listed as a Wingman
        Partner until we approve it.
      </p>

      {done ? (
        <div className="mt-10">
          <p className="text-[1.05rem] leading-relaxed text-ink">{done}</p>
          <Link href="/venue" className="mt-6 inline-block text-champagne">
            Open venue desk
          </Link>
        </div>
      ) : !loading && !user ? (
        <div className="mt-10">
          <p className="text-[0.95rem] text-ink-muted">
            Sign in to create the official profile for your room.
          </p>
          <Link href="/auth?next=/venues/apply" className="mt-6 block">
            <Button fullWidth size="lg">
              Sign in to apply
            </Button>
          </Link>
        </div>
      ) : (
        <div className="mt-8">
          <p className="text-label">
            {step === 1 ? "Brand" : step === 2 ? "The room" : "Verify"} · {step} of 3
          </p>

          {step === 1 ? (
            <div className="mt-6 space-y-4">
              <Field label="Venue name" value={form.venueName} onChange={(value) => set("venueName", value)} />
              <label className="block">
                <span className="text-label">Type</span>
                <select
                  value={form.venueType}
                  onChange={(event) => set("venueType", event.target.value)}
                  className="field mt-2"
                >
                  {VENUE_CATEGORIES.map((item) => (
                    <option key={item} value={item}>
                      {VENUE_CATEGORY_LABEL[item]}
                    </option>
                  ))}
                </select>
              </label>
              <Field label="Neighborhood" value={form.neighborhood} onChange={(value) => set("neighborhood", value)} />
              <Field label="Street address" value={form.address} onChange={(value) => set("address", value)} />
              <Field label="Website" value={form.website} onChange={(value) => set("website", value)} />
              <Field label="Instagram" value={form.instagram} onChange={(value) => set("instagram", value)} />
              <Area label="Brand story" value={form.description} onChange={(value) => set("description", value)} />
              <Field label="Logo URL" value={form.logoUrl} onChange={(value) => set("logoUrl", value)} />
              <Field label="Hero photo URL" value={form.heroPhotoUrl} onChange={(value) => set("heroPhotoUrl", value)} />
              <Button fullWidth onClick={() => setStep(2)}>
                Continue
              </Button>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="mt-6 space-y-4">
              <Field label="Hours" value={form.hoursText} onChange={(value) => set("hoursText", value)} />
              <Field label="Music" value={form.musicGenres} onChange={(value) => set("musicGenres", value)} />
              <Field label="Dress code" value={form.dressCode} onChange={(value) => set("dressCode", value)} />
              <Field label="Who the room is for" value={form.guestProfile} onChange={(value) => set("guestProfile", value)} />
              <Field label="Reservation link" value={form.reservationUrl} onChange={(value) => set("reservationUrl", value)} />
              <Field label="Ticket link" value={form.ticketUrl} onChange={(value) => set("ticketUrl", value)} />
              <Field label="Table minimums" value={form.tableMinimums} onChange={(value) => set("tableMinimums", value)} />
              <Area label="Upcoming nights" value={form.upcomingEvents} onChange={(value) => set("upcomingEvents", value)} />
              <Button fullWidth onClick={() => setStep(3)}>
                Continue to verification
              </Button>
              <button type="button" className="text-sm text-ink-subtle" onClick={() => setStep(1)}>
                Back
              </button>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="mt-6 space-y-4">
              <Field label="Legal business name" value={form.legalName} onChange={(value) => set("legalName", value)} />
              <Field
                label="Business license or occupancy number"
                value={form.licenseNumber}
                onChange={(value) => set("licenseNumber", value)}
              />
              <Field label="Authorized contact" value={form.contactName} onChange={(value) => set("contactName", value)} />
              <Field label="Title at the venue" value={form.contactTitle} onChange={(value) => set("contactTitle", value)} />
              <Field label="Business email" value={form.businessEmail} onChange={(value) => set("businessEmail", value)} />
              <Field label="Phone" value={form.phone} onChange={(value) => set("phone", value)} />
              <label className="flex items-start gap-3 pt-2 text-[0.9rem] text-ink">
                <input
                  type="checkbox"
                  checked={form.authorityAttested}
                  onChange={(event) => set("authorityAttested", event.target.checked)}
                  className="mt-1"
                />
                I am authorized to represent this venue and create its official Wingman profile.
              </label>
              <label className="flex items-start gap-3 text-[0.9rem] text-ink">
                <input
                  type="checkbox"
                  checked={form.accuracyAttested}
                  onChange={(event) => set("accuracyAttested", event.target.checked)}
                  className="mt-1"
                />
                Every detail is accurate. Hours, music, dress, and links are current.
              </label>
              <label className="flex items-start gap-3 text-[0.9rem] text-ink">
                <input
                  type="checkbox"
                  checked={form.mediaRightsAttested}
                  onChange={(event) => set("mediaRightsAttested", event.target.checked)}
                  className="mt-1"
                />
                Photos and logo belong to this venue, or we have the right to use them.
              </label>
              <Button fullWidth size="lg" loading={busy} onClick={() => void submit()}>
                Submit brand for verification
              </Button>
              <button type="button" className="text-sm text-ink-subtle" onClick={() => setStep(2)}>
                Back
              </button>
              {error ? <p className="text-sm text-ink-muted">{error}</p> : null}
            </div>
          ) : null}
        </div>
      )}
    </AppShell>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-label">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="field mt-2" />
    </label>
  );
}

function Area({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-label">{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} className="field mt-2 h-auto py-3" />
    </label>
  );
}
