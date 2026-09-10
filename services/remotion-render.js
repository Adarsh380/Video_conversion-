const path = require('path');
const { bundle } = require('@remotion/bundler');
const { renderMedia, getCompositions } = require('@remotion/renderer');

async function renderSession({ session, backgroundClips, audioPath, audioDuration, outputLocation, fps = 30, width = 1920, height = 1080 }) {
  const entry = path.join(__dirname, 'remotion', 'entry.jsx');
  const bundled = await bundle(entry);
  const comps = await getCompositions(bundled, {
    inputProps: { session, backgroundClips, audioPath, audioDuration, fps, width, height },
  });
  const comp = comps.find((c) => c.id === 'SessionComp');
  if (!comp) throw new Error('Remotion composition not found');

  await renderMedia({
    composition: comp,
    serveUrl: bundled,
    codec: 'h264',
    outputLocation,
    inputProps: { session, backgroundClips, audioPath, audioDuration, fps, width, height },
    audioCodec: 'aac',
    muted: false,
  });
  return outputLocation;
}

module.exports = renderSession;
