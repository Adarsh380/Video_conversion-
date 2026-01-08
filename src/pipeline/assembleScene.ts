import { exec as execCb } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const exec = promisify(execCb);

export interface Scene {
  id: string;
  duration_seconds: number;
  on_screen_text: string;
  mood: string;
  // ...other fields
}
export interface RankedAsset {
  assetId: string;
  filePath: string;
  duration: number;
  resolution: string;
  aspect_ratio: string;
}
export interface TTSAudio {
  voiceFilePath: string;
  audioDurationSeconds: number;
}

export async function assembleSceneVideo(
  scene: Scene,
  rankedAsset: RankedAsset,
  ttsAudio: TTSAudio
): Promise<{ sceneId: string; outputFile: string; durationSeconds: number }> {
  const outputFile = `/tmp/scene_${scene.id}_final.mp4`;
  const workingRes = '1280x720';
  const fontFile = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'; // TODO: Make configurable/cross-platform

  try {
    // 1. Prepare video: scale/crop/loop/trim as needed
    let filter = `scale=${workingRes}:force_original_aspect_ratio=decrease,pad=${workingRes}:(ow-iw)/2:(oh-ih)/2,setsar=1`;
    const tempVid = `/tmp/scene_${scene.id}_prep.mp4`;

    // Loop or trim
    if (rankedAsset.duration < scene.duration_seconds) {
      // Loop video
      await exec(`ffmpeg -y -stream_loop -1 -i "${rankedAsset.filePath}" -t ${scene.duration_seconds} -vf "${filter}" -an "${tempVid}"`);
    } else {
      // Trim video
      await exec(`ffmpeg -y -i "${rankedAsset.filePath}" -t ${scene.duration_seconds} -vf "${filter}" -an "${tempVid}"`);
    }

    // 2. Prepare audio: mix TTS and original audio
    const tempAudio = `/tmp/scene_${scene.id}_audio.m4a`;
    // Lower original audio, mix with TTS
    await exec(
      `ffmpeg -y -i "${rankedAsset.filePath}" -vn -af "volume=-12dB" "${tempAudio}"`
    );
    const mixedAudio = `/tmp/scene_${scene.id}_mixed.m4a`;
    await exec(
      `ffmpeg -y -i "${tempAudio}" -i "${ttsAudio.voiceFilePath}" -filter_complex "[0][1]amix=inputs=2:duration=first:dropout_transition=2" -c:a aac "${mixedAudio}"`
    );

    // 3. Overlay text
    const safeText = scene.on_screen_text.replace(/'/g, "\\'");
    const drawtext = `drawtext=fontfile='${fontFile}':text='${safeText}':fontcolor=white:fontsize=48:borderw=2:x=(w-text_w)/2:y=h-100`;
    // TODO: Style based on scene.mood

    // 4. Burn subtitles (simple: overlay text for full duration)
    // TODO: Support SRT or advanced captions

    // 5. Final mux
    await exec(
      `ffmpeg -y -i "${tempVid}" -i "${mixedAudio}" -vf "${drawtext}" -t ${scene.duration_seconds} -c:v libx264 -c:a aac -shortest "${outputFile}"`
    );

    // Clean up temp files
    [tempVid, tempAudio, mixedAudio].forEach(f => fs.existsSync(f) && fs.unlinkSync(f));

    return { sceneId: scene.id, outputFile, durationSeconds: scene.duration_seconds };
  } catch (err: any) {
    // Error handling
    return Promise.reject({
      error: `Failed to assemble scene ${scene.id}: ${err.message}`,
      sceneId: scene.id,
      outputFile: null,
      durationSeconds: 0,
      // TODO: Return partial metadata if possible
    });
  }
}

// TODO: Make font, style, and ducking configurable. Support advanced captions and streaming.