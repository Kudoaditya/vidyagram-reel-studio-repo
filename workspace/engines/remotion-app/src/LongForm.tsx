import { AbsoluteFill, Easing, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";

// Long-form (16:9, 1920x1080) layout: speaker fills the frame, and while a scene plays the speaker
// glides into a rounded "pill" docked on one side. Scenes are pre-rendered 1920x1080 MP4s (muted).

export const sceneSchema = z.object({
  src: z.string(), // path relative to ./public
  startMs: z.number(),
  durationMs: z.number(),
  // pill: speaker docks in the pill (default) · solo: scene only, speaker hidden (audio continues)
  mode: z.enum(["pill", "solo"]).default("pill"),
  trimMs: z.number().default(0), // start offset inside the clip
  scale: z.number().default(1), // extra zoom, e.g. 1.24 to hide baked-in letterbox bars
  kick: z.string().optional(),
  title: z.string().optional(), // lower-left caption on top of clips / images
  sub: z.string().optional(),
  fit: z.enum(["cover", "card"]).default("cover"), // images: cover = full frame, card = rounded card in the stage
});

export const captionSchema = z.object({
  startMs: z.number(),
  durationMs: z.number(),
  text: z.string(),
});

export const longFormSchema = z.object({
  captions: z.array(captionSchema).default([]), // short key-phrase captions shown only while the speaker is full-frame
  videoSrc: z.string(), // speaker video, relative to ./public (audio = soundtrack)
  scenes: z.array(sceneSchema).default([]),
  face: z.object({ x: z.number(), y: z.number() }).default({ x: 0.5, y: 0.4 }),
  side: z.enum(["right", "left"]).default("right"),
  pillW: z.number().default(380),
  pillH: z.number().default(420),
  zoom: z.number().default(1), // 1 = whole frame height visible in the pill (no crop); >1 zooms in
  pillRadius: z.number().default(30),
  bg: z.string().default("#0b0b0c"),
  ring: z.string().default("rgba(255,255,255,0.14)"), // hairline border of the pill
  title: z.string().default(""),
});

export type LongFormProps = z.input<typeof longFormSchema>;

const W = 1920;
const H = 1080;
const MARGIN = 56;
const TRANSITION = 20; // frames for speaker <-> pill glide and scene fade
const ease = Easing.bezier(0.65, 0, 0.35, 1);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const LongForm: React.FC<LongFormProps> = ({
  videoSrc, scenes = [], face = { x: 0.5, y: 0.4 }, side = "right",
  captions = [], pillW = 380, pillH = 420, zoom = 1, pillRadius = 30, bg = "#0b0b0c", ring = "rgba(255,255,255,0.14)",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (m: number) => Math.round((m / 1000) * fps);

  // Pill progress = strongest ramp over all scenes (back-to-back scenes keep the pill docked).
  let p = 0;
  let solo = 0;
  for (const s of scenes) {
    if (s.mode === "solo") {
      const a = ms(s.startMs), b = a + ms(s.durationMs);
      solo = Math.max(solo, interpolate(frame, [a, a + 4, b - 4, b], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
      continue;
    }
    const a = ms(s.startMs);
    const b = a + ms(s.durationMs);
    const chained = scenes.some((o) => o !== s && Math.abs(ms(o.startMs) - b) <= 2);
    const t = chained
      ? interpolate(frame, [a, a + TRANSITION, Math.max(b, a + TRANSITION + 1), Math.max(b, a + TRANSITION + 1) + 1], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
      : interpolate(frame, [a, a + Math.min(TRANSITION, Math.floor((b - a) / 2) - 1), b - Math.min(TRANSITION, Math.floor((b - a) / 2) - 1), b], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    p = Math.max(p, t);
  }
  const e = ease(p);

  const pillLeft = side === "right" ? W - MARGIN - pillW : MARGIN;
  const box = {
    left: lerp(0, pillLeft, e),
    top: lerp(0, (H - pillH) / 2, e),
    width: lerp(W, pillW, e),
    height: lerp(H, pillH, e),
    radius: lerp(0, pillRadius, e),
  };

  // Scale the whole speaker frame down first, then slide it so the face stays centred (clamped to the frame edges).
  const sp = (pillH / H) * zoom;
  const vwP = W * sp, vhP = H * sp;
  const leftP = Math.min(0, Math.max(pillW - vwP, pillW / 2 - face.x * vwP));
  const topP = Math.min(0, Math.max(pillH - vhP, pillH / 2 - face.y * vhP));
  const vid = { width: lerp(W, vwP, e), height: lerp(H, vhP, e), left: lerp(0, leftP, e), top: lerp(0, topP, e) };

  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 120% at 20% 10%, #17171a 0%, ${bg} 55%, #060607 100%)` }}>
      {scenes.map((s, i) => {
        const from = ms(s.startMs);
        const dur = Math.max(1, ms(s.durationMs));
        return (
          <Sequence key={i} from={from} durationInFrames={dur} premountFor={30}>
            <SceneLayer s={s} dur={dur} fps={fps} />
          </Sequence>
        );
      })}
      <div
        style={{
          position: "absolute", left: box.left, top: box.top, width: box.width, height: box.height,
          borderRadius: box.radius, overflow: "hidden", opacity: 1 - solo,
          boxShadow: `0 ${30 * e}px ${80 * e}px rgba(0,0,0,${0.55 * e})`,
        }}
      >
        <OffthreadVideo
          src={staticFile(videoSrc)}
          style={{ position: "absolute", left: vid.left, top: vid.top, width: vid.width, height: vid.height, objectFit: "cover", maxWidth: "none", maxHeight: "none" }}
        />
        <div style={{ position: "absolute", inset: 0, borderRadius: box.radius, border: `2px solid ${ring}`, opacity: e }} />
      </div>
      {captions.map((c, i) => {
        const a = ms(c.startMs), b = a + ms(c.durationMs);
        const k = interpolate(frame, [a, a + 12, b - 12, b], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const show = k * (1 - e) * (1 - solo);
        if (show <= 0.001) return null;
        return (
          <div key={i} style={{ position: "absolute", left: 0, right: 0, bottom: 38, display: "flex", justifyContent: "center", opacity: show, transform: `translateY(${(1 - k) * 14}px)` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "12px 32px", borderRadius: 18, background: "rgba(10,10,12,.86)", border: "1px solid rgba(255,255,255,.14)", color: "#f4f3ef", fontFamily: "'Iowan Old Style','Charter',Georgia,serif", fontSize: 42, letterSpacing: "-.01em" }}>
              <span style={{ width: 4, height: 38, background: "#E8C48A", borderRadius: 2 }} />{c.text}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const isImg = (src: string) => /\.(png|jpe?g|webp)$/i.test(src);

const SceneLayer: React.FC<{ s: z.input<typeof sceneSchema>; dur: number; fps: number }> = ({ s, dur, fps }) => {
  const frame = useCurrentFrame();
  const solo = s.mode === "solo";
  const F = Math.max(1, Math.min(solo ? 4 : TRANSITION, Math.floor(dur / 2) - 1));
  const o = interpolate(frame, [0, F, dur - F, dur], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const zoom = lerp(solo ? 1.0 : 1.015, solo ? (isImg(s.src) ? 1.015 : 1.08) : 1, solo ? frame / dur : ease(Math.min(1, frame / (TRANSITION * 2))));
  const img = isImg(s.src);
  const card = img && (s.fit ?? "cover") === "card";
  const t = ease(Math.min(1, Math.max(0, (frame - 6) / 14)));
  return (
    <AbsoluteFill style={{ opacity: o }}>
      {card ? (
        <div style={{ position: "absolute", left: 110, top: 250, width: 1340, height: 754, borderRadius: 22, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,.6)", border: "1px solid rgba(255,255,255,.12)" }}>
          <Img src={staticFile(s.src)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${lerp(1, 1.06, frame / dur)})` }} />
        </div>
      ) : img ? (
        <Img src={staticFile(s.src)} style={{ width: W, height: H, objectFit: "cover", transform: `scale(${zoom})` }} />
      ) : (
        <OffthreadVideo src={staticFile(s.src)} muted startFrom={Math.round(((s.trimMs ?? 0) / 1000) * fps)} style={{ width: W, height: H, objectFit: "cover", transform: `scale(${zoom * (s.scale ?? 1)})` }} />
      )}
      {(s.title || s.kick) && (
        <>
          {!card && <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 460, background: "linear-gradient(180deg, rgba(8,8,10,0) 0%, rgba(8,8,10,.78) 100%)" }} />}
          <div style={{ position: "absolute", left: 110, top: card ? 96 : undefined, bottom: card ? undefined : 96, opacity: t, transform: `translateY(${(1 - t) * 24}px)`, color: "#f4f3ef", fontFamily: "'SF Pro Text','Helvetica Neue',Arial,sans-serif" }}>
            {s.kick && (
              <div style={{ fontSize: 24, letterSpacing: ".18em", textTransform: "uppercase", color: "#d9d6cf", display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ width: 34, height: 2, background: "#E8C48A", display: "inline-block" }} />{s.kick}
              </div>
            )}
            {s.title && <div style={{ fontFamily: "'Iowan Old Style','Charter',Georgia,serif", fontSize: 92, lineHeight: 1.05, marginTop: 16, letterSpacing: "-.01em", textShadow: "0 4px 30px rgba(0,0,0,.6)" }}>{s.title}</div>}
            {s.sub && <div style={{ fontSize: 32, color: "#cfccc4", marginTop: 14 }}>{s.sub}</div>}
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};
