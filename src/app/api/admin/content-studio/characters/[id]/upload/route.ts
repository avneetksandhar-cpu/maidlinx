import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join, extname } from "node:path";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { getAdminSessionOrNull } from "@/lib/admin/session";
import { charactersDir } from "@/lib/content-studio/paths";

const ALLOWED = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);
const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminSessionOrNull();
  if (!admin) return jsonError("Admin access denied.", 403);

  const { id } = await context.params;
  const safeId = id.replace(/[^a-z0-9-]/gi, "").toLowerCase();
  if (!safeId) return jsonError("Invalid character id.", 400);

  const charJson = join(charactersDir(), `${safeId}.json`);
  if (!existsSync(charJson)) return jsonError("Character not found.", 404);

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return jsonError("Missing file.", 400);
    if (file.size > MAX_BYTES) return jsonError("File too large (max 8MB).", 400);

    const ext = extname(file.name || "").toLowerCase() || ".png";
    if (!ALLOWED.has(ext)) return jsonError("Unsupported file type.", 400);

    const refDir = join(charactersDir(), safeId, "references");
    mkdirSync(refDir, { recursive: true });

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const base = (file.name || "ref")
      .replace(ext, "")
      .replace(/[^a-z0-9-_]+/gi, "-")
      .slice(0, 40);
    const filename = `${stamp}-${base}${ext}`;
    const dest = join(refDir, filename);

    // Never overwrite: timestamped name guarantees uniqueness
    const buf = Buffer.from(await file.arrayBuffer());
    writeFileSync(dest, buf);

    return jsonSuccess({
      characterId: safeId,
      filename,
      path: `content-studio/characters/${safeId}/references/${filename}`,
    }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return jsonError(message, 500);
  }
}
