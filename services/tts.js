const sdk = require('microsoft-cognitiveservices-speech-sdk');
const fs = require('fs');
const path = require('path');
const ffprobeStatic = require('ffprobe-static');
const ffmpeg = require('fluent-ffmpeg');
const dotenv = require('dotenv');
dotenv.config();

ffmpeg.setFfprobePath(ffprobeStatic.path);

const SPEECH_KEY = process.env.AZURE_SPEECH_KEY;
const SPEECH_REGION = process.env.AZURE_SPEECH_REGION;

async function synthesizeToFile(text, outPath, voice = 'en-US-JennyNeural') {
  if (!SPEECH_KEY || !SPEECH_REGION) throw new Error('Missing AZURE_SPEECH_KEY/AZURE_SPEECH_REGION');

  const audioConfig = sdk.AudioConfig.fromAudioFileOutput(outPath);
  const speechConfig = sdk.SpeechConfig.fromSubscription(SPEECH_KEY, SPEECH_REGION);
  speechConfig.speechSynthesisVoiceName = voice;
  speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio48Khz192KBitRateMonoMp3;

  const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

  await new Promise((resolve, reject) => {
    synthesizer.speakTextAsync(
      text,
      (result) => {
        synthesizer.close();
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) return resolve();
        return reject(new Error(result.errorDetails || 'TTS failed'));
      },
      (err) => {
        synthesizer.close();
        reject(err);
      }
    );
  });

  // Ensure file exists
  if (!fs.existsSync(outPath)) throw new Error('TTS output not created');
  return outPath;
}


async function getAudioDuration(outPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(outPath, (error, metadata) => {
      if (error) return reject(error);
      const duration = Number(metadata?.format?.duration || 0);
      if (!Number.isFinite(duration) || duration <= 0) return reject(new Error('Unable to determine synthesized audio duration'));
      resolve(duration);
    });
  });
}
module.exports = { synthesizeToFile, getAudioDuration };
