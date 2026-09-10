import path from "path";
import fs from "fs";
import { bundle } from "@remotion/bundler";
import { renderMedia } from "@remotion/renderer";
import type { Session } from "../types";
import { fetchPixabayVideosForSession } from "../media/fetchPixabayVideos";
import { generateNarrationForSession } from "../audio/generateNarration";

function sanitize(name: string) {
  return (name || "session").replace(/[^a-z0-9-_]+/gi, "_").slice(0, 80);
}

export async function renderSessionVideo(
  s: Session,
  opts?: { textPlacement?: "top" | "middle" | "bottom"; audioVolume?: number }
): Promise<string> {
  const media = await fetchPixabayVideosForSession(s);
  const narration = await generateNarrationForSession(s);

  const entry = path.resolve("src/video/remotion/index.tsx");
  const bundleLocation = await bundle(entry);

  const outDir = path.resolve("output");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.resolve(outDir, `${sanitize(s.id || "session")}.mp4`);

  await renderMedia({
    composition: {
      id: "SessionComp",
      fps: 30,
      width: 1920,
      height: 1080,
      durationInFrames: Math.max(1, Math.round((narration.durationSeconds || 10) * 30)),
      props: {},
      defaultProps: {
        backgroundVideo: media.selected?.[0] || media.first || media.fallback,
        overlayText: s.text,
        audioPath: narration.audioPath,
        durationSeconds: narration.durationSeconds,
        textPlacement: opts?.textPlacement ?? "middle",
        audioVolume: opts?.audioVolume ?? 1,
      },
      defaultCodec: "h264",
    },
    serveUrl: bundleLocation,
    codec: "h264",
    outputLocation: outPath,
    logLevel: "info",
    overwrite: true,
  });

  return outPath;
}

