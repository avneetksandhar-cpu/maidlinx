import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { RenderPanel } from "@/components/admin/content-studio/render-panel";
import { routes } from "@/config/site";
import { loadEpisode } from "@/lib/content-studio/load";

export const metadata = {
  title: "Admin · Episode",
  robots: { index: false, follow: false },
};

export default async function ContentStudioEpisodePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const episode = loadEpisode(slug);
  if (!episode) notFound();

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-10">
      <AdminHeader
        title={episode.title}
        badge={episode.platform}
        description={`${episode.genre} · ${episode.width}×${episode.height} · ${episode.fps}fps · ${episode.durationSeconds}s`}
      />
      <p className="mb-6 text-sm">
        <Link href={routes.adminContentStudio} className="text-accent hover:underline">
          ← Content Studio
        </Link>
      </p>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-surface p-5 shadow-card">
            <h2 className="font-display text-lg font-semibold">Brief</h2>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <Item label="Hook" value={episode.hook} />
              <Item label="Location" value={episode.location} />
              <Item label="CTA" value={episode.cta} />
              <Item label="Characters" value={episode.characters.join(", ")} />
            </dl>
            <p className="mt-4 text-sm text-ink">{episode.story}</p>
            {episode.disclaimer && (
              <p className="mt-3 text-xs text-ink-subtle">{episode.disclaimer}</p>
            )}
          </section>

          <section className="rounded-xl border border-border bg-surface p-5 shadow-card">
            <h2 className="font-display text-lg font-semibold">Dialogue</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {episode.dialogue.map((d, i) => (
                <li key={`${d.speaker}-${i}`}>
                  <span className="font-semibold text-accent">{d.speaker}</span>
                  <span className="text-ink"> — {d.line}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-border bg-surface p-5 shadow-card">
            <h2 className="font-display text-lg font-semibold">Shot list</h2>
            <p className="mt-1 text-xs text-ink-muted">
              TikTok safe zones reserved · hard cuts · Ken Burns on stills when attached
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-ink-subtle">
                  <tr>
                    <th className="py-2 pr-3">#</th>
                    <th className="py-2 pr-3">Time</th>
                    <th className="py-2 pr-3">Label</th>
                    <th className="py-2 pr-3">Move</th>
                    <th className="py-2">Subtitle / overlay</th>
                  </tr>
                </thead>
                <tbody>
                  {episode.shots.map((s) => (
                    <tr key={s.id} className="border-t border-border align-top">
                      <td className="py-2 pr-3 font-mono text-xs">{s.index}</td>
                      <td className="py-2 pr-3 font-mono text-xs">
                        {s.startSec.toFixed(1)}–{(s.startSec + s.durationSec).toFixed(1)}s
                      </td>
                      <td className="py-2 pr-3">
                        <div className="font-medium text-ink">{s.label}</div>
                        <div className="text-xs text-ink-muted">{s.visual}</div>
                      </td>
                      <td className="py-2 pr-3 text-xs">{s.movement || "—"}</td>
                      <td className="py-2 text-xs">
                        {s.speaker && (
                          <div className="font-semibold text-accent">{s.speaker}</div>
                        )}
                        {s.subtitle || s.overlay || (s.endCard ? "END CARD" : "—")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-surface p-5 shadow-card">
            <h2 className="font-display text-lg font-semibold">Captions</h2>
            <div className="mt-3 space-y-4 text-sm">
              <CaptionBlock title="TikTok" body={episode.captions?.tiktok} />
              <CaptionBlock title="Instagram" body={episode.captions?.instagram} />
              <CaptionBlock
                title="YouTube Shorts title"
                body={episode.captions?.youtubeShortsTitle}
              />
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <RenderPanel episodeSlug={episode.slug} />
          <div className="rounded-xl border border-border bg-ink p-5 text-white">
            <p className="font-display text-lg font-semibold">End card</p>
            <p className="mt-4 text-2xl font-semibold tracking-tight">MaidLinx</p>
            <p className="mt-1 text-accent">Your Clean Connection.</p>
            <p className="mt-1 text-sm text-white/60">maidlinx.com</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4 text-xs text-ink-muted">
            Attach stills under{" "}
            <code>content-studio/episodes/{episode.slug}/assets/</code> and set{" "}
            <code>shot.still</code> in episode.json. Renderer never overwrites sources.
          </div>
        </aside>
      </div>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-ink-subtle">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}

function CaptionBlock({ title, body }: { title: string; body?: string }) {
  if (!body) return null;
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
        {title}
      </h3>
      <pre className="mt-1 whitespace-pre-wrap rounded-lg bg-surface-muted p-3 text-xs text-ink">
        {body}
      </pre>
    </div>
  );
}
