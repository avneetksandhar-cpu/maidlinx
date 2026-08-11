import { createShareImageResponse } from "@/lib/seo/share-image";

export const runtime = "nodejs";
export const alt = "MaidLinx — Book cleaning on demand";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function TwitterImage() {
  return createShareImageResponse();
}
