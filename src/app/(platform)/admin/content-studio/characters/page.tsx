import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { CharacterUpload } from "@/components/admin/content-studio/character-upload";
import { routes } from "@/config/site";
import { listCharacters } from "@/lib/content-studio/load";

export const metadata = {
  title: "Admin · Content Studio Characters",
  robots: { index: false, follow: false },
};

export default async function ContentStudioCharactersPage() {
  const characters = listCharacters();

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-10">
      <AdminHeader
        title="Character library"
        description="Lexi, Nia, and The Caller stay visually/narratively consistent. Drop reference images here or locally under content-studio/characters/*/references/."
      />
      <p className="mb-6 text-sm">
        <Link href={routes.adminContentStudio} className="text-accent hover:underline">
          ← Content Studio
        </Link>
      </p>
      <div className="grid gap-4 lg:grid-cols-3">
        {characters.map((c) => (
          <article
            key={c.id}
            className="rounded-xl border border-border bg-surface p-5 shadow-card"
          >
            <h2 className="font-display text-xl font-semibold text-ink">{c.name}</h2>
            <p className="mt-1 text-sm text-ink-muted">{c.role}</p>
            <dl className="mt-4 space-y-2 text-sm">
              <div>
                <dt className="text-ink-subtle">Voice</dt>
                <dd className="text-ink">{c.voice}</dd>
              </div>
              <div>
                <dt className="text-ink-subtle">Look</dt>
                <dd className="text-ink">
                  {c.look.hair}. {c.look.wardrobe}.
                </dd>
              </div>
              <div>
                <dt className="text-ink-subtle">Consistency</dt>
                <dd className="text-ink">{c.consistencyNotes}</dd>
              </div>
              <div>
                <dt className="text-ink-subtle">References on disk</dt>
                <dd className="text-ink">
                  {c.referenceImages.length
                    ? c.referenceImages.join(", ")
                    : "None yet — upload or drop files locally"}
                </dd>
              </div>
            </dl>
            <CharacterUpload characterId={c.id} />
          </article>
        ))}
      </div>
    </div>
  );
}
