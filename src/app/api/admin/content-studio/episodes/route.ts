import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { getAdminSessionOrNull } from "@/lib/admin/session";
import { buildDefaultCaptions } from "@/lib/content-studio/captions";
import { listEpisodes } from "@/lib/content-studio/load";
import { episodeDir, episodesDir } from "@/lib/content-studio/paths";
import { buildTimestampedShotList, slugifyTitle } from "@/lib/content-studio/shot-list";
import type { ContentEpisode } from "@/lib/content-studio/types";

const draftSchema = z.object({
  title: z.string().min(2).max(120),
  genre: z.string().min(1).max(80),
  hook: z.string().min(1).max(280),
  durationSeconds: z.number().min(5).max(60).default(15),
  characters: z.array(z.string()).min(1),
  location: z.string().min(1).max(160),
  story: z.string().min(1).max(2000),
  dialogue: z
    .array(z.object({ speaker: z.string().min(1), line: z.string().min(1) }))
    .min(1),
  cta: z.string().min(1).max(200),
  platform: z.string().min(1).max(40).default("tiktok"),
  slug: z.string().min(2).max(64).optional(),
});

export async function GET() {
  const admin = await getAdminSessionOrNull();
  if (!admin) return jsonError("Admin access denied.", 403);
  return jsonSuccess({ episodes: listEpisodes() });
}

export async function POST(request: Request) {
  const admin = await getAdminSessionOrNull();
  if (!admin) return jsonError("Admin access denied.", 403);

  try {
    const body = draftSchema.parse(await request.json());
    const slug = body.slug?.replace(/[^a-z0-9-]/g, "") || slugifyTitle(body.title);
    const dir = episodeDir(slug);
    if (existsSync(join(dir, "episode.json"))) {
      return jsonError("Episode slug already exists. Choose another slug.", 409);
    }

    mkdirSync(join(dir, "assets"), { recursive: true });
    mkdirSync(episodesDir(), { recursive: true });

    const shots = buildTimestampedShotList(body);
    const durationSeconds =
      shots.reduce((s, sh) => Math.max(s, sh.startSec + sh.durationSec), 0) ||
      body.durationSeconds;

    const episode: ContentEpisode = {
      id: slug,
      slug,
      title: body.title,
      genre: body.genre,
      hook: body.hook,
      durationSeconds,
      width: 1080,
      height: 1920,
      aspectRatio: "9:16",
      fps: 30,
      platform: body.platform,
      characters: body.characters,
      location: body.location,
      story: body.story,
      cta: body.cta,
      disclaimer: "Original scripted fiction. Not a customer testimonial.",
      dialogue: body.dialogue,
      endCard: {
        lines: ["MaidLinx", "Your Clean Connection.", "maidlinx.com"],
        durationSeconds: 1.5,
      },
      captions: buildDefaultCaptions({
        title: body.title,
        hook: body.hook,
        cta: body.cta,
        disclaimer: "Original scripted fiction. Not a customer testimonial.",
      }),
      shots,
      audio: { bgm: null, sfx: {}, notes: "Optional SFX/BGM under content-studio/audio/" },
    };

    writeFileSync(join(dir, "episode.json"), JSON.stringify(episode, null, 2), "utf8");
    return jsonSuccess({ episode }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(error.issues.map((i) => i.message).join("; "), 400);
    }
    const message = error instanceof Error ? error.message : "Unable to create episode.";
    return jsonError(message, 500);
  }
}
