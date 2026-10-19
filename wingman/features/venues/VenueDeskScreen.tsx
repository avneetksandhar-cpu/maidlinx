"use client";

import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusChip } from "@/components/ui/StatusChip";
import type { PublicVenue } from "@/lib/venues/types";
import Link from "next/link";
import { useEffect, useState } from "react";

export function VenueDeskScreen() {
  const [venues, setVenues] = useState<PublicVenue[]>([]);
  const [inquiries, setInquiries] = useState<Array<Record<string, unknown>>>([]);
  const [applications, setApplications] = useState<Array<Record<string, unknown>>>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void fetch("/api/venues/me")
      .then((response) => (response.ok ? response.json() : { venues: [], inquiries: [] }))
      .then((payload: {
        venues?: PublicVenue[];
        inquiries?: Array<Record<string, unknown>>;
        applications?: Array<Record<string, unknown>>;
      }) => {
        setVenues(payload.venues ?? []);
        setInquiries(payload.inquiries ?? []);
        setApplications(payload.applications ?? []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  return (
    <AppShell>
      <AppHeader title="Venue" showBack backHref="/profile" />
      <h1 className="font-display text-4xl text-ink">Your room</h1>
      <p className="mt-3 text-[0.95rem] text-ink-muted">
        Edit presence, see inquiries, and wait for verification before you are listed as a partner.
      </p>
      {applications.length > 0 ? (
        <section className="mt-10">
          <p className="text-label">Verification</p>
          {applications.map((item) => (
            <article key={String(item.id)} className="mt-4">
              <h2 className="font-display text-2xl text-ink">{String(item.venue_name)}</h2>
              <p className="mt-1 text-champagne">
                {String(item.status) === "approved" ? "Verified Venue" : "Pending verification"}
              </p>
            </article>
          ))}
        </section>
      ) : null}

      {loaded && venues.length === 0 && applications.length === 0 ? (
        <EmptyState
          title="No brand profile yet."
          body="Create the official page for your club or restaurant. We verify everything first."
          action={
            <Link href="/venues/apply" className="text-champagne">
              Build your profile
            </Link>
          }
        />
      ) : (
        venues.map((venue) => (
          <section key={venue.id} className="mt-8">
            <StatusChip>{venue.verified ? "Verified Venue" : venue.verificationStatus}</StatusChip>
            <h2 className="font-display mt-2 text-3xl text-ink">{venue.name}</h2>
            <p className="mt-2 text-sm text-ink-muted">{venue.neighborhood || venue.area}</p>
            <Link href={`/venues/${venue.slug}`} className="mt-3 inline-block text-sm text-champagne">
              View public page
            </Link>
          </section>
        ))
      )}
      <section className="mt-12">
        <p className="text-label">Inquiries</p>
        <div className="mt-4 space-y-4">
          {inquiries.length === 0 ? (
            <p className="text-sm text-ink-muted">No guest notes yet.</p>
          ) : (
            inquiries.map((item) => (
              <article key={String(item.id)}>
                <p className="text-champagne">{String(item.kind)}</p>
                <p className="mt-1 text-ink">{String(item.message)}</p>
              </article>
            ))
          )}
        </div>
      </section>
    </AppShell>
  );
}
