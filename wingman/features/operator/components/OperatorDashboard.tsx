"use client";

import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { VERIFICATION_GATES } from "@/lib/marketplace/constants";
import Link from "next/link";
import { useEffect, useState } from "react";

type Overview = {
  newRequests: Array<Record<string, unknown>>;
  unassigned: Array<Record<string, unknown>>;
  paidUnassigned: Array<Record<string, unknown>>;
  catalog: Array<Record<string, unknown>>;
  awaitingCustomer: Array<Record<string, unknown>>;
  paymentPending: Array<Record<string, unknown>>;
  tonight: Array<Record<string, unknown>>;
  support: Array<Record<string, unknown>>;
  staleEvents: Array<Record<string, unknown>>;
  expiredOffers: Array<Record<string, unknown>>;
  pendingApplications: Array<Record<string, unknown>>;
  audit: Array<Record<string, unknown>>;
  verifiedWingmen: number;
  bookableOffers: number;
  settings: { customer_fee_bps: number; supplier_commission_bps: number; min_booking_cents: number } | null;
  wingmen: Array<Record<string, unknown>>;
  events: Array<Record<string, unknown>>;
  interest: Array<Record<string, unknown>>;
};

export function OperatorDashboard() {
  const [data, setData] = useState<Overview | null>(null);
  const [note, setNote] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const response = await fetch("/api/operator/overview");
    if (response.ok) setData((await response.json()) as Overview);
  }

  useEffect(() => {
    void load();
  }, []);

  async function act(body: Record<string, unknown>) {
    const response = await fetch("/api/operator/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json()) as { error?: string; ok?: boolean };
    setMessage(payload.error ?? (payload.ok ? "Saved." : "Failed."));
    await load();
  }

  if (!data) {
    return (
      <AppShell wide>
        <AppHeader title="Operator" showBack backHref="/home" />
        <p className="text-sm text-ink-muted">Loading operator desk…</p>
      </AppShell>
    );
  }

  return (
    <AppShell wide>
      <AppHeader title="Operator" showBack backHref="/home" />
      <p className="text-label text-accent">Miami beta control</p>
      <h1 className="mt-2 text-2xl text-ink">Operator desk</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Verified Wingmen: {data.verifiedWingmen}. Bookable offers: {data.bookableOffers}. Public
        launch stays blocked until those are real.
      </p>
      <Link href="/operator/venues" className="mt-4 inline-block text-champagne">
        Review venue brands
      </Link>
      {message ? <p className="mt-3 text-sm text-accent">{message}</p> : null}

      <section className="mt-6 rounded-2xl border border-dashed border-accent/40 bg-surface p-4">
        <h2 className="text-lg text-ink">Private TEST booking</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Admin/test mode only. TEST fixtures never appear on /wingmen or /events. Public counts
          above exclude them. Remove with ENABLE_TEST_FIXTURES=false then npm run seed.
        </p>
        <Link href="/operator/test-booking" className="mt-4 block">
          <Button fullWidth variant="secondary">
            Open private TEST booking flow
          </Button>
        </Link>
      </section>

      <CatalogEditor catalog={data.catalog ?? []} onSave={(body) => void act(body)} />

      <section className="mt-6 rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-lg text-ink">Assign Wingman after payment</h2>
        <p className="mt-1 text-xs text-ink-subtle">
          Customer paid first. Assign a Wingman here — they do not pick one at checkout.
        </p>
        <AssignAfterPayForm requests={data.paidUnassigned ?? []} wingmen={data.wingmen} />
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-lg text-ink">Route a request</h2>
        <p className="mt-1 text-xs text-ink-subtle">
          Only verified Wingmen can be assigned. There are {data.wingmen.filter((w) => w.verification_status === "verified").length} verified.
        </p>
        <RouteForm requests={[...data.newRequests, ...data.unassigned]} wingmen={data.wingmen} />
      </section>

      <Section title="New requests" rows={data.newRequests} empty="None." />
      <Section title="Paid, waiting for a Wingman" rows={data.paidUnassigned ?? []} empty="None." />
      <Section title="Unassigned" rows={data.unassigned} empty="None." />
      <Section title="Quotes awaiting customers" rows={data.awaitingCustomer} empty="None." />
      <Section title="Payments awaiting confirmation" rows={data.paymentPending} empty="None." />
      <Section title="Tonight’s confirmed bookings" rows={data.tonight} empty="None tonight." />
      <Section title="Support cases" rows={data.support} empty="No open cases." />
      <Section title="Event source freshness (14+ days)" rows={data.staleEvents} empty="All recent." />
      <Section title="Expired or empty inventory" rows={data.expiredOffers} empty="None." />

      <LinkToEventOps />
      <AddApplicationForm onSave={(body) => void act(body)} />
      <EventImportPanel onSave={(body) => void act(body)} />

      <section className="mt-8">
        <h2 className="text-xl text-ink">Customer interest (no charge)</h2>
        <p className="mt-1 text-xs text-ink-subtle">
          Waitlist only. These people were not promised access and were not charged.
        </p>
        {data.interest.length === 0 ? (
          <p className="mt-2 text-sm text-ink-subtle">No interest yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {data.interest.map((item) => (
              <li key={String(item.id)} className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink">
                {String(item.email)} · {String(item.source)} · {String(item.created_at).slice(0, 10)}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-xl text-ink">Recruitment pipeline (private)</h2>
        <p className="mt-1 text-xs text-ink-subtle">
          Not public. Leads stay hidden until every verification gate is complete.
        </p>
        <div className="mt-4 space-y-4">
          {data.pendingApplications.map((app) => (
            <article key={String(app.id)} className="rounded-2xl border border-border bg-surface p-4">
              <p className="text-sm font-medium text-ink">{String(app.organization_name)}</p>
              <p className="mt-1 text-xs text-ink-subtle">
                {String(app.lead_external_id)} · {String(app.verification_status)} · visible:{" "}
                {String(app.production_visible)}
              </p>
              <p className="mt-2 text-xs text-ink-muted">{String(app.next_action ?? "")}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {VERIFICATION_GATES.map((gate) => (
                  <button
                    key={gate}
                    type="button"
                    className="rounded-full border border-border px-3 py-1 text-[11px] text-ink-muted"
                    onClick={() => void act({ action: "mark_gate", applicationId: app.id, gate })}
                  >
                    {gate.replaceAll("_", " ")}
                  </button>
                ))}
              </div>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Approved display name"
                className="mt-3 h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm text-ink"
              />
              <Button
                className="mt-3"
                variant="secondary"
                fullWidth
                onClick={() =>
                  void act({
                    action: "verify_wingman",
                    applicationId: app.id,
                    displayName,
                  })
                }
              >
                Verify only if all gates passed
              </Button>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-xl text-ink">Fees (admin)</h2>
        <p className="mt-2 text-xs text-ink-subtle">
          Customer fee and supplier commission are basis points. Developer 10% + $200/month is not
          stored here.
        </p>
        <p className="mt-2 text-sm text-ink-muted">
          Current customer fee: {data.settings?.customer_fee_bps ?? 0} bps · supplier:{" "}
          {data.settings?.supplier_commission_bps ?? 0} bps · minimum{" "}
          ${(data.settings?.min_booking_cents ?? 50000) / 100}
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl text-ink">Internal note</h2>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          className="mt-2 w-full rounded-2xl border border-border bg-surface px-3 py-2 text-sm text-ink"
        />
        <Button
          className="mt-3"
          variant="secondary"
          fullWidth
          onClick={() =>
            void act({ action: "record_note", entityType: "ops", entityId: "desk", note })
          }
        >
          Record note
        </Button>
      </section>

      <section className="mt-8">
        <h2 className="text-xl text-ink">Audit history</h2>
        <ul className="mt-3 space-y-2 text-xs text-ink-subtle">
          {data.audit.map((item) => (
            <li key={String(item.id)}>
              {String(item.created_at).slice(0, 19)} · {String(item.action)} · {String(item.entity_type)}{" "}
              · {String(item.to_state ?? "")}
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}

function LinkToEventOps() {
  return (
    <section className="mt-8 rounded-2xl border border-border bg-surface p-4">
      <h2 className="text-xl text-ink">Event operations</h2>
      <p className="mt-1 text-xs text-ink-subtle">
        Sync history, source health, duplicate warnings, approve/reject imports, merge, and Sync now.
      </p>
      <Link href="/operator/events" className="mt-3 block">
        <Button variant="secondary" fullWidth>
          Open event ops
        </Button>
      </Link>
      <Link href="/operator/events/health" className="mt-2 block">
        <Button variant="ghost" fullWidth>
          Source health
        </Button>
      </Link>
    </section>
  );
}

function AddApplicationForm({ onSave }: { onSave: (body: Record<string, unknown>) => void }) {
  const [organizationName, setOrganizationName] = useState("");
  const [publicContact, setPublicContact] = useState("");
  const [publicSource, setPublicSource] = useState("");
  const [nextAction, setNextAction] = useState("");

  return (
    <section className="mt-8 rounded-2xl border border-border bg-surface p-4">
      <h2 className="text-xl text-ink">Add a Wingman lead</h2>
      <p className="mt-1 text-xs text-ink-subtle">
        Creates a private application. It stays unpublished and unverified until every gate is marked.
      </p>
      <input
        value={organizationName}
        onChange={(event) => setOrganizationName(event.target.value)}
        placeholder="Organization or person"
        className="field mt-3"
      />
      <input
        value={publicContact}
        onChange={(event) => setPublicContact(event.target.value)}
        placeholder="Public contact on file"
        className="field mt-2"
      />
      <input
        value={publicSource}
        onChange={(event) => setPublicSource(event.target.value)}
        placeholder="Public source URL"
        className="field mt-2"
      />
      <input
        value={nextAction}
        onChange={(event) => setNextAction(event.target.value)}
        placeholder="Next action"
        className="field mt-2"
      />
      <Button
        className="mt-3"
        variant="secondary"
        fullWidth
        onClick={() => {
          onSave({
            action: "create_application",
            organizationName,
            publicContact,
            publicSource,
            nextAction,
          });
          setOrganizationName("");
        }}
      >
        Add private lead
      </Button>
    </section>
  );
}

function EventImportPanel({ onSave }: { onSave: (body: Record<string, unknown>) => void }) {
  const [name, setName] = useState("");
  const [venueName, setVenueName] = useState("");
  const [localDate, setLocalDate] = useState("");
  const [localTimeText, setLocalTimeText] = useState("11:00 PM");
  const [officialSourceUrl, setOfficialSourceUrl] = useState("");
  const [area, setArea] = useState("Miami");
  const [importNote, setImportNote] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  async function upload(file: File) {
    setImporting(true);
    setImportNote(null);
    const form = new FormData();
    form.append("file", file);
    const response = await fetch("/api/operator/import", { method: "POST", body: form });
    const payload = (await response.json()) as { error?: string; imported?: number };
    setImporting(false);
    setImportNote(
      payload.error ??
        `Imported ${payload.imported ?? 0} discovery listings. Bookable offers created: 0.`,
    );
  }

  return (
    <section className="mt-8 rounded-2xl border border-border bg-surface p-4">
      <h2 className="text-xl text-ink">Import events</h2>
      <p className="mt-1 text-xs text-ink-subtle">
        Manual or CSV/XLSX. Listings stay discovery-only. This does not create Wingmen or bookable
        offers.
      </p>
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Event name"
        className="field mt-3"
      />
      <input
        value={venueName}
        onChange={(event) => setVenueName(event.target.value)}
        placeholder="Venue"
        className="field mt-2"
      />
      <input
        type="date"
        value={localDate}
        onChange={(event) => setLocalDate(event.target.value)}
        className="field mt-2"
      />
      <input
        value={localTimeText}
        onChange={(event) => setLocalTimeText(event.target.value)}
        placeholder="Start time"
        className="field mt-2"
      />
      <input
        value={area}
        onChange={(event) => setArea(event.target.value)}
        placeholder="Area"
        className="field mt-2"
      />
      <input
        value={officialSourceUrl}
        onChange={(event) => setOfficialSourceUrl(event.target.value)}
        placeholder="Official source URL"
        className="field mt-2"
      />
      <Button
        className="mt-3"
        variant="secondary"
        fullWidth
        onClick={() =>
          onSave({
            action: "create_event",
            name,
            venueName,
            localDate,
            localTimeText,
            area,
            officialSourceUrl,
          })
        }
      >
        Add discovery listing
      </Button>
      <label className="mt-4 block text-xs text-ink-subtle">
        CSV or XLSX
        <input
          type="file"
          accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="mt-2 block w-full text-sm text-ink"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
          }}
        />
      </label>
      {importNote ? <p className="mt-2 text-sm text-accent">{importNote}</p> : null}
      {importing ? <p className="mt-2 text-xs text-ink-subtle">Importing…</p> : null}
    </section>
  );
}

function CatalogEditor({
  catalog,
  onSave,
}: {
  catalog: Array<Record<string, unknown>>;
  onSave: (body: Record<string, unknown>) => void;
}) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  return (
    <section className="mt-6 rounded-2xl border border-border bg-surface p-4">
      <h2 className="text-lg text-ink">Experience prices</h2>
      <p className="mt-1 text-xs text-ink-subtle">
        Editable here — not hard-coded. Wingman Experience ≈ $100 platform. VIP table 10%. Venue
        may separately give the Wingman 10% on qualifying extra sales.
      </p>
      <div className="mt-4 space-y-4">
        {catalog.map((item) => {
          const id = String(item.id);
          const dollars = drafts[id] ?? String(Number(item.price_cents ?? 0) / 100);
          return (
            <article key={id} className="rounded-xl border border-border px-3 py-3">
              <p className="text-sm text-ink">{String(item.name)}</p>
              <p className="mt-1 text-xs text-ink-subtle">{String(item.slug)}</p>
              <label className="mt-2 block text-xs text-ink-muted">
                Price (USD)
                <input
                  value={dollars}
                  onChange={(event) => setDrafts((current) => ({ ...current, [id]: event.target.value }))}
                  className="field mt-1"
                />
              </label>
              <Button
                className="mt-3"
                variant="secondary"
                fullWidth
                onClick={() =>
                  onSave({
                    action: "update_catalog",
                    id,
                    priceCents: Math.round(Number(dollars) * 100),
                  })
                }
              >
                Save price
              </Button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function AssignAfterPayForm({
  requests,
  wingmen,
}: {
  requests: Array<Record<string, unknown>>;
  wingmen: Array<Record<string, unknown>>;
}) {
  const [requestId, setRequestId] = useState(String(requests[0]?.id ?? ""));
  const [wingmanId, setWingmanId] = useState(String(wingmen[0]?.id ?? ""));
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function assign() {
    setError(null);
    setNote(null);
    const response = await fetch("/api/operator/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "assign_after_pay", requestId, wingmanId }),
    });
    const payload = (await response.json()) as { error?: string; hostName?: string };
    if (!response.ok) {
      setError(payload.error ?? "Could not assign.");
      return;
    }
    setNote(`Assigned ${payload.hostName ?? "Wingman"}.`);
  }

  if (requests.length === 0) {
    return <p className="mt-3 text-sm text-ink-subtle">No paid bookings waiting for a Wingman.</p>;
  }

  return (
    <div className="mt-3 space-y-2">
      <select
        value={requestId}
        onChange={(event) => setRequestId(event.target.value)}
        className="h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm text-ink"
      >
        {requests.map((item) => (
          <option key={String(item.id)} value={String(item.id)}>
            {String(item.occasion ?? item.id)} · {String(item.status)}
          </option>
        ))}
      </select>
      <select
        value={wingmanId}
        onChange={(event) => setWingmanId(event.target.value)}
        className="h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm text-ink"
      >
        {wingmen.map((item) => (
          <option key={String(item.id)} value={String(item.id)}>
            {String(item.display_name)} ({String(item.verification_status)})
          </option>
        ))}
      </select>
      {error ? <p className="text-xs text-ink-muted">{error}</p> : null}
      {note ? <p className="text-xs text-accent">{note}</p> : null}
      <Button variant="secondary" fullWidth disabled={!requestId || !wingmanId} onClick={() => void assign()}>
        Assign Wingman
      </Button>
    </div>
  );
}

function RouteForm({
  requests,
  wingmen,
}: {
  requests: Array<Record<string, unknown>>;
  wingmen: Array<Record<string, unknown>>;
}) {
  const [requestId, setRequestId] = useState(String(requests[0]?.id ?? ""));
  const [wingmanId, setWingmanId] = useState(String(wingmen[0]?.id ?? ""));
  const [error, setError] = useState<string | null>(null);

  async function route() {
    setError(null);
    const review = await fetch(`/api/requests/${requestId}/transition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: "under_review" }),
    });
    if (!review.ok) {
      const payload = (await review.json()) as { error?: string };
      if (!String(payload.error ?? "").includes("Illegal")) {
        setError(payload.error ?? "Could not review.");
        return;
      }
    }
    const routed = await fetch(`/api/requests/${requestId}/transition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: "routed", wingmanId }),
    });
    const payload = (await routed.json()) as { error?: string };
    if (!routed.ok) setError(payload.error ?? "Could not route.");
  }

  return (
    <div className="mt-3 space-y-2">
      <select
        value={requestId}
        onChange={(event) => setRequestId(event.target.value)}
        className="h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm text-ink"
      >
        {requests.map((item) => (
          <option key={String(item.id)} value={String(item.id)}>
            {String(item.occasion ?? item.id)}
          </option>
        ))}
      </select>
      <select
        value={wingmanId}
        onChange={(event) => setWingmanId(event.target.value)}
        className="h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm text-ink"
      >
        {wingmen.map((item) => (
          <option key={String(item.id)} value={String(item.id)}>
            {String(item.display_name)} ({String(item.verification_status)})
          </option>
        ))}
      </select>
      {error ? <p className="text-xs text-ink-muted">{error}</p> : null}
      <Button variant="secondary" fullWidth disabled={!requestId || !wingmanId} onClick={() => void route()}>
        Route to Wingman
      </Button>
    </div>
  );
}

function Section({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: Array<Record<string, unknown>>;
  empty: string;
}) {
  return (
    <section className="mt-6">
      <h2 className="text-lg text-ink">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-ink-subtle">{empty}</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {rows.map((row) => (
            <li key={String(row.id)} className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink">
              {String(row.occasion ?? row.name ?? row.subject ?? row.organization_name ?? row.id)}{" "}
              <span className="text-ink-subtle">{String(row.status ?? "")}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
