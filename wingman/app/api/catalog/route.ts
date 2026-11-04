import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/http";
import { listCatalog } from "@/lib/catalog/service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const products = await listCatalog(true);
    return NextResponse.json({ products });
  } catch {
    return jsonError("Catalog is unavailable right now.", 503);
  }
}
