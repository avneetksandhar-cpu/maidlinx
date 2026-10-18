"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CharacterUpload({ characterId }: { characterId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(
        `/api/admin/content-studio/characters/${characterId}/upload`,
        { method: "POST", body: fd },
      );
      const json = (await res.json()) as { data?: { path?: string }; error?: string };
      if (!res.ok) throw new Error(json.error || "Upload failed");
      setMsg(`Saved ${json.data?.path}`);
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <div className="mt-3 space-y-1">
      <label className="inline-flex cursor-pointer text-sm text-accent">
        <span className="rounded-md border border-border px-2.5 py-1.5 hover:bg-accent-muted">
          {busy ? "Uploading…" : "Upload reference"}
        </span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="sr-only"
          disabled={busy}
          onChange={onChange}
        />
      </label>
      {msg && <p className="text-xs text-ink-muted">{msg}</p>}
    </div>
  );
}
