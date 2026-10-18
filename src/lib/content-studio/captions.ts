import type { ContentEpisode } from "@/lib/content-studio/types";

export function buildDefaultCaptions(episode: Pick<
  ContentEpisode,
  "title" | "hook" | "cta" | "disclaimer"
>): NonNullable<ContentEpisode["captions"]> {
  const disclaimer =
    episode.disclaimer ?? "Original scripted fiction. Not a customer testimonial.";
  return {
    tiktok: `${episode.hook}\n\n${episode.title}\n${disclaimer}\n\n${episode.cta}\n\n#MaidLinx #CleaningTok`,
    instagram: `${episode.title}\n\n${episode.hook}\n${disclaimer}\n\n${episode.cta}`,
    youtubeShortsTitle: `${episode.title} | MaidLinx Short`,
  };
}

export function shotsToSrt(episode: ContentEpisode): string {
  const blocks: string[] = [];
  let i = 1;
  for (const shot of episode.shots) {
    if (!shot.subtitle) continue;
    const end = shot.startSec + shot.durationSec;
    blocks.push(
      `${i++}\n${formatSrtTime(shot.startSec)} --> ${formatSrtTime(end)}\n${shot.subtitle}\n`,
    );
  }
  return blocks.join("\n");
}

function formatSrtTime(t: number): string {
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = Math.floor(t % 60);
  const ms = Math.round((t - Math.floor(t)) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${String(ms).padStart(3, "0")}`;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
