"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button, Card, CardContent } from "@/components/ui";
import type { JobPhoto } from "@/lib/pro/dashboard/jobs";

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
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-ink">{label}</h3>
          <span className="text-sm text-ink-muted">{photos.length} uploaded</span>
        </div>

        {photos.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((photo) => (
              <a
                key={photo.id}
                href={photo.publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-surface-muted"
              >
                <Image
                  src={photo.publicUrl}
                  alt={`${photoType} photo`}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  unoptimized
                />
              </a>
            ))}
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          disabled={disabled || uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
            e.target.value = "";
          }}
        />

        {!disabled && (
          <Button
            variant="secondary"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? "Uploading..." : `Upload ${photoType} photo`}
          </Button>
        )}

        {error && <p className="text-sm text-error">{error}</p>}
      </CardContent>
    </Card>
  );
}
