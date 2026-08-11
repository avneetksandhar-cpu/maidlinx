import { Suspense } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { FavoriteCleanerCard } from "@/components/dashboard/favorite-cleaner-card";
import { getFavoriteCleaners } from "@/lib/dashboard/favorites";
import { requireCustomerSession } from "@/lib/dashboard/session";
import { routes } from "@/config/site";

export const metadata = {
  title: "Favorite cleaners",
};

async function FavoritesContent() {
  const { profile } = await requireCustomerSession();
  const favorites = await getFavoriteCleaners(profile.id);

  return (
    <>
      <DashboardHeader
        title="Favorite cleaners"
        description="Save pros you love and request them on future bookings."
      />
      {favorites.length === 0 ? (
        <EmptyState
          title="No favorites yet"
          description="After your first clean, you can save your favorite professional here."
          actionLabel="Book a clean"
          actionHref={routes.book}
        />
      ) : (
        <div className="space-y-3">
          {favorites.map((cleaner) => (
            <FavoriteCleanerCard key={cleaner.id} cleaner={cleaner} />
          ))}
        </div>
      )}
    </>
  );
}

export default function FavoritesPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-border" />}>
        <FavoritesContent />
      </Suspense>
    </div>
  );
}
