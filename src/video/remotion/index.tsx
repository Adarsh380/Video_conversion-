import { registerRoot, Composition } from "remotion";
import React from "react";
import { SessionComposition, SessionCompositionProps } from "./Composition";

export const RemotionRoot: React.FC<{ props: SessionCompositionProps }> = ({ props }) => {
  return (
    <Composition
      id="SessionComp"
      component={() => <SessionComposition {...props} />}
      durationInFrames={Math.round((props.durationSeconds || 8) * 30)}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};

registerRoot(() => <RemotionRoot props={{
  backgroundVideo: "",
  overlayText: "",
  audioPath: "",
  durationSeconds: 8,
}} />);
