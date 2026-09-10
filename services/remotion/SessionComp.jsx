import React from 'react';
import { AbsoluteFill, Audio, Sequence, Video, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

const TextOverlay = ({ title, text, placement }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 200 } });
  const opacity = interpolate(enter, [0, 1], [0, 1]);

  const style = {
    position: 'absolute',
    left: placement?.x === 'center' ? '50%' : placement?.x || '50%',
    top: placement?.y || '70%',
    transform: placement?.x === 'center' ? 'translate(-50%, -50%)' : undefined,
    color: '#fff',
    textShadow: '0 2px 10px rgba(0,0,0,0.7)',
    width: '80%',
    maxWidth: 1200,
    fontFamily: 'system-ui, sans-serif',
    opacity,
  };

  return (
    <div style={style}>
      {title && <h1 style={{ fontSize: 56, margin: 0, marginBottom: 12 }}>{title}</h1>}
      {text && <p style={{ fontSize: 36, margin: 0, lineHeight: 1.35 }}>{text}</p>}
    </div>
  );
};

export default function SessionComp({ session, backgroundClips, audioPath, audioDuration }) {
  const { fps } = useVideoConfig();
  const totalFrames = Math.max(1, Math.ceil((audioDuration || 10) * fps));
  const count = Math.max(1, backgroundClips.length);
  const per = Math.ceil(totalFrames / count);

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      {backgroundClips.map((clip, i) => (
        <Sequence key={i} from={i * per} durationInFrames={per}>
          <Video src={clip} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </Sequence>
      ))}

      {audioPath && <Audio src={audioPath} />}
      <TextOverlay title={session?.title} text={session?.text} placement={session?.textPlacement} />
    </AbsoluteFill>
  );
}
