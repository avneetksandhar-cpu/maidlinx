import { jsonError, jsonSuccess } from "@/lib/api/response";
import { listCleanerDocuments, registerCleanerDocument } from "@/lib/cleaners/documents";
import { markOnboardingStep } from "@/lib/cleaners/onboarding-store";
import { requireProfessionalSession } from "@/lib/pro/dashboard/session";
import { registerDocumentSchema } from "@/lib/validations/pro-dashboard";

export async function GET() {
  try {
    const { profile } = await requireProfessionalSession();
    const documents = await listCleanerDocuments(profile.professionalId);
    return jsonSuccess({ documents });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Authentication required.", 401);
  }
}

export async function POST(request: Request) {
  try {
    const { profile } = await requireProfessionalSession();
    const body = await request.json();
    const parsed = registerDocumentSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid document metadata.", 400);
    }

    // Reject path traversal / absolute public URLs — metadata only for private storage keys.
    if (
      parsed.data.storagePath.includes("..") ||
      parsed.data.storagePath.startsWith("http")
    ) {
      return jsonError("storagePath must be a private storage key, not a public URL.", 400);
    }

    const document = await registerCleanerDocument({
      cleanerId: profile.professionalId,
      docType: parsed.data.docType,
      storagePath: parsed.data.storagePath,
      fileName: parsed.data.fileName,
      mimeType: parsed.data.mimeType,
    });

    await markOnboardingStep(profile.professionalId, "documents", true);
    return jsonSuccess({ document });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to register document.", 400);
  }
}
