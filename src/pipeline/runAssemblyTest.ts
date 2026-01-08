import { assembleSceneVideo } from './assembleScene';
import { concatAllScenesOrdered } from './concatScenes';
import fs from 'fs';
import path from 'path';


async function runTest() {
  // Dummy test data
  const scene = {
    id: 'test1',
    duration_seconds: 8,
    on_screen_text: 'Welcome to VideoConverter Pro!',
    mood: 'inspirational'
  };
  const rankedAsset = {
    assetId: 'asset1',
    filePath: 'public/sample_video.mp4', // Provide a real sample
    duration: 5,
    resolution: '1280x720',
    aspect_ratio: '16:9'
  };
  const ttsAudio = {
    voiceFilePath: 'public/sample_tts.m4a', // Provide a real sample
    audioDurationSeconds: 8
  };

  try {
    const sceneResult = await assembleSceneVideo(scene, rankedAsset, ttsAudio);
    const concatResult = await concatAllScenesOrdered([sceneResult.outputFile]);
    // Copy to public for browser preview
    fs.copyFileSync(concatResult.masterPath, 'public/final_master.mp4');
    fs.copyFileSync(concatResult.thumbnailPath, 'public/final_thumbnail.jpg');
    console.log('Test pipeline complete. Output at public/final_master.mp4');
  } catch (err) {
    console.error('Pipeline test failed:', err);
  }
}

runTest();