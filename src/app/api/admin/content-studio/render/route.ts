import { existsSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { getAdminSessionOrNull } from "@/lib/admin/session";
import { loadEpisode } from "@/lib/content-studio/load";
import { rendersDir } from "@/lib/content-studio/paths";

const schema = z.object({
  episode: z.string().min(2).max(80),
});

/**
 * Render is intentionally CLI-only (founder machine + system FFmpeg).
 * No child_process spawn here — keeps Next/Turbopack NFT scoped and Vercel safe.
 */
export async function POST(request: Request) {
  const admin = await getAdminSessionOrNull();
  if (!admin) return jsonError("Admin access denied.", 403);

  try {
    const body = schema.parse(await request.json());
    const episode = loadEpisode(body.episode);
    if (!episode) return jsonError("Episode not found.", 404);

    const cli = `npm run content-studio:render -- --episode=${episode.slug}`;
    const outMp4 = join(rendersDir(), `${episode.slug}-tiktok.mp4`);

    return jsonSuccess({
      mode: "cli",
      command: cli,
      note: "Run this on a machine with FFmpeg installed (brew install ffmpeg). Not executed on the app server.",
      expectedOutput: `content-studio/renders/${episode.slug}-tiktok.mp4`,
      alreadyRendered: existsSync(outMp4),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(error.issues.map((i) => i.message).join("; "), 400);
    }
    const message = error instanceof Error ? error.message : "Render request failed.";
    return jsonError(message, 500);
  }
}
