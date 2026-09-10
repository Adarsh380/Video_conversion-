import * as fs from "fs";
import * as path from "path";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import type { Session } from "../types";

ffmpeg.setFfmpegPath(ffmpegStatic as string);

function estimateDurationSeconds(text: string): number {
  const words = text.trim().split(/\s+/).length;
  const wpm = 140; // average speaking rate
  return Math.max(4, Math.round((words / wpm) * 60));
}

export type NarrationResult = {
  sessionId: string;
  script: string;
  audioPath: string;
  durationSeconds: number;
};

function generateSpokenStyle(text: string): string {
  // Placeholder LLM: lightly format text for speech
  return text
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/([.!?])\s*/g, " ")
    .trim();
}

export async function generateNarrationForSession(s: Session): Promise<NarrationResult> {
  const script = generateSpokenStyle(s.text);
  const duration = s.durationSeconds || s.pacingSeconds || estimateDurationSeconds(script);

  const outDir = path.resolve("tmp");
  await fs.promises.mkdir(outDir, { recursive: true });
  const audioPath = path.join(outDir, `${s.id ?? 'session'}_voice.wav`);

  // Placeholder TTS: generate silent audio matching duration
  await new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input("anullsrc=r=44100:cl=mono")
      .inputFormat("lavfi")
      .duration(duration)
      .audioCodec("pcm_s16le")
      .audioChannels(1)
      .audioFrequency(44100)
      .output(audioPath)
      .on("end", () => resolve())
      .on("error", reject)
      .run();
  });

  return { sessionId: s.id, script, audioPath, durationSeconds: duration };
}

