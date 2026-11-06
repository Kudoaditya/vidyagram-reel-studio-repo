import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";
import { z } from "zod";
import { useSplit } from "./components/split";
import { pipGeometry, usePip } from "./components/pip";
import { Captions } from "./components/Captions";
import { Inserts, insertSchema } from "./components/Inserts";

const captionSchema = z.object({
  text: z.string(),
  startMs: z.number(),
  endMs: z.number(),
  timestampMs: z.number().nullable(),
  confidence: z.number().nullable(),
});

export const reelSchema = z.object({
  // Path relative to ./public, e.g. "my_reel/my_reel_cut.mp4". Empty = no background video.
  videoSrc: z.string(),
  // @remotion/captions Caption[] — produced as captions.json by scripts/preprocess_reel.py
  captions: z.array(captionSchema),
  // Face centre as fractions of the source frame (used to frame the speaker inside PiP shapes).
  face: z.object({ x: z.number(), y: z.number() }).default({ x: 0.5, y: 0.36 }),
  accent: z.string().default("#FFFFFF"),
  // Graphic clips placed on the timeline (written by `./vp assemble --insert ...`).
  inserts: z.array(insertSchema).default([]),
  showCaptions: z.boolean().default(true),
  title: z.string(),
});

export type ReelProps = z.input<typeof reelSchema>;

// Layer order: speaker video → graphic inserts → captions (always on top).
export const Reel: React.FC<ReelProps> = ({ videoSrc, captions, inserts = [], showCaptions = true, title, face = { x: 0.5, y: 0.36 }, accent = "#FFFFFF" }) => {
  const split = useSplit(inserts);
  const { p: pip, insert: pipIns } = usePip(inserts);
  const g = pipGeometry((pipIns?.layout as never) ?? "circle", pipIns?.pos ?? "bc", face);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const boxH = lerp(1920 - split * 790, g.win.h, pip);
  const vidW = lerp(1080, g.vid.w, pip);
  const vidH = lerp(boxH, g.vid.h, pip);
  const box = { left: lerp(0, g.win.left, pip), top: lerp(split * 790, g.win.top, pip), width: lerp(1080, g.win.w, pip), height: boxH };
  return (
  <AbsoluteFill className="bg-neutral-950">
    {videoSrc ? (
      <>
      <Inserts inserts={inserts} only="split" />
      <div style={{ position: "absolute", ...box, overflow: "hidden", borderRadius: pip * g.win.r, clipPath: pip > 0 ? undefined : `polygon(0 ${split * 130}px, 100% 0, 100% 100%, 0 100%)` }}>
        <div style={{ position: "absolute", left: lerp(0, g.vid.left, pip), top: lerp(0, g.vid.top, pip), width: vidW, height: vidH }}>
          <OffthreadVideo src={staticFile(videoSrc)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      </div>
      <svg width="1080" height="1920" style={{ position: "absolute", left: 0, top: 0, opacity: split }}>
        <line x1="0" y1="920" x2="1080" y2="790" stroke="#FFE14D" strokeWidth="12" />
      </svg>
      {g.win.ring && (
        <div style={{ position: "absolute", ...box, borderRadius: pip * g.win.r, border: `8px solid ${accent}`, opacity: pip }} />
      )}
      </>
    ) : (
      <AbsoluteFill className="items-center justify-center">
        <h1 className="text-8xl font-bold tracking-tight text-white">{title}</h1>
      </AbsoluteFill>
    )}
    <Inserts inserts={inserts} only="rest" />
    {showCaptions && <Captions captions={captions} inserts={inserts} />}
  </AbsoluteFill>
  );
};
