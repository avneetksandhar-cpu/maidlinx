"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, CardContent } from "@/components/ui";
import type { FavoriteCleaner } from "@/lib/dashboard/favorites";

interface FavoriteCleanerCardProps {
  cleaner: FavoriteCleaner;
}

export function FavoriteCleanerCard({ cleaner }: FavoriteCleanerCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    setLoading(true);
    try {
      await fetch("/api/dashboard/favorites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ professionalProfileId: cleaner.professionalProfileId }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-muted font-display text-sm font-semibold text-accent">
            {cleaner.name
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-ink">{cleaner.name}</p>
            <p className="text-sm text-ink-muted">
              {cleaner.ratingAverage.toFixed(1)} · {cleaner.ratingCount} reviews
              {cleaner.isVerified ? " · MaidLinx Verified" : ""}
            </p>
            {cleaner.isVerified && (
              <p className="mt-1 text-xs text-ink-muted">
                Ops-approved and trained for MaidLinx jobs. Screening partner status is
                shown only when a real provider is connected — never invented.
              </p>
            )}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleRemove} disabled={loading}>
          {loading ? "Removing..." : "Remove"}
        </Button>
      </CardContent>
    </Card>
  );
}
