import type { ContentShot, EpisodeDraftInput } from "@/lib/content-studio/types";

/**
 * Auto-build a timestamped shot list from episode fields.
 * Keeps total duration ≈ durationSeconds (+ optional end card).
 */
export function buildTimestampedShotList(
  input: EpisodeDraftInput,
  endCardSeconds = 1.5,
): ContentShot[] {
  const body = Math.max(3, input.durationSeconds);
  const beats: Array<Omit<ContentShot, "id" | "index" | "startSec">> = [
    {
      durationSec: Math.min(1.5, body * 0.1),
      label: "Open",
      visual: input.location || "Opening establishing",
      still: null,
      background: "#0B1220",
      movement: "kenburns-in",
      transition: "hard",
      overlay: input.hook.slice(0, 48) || "Tonight.",
      subtitle: null,
      characters: input.characters,
    },
    {
      durationSec: Math.min(2, body * 0.12),
      label: "Hook",
      visual: "Character reaction / phone",
      still: null,
      background: "#1A1020",
      movement: "zoom-in",
      transition: "hard",
      overlay: null,
      subtitle: input.dialogue[0]?.line ?? input.hook,
      speaker: input.dialogue[0]?.speaker,
      characters: input.characters,
    },
  ];

  const midCount = Math.max(1, input.dialogue.length - 1);
  const remaining = body - beats.reduce((s, b) => s + b.durationSec, 0) - 1.5;
  const each = Math.max(0.8, remaining / (midCount + 2));

  for (let i = 1; i < input.dialogue.length; i++) {
    const d = input.dialogue[i]!;
    beats.push({
      durationSec: each,
      label: `Line ${i + 1}`,
      visual: `${d.speaker} — dialogue beat`,
      still: null,
      background: i % 2 === 0 ? "#151018" : "#221018",
      movement: "kenburns-in",
      transition: "hard",
      overlay: null,
      subtitle: d.line,
      speaker: d.speaker,
      characters: input.characters,
    });
  }

  beats.push({
    durationSec: each,
    label: "Story turn",
    visual: input.story.slice(0, 80) || "Story beat",
    still: null,
    background: "#0F2A28",
    movement: "kenburns-out",
    transition: "hard",
    overlay: null,
    subtitle: null,
    characters: input.characters,
  });

  beats.push({
    durationSec: 0.5,
    label: "Cut to black",
    visual: "Hard black before end card",
    still: null,
    background: "#000000",
    movement: "none",
    transition: "hard",
    overlay: null,
    subtitle: null,
    characters: [],
  });

  beats.push({
    durationSec: endCardSeconds,
    label: "MaidLinx end card",
    visual: "Brand end card",
    still: null,
    background: "#111827",
    movement: "none",
    transition: "hard",
    overlay: null,
    subtitle: null,
    endCard: true,
    characters: [],
  });

  let t = 0;
  return beats.map((b, i) => {
    const shot: ContentShot = {
      id: `s${String(i + 1).padStart(2, "0")}`,
      index: i + 1,
      startSec: Math.round(t * 1000) / 1000,
      ...b,
    };
    t += b.durationSec;
    return shot;
  });
}

export function slugifyTitle(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return base || `episode-${Date.now()}`;
}
