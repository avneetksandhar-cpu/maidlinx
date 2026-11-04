import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  brandPath,
  charactersDir,
  episodeDir,
  episodesDir,
} from "@/lib/content-studio/paths";
import type { ContentCharacter, ContentEpisode } from "@/lib/content-studio/types";

export function loadBrand() {
  const path = brandPath();
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8")) as {
    name: string;
    tagline: string;
    url: string;
    colors: Record<string, string>;
    endCardSeconds: number;
    disclaimer: string;
  };
}

export function listCharacters(): ContentCharacter[] {
  const dir = charactersDir();
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const raw = JSON.parse(readFileSync(join(dir, f), "utf8")) as ContentCharacter;
      const refDir = join(dir, raw.id, "references");
      const refs = existsSync(refDir)
        ? readdirSync(refDir).filter((n) => !n.startsWith(".") && n !== ".gitkeep")
        : [];
      return { ...raw, referenceImages: refs };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function listEpisodes(): ContentEpisode[] {
  const dir = episodesDir();
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => {
      const p = join(dir, name);
      return statSync(p).isDirectory() && existsSync(join(p, "episode.json"));
    })
    .map((name) => loadEpisode(name)!)
    .filter(Boolean)
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

export function loadEpisode(slug: string): ContentEpisode | null {
  const path = join(episodeDir(slug), "episode.json");
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8")) as ContentEpisode;
}
