import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";

const wordSchema = z.object({ text: z.string(), startMs: z.number(), key: z.boolean() });
const pageSchema = z.object({ startMs: z.number(), endMs: z.number(), words: z.array(wordSchema) });
export const captionsOverlaySchema = z.object({ pages: z.array(pageSchema) });
type Page = z.infer<typeof pageSchema>;

const ACCENT = "#FFB547";
// Centre line of the caption band: just under the chin, above the graphic cards (which start at y=1080).
const CENTER_Y = 1015;

const PageView: React.FC<{ page: Page; frames: number }> = ({ page, frames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nowMs = page.startMs + (frame / fps) * 1000;
  const enter = spring({ frame, fps, config: { damping: 18, stiffness: 220, mass: 0.6 } });
  const exit = interpolate(frame, [frames - 4, frames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute", left: 60, right: 60, top: CENTER_Y - 50, height: 100,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 18, flexWrap: "nowrap",
          opacity: Math.min(enter, exit),
          transform: `translateY(${interpolate(enter, [0, 1], [18, 0])}px) scale(${interpolate(enter, [0, 1], [0.94, 1])})`,
          fontFamily: '"Kohinoor Devanagari", "SF Pro Display", system-ui, sans-serif',
          fontSize: 60, fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1,
          textShadow: "0 3px 18px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.9)",
        }}
      >
        {page.words.map((w, i) => {
          const spoken = nowMs >= w.startMs;
          const since = (nowMs - w.startMs) / 1000;
          // keywords get a short pop the moment they are spoken
          const pop = w.key && spoken ? interpolate(since, [0, 0.08, 0.22], [1, 1.12, 1], { extrapolateRight: "clamp" }) : 1;
          return (
            <span
              key={i}
              style={{
                color: w.key ? ACCENT : "#FFFFFF",
                opacity: spoken ? 1 : 0.55,
                display: "inline-block",
                transform: `scale(${pop})`,
              }}
            >
              {w.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const CaptionsOverlay: React.FC<z.infer<typeof captionsOverlaySchema>> = ({ pages }) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "transparent" }}>
      {pages.map((p, i) => {
        const from = Math.round((p.startMs / 1000) * fps);
        const frames = Math.max(2, Math.round(((p.endMs - p.startMs) / 1000) * fps));
        return (
          <Sequence key={i} from={from} durationInFrames={frames} layout="none">
            <PageView page={p} frames={frames} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
