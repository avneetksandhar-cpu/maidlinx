#!/usr/bin/env node
/**
 * MaidLinx Content Studio — local FFmpeg renderer (no paid SaaS).
 * Usage:
 *   node scripts/content-studio/render.mjs --episode=001-spilled-last-summer
 *   npm run content-studio:render -- --episode=001-spilled-last-summer
 *
 * Requires system ffmpeg. Does not alter Next.js bundling.
 */

import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const STUDIO = join(ROOT, "content-studio");

function arg(name, fallback = null) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  if (hit) return hit.slice(prefix.length);
  const flag = process.argv.includes(`--${name}`);
  if (flag && fallback === null) return true;
  return fallback;
}

function ensureDir(p) {
  mkdirSync(p, { recursive: true });
}

function whichFfmpeg() {
  // Prefer ffmpeg-full (Homebrew keg) — plain ffmpeg bottle often lacks drawtext.
  const candidates = [
    "/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg",
    "/usr/local/opt/ffmpeg-full/bin/ffmpeg",
    "ffmpeg",
  ];
  for (const bin of candidates) {
    const r = spawnSync(bin, ["-filters"], { encoding: "utf8" });
    if (r.status !== 0) continue;
    const filters = `${r.stdout || ""}\n${r.stderr || ""}`;
    if (filters.includes("drawtext")) return bin;
    // Keep as fallback if nothing with drawtext is found
    if (bin === "ffmpeg") {
      const ver = spawnSync(bin, ["-version"], { encoding: "utf8" });
      if (ver.status === 0) return bin;
    }
  }
  return null;
}

function escapeDrawtext(text) {
  return String(text)
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'")
    .replace(/%/g, "\\%")
    .replace(/\n/g, " ");
}

function secToSrt(t) {
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = Math.floor(t % 60);
  const ms = Math.round((t - Math.floor(t)) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

function writeSrt(episode, outPath) {
  const lines = [];
  let i = 1;
  for (const shot of episode.shots) {
    if (!shot.subtitle) continue;
    const end = shot.startSec + shot.durationSec;
    lines.push(String(i++));
    lines.push(`${secToSrt(shot.startSec)} --> ${secToSrt(end)}`);
    lines.push(shot.subtitle);
    lines.push("");
  }
  writeFileSync(outPath, lines.join("\n"), "utf8");
}

function writeCaptions(episode, outDir) {
  const c = episode.captions || {};
  if (c.tiktok) writeFileSync(join(outDir, `${episode.slug}.tiktok.txt`), c.tiktok, "utf8");
  if (c.instagram) writeFileSync(join(outDir, `${episode.slug}.instagram.txt`), c.instagram, "utf8");
  if (c.youtubeShortsTitle) {
    writeFileSync(join(outDir, `${episode.slug}.youtube-shorts-title.txt`), c.youtubeShortsTitle, "utf8");
  }
}

function zoompanExpr(movement, frames) {
  const d = Math.max(frames, 1);
  switch (movement) {
    case "kenburns-in":
    case "zoom-in":
      return `zoompan=z='min(1.12,1+0.12*on/${d})':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${d}:s=1080x1920:fps=30`;
    case "kenburns-out":
      return `zoompan=z='if(eq(on,0),1.12,max(1,1.12-0.12*on/${d}))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${d}:s=1080x1920:fps=30`;
    case "pan-up":
      return `zoompan=z='1.08':x='iw/2-(iw/zoom/2)':y='ih*(1-on/${d})*0.08':d=${d}:s=1080x1920:fps=30`;
    case "shake":
      return `zoompan=z='1.06':x='iw/2-(iw/zoom/2)+8*sin(on/2)':y='ih/2-(ih/zoom/2)+6*cos(on/3)':d=${d}:s=1080x1920:fps=30`;
    default:
      return `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30`;
  }
}

function buildShotFilter(shot, episode, brand) {
  const fps = episode.fps || 30;
  const frames = Math.max(1, Math.round(shot.durationSec * fps));
  const bg = (shot.background || "#111827").replace("#", "");
  const textColor = (shot.textColor || "#FFFFFF").replace("#", "");
  const accent = (brand.colors?.accent || "#0D9488").replace("#", "");
  const safeBottom = brand.safeZones?.bottomPx ?? 220;
  const safeTop = brand.safeZones?.topPx ?? 140;

  const parts = [];
  // color source → optional still overlay later via separate input; for MVP color + text
  parts.push(`color=c=0x${bg}:s=1080x1920:d=${shot.durationSec}:r=${fps}`);

  if (shot.endCard) {
    const lines =
      Array.isArray(episode.endCard?.lines) && episode.endCard.lines.length
        ? episode.endCard.lines
        : [brand.name || "MaidLinx", brand.tagline || "Your Clean Connection.", brand.url || "maidlinx.com"];
    // Stack title (+ brand lines) centered; first line = episode title when present
    const draw = lines.map((raw, i) => {
      const text = escapeDrawtext(raw);
      const n = lines.length;
      const baseY = Math.round(960 - (n - 1) * 40);
      const y = baseY + i * 80;
      const isTitle = i === 0 && n >= 4;
      const isBrand = (n >= 4 && i === 1) || (n < 4 && i === 0);
      const fontsize = isTitle ? 40 : isBrand ? 64 : 34;
      const color = isBrand ? "0xFFFFFF" : i === n - 2 || (n >= 4 && i === 2) ? `0x${accent}` : "0x9CA3AF";
      return `drawtext=text='${text}':fontcolor=${color}:fontsize=${fontsize}:x=(w-text_w)/2:y=${y}`;
    });
    return [`color=c=0x111827:s=1080x1920:d=${shot.durationSec}:r=${fps}`, ...draw].join(",");
  }

  let vf = parts[0];
  // Apply subtle scale loop for movement on solid plates via zoompan needs an image;
  // use geq/crop simulation: fps already set. For solids, skip zoompan (needs frames).
  // Add overlays in TikTok safe zone.
  if (shot.overlay) {
    vf += `,drawtext=text='${escapeDrawtext(shot.overlay)}':fontcolor=0x${textColor}:fontsize=56:x=(w-text_w)/2:y=${safeTop + 40}`;
  }
  if (shot.subtitle) {
    vf += `,drawtext=text='${escapeDrawtext(shot.subtitle)}':fontcolor=0x${textColor}:fontsize=42:x=(w-text_w)/2:y=h-${safeBottom}:box=1:boxcolor=0x00000099:boxborderw=16`;
  }
  if (shot.speaker) {
    vf += `,drawtext=text='${escapeDrawtext(shot.speaker)}':fontcolor=0x${accent}:fontsize=28:x=(w-text_w)/2:y=h-${safeBottom + 70}`;
  }

  // Mark movement as metadata-only for solid plates; when still exists we use zoompan path
  void frames;
  return vf;
}

function renderShotWithStill(ffmpeg, shot, episode, brand, stillPath, outPath) {
  const fps = episode.fps || 30;
  const frames = Math.max(1, Math.round(shot.durationSec * fps));
  const textColor = (shot.textColor || "#FFFFFF").replace("#", "");
  const accent = (brand.colors?.accent || "#0D9488").replace("#", "");
  const safeBottom = brand.safeZones?.bottomPx ?? 220;
  const safeTop = brand.safeZones?.topPx ?? 140;

  let vf = zoompanExpr(shot.movement || "kenburns-in", frames);
  if (shot.overlay) {
    vf += `,drawtext=text='${escapeDrawtext(shot.overlay)}':fontcolor=0x${textColor}:fontsize=56:x=(w-text_w)/2:y=${safeTop + 40}`;
  }
  if (shot.subtitle) {
    vf += `,drawtext=text='${escapeDrawtext(shot.subtitle)}':fontcolor=0x${textColor}:fontsize=42:x=(w-text_w)/2:y=h-${safeBottom}:box=1:boxcolor=0x00000099:boxborderw=16`;
  }
  if (shot.speaker) {
    vf += `,drawtext=text='${escapeDrawtext(shot.speaker)}':fontcolor=0x${accent}:fontsize=28:x=(w-text_w)/2:y=h-${safeBottom + 70}`;
  }

  const args = [
    "-y",
    "-loop",
    "1",
    "-i",
    stillPath,
    "-vf",
    vf,
    "-t",
    String(shot.durationSec),
    "-r",
    String(fps),
    "-an",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    outPath,
  ];
  const r = spawnSync(ffmpeg, args, { encoding: "utf8" });
  if (r.status !== 0) {
    throw new Error(`Shot ${shot.id} still render failed:\n${r.stderr}`);
  }
}

function renderShotColor(ffmpeg, shot, episode, brand, outPath) {
  const vf = buildShotFilter(shot, episode, brand);
  const args = [
    "-y",
    "-f",
    "lavfi",
    "-i",
    vf.includes("drawtext") ? `nullsrc=s=1080x1920:d=${shot.durationSec}:r=${episode.fps || 30}` : `color=c=black:s=1080x1920:d=${shot.durationSec}:r=${episode.fps || 30}`,
    "-vf",
    vf.startsWith("color=") ? vf : vf,
    "-t",
    String(shot.durationSec),
    "-r",
    String(episode.fps || 30),
    "-an",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    outPath,
  ];

  // lavfi with full filtergraph as -i is cleaner:
  const lavfi = vf;
  const args2 = [
    "-y",
    "-f",
    "lavfi",
    "-i",
    lavfi,
    "-t",
    String(shot.durationSec),
    "-r",
    String(episode.fps || 30),
    "-an",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    outPath,
  ];
  void args;
  const r = spawnSync(ffmpeg, args2, { encoding: "utf8" });
  if (r.status !== 0) {
    throw new Error(`Shot ${shot.id} color render failed:\n${r.stderr}`);
  }
}

function resolveStill(shot, episodeDir, root) {
  if (!shot.still) return null;
  const candidates = [
    join(episodeDir, shot.still),
    join(STUDIO, shot.still),
    join(root, shot.still),
  ];
  return candidates.find((p) => existsSync(p)) || null;
}

function main() {
  const episodeId = arg("episode", "001-spilled-last-summer");
  const episodePath = join(STUDIO, "episodes", episodeId, "episode.json");
  if (!existsSync(episodePath)) {
    console.error(`Episode not found: ${episodePath}`);
    process.exit(1);
  }

  const brand = JSON.parse(readFileSync(join(STUDIO, "brand.json"), "utf8"));
  const episode = JSON.parse(readFileSync(episodePath, "utf8"));
  const episodeDir = join(STUDIO, "episodes", episodeId);
  const rendersDir = join(STUDIO, "renders");
  const thumbsDir = join(STUDIO, "thumbnails");
  const workDir = join(rendersDir, `.work-${episode.slug}`);
  ensureDir(rendersDir);
  ensureDir(thumbsDir);
  ensureDir(workDir);

  // Always emit captions + SRT even without ffmpeg
  writeCaptions(episode, rendersDir);
  writeSrt(episode, join(rendersDir, `${episode.slug}.srt`));
  console.log(`Wrote captions + SRT for ${episode.slug}`);

  const ffmpeg = whichFfmpeg();
  if (!ffmpeg) {
    console.error(`
FFmpeg not found on PATH.
Install (macOS): brew install ffmpeg
Then re-run: npm run content-studio:render -- --episode=${episodeId}

Captions/SRT were still generated under content-studio/renders/.
`);
    process.exit(2);
  }

  const segmentPaths = [];
  try {
    for (const shot of episode.shots) {
      const out = join(workDir, `${shot.id}.mp4`);
      const still = resolveStill(shot, episodeDir, ROOT);
      if (still) {
        console.log(`Rendering ${shot.id} (still + ${shot.movement || "none"})…`);
        renderShotWithStill(ffmpeg, shot, episode, brand, still, out);
      } else {
        console.log(`Rendering ${shot.id} (color plate)…`);
        renderShotColor(ffmpeg, shot, episode, brand, out);
      }
      segmentPaths.push(out);
    }

    const listFile = join(workDir, "concat.txt");
    writeFileSync(
      listFile,
      segmentPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n"),
      "utf8",
    );

    const outMp4 = join(rendersDir, `${episode.slug}.mp4`);
    console.log("Concatenating…");
    const concat = spawnSync(
      ffmpeg,
      [
        "-y",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        listFile,
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-r",
        String(episode.fps || 30),
        "-movflags",
        "+faststart",
        outMp4,
      ],
      { encoding: "utf8" },
    );
    if (concat.status !== 0) {
      throw new Error(`Concat failed:\n${concat.stderr}`);
    }

    // Silent AAC track so players expecting audio don't choke
    const outFinal = join(rendersDir, `${episode.slug}-tiktok.mp4`);
    const mux = spawnSync(
      ffmpeg,
      [
        "-y",
        "-i",
        outMp4,
        "-f",
        "lavfi",
        "-i",
        "anullsrc=channel_layout=stereo:sample_rate=44100",
        "-shortest",
        "-c:v",
        "copy",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-movflags",
        "+faststart",
        outFinal,
      ],
      { encoding: "utf8" },
    );
    if (mux.status !== 0) {
      console.warn("AAC mux failed; keeping video-only MP4.", mux.stderr);
      copyFileSync(outMp4, outFinal);
    }

    const thumb = join(thumbsDir, `${episode.slug}.jpg`);
    spawnSync(
      ffmpeg,
      ["-y", "-ss", "1.2", "-i", outFinal, "-frames:v", "1", "-q:v", "3", thumb],
      { encoding: "utf8" },
    );

    // Prefer logo-stamped note file
    writeFileSync(
      join(rendersDir, `${episode.slug}.render.json`),
      JSON.stringify(
        {
          episode: episode.slug,
          title: episode.title,
          output: outFinal,
          thumbnail: thumb,
          width: episode.width,
          height: episode.height,
          fps: episode.fps,
          disclaimer: episode.disclaimer,
          renderedAt: new Date().toISOString(),
        },
        null,
        2,
      ),
      "utf8",
    );

    console.log(`\nOK → ${outFinal}`);
    console.log(`Thumbnail → ${thumb}`);
  } finally {
    try {
      rmSync(workDir, { recursive: true, force: true });
    } catch {
      /* keep work dir on failure for debug */
    }
  }
}

main();
