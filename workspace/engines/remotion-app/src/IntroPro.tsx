import { AbsoluteFill, Easing, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

// Intro 16:9 v2: tightened cut (gaps + retake removed, 1.08x), graded footage, white/black/red motion design.
// Authoring is in ORIGINAL (spoken-word) time `t`; `toOld` maps the tight timeline back to it.
const W = 1920, H = 1080, FPS = 30;
const INK = "#0A0A0A", RED = "#E5171F", GREY = "#6B6B6B";
const FONT = "'SF Pro Display','Helvetica Neue',Helvetica,Arial,sans-serif";
const MONO = "'SF Mono',Menlo,monospace";
const KEEP: [number, number][] = [[0.14, 6.93], [7.14, 10.35], [10.57, 16.04], [16.28, 32.44], [32.65, 33.78]];
const SP = 1;
export const INTRO_FRAMES = Math.round((KEEP.reduce((s, [a, b]) => s + b - a, 0) / SP) * FPS);
const toOld = (tn: number) => { let r = tn * SP; for (const [a, b] of KEEP) { if (r <= b - a) return a + r; r -= b - a; } return KEEP[KEEP.length - 1][1]; };
const toNew = (o: number) => { let acc = 0; for (const [a, b] of KEEP) { if (o < a) return acc / SP; if (o <= b) return (acc + o - a) / SP; acc += b - a; } return acc / SP; };

const out = Easing.bezier(0.16, 1, 0.3, 1);
const inout = Easing.bezier(0.65, 0, 0.35, 1);
const back = Easing.bezier(0.34, 1.56, 0.64, 1);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const prog = (t: number, a: number, b: number, e = out) => e(Math.min(1, Math.max(0, (t - a) / (b - a))));
const win = (t: number, a: number, b: number, f = 0.3) => Math.min(1, Math.max(0, (t - a) / 0.01)) * Math.min(1, Math.max(0, (b - t) / f));

const PILL: [number, number][] = [[3.7, 10.2], [18.2, 34]];
const PILL_W = 420, PILL_H = 480, PILL_LEFT = W - 90 - PILL_W, PILL_TOP = 270;
const FACE = { x: 0.53, y: 0.36 };
const pillAmount = (t: number) => {
  let p = 0;
  for (const [a, b] of PILL) p = Math.max(p, Math.min(1, Math.max(0, (t - a) / 0.8)) * Math.min(1, Math.max(0, (b - t) / 0.8)));
  return inout(p);
};

// ---------- text ----------
const Line: React.FC<{ t: number; at: number; size: number; color?: string; children: string; ul?: boolean }> = ({ t, at, size, color = INK, children, ul }) => {
  const words = children.split(" ");
  return (
    <div style={{ position: "relative", display: "inline-flex", gap: size * 0.26, fontFamily: FONT, fontSize: size, fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 1.04, color, whiteSpace: "nowrap" }}>
      {words.map((w, i) => {
        const k = prog(t, at + i * 0.07, at + i * 0.07 + 0.8);
        const kk = back(Math.min(1, Math.max(0, (t - at - i * 0.07) / 0.7)));
        return (
          <span key={i} style={{ display: "inline-block", overflow: "hidden", paddingBottom: size * 0.14, marginBottom: -size * 0.14, paddingRight: size * 0.03 }}>
            <span style={{ display: "inline-block", transform: `translateY(${(1 - kk) * 112}%) rotate(${(1 - k) * 4}deg)`, transformOrigin: "0 100%", opacity: Math.min(1, k * 4) }}>{w}</span>
          </span>
        );
      })}
      {ul && <div style={{ position: "absolute", left: 0, bottom: -size * 0.02, height: Math.max(8, size * 0.07), width: "100%", background: RED, transformOrigin: "0 50%", transform: `scaleX(${prog(t, at + 0.6, at + 1.25)})`, opacity: 0.9 }} />}
    </div>
  );
};
const Kicker: React.FC<{ t: number; at: number; children: string; color?: string }> = ({ t, at, children, color = RED }) => {
  const k = prog(t, at, at + 0.6);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, fontFamily: FONT, fontWeight: 700, fontSize: 26, letterSpacing: ".2em", color, opacity: k, transform: `translateX(${(1 - k) * -30}px)` }}>
      <span style={{ width: 44 * k, height: 4, background: color, display: "inline-block" }} />
      {children}
    </div>
  );
};

// ---------- background ----------
const Bg: React.FC<{ tn: number; e: number }> = ({ tn, e }) => (
  <AbsoluteFill style={{ background: "#fff" }}>
    <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(${INK} 1.4px, transparent 1.6px)`, backgroundSize: "56px 56px", backgroundPosition: `${-tn * 14}px ${-tn * 7}px`, opacity: 0.07 * e }} />
    <div style={{ position: "absolute", left: 1180 + Math.sin(tn * 0.6) * 24, top: 40 + Math.cos(tn * 0.5) * 18, width: 980, height: 980, borderRadius: "50%", border: `3px solid ${RED}`, opacity: 0.16 * e, transform: `scale(${1 + Math.sin(tn * 0.9) * 0.03})` }} />
    <div style={{ position: "absolute", left: 1330 + Math.cos(tn * 0.7) * 20, top: 190, width: 680, height: 680, borderRadius: "50%", border: `2px solid ${INK}`, opacity: 0.09 * e }} />
  </AbsoluteFill>
);

// ---------- carousel ----------
const N = 13, CARD_W = 540, CARD_H = 960, STEP = CARD_W + 70;
const speedAt = (t: number) => {
  if (t < 3.7) return 0;
  if (t < 7.0) return 230;
  if (t < 7.8) return lerp(230, 1500, inout((t - 7.0) / 0.8));
  if (t < 9.4) return 1500;
  if (t < 10.4) return lerp(1500, 260, inout((t - 9.4) / 1.0));
  if (t < 18.3) return 0;
  if (t > 26.5) return 0;
  return 260;
};
const TRACK: number[] = (() => {
  const a: number[] = [0];
  for (let f = 1; f < INTRO_FRAMES + 3; f++) a.push(a[f - 1] + speedAt(toOld(f / FPS)) / FPS);
  return a;
})();
const carVisible = (t: number) =>
  t < 14 ? prog(t, 3.75, 4.6) * (1 - prog(t, 10.0, 10.7, inout)) : t < 26.5 ? prog(t, 18.35, 19.2) * (1 - prog(t, 25.95, 26.5, inout)) : 0;

const Carousel: React.FC<{ t: number; frame: number }> = ({ t, frame }) => {
  const v = carVisible(t);
  if (v <= 0.001) return null;
  const scale = t < 14 ? 0.56 : 0.5;
  const cy = (t < 14 ? 735 : 905) + (1 - v) * 720;
  const off = TRACK[Math.min(frame, TRACK.length - 1)];
  const cards = [];
  for (let i = 0; i < N; i++) {
    const x = i * STEP - off + 200;
    const norm = (x * scale) / 640;
    if (Math.abs(norm) > 1.55) continue;
    const rotY = Math.max(-24, Math.min(24, -norm * 20));
    const s = 1 - Math.min(0.16, Math.abs(norm) * 0.09);
    const bob = Math.sin(i * 1.7) * 22;
    cards.push(
      <div key={i} style={{ position: "absolute", left: x - CARD_W / 2, top: -CARD_H / 2 + bob, width: CARD_W, height: CARD_H, borderRadius: 54, overflow: "hidden", border: `12px solid ${INK}`, background: INK, boxSizing: "border-box", transform: `rotateY(${rotY}deg) scale(${s})`, zIndex: 100 - Math.round(Math.abs(norm) * 10) }}>
        <OffthreadVideo muted src={staticFile(`intro2/clip${String(i).padStart(2, "0")}.mp4`)} startFrom={(i * 37) % 60} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1400, height: H, overflow: "hidden", WebkitMaskImage: "linear-gradient(90deg,transparent 0,#000 110px,#000 1240px,transparent 1400px)" }}>
      <div style={{ position: "absolute", left: 700, top: cy, width: 0, height: 0, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, perspective: 2800, perspectiveOrigin: "0 0" }}>{cards}</div>
      </div>
    </div>
  );
};

// reel counter (scene 2-3)
const Counter: React.FC<{ t: number; frame: number }> = ({ t, frame }) => {
  const o = win(t, 4.2, 10.2, 0.3);
  if (o <= 0) return null;
  const off = TRACK[Math.min(frame, TRACK.length - 1)];
  const n = Math.max(0, Math.min(N - 1, Math.round((off + 20) / STEP))) + 1;
  const k = prog(t, 4.3, 4.9);
  return (
    <div style={{ position: "absolute", right: 550, top: 112, opacity: o * k, transform: `translateY(${(1 - k) * 20}px)`, fontFamily: MONO, display: "flex", alignItems: "baseline", gap: 14 }}>
      <span style={{ fontSize: 22, letterSpacing: ".2em", color: GREY, fontWeight: 600 }}>REEL</span>
      <span style={{ fontSize: 76, fontWeight: 700, color: INK, letterSpacing: "-0.04em" }}>{String(n).padStart(2, "0")}</span>
      <span style={{ fontSize: 30, color: RED, fontWeight: 700 }}>/ {N}</span>
    </div>
  );
};

// ---------- comments ----------
const COMMENTS = [
  { at: 10.75, x: 90, y: 200, a: "A", t: "Bhai, teach us this!", n: 248 },
  { at: 11.55, x: -1, y: 300, a: "R", t: "How do you edit like this?", n: 91 },
  { at: 12.9, x: 110, y: 480, a: "S", t: "Make a tutorial please", n: 163 },
  { at: 14.1, x: -1, y: 590, a: "K", t: "Next video kab aayega?", n: 57 },
];
const Bubble: React.FC<{ t: number; c: (typeof COMMENTS)[number]; fade: number }> = ({ t, c, fade }) => {
  const dots = prog(t, c.at - 0.35, c.at - 0.1, Easing.linear) * (1 - prog(t, c.at - 0.02, c.at + 0.08, Easing.linear));
  const k = back(Math.min(1, Math.max(0, (t - c.at) / 0.6)));
  const fl = Math.sin(t * 1.4 + c.x) * 6;
  const heart = back(Math.min(1, Math.max(0, (t - c.at - 0.55) / 0.5)));
  const vis = Math.min(1, k * 4) * (1 - fade);
  return (
    <>
      {dots > 0.01 && (
        <div style={{ position: "absolute", ...(c.x < 0 ? { right: 60 } : { left: c.x }), top: c.y + 14, opacity: dots * (1 - fade), display: "flex", gap: 8, padding: "18px 24px", background: "#fff", border: `5px solid ${INK}`, borderRadius: 40 }}>
          {[0, 1, 2].map((d) => <span key={d} style={{ width: 14, height: 14, borderRadius: 7, background: INK, transform: `translateY(${Math.sin(t * 14 + d * 1.2) * 5}px)` }} />)}
        </div>
      )}
      <div style={{ position: "absolute", ...(c.x < 0 ? { right: 60 } : { left: c.x }), top: c.y + fl, transform: `scale(${0.55 + 0.45 * k})`, transformOrigin: c.x < 0 ? "100% 100%" : "0 100%", opacity: vis, display: "flex", alignItems: "center", gap: 18, padding: "20px 30px 20px 20px", background: "#fff", border: `6px solid ${INK}`, borderRadius: 60, fontFamily: FONT, fontWeight: 700, fontSize: 38, color: INK, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
        <span style={{ width: 62, height: 62, borderRadius: 31, background: RED, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 800 }}>{c.a}</span>
        {c.t}
        <span style={{ display: "flex", alignItems: "center", gap: 8, color: RED, fontSize: 34, transform: `scale(${0.4 + 0.6 * heart})` }}>♥<span style={{ fontFamily: MONO, fontSize: 26, color: INK }}>{c.n}</span></span>
      </div>
    </>
  );
};

// ---------- roadmap ----------
const Icon: React.FC<{ kind: number; t: number; k: number }> = ({ kind, t, k }) => {
  const sw = 6;
  if (kind === 0) return <svg width="84" height="84" viewBox="0 0 84 84"><circle cx="42" cy="42" r="36" fill="none" stroke={INK} strokeWidth={sw} strokeDasharray={226} strokeDashoffset={226 * (1 - k)} /><path d="M34 26 L60 42 L34 58 Z" fill={RED} transform={`scale(${0.5 + 0.5 * k})`} style={{ transformOrigin: "42px 42px" }} /></svg>;
  if (kind === 1) return <svg width="84" height="84" viewBox="0 0 84 84"><rect x="6" y="28" width="30" height="28" rx="6" fill="none" stroke={INK} strokeWidth={sw} transform={`translate(${-(1 - k) * 8} 0)`} /><rect x="48" y="28" width="30" height="28" rx="6" fill="none" stroke={INK} strokeWidth={sw} transform={`translate(${(1 - k) * 8} 0)`} /><path d="M42 10 V74" stroke={RED} strokeWidth={sw} strokeLinecap="round" strokeDasharray={64} strokeDashoffset={64 * (1 - k)} /></svg>;
  if (kind === 2) return <svg width="84" height="84" viewBox="0 0 84 84"><path d="M8 66 C 24 66, 24 18, 42 18 S 62 66, 76 66" fill="none" stroke={INK} strokeWidth={sw} strokeLinecap="round" strokeDasharray={150} strokeDashoffset={150 * (1 - k)} /><circle cx={lerp(8, 76, k)} cy={66 - Math.sin(k * Math.PI) * 48} r="9" fill={RED} /></svg>;
  return <svg width="84" height="84" viewBox="0 0 84 84">{[0, 1, 2, 3, 4].map((b) => { const hh = (14 + 40 * Math.abs(Math.sin(t * 6 + b * 1.3))) * k; return <rect key={b} x={8 + b * 15} y={42 - hh / 2} width="9" height={hh} rx="4.5" fill={b === 2 ? RED : INK} />; })}</svg>;
};
const STEPS = [{ at: 19.75, n: "01", t: "Hook" }, { at: 20.45, n: "02", t: "Cut" }, { at: 21.35, n: "03", t: "Motion" }, { at: 22.25, n: "04", t: "Sound" }];

// ---------- fan ----------
const FAN_START = 26.55, FAN_END = 29.45;
const FAN = [
  { i: 2, rot: -17, dx: -430, dy: 60 }, { i: 5, rot: -8.5, dx: -215, dy: 14 }, { i: 7, rot: 0, dx: 0, dy: -10 },
  { i: 9, rot: 8.5, dx: 215, dy: 14 }, { i: 11, rot: 17, dx: 430, dy: 60 },
];
const Fan: React.FC<{ t: number }> = ({ t }) => {
  if (t < FAN_START || t > FAN_END) return null;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1400, height: H, perspective: 2400 }}>
      {FAN.map((c, n) => {
        const ap = prog(t, FAN_START + n * 0.09, FAN_START + 0.9 + n * 0.09);
        const rot = lerp(0, c.rot, ap), dx = lerp(0, c.dx, ap);
        const dy = lerp(900, c.dy, ap) + Math.sin(t * 1.6 + n) * 8 * ap;
        const flip = (1 - ap) * 55;
        return (
          <div key={n} style={{ position: "absolute", left: 700 + dx - CARD_W / 2, top: 1000 - CARD_H + dy, width: CARD_W, height: CARD_H, transform: `rotate(${rot}deg) rotateY(${flip}deg) scale(0.58)`, transformOrigin: "50% 100%", borderRadius: 54, overflow: "hidden", border: `12px solid ${INK}`, background: INK, boxSizing: "border-box", zIndex: 10 - Math.abs(n - 2) }}>
            <OffthreadVideo muted src={staticFile(`intro2/clip${String(c.i).padStart(2, "0")}.mp4`)} startFrom={n * 20} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        );
      })}
    </div>
  );
};

// ---------- curtain ----------
const Curtain: React.FC<{ tn: number; tc: number; dir: "x" | "y" }> = ({ tn, tc, dir }) => {
  if (tn < tc - 0.5 || tn > tc + 0.55) return null;
  const x = tn < tc ? lerp(-100, 0, inout((tn - (tc - 0.5)) / 0.5)) : lerp(0, 100, inout((tn - tc) / 0.55));
  const tf = dir === "x" ? `translateX(${x}%)` : `translateY(${-x}%)`;
  return (
    <AbsoluteFill style={{ transform: tf, zIndex: 50 }}>
      <AbsoluteFill style={{ background: RED }} />
      <div style={dir === "x" ? { position: "absolute", left: 0, top: 0, bottom: 0, width: 22, background: INK } : { position: "absolute", left: 0, right: 0, bottom: 0, height: 22, background: INK }} />
    </AbsoluteFill>
  );
};

// ---------- main ----------
export const IntroPro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tn = frame / fps;
  const t = toOld(tn);
  const e = pillAmount(t);
  const tc1 = toNew(26.5), tc2 = toNew(29.45);

  const left = lerp(0, PILL_LEFT, e), top = lerp(0, PILL_TOP, e), w = lerp(W, PILL_W, e), h = lerp(H, PILL_H, e), r = lerp(0, 44, e);
  const sp = PILL_H / H, vwP = W * sp, vhP = H * sp;
  const leftP = Math.min(0, Math.max(PILL_W - vwP, PILL_W / 2 - FACE.x * vwP));
  const topP = Math.min(0, Math.max(PILL_H - vhP, PILL_H / 2 - FACE.y * vhP));
  // jump-cut punch-ins (full-frame only) + slow push
  const jump = t >= 10.35 && t < 16.28 ? 1.07 : 1;
  const fullSeg = t < 3.7 ? t / 3.7 : t >= 10.2 && t < 18.2 ? (t - 10.2) / 8 : 0;
  const push = (1 + 0.05 * inout(Math.min(1, fullSeg))) * lerp(jump, 1, e);
  const vid = { w: lerp(W, vwP, e), h: lerp(H, vhP, e), l: lerp(0, leftP, e), t: lerp(0, topP, e) };
  const bob = Math.sin(tn * 1.3) * 5 * e;

  const commentsFade = prog(t, 15.7, 16.2);
  const wipe = prog(t, 18.2, 18.9);
  const bars = (i: number) => 8 + 22 * Math.abs(Math.sin(tn * 7 + i * 1.7)) * Math.abs(Math.sin(tn * 2.3 + i));

  // roadmap connector progress
  const lineK = prog(t, 19.9, 22.6, Easing.linear);

  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Bg tn={tn} e={e > 0.01 ? 1 : 0} />

      {/* scenes 2-3 */}
      <div style={{ position: "absolute", left: 110, top: 100, opacity: win(t, 4.0, 10.2) }}>
        <Kicker t={t} at={4.05}>TODAY'S VIDEO</Kicker>
        <div style={{ marginTop: 26, position: "relative", height: 270 }}>
          <div style={{ position: "absolute", left: 0, top: 0, opacity: win(t, 4.2, 7.1) }}>
            <Line t={t} at={4.25} size={118}>Reel editing</Line><br />
            <Line t={t} at={5.2} size={118} color={RED} ul>like these.</Line>
          </div>
          <div style={{ position: "absolute", left: 0, top: 0, opacity: win(t, 7.25, 10.2) }}>
            <Line t={t} at={7.3} size={118}>You've been</Line><br />
            <Line t={t} at={8.0} size={118} color={RED} ul>watching these.</Line>
          </div>
        </div>
      </div>
      <Counter t={t} frame={frame} />

      {/* roadmap */}
      <div style={{ position: "absolute", left: 110, top: 100, opacity: win(t, 18.2, 26.5, 0.25) * wipe }}>
        <Kicker t={t} at={18.5}>THE PLAN</Kicker>
        <div style={{ marginTop: 26, display: "flex", flexDirection: "column" }}>
          <Line t={t} at={18.7} size={104}>Zero to</Line>
          <Line t={t} at={19.0} size={104} color={RED} ul>finished reel.</Line>
        </div>
        <div style={{ position: "absolute", left: 0, top: 298, width: 1240 }}>
          <div style={{ position: "absolute", left: 0, top: 150, height: 6, width: 1240, background: "rgba(10,10,10,.1)" }} />
          <div style={{ position: "absolute", left: 0, top: 150, height: 6, width: 1240 * lineK, background: RED }} />
          <div style={{ position: "absolute", left: 1240 * lineK - 11, top: 143, width: 22, height: 22, borderRadius: 11, background: RED, opacity: lineK > 0 && lineK < 1 ? 1 : 0 }} />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {STEPS.map((s, i) => {
              const k = prog(t, s.at, s.at + 0.7), kb = back(Math.min(1, Math.max(0, (t - s.at) / 0.7)));
              return (
                <div key={i} style={{ width: 280, height: 190, background: "#fff", border: `6px solid ${INK}`, borderRadius: 30, padding: "18px 24px", boxSizing: "border-box", opacity: Math.min(1, k * 3), transform: `translateY(${(1 - kb) * 60}px) scale(${0.9 + 0.1 * kb})`, position: "relative" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 28, color: RED }}>{s.n}</div>
                    <div style={{ marginTop: -2 }}><Icon kind={i} t={tn} k={k} /></div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 58, color: INK, letterSpacing: "-0.04em", position: "absolute", left: 24, bottom: 14 }}>{s.t}</div>
                </div>
              );
            })}
          </div>
        </div>
        {(() => {
          const k = back(Math.min(1, Math.max(0, (t - 22.7) / 0.6)));
          return (
            <div style={{ position: "absolute", left: 790, top: 4, transform: `scale(${k}) rotate(${(1 - k) * -8}deg)`, transformOrigin: "0 50%", opacity: Math.min(1, k * 3), background: RED, color: "#fff", fontWeight: 800, fontSize: 40, letterSpacing: "-0.02em", padding: "16px 34px", borderRadius: 50, whiteSpace: "nowrap" }}>
              Step by step
            </div>
          );
        })()}
      </div>

      {/* fan headline */}
      <div style={{ position: "absolute", left: 110, top: 100, opacity: win(t, 26.55, FAN_END, 0.25) }}>
        <Kicker t={t} at={26.62}>THE GOAL</Kicker>
        <div style={{ marginTop: 22, display: "flex", flexDirection: "column" }}>
          <Line t={t} at={26.75} size={96}>How to make</Line>
          <Line t={t} at={27.45} size={96} color={RED} ul>reels like these.</Line>
        </div>
      </div>

      {/* finale */}
      {t >= FAN_END && (
        <div style={{ position: "absolute", left: 110, top: 150, transform: `scale(${1 + prog(t, 29.9, 33.8, Easing.linear) * 0.025})`, transformOrigin: "0 50%" }}>
          <Kicker t={t} at={29.6}>LET'S BEGIN</Kicker>
          <div style={{ marginTop: 34, display: "flex", flexDirection: "column" }}>
            <Line t={t} at={30.55} size={142}>The secret</Line>
            <Line t={t} at={31.2} size={142}>behind these</Line>
            <Line t={t} at={31.85} size={142} color={RED} ul>reels.</Line>
          </div>
        </div>
      )}

      <Carousel t={t} frame={frame} />
      <Fan t={t} />

      {/* speaker */}
      <div style={{ position: "absolute", left, top: top + bob, width: w, height: h, borderRadius: r, overflow: "hidden", border: e > 0.02 ? `${6 * e}px solid ${INK}` : "none", boxSizing: "border-box", background: INK }}>
        <OffthreadVideo src={staticFile("intro2/tight2.mp4")} style={{ position: "absolute", left: vid.l - (push - 1) * vid.w * FACE.x, top: vid.t - (push - 1) * vid.h * 0.25, width: vid.w * push, height: vid.h * push, maxWidth: "none", maxHeight: "none", objectFit: "cover" }} />
      </div>
      {e > 0.98 && (
        <div style={{ position: "absolute", left: PILL_LEFT, top: PILL_TOP + PILL_H + 28 + bob, width: PILL_W, opacity: prog(t, 4.6, 5.2) * (t < 10.2 || t >= 18.2 ? 1 : 0), display: "flex", alignItems: "center", gap: 16, fontFamily: FONT }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, height: 34 }}>{[0, 1, 2, 3].map((i) => <span key={i} style={{ width: 6, height: bars(i), background: RED, borderRadius: 3 }} />)}</div>
          <div style={{ fontWeight: 800, fontSize: 32, color: INK, letterSpacing: "-0.03em" }}>Aditya</div>
          <div style={{ fontWeight: 600, fontSize: 24, color: GREY }}>VidyaGram Skills</div>
        </div>
      )}

      {/* scene 1: welcome */}
      {t < 3.8 && (() => {
        const k = prog(t, 0.2, 1.0), o2 = prog(t, 2.9, 3.4), k2 = prog(t, 3.0, 3.6);
        return (
          <div style={{ position: "absolute", left: 90, bottom: 110, opacity: 1 - prog(t, 3.5, 3.75), transform: `translateY(${(1 - k) * 60}px)` }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 16, background: RED, borderRadius: "34px 0 0 34px", transform: `scaleY(${k})`, transformOrigin: "50% 100%" }} />
            <div style={{ marginLeft: 16, background: "#fff", border: `6px solid ${INK}`, borderLeft: "none", borderRadius: "0 34px 34px 0", padding: "26px 46px 30px", overflow: "hidden", minWidth: 640, clipPath: `inset(0 ${(1 - k) * 100}% 0 0)` }}>
              <div style={{ position: "relative", height: 150 }}>
                <div style={{ position: "absolute", left: 0, top: 0, opacity: 1 - o2, transform: `translateY(${-o2 * 40}px)` }}>
                  <div style={{ fontWeight: 600, fontSize: 32, color: GREY }}>Welcome to</div>
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

      {/* scene 4: comments */}
      {t > 10.2 && t < 16.4 && (
        <>
          {(() => {
            const k = back(Math.min(1, Math.max(0, (t - 10.4) / 0.6)));
            return (
              <div style={{ position: "absolute", left: 90, top: 100, opacity: (1 - commentsFade) * Math.min(1, k * 3), transform: `translateY(${(1 - k) * -30}px)`, display: "flex", alignItems: "center", gap: 14, background: INK, color: "#fff", padding: "14px 28px", borderRadius: 40, fontWeight: 800, fontSize: 28, letterSpacing: ".12em" }}>
                <span style={{ width: 14, height: 14, borderRadius: 7, background: RED }} />COMMENTS
              </div>
            );
          })()}
          {COMMENTS.map((c, i) => <Bubble key={i} t={t} c={c} fade={commentsFade} />)}
        </>
      )}

      {/* scene 5 */}
      {t > 16.3 && t < 18.5 && (() => {
        const k = prog(t, 16.4, 17.1), o2 = prog(t, 17.95, 18.25);
        return (
          <div style={{ position: "absolute", left: 90, bottom: 110, opacity: 1 - o2, transform: `translateY(${(1 - k) * 70}px)` }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 16, background: RED, borderRadius: "34px 0 0 34px" }} />
            <div style={{ marginLeft: 16, background: "#fff", border: `6px solid ${INK}`, borderLeft: "none", borderRadius: "0 34px 34px 0", padding: "22px 50px 28px", clipPath: `inset(0 ${(1 - k) * 100}% 0 0)` }}>
              <div style={{ fontWeight: 700, fontSize: 28, letterSpacing: ".2em", color: RED }}>NEW TUTORIAL</div>
              <div style={{ fontWeight: 800, fontSize: 104, color: INK, letterSpacing: "-0.05em", lineHeight: 1.05 }}>It's <span style={{ color: RED }}>here.</span></div>
            </div>
          </div>
        );
      })()}

      {/* progress hairline */}
      <div style={{ position: "absolute", left: 0, bottom: 0, height: 8, width: "100%", background: "rgba(10,10,10,.08)", opacity: e }}>
        <div style={{ height: "100%", width: `${(frame / INTRO_FRAMES) * 100}%`, background: RED }} />
      </div>

      <Curtain tn={tn} tc={tc1} dir="x" />
      <Curtain tn={tn} tc={tc2} dir="y" />
    </AbsoluteFill>
  );
};
