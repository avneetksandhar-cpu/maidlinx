import type { AdapterContext, AdapterFetchResult, EventAdapter, SourceSlug } from "@/lib/events/types";

function internalAdapter(slug: SourceSlug, name: string): EventAdapter {
  return {
    slug,
    name,
    enabled: true,
    async fetch(ctx: AdapterContext): Promise<AdapterFetchResult> {
      return { status: "ok", events: ctx.existingForSource ?? [] };
    },
  };
}

export const adminAdapter = internalAdapter("admin", "Admin-created listings");
export const csvAdapter = internalAdapter("csv", "CSV / XLSX imports");
