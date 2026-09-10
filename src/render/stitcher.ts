import * as fs from "fs";
import * as path from "path";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";

ffmpeg.setFfmpegPath(ffmpegStatic as string);

export async function stitchSessionsToFinal(paths: string[], opts?: {
  backgroundMusic?: string;
  normalizeAudio?: boolean;
}): Promise<string> {
  const outDir = path.resolve("output");
  await fs.promises.mkdir(outDir, { recursive: true });
  const listFile = path.join(outDir, "concat_list.txt");

  const content = paths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n");
  await fs.promises.writeFile(listFile, content, "utf8");

  const outPath = path.join(outDir, "final_video.mp4");

  await new Promise<void>((resolve, reject) => {
    let cmd = ffmpeg()
      .input(listFile)
      .inputOptions(["-f", "concat", "-safe", "0"])
      .outputOptions(["-c", "copy"])
      .output(outPath);

    if (opts?.backgroundMusic) {
      cmd = ffmpeg()
        .input(listFile)
        .inputOptions(["-f", "concat", "-safe", "0"])
        .input(opts.backgroundMusic)
        .complexFilter([
          "[0:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2[v]",
          "[0:a]anull[a0]",
          "[1:a]volume=0.2[a1]",
          "[a0][a1]amix=inputs=2:duration=longest[a]",
        ])
        .outputOptions(["-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-c:a", "aac"])
        .output(outPath);
    }

    cmd.on("end", () => resolve());
    cmd.on("error", reject);
    cmd.run();
  });

  return outPath;
}
