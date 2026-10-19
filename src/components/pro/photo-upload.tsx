"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import type { JobPhoto } from "@/lib/pro/dashboard/jobs";
import { JOB_PHOTO_SLOT_CAP } from "@/lib/pro/dashboard/display";
import { cn } from "@/lib/utils";

interface PhotoUploadProps {
  jobId: string;
  photoType: "before" | "after";
  photos: JobPhoto[];
  disabled?: boolean;
}

export function PhotoUpload({ jobId, photoType, photos, disabled = false }: PhotoUploadProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const label = photoType === "before" ? "Before photos" : "After photos";
  const atCap = photos.length >= JOB_PHOTO_SLOT_CAP;

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("photoType", photoType);
      formData.append("file", file);

      const response = await fetch(`/api/cleaner/jobs/${jobId}/photos`, {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Upload failed.");

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-[var(--ml-dark-ink)]">{label}</h3>
        <span className="text-sm tabular-nums text-[var(--ml-dark-ink-muted)]">
          {photos.length}/{JOB_PHOTO_SLOT_CAP}
        </span>
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {photos.map((photo) => (
          <a
            key={photo.id}
            href={photo.publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface-2)]"
          >
            <Image
              src={photo.publicUrl}
              alt={`${photoType} photo`}
              fill
              className="object-cover"
              unoptimized
            />
          </a>
        ))}

        {!disabled && !atCap ? (
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex size-20 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[var(--ml-dark-border-strong)]",
              "bg-[var(--ml-dark-surface-2)] text-[var(--ml-dark-ink-muted)] active:bg-[var(--ml-dark-surface)]",
              "disabled:opacity-60",
            )}
          >
            <Camera className="size-5" strokeWidth={1.75} aria-hidden />
            <span className="text-[10px] font-medium">
              {uploading ? "…" : "Add photo"}
            </span>
          </button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        disabled={disabled || uploading || atCap}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleUpload(file);
          e.target.value = "";
        }}
      />

      {error ? <p className="text-sm text-error">{error}</p> : null}
    </section>
  );
}
