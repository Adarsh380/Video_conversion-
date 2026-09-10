import React from "react";
import { AbsoluteFill, Audio, Sequence, useCurrentFrame, useVideoConfig, Video } from "remotion";

export type SessionCompositionProps = {
  backgroundVideo: string;
  overlayText: string;
  audioPath: string;
  durationSeconds: number;
  textPlacement?: "top" | "middle" | "bottom";
  audioVolume?: number; // 0..1
};

function FadeInOut({ children, duration }: { children: React.ReactNode; duration: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const total = Math.round(duration * fps);
  const fade = Math.round(Math.min(30, fps));
  const opacity = frame < fade ? frame / fade : frame > total - fade ? (total - frame) / fade : 1;
  return <div style={{ opacity }}>{children}</div>;
}

export const SessionComposition: React.FC<SessionCompositionProps> = ({
  backgroundVideo,
  overlayText,
  audioPath,
  durationSeconds,
  textPlacement = "middle",
  audioVolume = 1,
}) => {
  const { fps } = useVideoConfig();
  const frames = Math.round(durationSeconds * fps);
  const align = textPlacement === "top" ? "flex-start" : textPlacement === "bottom" ? "flex-end" : "center";

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <Video src={backgroundVideo} />
      <Audio src={audioPath} volume={audioVolume} />
      <Sequence from={0} durationInFrames={frames}>
        <AbsoluteFill style={{ display: "flex", alignItems: align, justifyContent: "center" }}>
          <FadeInOut duration={durationSeconds}>
            <div style={{
              color: "white",
              fontSize: 64,
              fontWeight: 700,
              textShadow: "0 2px 24px rgba(0,0,0,0.6)",
              padding: 24,
              textAlign: "center",
              maxWidth: 1000,
              margin: "0 auto",
            }}>
              {overlayText}
            </div>
          </FadeInOut>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
