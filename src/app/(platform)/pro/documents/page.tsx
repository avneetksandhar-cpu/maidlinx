import { Suspense } from "react";
import { DocumentsPanel } from "@/components/pro/documents-panel";
import { ProHeader } from "@/components/pro/pro-header";
import { listCleanerDocuments } from "@/lib/cleaners/documents";
import { requireProfessionalSession } from "@/lib/pro/dashboard/session";

export const metadata = {
  title: "Documents",
};

async function DocumentsContent() {
  const { profile } = await requireProfessionalSession();
  const documents = await listCleanerDocuments(profile.professionalId);

  return (
    <>
      <ProHeader
        title="Documents"
        description="ID and work docs for ops review. Stored privately — never shown on the public site."
      />
      <DocumentsPanel documents={documents} />
    </>
  );
}

export default function ProDocumentsPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-5 sm:max-w-xl lg:max-w-2xl lg:px-8 lg:py-8">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-border" />}>
        <DocumentsContent />
      </Suspense>
    </div>
  );
}
