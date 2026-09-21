import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/http";
import { getCatalogBySlug } from "@/lib/catalog/service";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  try {
    const product = await getCatalogBySlug(slug);
    if (!product || !product.active) return jsonError("Experience not found.", 404);
    return NextResponse.json({ product });
  } catch {
    return jsonError("Catalog is unavailable right now.", 503);
  }
}
