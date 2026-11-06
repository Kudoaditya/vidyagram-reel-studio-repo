#!/usr/bin/env node
// Render an anatomy (isometric machine) page to MP4 on a virtual clock - deterministic, frame exact.
// usage: node render_sim.mjs <page.html> <events.json> <out.mp4> [--w 1080] [--h 1000] [--fps 30] [--dur 12] [--bg "#111111"] [--zoom 1.25] [--keep]
// events.json: [{"t":0.5,"key":" "}, {"t":3,"key":"ArrowUp"}, ...]  t in seconds; key goes to the figure's [tabindex=0] stage.
import { writeFileSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
const a = process.argv.slice(2);
const [page, evFile, out] = a;
if (!out) { console.error("usage: render_sim.mjs page.html events.json out.mp4 [--w --h --fps --dur --bg --keep]"); process.exit(1); }
const opt = (n, d) => (a.includes("--" + n) ? a[a.indexOf("--" + n) + 1] : d);
const W = +opt("w", 1080), H = +opt("h", 1000), FPS = +opt("fps", 30), DUR = +opt("dur", 12), ZOOM = +opt("zoom", 1.25), BG = opt("bg", page.includes("light") ? "#f4f1ea" : "#111111");
const events = JSON.parse(readFileSync(evFile, "utf8")).sort((x, y) => x.t - y.t);
const work = join(tmpdir(), "sim-" + Date.now()); mkdirSync(work, { recursive: true });
const frames = Math.round(DUR * FPS);
writeFileSync(join(work, "pre.js"), `window.__SIM=true;let q=[],now=0;window.requestAnimationFrame=cb=>{q.push(cb);return q.length};window.cancelAnimationFrame=()=>{};performance.now=()=>now;
window.__sim={step(ms){now+=ms;const c=q;q=[];c.forEach(f=>f(now))},key(k){const s=document.querySelector('[tabindex="0"]');s.dispatchEvent(new KeyboardEvent('keydown',{key:k,bubbles:true}))}};
document.addEventListener('DOMContentLoaded',()=>{const st=document.createElement('style');st.textContent='html,body{height:${H}px;margin:0;background:${BG}!important}body{display:flex;align-items:center;justify-content:center}.iso-page{width:${W}px!important;margin:0!important}.iso-figure{margin:0}.iso-plate{border:0!important;background:transparent!important;padding:0!important;box-shadow:none!important}.iso-plate-corners,.iso-legend{display:none!important}.iso-stage{width:${W}px}.iso-stage svg{width:${W}px;height:auto;display:block;transform:scale(${ZOOM})}html,body{overflow:hidden}';document.head.appendChild(st)});`);
const acts = [["wait", 600], ["eval", "__sim.step(16)"]];
let ei = 0;
for (let f = 0; f < frames; f++) {
  const t = f / FPS;
  while (ei < events.length && events[ei].t <= t + 1e-6) { acts.push(["eval", `__sim.key(${JSON.stringify(events[ei].key)})`]); ei++; }
  acts.push(["eval", `__sim.step(${1000 / FPS})`], ["shot", join(work, `f${String(f).padStart(5, "0")}.png`), "body", 1]);
}
writeFileSync(join(work, "acts.json"), JSON.stringify(acts));
const drive = join(process.env.HOME, ".claude/skills/anatomy/scripts/drive.mjs");
const r = spawnSync(process.execPath, [drive, resolve(page), "--actions", join(work, "acts.json"), "--width", W, "--height", H, "--preload", join(work, "pre.js")], { stdio: ["ignore", "ignore", "inherit"] });
if (r.status) process.exit(r.status);
const f = spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", FPS, "-i", join(work, "f%05d.png"), "-vf", `scale=${W}:${H}`, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "16", resolve(out)], { stdio: "inherit" });
if (!a.includes("--keep")) rmSync(work, { recursive: true, force: true });
console.log(f.status ? "ffmpeg failed" : "wrote " + resolve(out), frames + " frames");
