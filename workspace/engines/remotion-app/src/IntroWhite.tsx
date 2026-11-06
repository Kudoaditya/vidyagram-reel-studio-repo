import { AbsoluteFill, Easing, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

// Intro 16:9 (1920x1080): white canvas, black + red type, speaker glides into a pill, reels as a muted carousel.
const W = 1920, H = 1080;
const INK = "#0A0A0A", RED = "#E5171F", GREY = "#6B6B6B";
const FONT = "'SF Pro Display','Helvetica Neue',Helvetica,Arial,sans-serif";
const FPS = 30;
const out = Easing.bezier(0.16, 1, 0.3, 1); // expo-out: Apple-like settle
const inout = Easing.bezier(0.65, 0, 0.35, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** eased 0..1 between seconds a and b */
const prog = (t: number, a: number, b: number, e = out) => e(Math.min(1, Math.max(0, (t - a) / (b - a))));

// Speaker pill windows (seconds)
const PILL: [number, number][] = [[3.7, 10.2], [18.2, 34]];
const PILL_W = 420, PILL_H = 480, PILL_LEFT = W - 90 - PILL_W, PILL_TOP = (H - PILL_H) / 2;
const FACE = { x: 0.53, y: 0.36 };

const pillAmount = (t: number) => {
  let p = 0;
  for (const [a, b] of PILL) {
    const k = Math.min(1, Math.max(0, (t - a) / 0.75)) * Math.min(1, Math.max(0, (b - t) / 0.75));
    p = Math.max(p, k);
  }
  return inout(p);
};

// ---------- text helpers ----------
const Line: React.FC<{ t: number; at: number; size: number; color?: string; weight?: number; children: string; stagger?: number }> = ({ t, at, size, color = INK, weight = 800, children, stagger = 0.06 }) => {
  const words = children.split(" ");
  return (
    <div style={{ display: "flex", gap: size * 0.26, fontFamily: FONT, fontSize: size, fontWeight: weight, letterSpacing: "-0.045em", lineHeight: 1.04, color, whiteSpace: "nowrap" }}>
      {words.map((w, i) => {
        const k = prog(t, at + i * stagger, at + i * stagger + 0.7);
        return (
          <span key={i} style={{ display: "inline-block", overflow: "hidden", paddingBottom: size * 0.12, marginBottom: -size * 0.12 }}>
            <span style={{ display: "inline-block", transform: `translateY(${(1 - k) * 115}%)`, opacity: Math.min(1, k * 3) }}>{w}</span>
          </span>
        );
      })}
    </div>
  );
};
const Kicker: React.FC<{ t: number; at: number; children: string }> = ({ t, at, children }) => {
  const k = prog(t, at, at + 0.6);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, fontFamily: FONT, fontWeight: 700, fontSize: 26, letterSpacing: ".2em", color: RED, opacity: k, transform: `translateX(${(1 - k) * -30}px)` }}>
      <span style={{ width: 44 * k, height: 4, background: RED, display: "inline-block" }} />
      {children}
    </div>
  );
};
/** visible in [a,b] with fade-out so text swaps don't overlap */
const win = (t: number, a: number, b: number, f = 0.3) => Math.min(1, Math.max(0, (t - a) / 0.01)) * Math.min(1, Math.max(0, (b - t) / f));

// ---------- carousel ----------
const N = 13, CARD_W = 540, CARD_H = 960, GAP = 70, STEP = CARD_W + GAP;
const speedAt = (t: number) => {
  if (t < 3.7) return 0;
  if (t < 7.0) return 230;
  if (t < 7.8) return lerp(230, 1500, inout((t - 7.0) / 0.8));
  if (t < 9.4) return 1500;
  if (t < 10.4) return lerp(1500, 260, inout((t - 9.4) / 1.0));
  if (t < 18.3) return 0;
  return 260;
};
const TRACK: number[] = (() => {
  const a: number[] = [0];
  for (let f = 1; f < 34 * FPS + 2; f++) a.push(a[f - 1] + speedAt(f / FPS) / FPS);
  return a;
})();

// carousel pose over time: scale, centre-y, opacity (slides down off-screen when hidden)
const carouselPose = (t: number) => {
  const inA = prog(t, 3.75, 4.5), outA = prog(t, 10.0, 10.7, inout);
  const inB = prog(t, 18.35, 19.15), outB = prog(t, 26.2, 26.9, inout);
  const hidden1 = 1 - inA + outA, hidden2 = (t > 14 ? 1 - inB : 1) + (t > 22 ? outB : 0);
  const hide = t < 14 ? Math.min(1, hidden1) : Math.min(1, hidden2);
  const scale = t < 14 ? 0.56 : 0.5;
  const cy = t < 14 ? 735 : 905;
  return { scale, cy: cy + hide * 700, hide };
};

const Carousel: React.FC<{ t: number; frame: number }> = ({ t, frame }) => {
  const { scale, cy, hide } = carouselPose(t);
  if (hide >= 0.999) return null;
  const off = TRACK[Math.min(frame, TRACK.length - 1)];
  // stage visible between x=0 and 1370 (pill docks on the right); track centred at x=700
  const cx = 700;
  const cards = [];
  for (let i = 0; i < N; i++) {
    const x = i * STEP - off + 200; // layout-space x of the card's centre relative to cx
    if (Math.abs(x) * scale > 900) continue;
    const bob = Math.sin(i * 1.7) * 26; // staggered height = depth without glow
    const mount = Math.max(0, Math.round(frame - 0)); // sequence starts when mounted (cards mount at the first frame they are visible)
    cards.push(
      <div key={i} style={{ position: "absolute", left: x - CARD_W / 2, top: -CARD_H / 2 + bob, width: CARD_W, height: CARD_H, borderRadius: 54, overflow: "hidden", border: `12px solid ${INK}`, background: INK, boxSizing: "border-box" }}>
        <Sequence from={0}>
          <OffthreadVideo muted src={staticFile(`intro2/clip${String(i).padStart(2, "0")}.mp4`)} startFrom={((i * 37) % 60)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </Sequence>
      </div>
    );
    void mount;
  }
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1400, height: H, overflow: "hidden", WebkitMaskImage: "linear-gradient(90deg,transparent 0,#000 110px,#000 1240px,transparent 1400px)" }}>
      <div style={{ position: "absolute", left: cx, top: cy, transform: `scale(${scale})`, transformOrigin: "0 0" }}>{cards}</div>
    </div>
  );
};

// ---------- comment bubbles (speaker full) ----------
const COMMENTS = [
  { at: 10.75, x: 90, y: 190, a: "A", t: "Bhai, teach us this!" },
  { at: 11.55, x: 1300, y: 300, a: "R", t: "How do you edit like this?" },
  { at: 12.9, x: 110, y: 470, a: "S", t: "Make a tutorial please" },
  { at: 14.1, x: 1340, y: 560, a: "K", t: "Next video kab aayega?" },
];
const Bubble: React.FC<{ t: number; c: (typeof COMMENTS)[number]; out: number }> = ({ t, c, out: o }) => {
  const k = prog(t, c.at, c.at + 0.55, Easing.bezier(0.34, 1.56, 0.64, 1));
  const fl = Math.sin(t * 1.4 + c.x) * 5;
  const vis = Math.min(1, k * 4) * (1 - o);
  return (
    <div style={{ position: "absolute", left: c.x, top: c.y + fl, transform: `scale(${0.6 + 0.4 * k})`, transformOrigin: "0 100%", opacity: vis, display: "flex", alignItems: "center", gap: 18, padding: "20px 34px 20px 20px", background: "#fff", border: `6px solid ${INK}`, borderRadius: 60, fontFamily: FONT, fontWeight: 700, fontSize: 38, color: INK, letterSpacing: "-0.02em" }}>
      <span style={{ width: 62, height: 62, borderRadius: 31, background: RED, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 800 }}>{c.a}</span>
      {c.t}
      <span style={{ color: RED, fontSize: 36 }}>♥</span>
    </div>
  );
};

// ---------- fan (scene 7) + collapse (scene 8) ----------
const FAN_START = 26.4, FAN_END = 29.2;
const FAN = [
  { i: 2, rot: -17, dx: -430, dy: 60 }, { i: 5, rot: -8.5, dx: -215, dy: 14 }, { i: 7, rot: 0, dx: 0, dy: -10 },
  { i: 9, rot: 8.5, dx: 215, dy: 14 }, { i: 11, rot: 17, dx: 430, dy: 60 },
];
const Fan: React.FC<{ t: number }> = ({ t }) => {
  if (t < FAN_START - 0.1 || t > 30.6) return null;
  const appear = prog(t, FAN_START, FAN_START + 1.0);
  const collapse = prog(t, FAN_END, FAN_END + 0.9, inout);
  const s = 0.58;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1400, height: H }}>
      {FAN.map((c, n) => {
        const ap = prog(t, FAN_START + n * 0.08, FAN_START + 0.8 + n * 0.08);
        const rot = lerp(0, c.rot, ap) * (1 - collapse);
        const dx = lerp(0, c.dx, ap) * (1 - collapse);
        const dy = lerp(900, c.dy, ap) + collapse * -620;
        const sc = s * (1 - collapse * 0.55);
        return (
          <div key={n} style={{ position: "absolute", left: 700 + dx - CARD_W / 2, top: 1000 - CARD_H + dy, width: CARD_W, height: CARD_H, transform: `rotate(${rot}deg) scale(${sc})`, transformOrigin: "50% 100%", borderRadius: 54, overflow: "hidden", border: `12px solid ${INK}`, background: INK, boxSizing: "border-box", opacity: 1 - Math.max(0, collapse - 0.7) / 0.3, zIndex: 10 - Math.abs(n - 2) }}>
            <OffthreadVideo muted src={staticFile(`intro2/clip${String(c.i).padStart(2, "0")}.mp4`)} startFrom={n * 20} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        );
      })}
      <div style={{ display: "none" }}>{appear}</div>
    </div>
  );
};

// ---------- roadmap (scene 6) ----------
const STEPS = [
  { at: 19.75, n: "01", t: "Hook" }, { at: 20.45, n: "02", t: "Cut" }, { at: 21.35, n: "03", t: "Motion" }, { at: 22.25, n: "04", t: "Sound" },
];

// ---------- main ----------
export const IntroWhite: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const e = pillAmount(t);

  // speaker box (full <-> pill); whole frame scaled first, face kept centred
  const left = lerp(0, PILL_LEFT, e), top = lerp(0, PILL_TOP, e), w = lerp(W, PILL_W, e), h = lerp(H, PILL_H, e), r = lerp(0, 44, e);
  const sp = PILL_H / H, vwP = W * sp, vhP = H * sp;
  const leftP = Math.min(0, Math.max(PILL_W - vwP, PILL_W / 2 - FACE.x * vwP));
  const topP = Math.min(0, Math.max(PILL_H - vhP, PILL_H / 2 - FACE.y * vhP));
  // slow cinematic push while full-frame
  const fullSeg = t < 3.7 ? t / 3.7 : t >= 10.2 && t < 18.2 ? (t - 10.2) / 8 : 0;
  const push = 1 + 0.055 * inout(Math.min(1, fullSeg)) * (1 - e);
  const vid = { w: lerp(W, vwP, e), h: lerp(H, vhP, e), l: lerp(0, leftP, e), t: lerp(0, topP, e) };

  const commentsOut = prog(t, 15.7, 16.2);
  const wipe16 = prog(t, 18.2, 18.9); // roadmap scene content in

  return (
    <AbsoluteFill style={{ background: "#fff", fontFamily: FONT }}>
      {/* ===== scene 2 + 3 : headline over carousel ===== */}
      <div style={{ position: "absolute", left: 110, top: 100, opacity: win(t, 4.0, 10.2) }}>
        <Kicker t={t} at={4.05}>TODAY'S VIDEO</Kicker>
        <div style={{ marginTop: 26, position: "relative", height: 270 }}>
          <div style={{ position: "absolute", left: 0, top: 0, opacity: win(t, 4.2, 7.1) }}>
            <Line t={t} at={4.25} size={118}>Reel editing</Line>
            <Line t={t} at={5.2} size={118} color={RED}>like these.</Line>
          </div>
          <div style={{ position: "absolute", left: 0, top: 0, opacity: win(t, 7.25, 10.2) }}>
            <Line t={t} at={7.3} size={118}>You've been</Line>
            <Line t={t} at={8.0} size={118} color={RED}>watching these.</Line>
          </div>
        </div>
      </div>

      {/* ===== roadmap scene (18.2 - 26.4) ===== */}
      <div style={{ position: "absolute", left: 110, top: 100, opacity: win(t, 18.2, 26.4) * wipe16 }}>
        <Kicker t={t} at={18.5}>THE PLAN</Kicker>
        <div style={{ marginTop: 26 }}>
          <Line t={t} at={18.7} size={112}>Zero to</Line>
          <Line t={t} at={19.0} size={112} color={RED}>finished reel.</Line>
        </div>
        <div style={{ position: "absolute", left: 0, top: 310, width: 1240, display: "flex", justifyContent: "space-between" }}>
          {STEPS.map((s, i) => {
            const k = prog(t, s.at, s.at + 0.6);
            return (
              <div key={i} style={{ width: 280, opacity: k, transform: `translateY(${(1 - k) * 34}px)` }}>
                <div style={{ fontWeight: 800, fontSize: 30, color: RED, letterSpacing: ".1em" }}>{s.n}</div>
                <div style={{ fontWeight: 800, fontSize: 64, color: INK, letterSpacing: "-0.04em", marginTop: 4 }}>{s.t}</div>
                <div style={{ height: 6, background: INK, marginTop: 14, width: `${k * 100}%` }} />
              </div>
            );
          })}
        </div>
        {/* "step by step" tag */}
        {(() => {
          const k = prog(t, 22.7, 23.3, Easing.bezier(0.34, 1.56, 0.64, 1));
          return (
            <div style={{ position: "absolute", left: 760, top: 0, transform: `scale(${k})`, transformOrigin: "0 50%", opacity: Math.min(1, k * 3), background: RED, color: "#fff", fontWeight: 800, fontSize: 40, letterSpacing: "-0.02em", padding: "16px 34px", borderRadius: 50, whiteSpace: "nowrap" }}>
              Step by step
            </div>
          );
        })()}
      </div>

      {/* ===== finale (29.2+) ===== */}
      <div style={{ position: "absolute", left: 110, top: 150, opacity: prog(t, 29.2, 29.4) }}>
        <Kicker t={t} at={29.9}>LET'S BEGIN</Kicker>
        <div style={{ marginTop: 34 }}>
          <Line t={t} at={30.9} size={142}>The secret</Line>
          <Line t={t} at={31.4} size={142}>behind these</Line>
          <Line t={t} at={32.0} size={142} color={RED}>reels.</Line>
        </div>
      </div>

      <div style={{ position: "absolute", left: 110, top: 100, opacity: win(t, 26.5, 29.2, 0.35) }}>
        <Kicker t={t} at={26.55}>THE GOAL</Kicker>
        <div style={{ marginTop: 22 }}>
          <Line t={t} at={26.7} size={96}>How to make</Line>
          <Line t={t} at={27.4} size={96} color={RED}>reels like these.</Line>
        </div>
      </div>

      <Carousel t={t} frame={frame} />
      <Fan t={t} />

      {/* ===== speaker ===== */}
      <div style={{ position: "absolute", left, top, width: w, height: h, borderRadius: r, overflow: "hidden", border: e > 0.02 ? `${6 * e}px solid ${INK}` : "none", boxSizing: "border-box", background: INK }}>
        <OffthreadVideo src={staticFile("intro2/main.mp4")} style={{ position: "absolute", left: vid.l - (push - 1) * vid.w * FACE.x, top: vid.t - (push - 1) * vid.h * 0.25, width: vid.w * push, height: vid.h * push, maxWidth: "none", maxHeight: "none", objectFit: "cover" }} />
      </div>

      {/* ===== scene 1 : welcome lower-third on speaker ===== */}
      {t < 3.8 && (() => {
        const k = prog(t, 0.25, 1.0), o = prog(t, 2.9, 3.4);
        const k2 = prog(t, 3.0, 3.6);
        return (
          <div style={{ position: "absolute", left: 90, bottom: 110, opacity: 1 - prog(t, 3.5, 3.75), transform: `translateY(${(1 - k) * 60}px)` }}>
            <div style={{ background: "#fff", border: `6px solid ${INK}`, borderRadius: 34, padding: "26px 46px 30px", overflow: "hidden", minWidth: 640 }}>
              <div style={{ position: "relative", height: 150 }}>
                <div style={{ position: "absolute", left: 0, top: 0, opacity: 1 - o, transform: `translateY(${-o * 40}px)` }}>
                  <div style={{ fontWeight: 600, fontSize: 32, color: GREY, letterSpacing: "-0.01em" }}>Welcome to</div>
                  <div style={{ fontWeight: 800, fontSize: 76, color: INK, letterSpacing: "-0.045em", lineHeight: 1.05, whiteSpace: "nowrap" }}>VidyaGram <span style={{ color: RED }}>Skills</span></div>
                </div>
                <div style={{ position: "absolute", left: 0, top: 0, opacity: k2, transform: `translateY(${(1 - k2) * 40}px)` }}>
                  <div style={{ fontWeight: 600, fontSize: 32, color: GREY }}>Your host</div>
                  <div style={{ fontWeight: 800, fontSize: 82, color: INK, letterSpacing: "-0.045em", lineHeight: 1.05 }}>I'm <span style={{ color: RED }}>Aditya.</span></div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ===== scene 4 : comments over speaker ===== */}
      {t > 10.6 && t < 16.4 && COMMENTS.map((c, i) => <Bubble key={i} t={t} c={c} out={commentsOut} />)}

      {/* ===== scene 5 : tutorial is here (speaker full) ===== */}
      {t > 16.3 && t < 18.5 && (() => {
        const k = prog(t, 16.4, 17.1), o = prog(t, 17.95, 18.25);
        return (
          <div style={{ position: "absolute", left: 90, bottom: 110, opacity: 1 - o, transform: `translateY(${(1 - k) * 70}px)` }}>
            <div style={{ background: "#fff", border: `6px solid ${INK}`, borderRadius: 34, padding: "22px 50px 28px" }}>
              <div style={{ fontWeight: 700, fontSize: 28, letterSpacing: ".2em", color: RED }}>NEW TUTORIAL</div>
              <div style={{ fontWeight: 800, fontSize: 104, color: INK, letterSpacing: "-0.05em", lineHeight: 1.05 }}>It's <span style={{ color: RED }}>here.</span></div>
            </div>
          </div>
        );
      })()}

      {/* final fade to white */}
      <AbsoluteFill style={{ background: "#fff", opacity: prog(t, 33.55, 33.9, Easing.linear) * 0 }} />
    </AbsoluteFill>
  );
};
