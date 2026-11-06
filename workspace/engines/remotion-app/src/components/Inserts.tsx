import { AbsoluteFill, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { isPip } from "./pip";

export const insertSchema = z.object({
  // Path relative to ./public (a rendered HyperFrames/Revideo MP4, or a PNG/JPG).
  src: z.string(),
  startMs: z.number(),
  durationMs: z.number(),
  // full: covers the frame · top: card over the upper half, speaker stays visible · pip: small corner window
  layout: z.enum(["full", "top", "pip", "split", "circle", "round", "frame", "wide"]),
  // width / height of the insert, so cards fit it without cropping (9:16 = 0.5625).
  aspect: z.number().default(9 / 16),
  // speaker window position for circle/round/frame/wide: bottom/top x centre/left/right
  pos: z.enum(["bc", "bl", "br", "tc", "tl", "tr"]).default("bc"),
});

export type Insert = z.input<typeof insertSchema>;

const FADE_FRAMES = 6;
const isImage = (src: string) => /\.(png|jpe?g|webp|gif)$/i.test(src);

// Fit a box of the given aspect inside maxW x maxH.
const fit = (aspect: number, maxW: number, maxH: number) => {
  const width = Math.min(maxW, maxH * aspect);
  return { width, height: width / aspect };
};

const layoutStyle = (layout: Insert["layout"], aspect: number): React.CSSProperties => {
  const card = { overflow: "hidden" as const, boxShadow: "0 30px 80px rgba(0,0,0,0.6)" };
  if (layout === "full" || isPip(layout)) return { inset: 0 };
  // split: graphic fills the top half, the speaker is moved to the bottom half (see Reel.tsx).
  if (layout === "split") return { ...fit(aspect, 1080, 1000), left: 0, top: 0 };
  if (layout === "pip") return { ...card, ...fit(aspect, 400, 600), right: 48, top: 160, borderRadius: 28 };
  // top: upper area above the caption zone, horizontally centred.
  const { width, height } = fit(aspect, 960, 1040);
  return { ...card, width, height, left: (1080 - width) / 2, top: 175, borderRadius: 40 };
};

const InsertClip: React.FC<{ insert: Insert; frames: number }> = ({ insert, frames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = interpolate(frame, [0, FADE_FRAMES, frames - FADE_FRAMES, frames], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pop = insert.layout === "full" || insert.layout === "split" || isPip(insert.layout) ? 1 : spring({ frame, fps, config: { damping: 200 }, durationInFrames: 12 });
  const scale = interpolate(pop, [0, 1], [0.92, 1]);
  const src = staticFile(insert.src);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...layoutStyle(insert.layout, insert.aspect ?? 9 / 16), opacity, transform: `scale(${scale})` }}>
        {isImage(insert.src) ? (
          <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          // Muted: the speaker's audio stays the soundtrack.
          <OffthreadVideo src={src} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        )}
      </div>
    </AbsoluteFill>
  );
};

export const Inserts: React.FC<{ inserts: Insert[]; only?: "split" | "rest" }> = ({ inserts: all, only }) => {
  const under = (i: Insert) => i.layout === "split" || isPip(i.layout); // drawn beneath the speaker layer
  const inserts = only ? all.filter((i) => under(i) === (only === "split")) : all;
  const { fps } = useVideoConfig();
  return (
    <>
      {inserts.map((insert, i) => {
        const frames = Math.max(1, Math.round((insert.durationMs / 1000) * fps));
        return (
          <Sequence key={`${insert.src}-${i}`} from={Math.round((insert.startMs / 1000) * fps)} durationInFrames={frames} layout="none">
            <InsertClip insert={insert} frames={frames} />
          </Sequence>
        );
      })}
    </>
  );
};
