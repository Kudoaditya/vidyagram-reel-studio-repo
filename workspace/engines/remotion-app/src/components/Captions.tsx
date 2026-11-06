import { useMemo } from "react";
import { AbsoluteFill, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { useSplit } from "./split";
import { usePip } from "./pip";
import type { Insert } from "./Inserts";
import { createTikTokStyleCaptions, type Caption, type TikTokPage } from "@remotion/captions";

// Words closer together than this are grouped onto one caption page.
const COMBINE_MS = 1200;

const ACCENT = "#FF3B6B";

const Page: React.FC<{ page: TikTokPage; inserts: Insert[] }> = ({ page, inserts }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const offset = Math.round((page.startMs / 1000) * fps);
  const split = useSplit(inserts, offset);
  const { p: pip } = usePip(inserts, offset);
  const nowMs = page.startMs + (frame / fps) * 1000;
  const enter = spring({ frame, fps, config: { damping: 18, mass: 0.7, stiffness: 140 }, durationInFrames: 10 });

  return (
    <AbsoluteFill className="items-center justify-end" style={{ paddingBottom: (400 + split * 480) * (1 - pip) + 380 * pip }}>
      <AbsoluteFill style={{ background: "linear-gradient(to top, rgba(6,8,14,0.7) 0%, rgba(6,8,14,0) 38%)", opacity: 1 - split }} />
      <div
        className="max-w-[960px] text-center"
        style={{
          fontFamily: "'Avenir Next Condensed', 'Arial Narrow', sans-serif",
          fontWeight: 900,
          textTransform: "uppercase",
          fontSize: 88,
          lineHeight: 1.02,
          letterSpacing: "0.01em",
          opacity: enter,
          transform: `translateY(${(1 - enter) * 24}px) scale(${0.96 + 0.04 * enter})`,
        }}
      >
        {page.tokens.map((t) => {
          const active = t.fromMs <= nowMs && nowMs < t.toMs;
          return (
            <span
              key={t.fromMs}
              style={{
                whiteSpace: "pre-wrap",
                display: "inline-block",
                color: "#FFFFFF",
                background: active ? ACCENT : "transparent",
                padding: active ? "0 14px" : 0,
                border: active ? "6px solid #111" : "0",
                borderRadius: active ? 16 : 0,
                boxShadow: active ? "6px 6px 0 #111" : "none",
                margin: "0 5px",
                transform: active ? "rotate(-2deg) scale(1.05)" : "none",
                WebkitTextStroke: active ? "0" : "10px #111",
                paintOrder: "stroke fill",
                textShadow: active ? "none" : "0 6px 0 #111",
              }}
            >
              {t.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const Captions: React.FC<{ captions: Caption[]; inserts?: Insert[] }> = ({ captions, inserts = [] }) => {
  const { fps } = useVideoConfig();
  const { pages } = useMemo(
    () => createTikTokStyleCaptions({ captions, combineTokensWithinMilliseconds: COMBINE_MS }),
    [captions],
  );

  return (
    <>
      {pages.map((page, i) => {
        const next = pages[i + 1];
        const from = Math.round((page.startMs / 1000) * fps);
        const endMs = next ? next.startMs : page.startMs + page.durationMs;
        const duration = Math.max(1, Math.round(((endMs - page.startMs) / 1000) * fps));
        return (
          <Sequence key={page.startMs} from={from} durationInFrames={duration} layout="none">
            <Page page={page} inserts={inserts} />
          </Sequence>
        );
      })}
    </>
  );
};
