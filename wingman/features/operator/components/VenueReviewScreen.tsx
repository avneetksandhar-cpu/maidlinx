"use client";

import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { venueChecklistComplete, type VenueVerifyChecklist } from "@/lib/venues/verification";
import Link from "next/link";
import { useEffect, useState } from "react";

type Application = {
  id: string;
  venue_name: string;
  venue_type: string;
  address: string;
  neighborhood?: string;
  website?: string;
  instagram?: string;
  contact_name: string;
  contact_title?: string;
  business_email: string;
  phone: string;
  legal_name?: string;
  license_number?: string;
  hours_text?: string;
  description?: string;
  music_genres?: string;
  dress_code?: string;
  logo_url?: string;
  hero_photo_url?: string;
  authority_attested?: boolean;
  accuracy_attested?: boolean;
  media_rights_attested?: boolean;
  verification_checklist?: VenueVerifyChecklist;
  status: string;
  review_notes?: string;
};

export function VenueReviewScreen() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const response = await fetch("/api/operator/venues");
    if (!response.ok) return;
    const payload = (await response.json()) as { applications?: Application[] };
    setApplications(payload.applications ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function act(action: "approve_venue" | "reject_venue", applicationId: string) {
    const response = await fetch("/api/operator/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, applicationId, notes: note || undefined }),
    });
    const payload = (await response.json()) as { error?: string; ok?: boolean };
    setMessage(payload.error ?? (payload.ok ? "Saved." : "Could not update."));
    setNote("");
    await load();
  }

  const pending = applications.filter((item) => item.status === "submitted" || item.status === "in_review");

  return (
    <AppShell wide>
      <AppHeader title="Venue review" showBack backHref="/operator" />
      <h1 className="font-display text-4xl text-ink">Venue brands</h1>
      <p className="mt-3 max-w-lg text-[0.95rem] text-ink-muted">
        Approve only a complete, verifiable club or restaurant profile. Approval makes them a
        Verified Venue. Ticketmaster listings stay untouched.
      </p>
      {message ? <p className="mt-4 text-sm text-champagne">{message}</p> : null}

      <label className="mt-8 block max-w-lg">
        <span className="text-label">Note to file</span>
        <input value={note} onChange={(event) => setNote(event.target.value)} className="field mt-2" />
      </label>

      <div className="mt-10 space-y-12">
        {pending.length === 0 ? (
          <EmptyState title="No brands waiting." body="New venue applications land here." />
        ) : (
          pending.map((app) => {
            const complete = Boolean(
              app.authority_attested &&
                app.accuracy_attested &&
                app.media_rights_attested &&
                app.legal_name &&
                app.license_number,
            ) || venueChecklistComplete(app.verification_checklist ?? ({} as VenueVerifyChecklist));
            return (
              <article key={app.id}>
                <p className="text-champagne">{complete ? "Ready to review" : "Incomplete"}</p>
                <h2 className="font-display mt-1 text-3xl text-ink">{app.venue_name}</h2>
                <p className="mt-2 text-sm text-ink-muted">
                  {app.venue_type} · {app.neighborhood || app.address}
                </p>
                <dl className="mt-5 max-w-lg space-y-2 text-sm">
                  <Row label="Legal name" value={app.legal_name} />
                  <Row label="License" value={app.license_number} />
                  <Row label="Contact" value={`${app.contact_name}${app.contact_title ? ` · ${app.contact_title}` : ""}`} />
                  <Row label="Email" value={app.business_email} />
                  <Row label="Phone" value={app.phone} />
                  <Row label="Hours" value={app.hours_text} />
                  <Row label="Music" value={app.music_genres} />
                  <Row label="Dress" value={app.dress_code} />
                  <Row label="Site" value={app.website} />
                  <Row label="Instagram" value={app.instagram} />
                </dl>
                {app.description ? (
                  <p className="mt-4 max-w-lg text-[0.95rem] text-ink">{app.description}</p>
                ) : null}
                <div className="mt-6 flex max-w-lg flex-col gap-3">
                  <Button
                    disabled={!complete}
                    onClick={() => void act("approve_venue", app.id)}
                  >
                    Approve as Verified Venue
                  </Button>
                  <Button variant="secondary" onClick={() => void act("reject_venue", app.id)}>
                    Send back
                  </Button>
                </div>
              </article>
            );
          })
        )}
      </div>

      <Link href="/operator" className="mt-12 inline-block text-sm text-ink-subtle">
        Back to operator desk
      </Link>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-subtle">{label}</dt>
      <dd className="text-right text-ink">{value}</dd>
    </div>
  );
}
