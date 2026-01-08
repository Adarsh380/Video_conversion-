import { exec as execCb } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const exec = promisify(execCb);

/**
 * Renders the final video as described in the render plan.
 * @param renderPlan The render plan object (with scenes, concat, export_settings)
 */
export async function renderFinalVideo(renderPlan: any) {
  // 1. Render each scene
  for (const scene of renderPlan.scenes) {
    const filter = `scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,drawtext=text='${scene.text_overlay}':fontcolor=white:fontsize=48:borderw=2:x=(w-text_w)/2:y=h-100`;
    const tempVid = `/tmp/scene_${scene.scene_id}_prep.mp4`;

    if (!fs.existsSync(scene.input_video)) throw new Error(`Missing asset: ${scene.input_video}`);
    if (!fs.existsSync(scene.tts_audio)) throw new Error(`Missing TTS: ${scene.tts_audio}`);

    // Trim or loop (for simplicity, just trim here; add loop logic if needed)
    await exec(`ffmpeg -y -i "${scene.input_video}" -t ${scene.duration} -vf "${filter}" -an "${tempVid}"`);

    // Mix audio: lower original, mix with TTS
    await exec(`ffmpeg -y -i "${tempVid}" -i "${scene.tts_audio}" -filter_complex "[0:a]volume=-12dB[a0];[a0][1:a]amix=inputs=2:duration=first:dropout_transition=2" -map 0:v -map "[a0]" -c:v libx264 -c:a aac -shortest "${scene.output}"`);

    fs.unlinkSync(tempVid);
  }

  // 2. Concatenate scenes
  const concatListPath = '/tmp/concat_list.txt';
  fs.writeFileSync(concatListPath, renderPlan.concat.inputs.map((f: string) => `file '${f}'`).join('\n'));
  await exec(`ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c copy "${renderPlan.concat.output}"`);

  // 3. Loudness normalization and final export
  const exportSettings = renderPlan.export_settings;
  const normPath = renderPlan.concat.output.replace('.mp4', '_norm.mp4');
  await exec(`ffmpeg -y -i "${renderPlan.concat.output}" -af loudnorm=I=-16:TP=-1.5:LRA=11 -c:v libx264 -preset ${exportSettings.preset} -crf ${exportSettings.crf} -s ${exportSettings.resolution} "${normPath}"`);

  // 4. Return final video path
  return normPath;
}

// --------- Standalone runner ---------
if (require.main === module) {
  // Accept a JSON file path as a command-line argument
  const jsonPath = process.argv[2];
  if (!jsonPath) {
    console.error('Usage: npx ts-node renderFinalVideo.ts <render_plan.json>');
    process.exit(1);
  }
  const absJsonPath = path.isAbsolute(jsonPath) ? jsonPath : path.join(process.cwd(), jsonPath);
  if (!fs.existsSync(absJsonPath)) {
    console.error('Render plan JSON file not found:', absJsonPath);
    process.exit(1);
  }
  const renderPlanJson = JSON.parse(fs.readFileSync(absJsonPath, 'utf-8'));
  renderFinalVideo(renderPlanJson.render_plan)
    .then(finalPath => console.log('Final video at:', finalPath))
    .catch(err => console.error('Error:', err));
}