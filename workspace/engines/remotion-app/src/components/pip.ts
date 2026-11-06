import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Insert } from "./Inserts";

// Speaker window shapes. k = displayed video width / window width (>= 1): the whole frame is scaled DOWN first so the
// face is never over-zoomed, then it is masked into the shape. face (x, y) = face centre as fractions of the source frame.
export type PipShape = "circle" | "round" | "frame" | "wide";
export const PIP_SHAPES: Record<PipShape, { w: number; h: number; r: number; k: number; ring: boolean }> = {
  circle: { w: 460, h: 460, r: 230, k: 1.12, ring: true },
  round: { w: 560, h: 640, r: 56, k: 1.0, ring: false },
  frame: { w: 560, h: 640, r: 56, k: 1.0, ring: true },
  wide: { w: 760, h: 520, r: 48, k: 1.0, ring: true },
};
export const isPip = (layout: Insert["layout"]): layout is PipShape => layout in PIP_SHAPES;

export type PipPos = "bc" | "bl" | "br" | "tc" | "tl" | "tr";
// Window bottom edge <= 1340 (captions sit at 1380-1540), top edge >= 180, right margin 130 (platform buttons).
export const pipGeometry = (shape: PipShape, pos: PipPos, face: { x: number; y: number }) => {
  const s = PIP_SHAPES[shape];
  const left = pos.endsWith("l") ? 60 : pos.endsWith("r") ? 1080 - s.w - 130 : (1080 - s.w) / 2;
  const top = pos.startsWith("t") ? 180 : 1340 - s.h;
  const vw = s.w * s.k;
  const vh = (vw * 1920) / 1080;
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  const vl = clamp(s.w / 2 - face.x * vw, s.w - vw, 0);
  const vt = clamp(s.h * 0.42 - face.y * vh, s.h - vh, 0);
  return { win: { left, top, w: s.w, h: s.h, r: s.r, ring: s.ring }, vid: { left: vl, top: vt, w: vw, h: vh } };
};

// Active pip insert and its eased progress (0..1), 8-frame ease in/out.
export const usePip = (inserts: Insert[] = [], frameOffset = 0) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame() + frameOffset;
  let best = { p: 0, insert: null as Insert | null };
  for (const ins of inserts) {
    if (!isPip(ins.layout)) continue;
    const a = Math.round((ins.startMs / 1000) * fps);
    const b = a + Math.round((ins.durationMs / 1000) * fps);
    const p = interpolate(frame, [a, a + 8, b - 8, b], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    if (p > best.p) best = { p, insert: ins };
  }
  return { p: best.p * best.p * (3 - 2 * best.p), insert: best.insert };
};
