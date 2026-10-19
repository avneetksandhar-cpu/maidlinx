"use client";

import { useState } from "react";
import { Button, Input, Textarea } from "@/components/ui";
import { routes } from "@/config/site";
import Link from "next/link";

const emptyForm = {
  applicantType: "individual" as "individual" | "cleaning_company",
  legalFirstName: "",
  legalLastName: "",
  companyName: "",
  phone: "",
  email: "",
  city: "",
  state: "",
  marketId: "",
  yearsExperience: 0,
  hasVehicle: false,
  transportation: "vehicle" as const,
  languages: "English",
  servicesInterested: "standard",
  bio: "",
  workAuthAttestation: false,
  accurateInfoAttestation: false,
  insuranceAttestation: false,
  insuranceProvider: "",
  insuranceDocumentUrl: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
};

export function CleanerApplicationForm({
  initialEmail,
}: {
  initialEmail?: string | null;
}) {
  const [form, setForm] = useState({ ...emptyForm, email: initialEmail ?? "" });
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save(submit: boolean) {
    setLoading(true);
    setStatus(null);
    try {
      const payload = {
        submit,
        application: {
          applicantType: form.applicantType,
          legalFirstName: form.legalFirstName,
          legalLastName: form.legalLastName,
          companyName:
            form.applicantType === "cleaning_company" ? form.companyName || null : null,
          phone: form.phone,
          email: form.email,
          city: form.city,
          state: form.state,
          marketId: form.marketId || null,
          yearsExperience: Number(form.yearsExperience) || 0,
          hasVehicle: form.hasVehicle,
          transportation: form.transportation,
          languages: form.languages
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          servicesInterested: form.servicesInterested
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          bio: form.bio || null,
          workAuthAttestation: form.workAuthAttestation ? true : undefined,
          accurateInfoAttestation: form.accurateInfoAttestation ? true : undefined,
          insuranceAttestation: form.insuranceAttestation ? true : undefined,
          insuranceProvider: form.insuranceProvider || null,
          insuranceDocumentUrl: form.insuranceDocumentUrl || null,
          emergencyContactName: form.emergencyContactName || null,
          emergencyContactPhone: form.emergencyContactPhone || null,
        },
      };
      const res = await fetch("/api/cleaner/application", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Save failed");
      setStatus(
        submit
          ? "Application submitted for ops review (including insurance)."
          : "Draft saved.",
      );
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Unable to save.");
    } finally {
      setLoading(false);
    }
  }

  function field(
    key: keyof typeof form,
    label: string,
    opts?: { type?: string; textarea?: boolean },
  ) {
    return (
      <label className="block space-y-1.5 text-sm">
        <span className="font-medium text-ink">{label}</span>
        {opts?.textarea ? (
          <Textarea
            value={String(form[key] ?? "")}
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            rows={3}
          />
        ) : (
          <Input
            type={opts?.type ?? "text"}
            value={String(form[key] ?? "")}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                [key]:
                  opts?.type === "number" ? Number(e.target.value) : e.target.value,
              }))
            }
          />
        )}
      </label>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-muted">
        Apply as an insured individual cleaner or an insured cleaning company
        (subcontractor). No SSN or government-ID uploads here. Insurance is attested and
        reviewed by ops — not auto-verified.
      </p>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-ink">Applicant type</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              {
                value: "individual" as const,
                title: "Individual cleaner",
                blurb: "Independent subcontractor with your own insurance",
              },
              {
                value: "cleaning_company" as const,
                title: "Cleaning company",
                blurb: "Company joining as a subcontractor, with insurance",
              },
            ] as const
          ).map((opt) => {
            const selected = form.applicantType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, applicantType: opt.value }))}
                className={
                  selected
                    ? "rounded-xl border border-accent bg-accent-muted px-4 py-3 text-left transition-colors"
                    : "rounded-xl border border-border bg-surface px-4 py-3 text-left transition-colors hover:border-accent/40"
                }
              >
                <span className="block text-sm font-semibold text-ink">{opt.title}</span>
                <span className="mt-0.5 block text-xs text-ink-muted">{opt.blurb}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        {form.applicantType === "cleaning_company"
          ? field("companyName", "Company name")
          : null}
        {field("legalFirstName", "Legal first name")}
        {field("legalLastName", "Legal last name")}
        {field("phone", "Phone")}
        {field("email", "Email", { type: "email" })}
        {field("city", "City")}
        {field("state", "State / province")}
        {field("yearsExperience", "Years experience", { type: "number" })}
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium text-ink">Transportation</span>
          <select
            className="w-full rounded-lg border border-border bg-surface px-3 py-2"
            value={form.transportation}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                transportation: e.target.value as typeof f.transportation,
                hasVehicle: e.target.value === "vehicle",
              }))
            }
          >
            <option value="vehicle">Vehicle</option>
            <option value="transit">Transit</option>
            <option value="bike">Bike</option>
            <option value="other">Other</option>
          </select>
        </label>
        {field("languages", "Languages (comma-separated)")}
        {field("servicesInterested", "Services interested (comma-separated)")}
        {field("bio", "Short bio", { textarea: true })}
        {field("emergencyContactName", "Emergency contact name (optional)")}
        {field("emergencyContactPhone", "Emergency contact phone (optional)")}
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-accent-muted/40 p-4">
        <p className="text-sm font-semibold text-ink">Insurance (required)</p>
        <p className="text-xs text-ink-muted">
          Attest that you carry active liability insurance. Optionally add a certificate
          link or storage path for ops review. This does not auto-verify coverage.
        </p>
        {field("insuranceProvider", "Insurance provider (optional)")}
        {field(
          "insuranceDocumentUrl",
          "Insurance certificate URL or private storage path (optional)",
        )}
        <p className="text-xs text-ink-muted">
          After signing in you can also register an insurance document under{" "}
          <Link href={routes.cleanerDocuments} className="font-medium text-accent underline">
            Documents
          </Link>
          .
        </p>
        <label className="flex items-start gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={form.insuranceAttestation}
            onChange={(e) =>
              setForm((f) => ({ ...f, insuranceAttestation: e.target.checked }))
            }
            className="mt-1 accent-accent"
          />
          I attest that I (or my company) carry active liability insurance covering cleaning
          work in my service market, and I will provide proof for ops review when requested.
        </label>
      </div>

      <label className="flex items-start gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={form.workAuthAttestation}
          onChange={(e) => setForm((f) => ({ ...f, workAuthAttestation: e.target.checked }))}
          className="mt-1 accent-accent"
        />
        I attest I am legally authorized to work in my service market.
      </label>
      <label className="flex items-start gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={form.accurateInfoAttestation}
          onChange={(e) =>
            setForm((f) => ({ ...f, accurateInfoAttestation: e.target.checked }))
          }
          className="mt-1 accent-accent"
        />
        The information I provided is accurate to the best of my knowledge.
      </label>

      {status && <p className="text-sm text-ink-muted">{status}</p>}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" disabled={loading} onClick={() => save(false)}>
          Save draft
        </Button>
        <Button type="button" variant="primary" disabled={loading} onClick={() => save(true)}>
          Submit application
        </Button>
      </div>
    </div>
  );
}
