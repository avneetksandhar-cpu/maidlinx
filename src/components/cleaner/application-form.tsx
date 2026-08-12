"use client";

import { useState } from "react";
import { Button, Input, Textarea } from "@/components/ui";

const emptyForm = {
  legalFirstName: "",
  legalLastName: "",
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
          legalFirstName: form.legalFirstName,
          legalLastName: form.legalLastName,
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
      setStatus(submit ? "Application submitted for review." : "Draft saved.");
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
        No SSN or government-ID uploads here. Identity verification is provider-based
        (pending until connected) and reviewed by ops.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
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

      <label className="flex items-start gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={form.workAuthAttestation}
          onChange={(e) => setForm((f) => ({ ...f, workAuthAttestation: e.target.checked }))}
          className="mt-1"
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
          className="mt-1"
        />
        The information I provided is accurate to the best of my knowledge.
      </label>

      {status && <p className="text-sm text-ink-muted">{status}</p>}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" disabled={loading} onClick={() => save(false)}>
          Save draft
        </Button>
        <Button type="button" disabled={loading} onClick={() => save(true)}>
          Submit application
        </Button>
      </div>
    </div>
  );
}
