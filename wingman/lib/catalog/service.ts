import type { PoolClient } from "pg";
import type { CatalogProduct } from "@/lib/catalog/types";
import { getSql } from "@/lib/neon";

function mapCatalogRow(row: Record<string, unknown>): CatalogProduct {
  return {
    id: String(row.id),
    slug: String(row.slug),
    kind: row.kind === "vip_table" ? "vip_table" : "wingman_experience",
    name: String(row.name),
    priceCents: Number(row.price_cents),
    includedCopy: String(row.included_copy),
    extrasCopy: String(row.extras_copy),
    drinkOptions: Array.isArray(row.drink_options) ? (row.drink_options as string[]) : [],
    maxGuests: row.max_guests == null ? null : Number(row.max_guests),
    active: Boolean(row.active),
    sortOrder: Number(row.sort_order ?? 0),
  };
}

export async function listCatalog(activeOnly = true): Promise<CatalogProduct[]> {
  const sql = getSql();
  const rows = (
    activeOnly
      ? await sql`SELECT * FROM experience_catalog WHERE active = true ORDER BY sort_order ASC, name ASC`
      : await sql`SELECT * FROM experience_catalog ORDER BY sort_order ASC, name ASC`
  ) as Array<Record<string, unknown>>;
  return rows.map(mapCatalogRow);
}

export async function getCatalogBySlug(slug: string): Promise<CatalogProduct | null> {
  const sql = getSql();
  const rows = (await sql`
    SELECT * FROM experience_catalog WHERE slug = ${slug} LIMIT 1
  `) as Array<Record<string, unknown>>;
  return rows[0] ? mapCatalogRow(rows[0]) : null;
}

export async function getCatalogById(id: string): Promise<CatalogProduct | null> {
  const sql = getSql();
  const rows = (await sql`
    SELECT * FROM experience_catalog WHERE id = ${id} LIMIT 1
  `) as Array<Record<string, unknown>>;
  return rows[0] ? mapCatalogRow(rows[0]) : null;
}

export async function updateCatalogProduct(
  client: PoolClient,
  input: {
    id: string;
    priceCents?: number;
    name?: string;
    includedCopy?: string;
    extrasCopy?: string;
    drinkOptions?: string[];
    maxGuests?: number | null;
    active?: boolean;
  },
): Promise<CatalogProduct> {
  if (input.priceCents != null && (!Number.isInteger(input.priceCents) || input.priceCents < 1)) {
    throw new Error("Price must be a positive amount in cents.");
  }
  const updated = await client.query(
    `UPDATE experience_catalog
     SET price_cents = COALESCE($2, price_cents),
         name = COALESCE($3, name),
         included_copy = COALESCE($4, included_copy),
         extras_copy = COALESCE($5, extras_copy),
         drink_options = COALESCE($6::text[], drink_options),
         max_guests = CASE WHEN $7::boolean THEN $8 ELSE max_guests END,
         active = COALESCE($9, active),
         updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [
      input.id,
      input.priceCents ?? null,
      input.name ?? null,
      input.includedCopy ?? null,
      input.extrasCopy ?? null,
      input.drinkOptions ?? null,
      input.maxGuests !== undefined,
      input.maxGuests ?? null,
      input.active ?? null,
    ],
  );
  if (!updated.rows[0]) throw new Error("Catalog item not found.");
  return mapCatalogRow(updated.rows[0] as Record<string, unknown>);
}
