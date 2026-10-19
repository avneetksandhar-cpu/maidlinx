import { jsonError, jsonSuccess } from "@/lib/api/response";
import { getAdminSessionOrNull } from "@/lib/admin/session";
import { listCharacters, loadBrand } from "@/lib/content-studio/load";

export async function GET() {
  const admin = await getAdminSessionOrNull();
  if (!admin) return jsonError("Admin access denied.", 403);
  return jsonSuccess({ characters: listCharacters(), brand: loadBrand() });
}
