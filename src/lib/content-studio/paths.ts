import { join } from "node:path";

export function contentStudioRoot(cwd = process.cwd()): string {
  return join(cwd, "content-studio");
}

export function charactersDir(cwd = process.cwd()): string {
  return join(contentStudioRoot(cwd), "characters");
}

export function episodesDir(cwd = process.cwd()): string {
  return join(contentStudioRoot(cwd), "episodes");
}

export function episodeDir(slug: string, cwd = process.cwd()): string {
  return join(episodesDir(cwd), slug);
}

export function rendersDir(cwd = process.cwd()): string {
  return join(contentStudioRoot(cwd), "renders");
}

export function brandPath(cwd = process.cwd()): string {
  return join(contentStudioRoot(cwd), "brand.json");
}
