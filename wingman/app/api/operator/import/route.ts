import { NextResponse } from "next/server";
import { isResponse, jsonError, requireOperator } from "@/lib/api/http";
import { mapImportRows, parseCsv } from "@/lib/marketplace/event-import";
import { importDiscoveryEvents } from "@/lib/marketplace/service";

export const runtime = "nodejs";

async function workbookToTable(buffer: Buffer): Promise<string[][]> {
  const xlsx = await import("xlsx");
  const workbook = xlsx.read(buffer, { type: "buffer" });
  const first = workbook.SheetNames[0];
  if (!first) return [];
  return xlsx.utils.sheet_to_json(workbook.Sheets[first], {
    header: 1,
    defval: "",
    raw: false,
  }) as string[][];
}

export async function POST(request: Request) {
  const user = await requireOperator();
  if (isResponse(user)) return user;

  const contentType = request.headers.get("content-type") ?? "";
  let table: string[][] = [];

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) return jsonError("Upload a CSV or XLSX file.", 400);
      const name = file.name.toLowerCase();
      const buffer = Buffer.from(await file.arrayBuffer());
      if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
        table = await workbookToTable(buffer);
      } else {
        table = parseCsv(buffer.toString("utf8"));
      }
    } else {
      const body = (await request.json()) as { csv?: string; rows?: string[][] };
      if (body.csv) table = parseCsv(body.csv);
      else if (body.rows) table = body.rows;
      else return jsonError("Provide csv text, rows, or a file.", 400);
    }
  } catch {
    return jsonError("Could not read the import file.", 400);
  }

  const parsed = mapImportRows(table);
  if (parsed.rows.length === 0) {
    return jsonError(parsed.errors[0]?.message ?? "No valid events found.", 400);
  }

  try {
    const result = await importDiscoveryEvents(user, parsed.rows);
    return NextResponse.json({
      ok: true,
      ...result,
      errors: parsed.errors,
      note: "Imported listings are discovery-only. Book with Wingman stays hidden until a verified Wingman has an approved offer.",
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Import failed.", 400);
  }
}
