"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";
import { routes } from "@/config/site";

const DEFAULT_DIALOGUE = `UNKNOWN: I know what you spilled last summer.
Lexi: What?
UNKNOWN: Check under your couch.
Nia: Girl.
UNKNOWN: I know about the oven too.
Nia: I'm gonna need overtime.`;

function parseDialogue(raw: string): Array<{ speaker: string; line: string }> {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(":");
      if (idx === -1) return { speaker: "NARRATOR", line };
      return {
        speaker: line.slice(0, idx).trim(),
        line: line.slice(idx + 1).trim(),
      };
    })
    .filter((d) => d.line.length > 0);
}

export function EpisodeGeneratorForm({
  characterIds,
}: {
  characterIds: string[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>(
    characterIds.length ? characterIds.slice(0, 3) : ["lexi", "nia", "caller"],
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const dialogue = parseDialogue(String(fd.get("dialogue") || ""));
    try {
      const res = await fetch("/api/admin/content-studio/episodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: String(fd.get("title") || ""),
          genre: String(fd.get("genre") || ""),
          hook: String(fd.get("hook") || ""),
          durationSeconds: Number(fd.get("durationSeconds") || 15),
          characters: selected,
          location: String(fd.get("location") || ""),
          story: String(fd.get("story") || ""),
          dialogue,
          cta: String(fd.get("cta") || "Book at maidlinx.com"),
          platform: String(fd.get("platform") || "tiktok"),
          slug: String(fd.get("slug") || "") || undefined,
        }),
      });
      const json = (await res.json()) as {
        data?: { episode?: { slug: string } };
        error?: string;
      };
      if (!res.ok) throw new Error(json.error || "Create failed");
      const slug = json.data?.episode?.slug;
      if (slug) router.push(`${routes.adminContentStudio}/episodes/${slug}`);
      else router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-border bg-surface p-5 shadow-card">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" name="title" required defaultValue="Untitled episode" />
        <Field label="Slug (optional)" name="slug" placeholder="002-my-episode" />
        <Field label="Genre" name="genre" required defaultValue="Cleaning comedy" />
        <Field
          label="Platform"
          name="platform"
          required
          defaultValue="tiktok"
        />
        <Field
          label="Duration (seconds)"
          name="durationSeconds"
          type="number"
          required
          defaultValue="15"
        />
        <Field
          label="Location"
          name="location"
          required
          defaultValue="Luxury condo at night"
        />
      </div>
      <Field label="Hook" name="hook" required defaultValue="The caller knows what you spilled." />
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-ink">Story</span>
        <textarea
          name="story"
          required
          rows={3}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          defaultValue="Chaos, clean reveal, cold callback."
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-ink">Dialogue (Speaker: line)</span>
        <textarea
          name="dialogue"
          required
          rows={5}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm"
          defaultValue={DEFAULT_DIALOGUE}
        />
      </label>
      <Field
        label="CTA"
        name="cta"
        required
        defaultValue="Book cleaning on demand at maidlinx.com"
      />

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink">Characters</legend>
        <div className="flex flex-wrap gap-3">
          {characterIds.map((id) => {
            const on = selected.includes(id);
            return (
              <label key={id} className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() =>
                    setSelected((prev) =>
                      on ? prev.filter((x) => x !== id) : [...prev, id],
                    )
                  }
                />
                {id}
              </label>
            );
          })}
        </div>
      </fieldset>

      {error && <p className="text-sm text-error">{error}</p>}
      <Button type="submit" disabled={busy || selected.length === 0}>
        {busy ? "Generating…" : "Generate episode + shot list"}
      </Button>
      <p className="text-xs text-ink-muted">
        Default export format: 1080×1920 · 9:16 · 30fps. Scripted fiction only — never fake reviews.
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-ink">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
      />
    </label>
  );
}
