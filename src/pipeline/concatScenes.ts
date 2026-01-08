import { exec as execCb } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const exec = promisify(execCb);

export async function concatAllScenesOrdered(
  sceneFinalFiles: string[],
  outputMasterPath = '/tmp/final_master.mp4',
  musicPath?: string
): Promise<{ masterPath: string; thumbnailPath: string; outputs: string[] }> {
  // 1. Verify files
  for (const file of sceneFinalFiles) {
    if (!fs.existsSync(file)) throw new Error(`Scene file missing: ${file}`);
  }

  // 2. Create concat list
  const concatListPath = '/tmp/concat_list.txt';
  fs.writeFileSync(concatListPath, sceneFinalFiles.map(f => `file '${f}'`).join('\n'));

  // 3. FFmpeg concat demuxer
  await exec(`ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c copy "${outputMasterPath}"`);

  // 4. Loudness normalization
  const normPath = outputMasterPath.replace('.mp4', '_norm.mp4');
  await exec(`ffmpeg -y -i "${outputMasterPath}" -af loudnorm=I=-16:TP=-1.5:LRA=11 -c:v copy "${normPath}"`);

  // 5. Optional music mix
  let finalPath = normPath;
  if (musicPath && fs.existsSync(musicPath)) {
    const musicMixPath = outputMasterPath.replace('.mp4', '_music.mp4');
    await exec(
      `ffmpeg -y -i "${normPath}" -i "${musicPath}" -filter_complex "[1:a]volume=0.2[a1];[0:a][a1]amix=inputs=2:duration=first:dropout_transition=2" -c:v copy -c:a aac "${musicMixPath}"`
    );
    finalPath = musicMixPath;
  }

  // 6. Thumbnail
  const thumbnailPath = '/tmp/final_thumbnail.jpg';
  await exec(`ffmpeg -y -i "${finalPath}" -ss 1 -vframes 1 "${thumbnailPath}"`);

  // 7. Return
  return {
    masterPath: finalPath,
    thumbnailPath,
    outputs: [finalPath, thumbnailPath]
  };
}

// TODO: Support advanced music ducking, streaming, and configurable output presets.