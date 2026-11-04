import { writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { getAdminSessionOrNull } from "@/lib/admin/session";
import { loadEpisode } from "@/lib/content-studio/load";
import { episodeDir } from "@/lib/content-studio/paths";
import type { ContentEpisode } from "@/lib/content-studio/types";

const patchSchema = z.object({
  title: z.string().min(2).max(120).optional(),
  genre: z.string().min(1).max(80).optional(),
  hook: z.string().min(1).max(280).optional(),
  location: z.string().min(1).max(160).optional(),
  story: z.string().min(1).max(2000).optional(),
  cta: z.string().min(1).max(200).optional(),
  platform: z.string().min(1).max(40).optional(),
  characters: z.array(z.string()).min(1).optional(),
  dialogue: z
    .array(z.object({ speaker: z.string().min(1), line: z.string().min(1) }))
    .min(1)
    .optional(),
  shots: z.array(z.record(z.string(), z.unknown())).optional(),
  captions: z
    .object({
      tiktok: z.string().optional(),
      instagram: z.string().optional(),
      youtubeShortsTitle: z.string().optional(),
    })
    .optional(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const admin = await getAdminSessionOrNull();
  if (!admin) return jsonError("Admin access denied.", 403);
  const { slug } = await context.params;
  const episode = loadEpisode(slug);
  if (!episode) return jsonError("Episode not found.", 404);
  return jsonSuccess({ episode });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const admin = await getAdminSessionOrNull();
  if (!admin) return jsonError("Admin access denied.", 403);
  const { slug } = await context.params;
  const existing = loadEpisode(slug);
  if (!existing) return jsonError("Episode not found.", 404);

  try {
    const body = patchSchema.parse(await request.json());
    const next: ContentEpisode = {
      ...existing,
      ...body,
      shots: (body.shots as ContentEpisode["shots"] | undefined) ?? existing.shots,
      captions: body.captions
        ? { ...existing.captions, ...body.captions }
        : existing.captions,
      id: existing.id,
      slug: existing.slug,
    };
    const path = join(episodeDir(slug), "episode.json");
    if (!existsSync(path)) return jsonError("Episode file missing.", 404);
    writeFileSync(path, JSON.stringify(next, null, 2), "utf8");
    return jsonSuccess({ episode: next });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(error.issues.map((i) => i.message).join("; "), 400);
    }
    const message = error instanceof Error ? error.message : "Unable to update episode.";
    return jsonError(message, 500);
  }
}
