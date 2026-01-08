import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';


const router = express.Router();

// Helper to safely send a file if it exists
function safeSendFile(res: Response, filePath: string, contentType: string) {
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }
  res.setHeader('Content-Type', contentType);
  const stream = fs.createReadStream(filePath);
  stream.on('error', () => res.status(500).send('Error streaming file'));
  stream.pipe(res);
}

// GET /preview/scene/:id
router.get('/preview/scene/:id', async (req, res) => {
  const { id } = req.params;
  const filePath = `/tmp/scene_${id}_final.mp4`;
  if (req.query.public === 'true') {
    // TODO: Remove for production, only for dev preview
    const publicPath = path.join('public', `scene_${id}_final.mp4`);
    fs.copyFileSync(filePath, publicPath);
  }
  safeSendFile(res, filePath, 'video/mp4');
});

// GET /preview/final
router.get('/preview/final', async (req, res) => {
  const filePath = '/tmp/final_master.mp4';
  if (req.query.public === 'true') {
    // TODO: Remove for production, only for dev preview
    const publicPath = path.join('public', 'final_master.mp4');
    fs.copyFileSync(filePath, publicPath);
  }
  safeSendFile(res, filePath, 'video/mp4');
});

// GET /download/final/:format
router.get('/download/final/:format', async (req, res) => {
  const { format } = req.params;
  const ext = format === 'mp4' ? 'mp4' : format; // Add more logic as needed
  const filePath = path.join('outputs', `final_${format}.${ext}`);
  if (!fs.existsSync(filePath)) return res.status(404).send('File not found');
  res.download(filePath);
});

/*
{
  "video_type": "1080p_mp4",
  "render_plan": {
    "specs": {
      "resolution": "1920x1080",
      "aspect_ratio": "16:9",
      "target_bitrate": "8M",
      "codec": "h264",
      "audio_format": "aac 192k",
      "export_filename": "/tmp/final_master.mp4"
    },
    "scenes": [
      {
        "scene_id": 1,
        "input_video": "/tmp/scene_1_asset.mp4",
        "tts_audio": "/tmp/scene_1_voice.mp3",
        "duration": 10,
        "assembly": {
          "scale_crop": "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2",
          "trim_or_loop": "trim to 10s",
          "text_overlay": {
            "text": "Scene 1 Title",
            "position": "bottom center",
            "font": "DejaVuSans-Bold.ttf",
            "style": "white, box, shadow"
          },
          "audio_mix": {
            "original_volume_db": -12,
            "tts_mix": "amix=inputs=2:duration=first:dropout_transition=2"
          }
        },
        "output": "/tmp/scene_1_final.mp4"
      }
      // ...repeat for all scenes
    ],
    "concatenation": {
      "inputs": [
        "/tmp/scene_1_final.mp4",
        "/tmp/scene_2_final.mp4"
        // ...all scene outputs
      ],
      "concat_method": "ffmpeg concat demuxer",
      "transitions": "none",
      "loudness_normalization": "loudnorm=I=-16:TP=-1.5:LRA=11",
      "final_export": {
        "codec": "h264",
        "preset": "medium",
        "crf": 18,
        "resolution": "1920x1080",
        "format": "mp4",
        "output": "/tmp/final_master.mp4"
      }
    }
  }
}
*/

// Example render plan output for backend to build the final video
export const renderPlan = {
  action: "render_video",
  video_type: "1080p_mp4",
  render_plan: {
    scenes: [
      {
        scene_id: 1,
        input_video: "/tmp/scene_1_asset.mp4",
        tts_audio: "/tmp/scene_1_voice.mp3",
        text_overlay: "Scene 1 text",
        duration: 12,
        output: "/tmp/scene_1_final.mp4"
      },
      {
        scene_id: 2,
        input_video: "/tmp/scene_2_asset.mp4",
        tts_audio: "/tmp/scene_2_voice.mp3",
        text_overlay: "Scene 2 text",
        duration: 10,
        output: "/tmp/scene_2_final.mp4"
      }
      // ...add more scenes as needed
    ],
    concat: {
      inputs: [
        "/tmp/scene_1_final.mp4",
        "/tmp/scene_2_final.mp4"
        // ...add more scene outputs as needed
      ],
      output: "/tmp/final_master.mp4"
    },
    export_settings: {
      codec: "h264",
      preset: "medium",
      crf: 18,
      resolution: "1920x1080",
      format: "mp4"
    }
  },
  return_final_video: true
};

export default router;