import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { EpisodeGeneratorForm } from "@/components/admin/content-studio/episode-generator-form";
import { routes } from "@/config/site";
import { listCharacters, listEpisodes, loadBrand } from "@/lib/content-studio/load";

export const metadata = {
  title: "Admin · Content Studio",
  robots: { index: false, follow: false },
};

export default async function ContentStudioPage() {
  const [episodes, characters, brand] = [
    listEpisodes(),
    listCharacters(),
    loadBrand(),
  ];

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-10">
      <AdminHeader
        title="Content Studio"
        badge="Internal"
        description="Private MaidLinx short-form studio. Scripted fiction only — never fabricate customer reviews. FFmpeg local render · $0 SaaS."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Episodes" value={String(episodes.length)} />
        <Stat label="Characters" value={String(characters.length)} />
        <Stat label="Brand" value={brand?.name ?? "MaidLinx"} />
      </div>

      <section className="mb-10">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="font-display text-xl font-semibold text-ink">Episodes</h2>
          <Link
            href={`${routes.adminContentStudio}/characters`}
            className="text-sm font-medium text-accent hover:underline"
          >
            Character library →
          </Link>
        </div>
        <ul className="space-y-3">
          {episodes.map((ep) => (
            <li key={ep.slug}>
              <Link
                href={`${routes.adminContentStudio}/episodes/${ep.slug}`}
                className="block rounded-xl border border-border bg-surface p-4 shadow-card transition hover:border-accent"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-display text-lg font-semibold text-ink">{ep.title}</h3>
                  <span className="text-xs uppercase tracking-wide text-ink-subtle">
                    {ep.width}×{ep.height} · {ep.durationSeconds}s · {ep.platform}
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink-muted">{ep.hook}</p>
                <p className="mt-2 text-xs text-ink-subtle">{ep.slug}</p>
              </Link>
            </li>
          ))}
          {episodes.length === 0 && (
            <li className="text-sm text-ink-muted">No episodes yet.</li>
          )}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold text-ink">
          New episode
        </h2>
        <EpisodeGeneratorForm characterIds={characters.map((c) => c.id)} />
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-card">
      <p className="text-xs uppercase tracking-wide text-ink-subtle">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}
