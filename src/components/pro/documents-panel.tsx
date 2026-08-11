"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, Input, Label } from "@/components/ui";
import {
  CLEANER_DOC_TYPES,
  type CleanerDocument,
  type CleanerDocType,
} from "@/lib/cleaners/documents";

const LABELS: Record<CleanerDocType, string> = {
  id_front: "ID front",
  id_back: "ID back",
  selfie: "Selfie",
  work_auth: "Work authorization",
  insurance: "Insurance",
  other: "Other",
};

export function DocumentsPanel({ documents }: { documents: CleanerDocument[] }) {
  const router = useRouter();
  const [docType, setDocType] = useState<CleanerDocType>("id_front");
  const [storagePath, setStoragePath] = useState("");
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function register() {
    setMessage(null);
    startTransition(async () => {
      const res = await fetch("/api/cleaner/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docType,
          storagePath: storagePath.trim(),
          fileName: fileName.trim() || null,
          mimeType: "application/octet-stream",
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(json?.error ?? "Could not register document.");
        return;
      }
      setStoragePath("");
      setFileName("");
      setMessage("Document metadata registered. Files stay in private storage.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface px-4 py-4">
        <p className="text-sm text-ink-muted">
          Upload to private storage first, then register the storage key here. MaidLinx never
          exposes private document URLs publicly.
        </p>
        <div className="mt-4 space-y-3">
          <div>
            <Label htmlFor="docType">Document type</Label>
            <select
              id="docType"
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              value={docType}
              onChange={(e) => setDocType(e.target.value as CleanerDocType)}
            >
              {CLEANER_DOC_TYPES.map((type) => (
                <option key={type} value={type}>
                  {LABELS[type]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="storagePath">Private storage path</Label>
            <Input
              id="storagePath"
              value={storagePath}
              onChange={(e) => setStoragePath(e.target.value)}
              placeholder="cleaners/{id}/id_front.jpg"
            />
          </div>
          <div>
            <Label htmlFor="fileName">File name (optional)</Label>
            <Input
              id="fileName"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="id_front.jpg"
            />
          </div>
          <Button
            className="w-full"
            disabled={pending || storagePath.trim().length < 3}
            onClick={() => void register()}
          >
            Register document
          </Button>
        </div>
        {message ? <p className="mt-3 text-sm text-ink-muted">{message}</p> : null}
      </div>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-semibold text-navy">Your documents</h2>
        {documents.length === 0 ? (
          <p className="text-sm text-ink-muted">No documents registered yet.</p>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              className="flex min-h-14 items-center justify-between rounded-xl border border-border bg-surface px-4 py-3"
            >
              <div>
                <p className="font-medium text-ink">{LABELS[doc.docType]}</p>
                <p className="text-xs text-ink-muted">
                  {doc.fileName ?? doc.storagePath} · {doc.status}
                </p>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
