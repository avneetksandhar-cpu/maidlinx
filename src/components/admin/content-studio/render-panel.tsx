"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

export function RenderPanel({ episodeSlug }: { episodeSlug: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [command, setCommand] = useState(
    `npm run content-studio:render -- --episode=${episodeSlug}`,
  );

  async function requestRender() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/content-studio/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ episode: episodeSlug }),
      });
      const json = (await res.json()) as {
        data?: {
          command?: string;
          note?: string;
          expectedOutput?: string;
          alreadyRendered?: boolean;
        };
        error?: string;
      };
      if (!res.ok) throw new Error(json.error || "Render request failed");
      if (json.data?.command) setCommand(json.data.command);
      setMessage(
        `${json.data?.note ?? "Use CLI on a machine with FFmpeg."}${
          json.data?.alreadyRendered
            ? ` Output already present: ${json.data.expectedOutput}`
            : ""
        }`,
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Render failed");
    } finally {
      setBusy(false);
    }
  }

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(command);
      setMessage("Command copied. Run it in the repo root after installing FFmpeg.");
    } catch {
      setMessage("Could not copy — select the command manually.");
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
      <h2 className="font-display text-lg font-semibold text-ink">Render TikTok</h2>
      <p className="mt-1 text-sm text-ink-muted">
        MP4 1080×1920 H.264 + AAC, SRT, captions, thumbnail. Requires local FFmpeg (
        <code className="text-xs">brew install ffmpeg</code>).
      </p>
      <pre className="mt-3 overflow-x-auto rounded-lg bg-ink px-3 py-2 text-xs text-white">
        {command}
      </pre>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" disabled={busy} onClick={() => requestRender()}>
          {busy ? "Checking…" : "Render TikTok"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => copyCommand()}>
          Copy CLI
        </Button>
      </div>
      {message && <p className="mt-3 whitespace-pre-wrap text-sm text-ink">{message}</p>}
    </div>
  );
}
