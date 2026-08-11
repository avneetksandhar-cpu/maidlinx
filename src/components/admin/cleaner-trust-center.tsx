"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { routes } from "@/config/site";
import Link from "next/link";

interface TrustCleaner {
  professionalId: string;
  firstName: string | null;
  lastName: string | null;
  platformStage: string;
  identityStatus: string;
  backgroundStatus: string;
  onboardingStatus: string;
  isActive: boolean;
  maidlinxVerified: boolean;
  requiresAdminReview: boolean;
  trustScore: number;
  reliabilityScore: number;
  seriousFlagCount: number;
  gates: { allowed: boolean; failedGates: string[] };
}

interface AuditRow {
  id: string;
  action: string;
  cleanerId: string | null;
  createdAt: string;
  metadata: Record<string, unknown>;
}

export function CleanerTrustCenter() {
  const [cleaners, setCleaners] = useState<TrustCleaner[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [providers, setProviders] = useState<{
    identityProviderConnected: boolean;
    backgroundProviderConnected: boolean;
  } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/cleaners/trust")
      .then((res) => res.json().then((json) => ({ res, json })))
      .then(({ res, json }) => {
        if (cancelled) return;
        if (!res.ok) {
          setMessage(json.error ?? "Unable to load Trust Center");
          return;
        }
        setCleaners(json.data.cleaners ?? []);
        setAudit(json.data.audit ?? []);
        setProviders(json.data.providers ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function reload() {
    const res = await fetch("/api/admin/cleaners/trust");
    const json = await res.json();
    if (!res.ok) {
      setMessage(json.error ?? "Unable to load Trust Center");
      return;
    }
    setCleaners(json.data.cleaners ?? []);
    setAudit(json.data.audit ?? []);
    setProviders(json.data.providers ?? null);
  }

  async function act(
    professionalId: string,
    action: string,
    extra: Record<string, unknown> = {},
  ) {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/cleaners/trust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ professionalId, action, ...extra }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Action failed");
      setMessage(`${action} ok`);
      await reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-4 text-sm">
        <p className="font-medium text-ink">Provider connection</p>
        <p className="mt-1 text-ink-muted">
          Identity: {providers?.identityProviderConnected ? "CONNECTED" : "PENDING"} ·
          Background: {providers?.backgroundProviderConnected ? "CONNECTED" : "PENDING"}
        </p>
        <p className="mt-2 text-ink-muted">
          Never auto-approve because a provider is unavailable. Clear only after human review.
        </p>
        <Link
          href={routes.adminCleaners}
          className="mt-3 inline-block text-sm font-medium text-teal hover:underline"
        >
          Back to cleaners list
        </Link>
      </div>

      {message && <p className="text-sm text-ink-muted">{message}</p>}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-surface-muted text-ink-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Cleaner</th>
              <th className="px-3 py-2 font-medium">Stage</th>
              <th className="px-3 py-2 font-medium">ID / BG</th>
              <th className="px-3 py-2 font-medium">Gates</th>
              <th className="px-3 py-2 font-medium">Trust</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {cleaners.map((c) => (
              <tr key={c.professionalId} className="border-t border-border">
                <td className="px-3 py-2">
                  {[c.firstName, c.lastName].filter(Boolean).join(" ") || "—"}
                  {c.requiresAdminReview && (
                    <span className="ml-2 text-xs text-accent">Review</span>
                  )}
                </td>
                <td className="px-3 py-2 font-mono text-xs">{c.platformStage}</td>
                <td className="px-3 py-2 font-mono text-xs">
                  {c.identityStatus} / {c.backgroundStatus}
                </td>
                <td className="px-3 py-2">
                  {c.gates.allowed ? (
                    <span className="text-success">OK</span>
                  ) : (
                    <span className="text-ink-muted">{c.gates.failedGates.join(", ")}</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {c.trustScore}/{c.reliabilityScore}
                  {c.seriousFlagCount > 0 ? ` · flags ${c.seriousFlagCount}` : ""}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={loading}
                      onClick={() =>
                        act(c.professionalId, "review_identity", { decision: "clear" })
                      }
                    >
                      Clear ID
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={loading}
                      onClick={() =>
                        act(c.professionalId, "review_background", { decision: "clear" })
                      }
                    >
                      Clear BG
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={loading}
                      onClick={() => act(c.professionalId, "activate")}
                    >
                      Activate
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={loading}
                      onClick={() =>
                        act(c.professionalId, "raise_flag", {
                          flagType: "policy",
                          severity: "high",
                          notes: "Manual admin flag — review only, no auto-fire",
                        })
                      }
                    >
                      Flag (review)
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {cleaners.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-ink-muted">
                  No cleaners yet. Create a synthetic TEST cleaner after migration.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <section>
        <h2 className="font-display text-lg font-semibold text-navy">Platform audit log</h2>
        <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto text-sm">
          {audit.map((row) => (
            <li key={row.id} className="rounded-lg bg-surface-muted px-3 py-2">
              <span className="font-mono text-xs text-ink">{row.action}</span>
              <span className="ml-2 text-ink-muted">
                {new Date(row.createdAt).toLocaleString()}
              </span>
            </li>
          ))}
          {audit.length === 0 && (
            <li className="text-ink-muted">No platform audit entries yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
