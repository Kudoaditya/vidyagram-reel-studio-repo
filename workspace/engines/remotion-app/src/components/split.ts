import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Insert } from "./Inserts";

// 0..1 eased progress of a speaker layout: 1 while an insert with that layout is active (8-frame ease in/out).
const useLayoutProgress = (layout: Insert["layout"], inserts: Insert[], frameOffset: number) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame() + frameOffset;
  let p = 0;
  for (const ins of inserts) {
    if (ins.layout !== layout) continue;
    const a = Math.round((ins.startMs / 1000) * fps);
    const b = a + Math.round((ins.durationMs / 1000) * fps);
    p = Math.max(p, interpolate(frame, [a, a + 8, b - 8, b], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  }
  return p * p * (3 - 2 * p);
};

// split: speaker moves to the bottom half, graphic fills the top.
export const useSplit = (inserts: Insert[] = [], frameOffset = 0) => useLayoutProgress("split", inserts, frameOffset);
