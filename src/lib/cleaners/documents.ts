import { createAdminClient } from "@/lib/supabase/admin";

export const CLEANER_DOC_TYPES = [
  "id_front",
  "id_back",
  "selfie",
  "work_auth",
  "insurance",
  "other",
] as const;

export type CleanerDocType = (typeof CLEANER_DOC_TYPES)[number];

export type CleanerDocStatus = "uploaded" | "under_review" | "accepted" | "rejected";

export interface CleanerDocument {
  id: string;
  cleanerId: string;
  docType: CleanerDocType;
  storagePath: string;
  fileName: string | null;
  mimeType: string | null;
  status: CleanerDocStatus;
  rejectionReason: string | null;
  createdAt: string;
}

export async function listCleanerDocuments(cleanerId: string): Promise<CleanerDocument[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("cleaner_documents")
    .select("*")
    .eq("cleaner_id", cleanerId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const record = row as Record<string, unknown>;
    return {
      id: String(record.id),
      cleanerId: String(record.cleaner_id),
      docType: record.doc_type as CleanerDocType,
      storagePath: String(record.storage_path),
      fileName: record.file_name ? String(record.file_name) : null,
      mimeType: record.mime_type ? String(record.mime_type) : null,
      status: record.status as CleanerDocStatus,
      rejectionReason: record.rejection_reason ? String(record.rejection_reason) : null,
      createdAt: String(record.created_at),
    };
  });
}

/**
 * Register document metadata only. File bytes belong in private storage;
 * this never returns signed public URLs for private docs.
 */
export async function registerCleanerDocument(input: {
  cleanerId: string;
  docType: CleanerDocType;
  storagePath: string;
  fileName?: string | null;
  mimeType?: string | null;
}): Promise<CleanerDocument> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("cleaner_documents")
    .insert({
      cleaner_id: input.cleanerId,
      doc_type: input.docType,
      storage_path: input.storagePath,
      file_name: input.fileName ?? null,
      mime_type: input.mimeType ?? null,
      status: "uploaded",
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Unable to register document.");

  const record = data as Record<string, unknown>;
  return {
    id: String(record.id),
    cleanerId: String(record.cleaner_id),
    docType: record.doc_type as CleanerDocType,
    storagePath: String(record.storage_path),
    fileName: record.file_name ? String(record.file_name) : null,
    mimeType: record.mime_type ? String(record.mime_type) : null,
    status: record.status as CleanerDocStatus,
    rejectionReason: record.rejection_reason ? String(record.rejection_reason) : null,
    createdAt: String(record.created_at),
  };
}
