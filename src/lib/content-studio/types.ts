export type ContentPlatform = "tiktok" | "instagram" | "youtube_shorts";

export interface ContentShot {
  id: string;
  index: number;
  startSec: number;
  durationSec: number;
  label: string;
  visual: string;
  still: string | null;
  background?: string;
  movement?: string;
  transition?: string;
  overlay?: string | null;
  subtitle?: string | null;
  speaker?: string;
  textColor?: string;
  endCard?: boolean;
  characters?: string[];
  sfx?: string;
}

export interface ContentEpisode {
  id: string;
  slug: string;
  title: string;
  genre: string;
  hook: string;
  durationSeconds: number;
  width: number;
  height: number;
  aspectRatio: string;
  fps: number;
  platform: ContentPlatform | string;
  characters: string[];
  location: string;
  story: string;
  cta: string;
  disclaimer?: string;
  dialogue: Array<{ speaker: string; line: string }>;
  endCard?: { lines: string[]; durationSeconds: number };
  captions?: {
    tiktok?: string;
    instagram?: string;
    youtubeShortsTitle?: string;
  };
  shots: ContentShot[];
  audio?: {
    bgm?: string | null;
    sfx?: Record<string, string | null>;
    notes?: string;
  };
  assetRequirements?: Array<{
    id: string;
    shotIds: string[];
    description: string;
  }>;
}

export interface ContentCharacter {
  id: string;
  name: string;
  role: string;
  voice: string;
  look: {
    hair: string;
    wardrobe: string;
    era: string;
  };
  personality: string[];
  consistencyNotes: string;
  referenceDir: string;
  referenceImages: string[];
}

export interface EpisodeDraftInput {
  title: string;
  genre: string;
  hook: string;
  durationSeconds: number;
  characters: string[];
  location: string;
  story: string;
  dialogue: Array<{ speaker: string; line: string }>;
  cta: string;
  platform: string;
}
