import React from 'react';
import { Composition } from 'remotion';
import SessionComp from './SessionComp.jsx';

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="SessionComp"
        component={SessionComp}
        defaultProps={{ session: {}, backgroundClips: [], audioPath: null, audioDuration: 10, fps: 30, width: 1920, height: 1080 }}
        calculateMetadata={({ props }) => {
          const fps = props.fps || 30;
          const width = props.width || 1920;
          const height = props.height || 1080;
          const durationInFrames = Math.max(1, Math.ceil((props.audioDuration || 10) * fps));
          return { durationInFrames, fps, width, height };
        }}
      />
    </>
  );
};
