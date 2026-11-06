import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SKILL = process.env.ANATOMY_SKILL || `${process.env.HOME}/.claude/skills/anatomy`;
const k = await import(`${SKILL}/kit/iso-kit.mjs`);
const { kitScript } = await import(`${SKILL}/scripts/inline-kit.mjs`);

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--light") ? "light" : "dark";

const WIDTH = 720;
const HEIGHT = 480;

// ---- the model's numbers (the page's live code uses the same ones) ----
const CAP = 6; // bucket size: coins the tube holds
const RATES = [0.5, 1, 2]; // refill, tokens per second
const BASE = 10; // tube floor (pedestal top)
const CH = 3.4; // coin pitch
const COIN_H = 3.2;
const COIN_R = 7;
const WEIR = BASE + CAP * CH; // top of a full stack
const GATE_H = 2;
const ZG = WEIR + 2.5; // gate plate bottom
const HOP0 = ZG + GATE_H; // bottom hopper coin rests here
const HOP_N = 4;
const ZP = HOP0 + HOP_N * CH + 3; // top frame
const FRAME_H = 2.4;
const PIT = 8.8; // post offset
const POST_R = 1.3;
const TRAY_Z = 2.6;
const F0 = -7.5; // pusher front, retracted
const F1 = 13; // pusher front, fully out

const PLATE = { x: -86, y: -92, w: 168, d: 156, r: 8 };
const PLATE_H = 12;
const FOOT_H = 5;
const PED = { x: -34, y: -16, w: 54, d: 32, r: 3 };
const HOUSE = { x: -66, y: -10, w: 32, d: 20, r: 3 };
const HOUSE_H = BASE + 8;
const COL = { x: -12, y: -80, w: 24, d: 18, r: 3 };
const COL_H = ZG + 8;
const TRAY_OUT = { x: 22, y: -13, w: 38, d: 26, r: 4 };
const TRAY_SPILL = { x: -13, y: 18, w: 26, d: 26, r: 4 };
const GAUGE = [-58, 34];
const GAUGE_R = 13;
const GAUGE_Z = 22;
const GAUGE_TOP = GAUGE_Z + 6;
const KNOB = [46, 44];
const KNOB_R = 6.4;
const KNOB_TOP = 5;
const SWEEP_FROM = -0.75 * Math.PI;
const SWEEP = 1.5 * Math.PI;
const KNOB_ANGLES = [-0.9, 0, 0.9];
const CLOCK_Z = COL_H + 3;
const CLOCK_R = 9;

const P = k.fitProjection(
  [
    ...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0),
    [0, 0, ZP + 8],
    [COL.x, COL.y, COL_H + 4],
    [GAUGE[0] - GAUGE_R, GAUGE[1], GAUGE_TOP],
    [KNOB[0] + 10, KNOB[1] + 10, 6],
  ],
  WIDTH,
  HEIGHT,
  { pad: 26, azimuth: 45 },
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const POSTS = [
  [-PIT, -PIT],
  [PIT, -PIT],
  [-PIT, PIT],
  [PIT, PIT],
];

function plate() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  const byDepth = [...k.corners(PLATE, 22)].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
  for (const [x, y] of byDepth) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // label plate with the one engraved word
  const label = { x: -74, y: 44, w: 40, d: 14, r: 1.6 };
  out.push(S(k.slabOf(label, 0, 1, P, 3, 0.3), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(label, 1.6), 1, P, 3), { tone: "faint" }));
  out.push(D([at([label.x + 2.6, label.y + 2.6, 1]), at([label.x + label.w - 2.6, label.y + 2.6, 1]), at([label.x + 2.6, label.y + label.d - 2.6, 1]), at([label.x + label.w - 2.6, label.y + label.d - 2.6, 1])], { size: 0.4 }));
  out.push(L(k.lineOnTop([label.x + 7, label.y + 10.2], [label.x + label.w - 7, label.y + 10.2], 1, P), { tone: "faint" }));
  out.push(k.faceTextSvg(k.topMatrix([label.x + label.w / 2, label.y + 7.4], 1, P, "x"), "BUCKET", { size: 3.4, tone: "mid", anchor: "middle" }));
  return out.join("");
}

// the metering clock: one turn of the pointer is one refill period
function clock() {
  const out = [];
  out.push(`<path class="iso-halo" d="${k.haloOf(k.insetPlan(COL, 2), 0, 1, P)}"/>`);
  out.push(S(k.slabOf(COL, 0, COL_H, P, 5, 0.8), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(COL, 3), COL_H, P, 5), { tone: "faint" }));
  const cx = COL.x + COL.w / 2;
  const cy = COL.y + COL.d / 2;
  out.push(D([at([COL.x + 3, COL.y + 3, COL_H]), at([COL.x + COL.w - 3, COL.y + 3, COL_H]), at([COL.x + 3, COL.y + COL.d - 3, COL_H]), at([COL.x + COL.w - 3, COL.y + COL.d - 3, COL_H])], { size: 0.45 }));
  out.push(S(k.cylinder(cx, cy, CLOCK_R, COL_H, 3, P, 56, 0.6), { tone: "hi", crease: "lo" }));
  out.push(L(k.knurl(cx, cy, CLOCK_R, COL_H + 0.4, CLOCK_H(), 64, P, 0.2), { tone: "lo" }));
  out.push(L(k.ring(cx, cy, CLOCK_R - 1.5, CLOCK_Z, P, 48), { tone: "lo" }));
  const t = k.radialTicks(cx, cy, CLOCK_R - 2, 12, 3, CLOCK_Z, [1.2, 2.6], P);
  out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
  out.push(D([at([cx, cy - CLOCK_R + 0.6, CLOCK_Z])], { size: 0.7, tone: "hi" }));
  return out.join("");
}
function CLOCK_H() {
  return COL_H + 3;
}
const pointerAt = (turn) => {
  const a = turn * Math.PI * 2;
  const cx = COL.x + COL.w / 2;
  const cy = COL.y + COL.d / 2;
  return k.lineOnTop([cx - Math.sin(a) * 2, cy + Math.cos(a) * 2], [cx + Math.sin(a) * (CLOCK_R - 3), cy - Math.cos(a) * (CLOCK_R - 3)], CLOCK_Z + 0.2, P);
};

// gate: a plate under the hopper, an armature on a guide bar, a pushrod
function gateGuide() {
  const out = [];
  const gx = COL.x + COL.w / 2;
  const faceY = COL.y + COL.d;
  out.push(S(k.slabOf({ x: gx - 0.9, y: faceY, w: 1.8, d: 24, r: 0.5 }, ZG + 0.2, 1.8, P, 2), { tone: "mid", crease: "none" }));
  out.push(S(k.slabOf({ x: gx - 2.4, y: faceY, w: 4.8, d: 1.6, r: 0.5 }, ZG - 1, 5.4, P, 2), { tone: "lo", crease: "none" }));
  return out.join("");
}
function gate() {
  const out = [];
  const gx = COL.x + COL.w / 2;
  const faceY = COL.y + COL.d;
  const armature = faceY + 16;
  out.push(S(k.slabOf({ x: gx - 1.6, y: armature + 6, w: 3.2, d: -7.5 - armature - 6, r: 0.6 }, ZG, GATE_H, P, 2), { tone: "mid", crease: "none" }));
  out.push(S(k.slabOf({ x: gx - 3.6, y: armature, w: 7.2, d: 6, r: 1 }, ZG - 1.4, 5.4, P, 3, 0.4), { tone: "mid" }));
  out.push(D([at([gx, armature + 3, ZG + 4])], { size: 0.5 }));
  out.push(S(k.slabOf({ x: -7, y: -7.5, w: 14, d: 15, r: 1.8 }, ZG, GATE_H, P, 4, 0.3), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan({ x: -7, y: -7.5, w: 14, d: 15, r: 1.8 }, 1.4), ZG + GATE_H, P, 4), { tone: "faint" }));
  return out.join("");
}

function pedestal() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PED, 0, BASE, P)}"/>`];
  out.push(S(k.slabOf(PED, 0, BASE, P, 4, 0.8), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PED, 2.6), BASE, P, 4), { tone: "faint" }));
  out.push(L(k.ring(0, 0, 9.4, BASE, P, 32), { tone: "lo" }));
  out.push(L(k.ring(0, 0, 8.2, BASE, P, 32), { tone: "faint" }));
  const ticks = k.topTicks(PED.x + 5, PED.x + PED.w - 3, 4, 5, PED.y + PED.d - 5.6, BASE, [1.4, 2.6], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(D([at([PED.x + 3, PED.y + 3, BASE]), at([PED.x + PED.w - 3, PED.y + 3, BASE]), at([PED.x + 3, PED.y + PED.d - 3, BASE]), at([PED.x + PED.w - 3, PED.y + PED.d - 3, BASE])], { size: 0.45 }));
  return out.join("");
}
function house() {
  const out = [`<path class="iso-halo" d="${k.haloOf(HOUSE, 0, HOUSE_H, P)}"/>`];
  out.push(S(k.slabOf(HOUSE, 0, HOUSE_H, P, 4, 0.8), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(HOUSE, 2.6), HOUSE_H, P, 4), { tone: "faint" }));
  out.push(D([at([HOUSE.x + 3, HOUSE.y + 3, HOUSE_H]), at([HOUSE.x + HOUSE.w - 3, HOUSE.y + 3, HOUSE_H]), at([HOUSE.x + 3, HOUSE.y + HOUSE.d - 3, HOUSE_H]), at([HOUSE.x + HOUSE.w - 3, HOUSE.y + HOUSE.d - 3, HOUSE_H])], { size: 0.45 }));
  return out.join("");
}
const rail = (y) => S(k.slabOf({ x: -34, y, w: 22, d: 2, r: 0.6 }, BASE, 3.6, P, 2, 0.3), { tone: "mid", crease: "faint" });

function slider() {
  const out = [];
  // front face is at x = F0 when retracted; geometry is built there and moved by (F - F0)
  out.push(S(k.slabOf({ x: F0 - 26.5, y: -2, w: 8.5, d: 4, r: 0.8 }, BASE, 1.8, P, 2), { tone: "lit", crease: "none", lit: true }));
  out.push(S(k.slabOf({ x: F0 - 18, y: -6.5, w: 18, d: 13, r: 1.4 }, BASE, 2.4, P, 3, 0.3), { tone: "hi", lit: true }));
  out.push(L(k.lineOnTop([F0 - 3, -4.6], [F0 - 3, 4.6], BASE + 2.4, P), { tone: "lo" }));
  out.push(D([at([F0 - 14, 0, BASE + 2.4]), at([F0 - 8.5, 0, BASE + 2.4])], { size: 0.4 }));
  return out.join("");
}
function button() {
  const [bx, by] = [-49, 0];
  const out = [];
  out.push(S(k.cylinder(bx, by, 7.6, HOUSE_H, 1.2, P, 32), { tone: "lo" }));
  out.push(D([at([bx - 6, by, HOUSE_H + 1.2]), at([bx + 6, by, HOUSE_H + 1.2])], { size: 0.4 }));
  return out.join("");
}
function buttonCap() {
  const [bx, by] = [-49, 0];
  const top = HOUSE_H + 1.2;
  const out = [];
  out.push(S(k.cylinder(bx, by, 5.6, top, 4.6, P, 32, 0.5), { tone: "mid" }));
  out.push(L(k.knurl(bx, by, 5.6, top, top + 4.6, 30, P), { tone: "lo" }));
  out.push(L(k.ring(bx, by, 3.4, top + 4.6, P, 24), { tone: "faint" }));
  return out.join("");
}
function flagPlate() {
  const plan = { x: -64.2, y: -8.6, w: 4.6, d: 17.2, r: 0.8 };
  const out = [];
  out.push(S(k.slabOf(plan, HOUSE_H - 8, 8, P, 2, 0.3), { tone: "mid", crease: "faint" }));
  out.push(L(k.lineOnTop([plan.x + 2.3, -6], [plan.x + 2.3, 6], HOUSE_H, P), { tone: "lo" }));
  return out.join("");
}
function flagSlot() {
  return L(k.planOutline({ x: -64.2, y: -8.6, w: 4.6, d: 17.2, r: 0.8 }, HOUSE_H, P, 2), { tone: "faint" });
}

function tray(plan, label) {
  const out = [`<path class="iso-halo" d="${k.haloOf(plan, 0, TRAY_Z, P)}"/>`];
  out.push(S(k.slabOf(plan, 0, TRAY_Z, P, 4, 0.5), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(plan, 2.2), TRAY_Z, P, 4), { tone: "faint" }));
  out.push(L(k.planOutline(k.insetPlan(plan, 4), TRAY_Z, P, 4), { tone: "faint" }));
  out.push(D(k.corners(plan, 2.6).map(([x, y]) => at([x, y, TRAY_Z])), { size: 0.4 }));
  return out.join("");
}

function post(x, y) {
  const out = [];
  out.push(S(k.cylinder(x, y, 2.5, BASE, 1.2, P, 16), { tone: "lo" }));
  out.push(S(k.cylinder(x, y, POST_R, BASE + 1.2, ZP + FRAME_H - BASE - 1.2, P, 14), { tone: "mid", crease: "none" }));
  const marks = [];
  for (let j = 1; j < CAP; j++) marks.push(k.sideArc(x, y, POST_R, BASE + j * CH, P, 8));
  for (let j = 1; j <= HOP_N; j++) marks.push(k.sideArc(x, y, POST_R, HOP0 + j * CH, P, 8));
  out.push(L(marks.join(""), { tone: "lo" }));
  // the weir: a collar at the level of a full stack
  out.push(S(k.cylinder(x, y, 2.3, WEIR - 0.6, 1.4, P, 16), { tone: "mid" }));
  out.push(S(k.cylinder(x, y, 2.3, ZG - 1, 1.2, P, 16), { tone: "lo" }));
  return out.join("");
}
const frameBar = (plan) => S(k.slabOf(plan, ZP, FRAME_H, P, 2, 0.3), { tone: "mid" });
const BAR = {
  farX: { x: -10.1, y: -10.1, w: 20.2, d: 2.6, r: 0.6 },
  farY: { x: -10.1, y: -7.5, w: 2.6, d: 15, r: 0.6 },
  nearX: { x: -10.1, y: 7.5, w: 20.2, d: 2.6, r: 0.6 },
  nearY: { x: 7.5, y: -7.5, w: 2.6, d: 15, r: 0.6 },
};

function gauge() {
  const [x, y] = GAUGE;
  const out = [`<path class="iso-halo" d="${k.haloOf({ x: x - 10, y: y - 10, w: 20, d: 20, r: 8 }, 0, 2, P)}"/>`];
  out.push(S(k.cylinder(x, y, 7, 0, 2.6, P, 32), { tone: "lo" }));
  out.push(D([at([x - 5.2, y, 2.6]), at([x + 5.2, y, 2.6])], { size: 0.4 }));
  out.push(S(k.cylinder(x, y, 3.2, 2.6, GAUGE_Z - 2.6, P, 20), { tone: "mid", crease: "none" }));
  out.push(L(k.sideArc(x, y, 3.2, 10, P, 12), { tone: "lo" }));
  out.push(S(k.cylinder(x, y, 5.2, GAUGE_Z - 3, 3, P, 20), { tone: "mid" }));
  out.push(S(k.cylinder(x, y, GAUGE_R, GAUGE_Z, 6, P, 64, 0.8), { tone: "hi", crease: "lo" }));
  out.push(L(k.knurl(x, y, GAUGE_R, GAUGE_TOP - 2.6, GAUGE_TOP, 76, P, 0.3), { tone: "lo" }));
  out.push(L(k.sideArc(x, y, GAUGE_R, GAUGE_TOP - 2.6, P, 36), { tone: "faint" }));
  out.push(L(k.ring(x, y, GAUGE_R - 2, GAUGE_TOP, P, 56), { tone: "lo" }));
  const t = k.radialTicks(x, y, GAUGE_R - 2.6, CAP * 2, 2, GAUGE_TOP, [1.2, 2.6], P, SWEEP_FROM, SWEEP);
  out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
  out.push(L(k.ring(x, y, 1.5, GAUGE_TOP, P, 16), { tone: "mid" }));
  return out.join("");
}
const needleAt = (frac) => {
  const a = SWEEP_FROM + frac * SWEEP;
  const [x, y] = GAUGE;
  return k.lineOnTop([x - Math.sin(a) * 3, y + Math.cos(a) * 3], [x + Math.sin(a) * (GAUGE_R - 3.6), y - Math.cos(a) * (GAUGE_R - 3.6)], GAUGE_TOP + 0.2, P);
};

function knobBase() {
  const [x, y] = KNOB;
  const plan = { x: x - 15, y: y - 15, w: 30, d: 30, r: 5 };
  const out = [`<path class="iso-halo" d="${k.haloOf(plan, 0, 1.6, P)}"/>`];
  out.push(S(k.slabOf(plan, 0, 1.6, P, 4, 0.4), { tone: "lo", crease: "none" }));
  out.push(D(k.corners(plan, 2.6).map(([cx, cy]) => at([cx, cy, 1.6])), { size: 0.4 }));
  // detent marks for the three rates
  const marks = KNOB_ANGLES.map((angle) => k.lineOnTop([x + Math.sin(angle) * 9.4, y - Math.cos(angle) * 9.4], [x + Math.sin(angle) * 12, y - Math.cos(angle) * 12], 1.6, P));
  out.push(L(marks.join(""), { tone: "mid" }));
  out.push(D(KNOB_ANGLES.map((angle) => at([x + Math.sin(angle) * 13.4, y - Math.cos(angle) * 13.4, 1.6])), { size: 0.5, tone: "hi" }));
  out.push(L(k.ring(x, y, 8.4, 1.6, P, 32), { tone: "faint" }));
  return out.join("");
}
function knobHead() {
  const [x, y] = KNOB;
  const out = [];
  out.push(S(k.cylinder(x, y, KNOB_R, 1.6, KNOB_TOP, P, 32, 0.5), { tone: "hi", crease: "lo" }));
  out.push(L(k.knurl(x, y, KNOB_R, 1.6, 1.6 + KNOB_TOP, 30, P), { tone: "lo" }));
  out.push(L(k.ring(x, y, KNOB_R - 1.5, 1.6 + KNOB_TOP, P, 24), { tone: "faint" }));
  return out.join("");
}
const knobPointer = (angle) => {
  const [x, y] = KNOB;
  return k.lineOnTop([x, y], [x + Math.sin(angle) * (KNOB_R - 0.6), y - Math.cos(angle) * (KNOB_R - 0.6)], 1.6 + KNOB_TOP + 0.1, P);
};

const COIN = [
  S(k.cylinder(0, 0, COIN_R, 0, COIN_H, P, 32, 0.3), { tone: "hi", crease: "lo" }),
  L(k.knurl(0, 0, COIN_R, 0, COIN_H, 44, P, 0.4), { tone: "lo" }),
  L(k.ring(0, 0, COIN_R - 1.5, COIN_H, P, 28), { tone: "faint" }),
  D([at([0, 0, COIN_H])], { size: 0.45, tone: "mid" }),
].join("");

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "A token bucket as a coin tube. A hopper above the tube holds spare coins behind a gate; a metering clock opens the gate once per refill period and one coin drops into the tube, which holds at most six. A pusher takes the bottom coin out for every request that arrives. When the tube is empty the pusher strokes through nothing and a flag rises: the request is rejected. When the tube is full the new coin hits the weir and spills into a tray: the token is lost.",
  body: [
    plate(),
    clock(),
    `<path data-part="clock-hand" class="iso-line" data-tone="hi" data-free="start" d="${pointerAt(0)}" style="stroke-width:1"/>`,
    gateGuide(),
    `<g data-part="gate">${gate()}</g>`,
    pedestal(),
    house(),
    flagSlot(),
    `<g data-part="flag">${flagPlate()}</g>`,
    button(),
    `<g data-part="button">${buttonCap()}</g>`,
    rail(-9.6),
    `<g data-part="slider">${slider()}</g>`,
    rail(7.6),
    tray(TRAY_OUT),
    tray(TRAY_SPILL),
    post(...POSTS[0]),
    post(...POSTS[1]),
    post(...POSTS[2]),
    frameBar(BAR.farX),
    frameBar(BAR.farY),
    `<g data-layer="coins"></g>`,
    post(...POSTS[3]),
    frameBar(BAR.nearX),
    frameBar(BAR.nearY),
    D([[-PIT, -PIT], [PIT, -PIT], [-PIT, PIT], [PIT, PIT]].map(([x, y]) => at([x, y, ZP + FRAME_H])), { size: 0.5 }),
    gauge(),
    `<path data-part="needle" class="iso-line" data-tone="lit" data-free="start" d="${needleAt(1)}" style="stroke-width:1.1"/>`,
    knobBase(),
    `<g data-part="knob">${knobHead()}<path data-part="knob-pointer" class="iso-line" data-tone="hi" data-free="start" d="${knobPointer(KNOB_ANGLES[1])}" style="stroke-width:1"/></g>`,
  ],
});

const live = `
const P = ${JSON.stringify(P)};
const COIN = ${JSON.stringify(COIN)};
const CAP = ${CAP}, RATES = ${JSON.stringify(RATES)}, BASE = ${BASE}, CH = ${CH}, R = ${COIN_R}, HOP0 = ${HOP0}, HOP_N = ${HOP_N};
const F0 = ${F0}, F1 = ${F1}, TRAY_Z = ${TRAY_Z}, GATE_OPEN = ${(16).toFixed(0)};
const SWEEP_FROM = ${SWEEP_FROM}, SWEEP = ${SWEEP}, KNOB_ANGLES = ${JSON.stringify(KNOB_ANGLES)};
const GAUGE = ${JSON.stringify(GAUGE)}, GAUGE_R = ${GAUGE_R}, GAUGE_TOP = ${GAUGE_TOP}, KNOB = ${JSON.stringify(KNOB)}, KNOB_R = ${KNOB_R}, KNOB_TOP = ${KNOB_TOP};
const CLOCK = ${JSON.stringify([COL.x + COL.w / 2, COL.y + COL.d / 2])}, CLOCK_R = ${CLOCK_R}, CLOCK_Z = ${CLOCK_Z};
const G = 1400;
const NS = "http://www.w3.org/2000/svg";
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const q = (name) => svg.querySelector('[data-part="' + name + '"]');
const parts = { gate: q("gate"), slider: q("slider"), button: q("button"), flag: q("flag"), needle: q("needle"), hand: q("clock-hand"), knob: q("knob"), pointer: q("knob-pointer") };
const layer = svg.querySelector('[data-layer="coins"]');
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

const pool = [];
for (let i = 0; i < 20; i++) {
  const el = document.createElementNS(NS, "g");
  el.innerHTML = COIN;
  el.style.display = "none";
  layer.appendChild(el);
  pool.push({ el, free: true, shown: false });
}
const take = (x, y, z) => {
  const c = pool.find((p) => p.free);
  if (!c) return null;
  Object.assign(c, { free: false, x, y, z, vx: 0, vy: 0, vz: 0, mode: "rest", tz: z, a: 1 });
  c.el.style.display = "";
  return c;
};
const drop = (c) => { c.free = true; c.el.style.display = "none"; };

const stack = [], hop = [];
for (let i = 0; i < CAP; i++) { const c = take(0, 0, BASE + i * CH); stack.push(c); }
for (let j = 0; j < HOP_N; j++) { const c = take(0, 0, HOP0 + j * CH); hop.push(c); }
const retarget = () => {
  stack.forEach((c, i) => (c.tz = BASE + i * CH));
  hop.forEach((c, j) => (c.tz = HOP0 + j * CH));
};

const st = { phase: 0, rate: 1, rateShown: 0, allowed: 0, rejected: 0, queue: 0, spilled: 0, gauge: CAP };
const pusher = { state: "idle", F: F0, coin: null };
const gate = { state: "idle", g: 0, shift: false };
let flagLift = 0, flagHold = 0, buttonPress = 0;

function startStroke() {
  pusher.state = "out";
  if (stack.length > 0) { st.allowed++; pusher.coin = stack[0]; pusher.coin.mode = "push"; pusher.coin.out = false; }
  else { st.rejected++; pusher.coin = null; flagHold = 0.9; }
}
function stepPusher(dt) {
  if (pusher.state === "idle" && st.queue > 0) { st.queue--; startStroke(); }
  if (pusher.state === "out") {
    pusher.F = Math.min(F1, pusher.F + 170 * dt);
    const c = pusher.coin;
    if (c) {
      c.x = pusher.F + R;
      if (!c.out && pusher.F > 1) { c.out = true; stack.shift(); retarget(); }
      if (pusher.F >= F1) { c.mode = "air"; c.vx = 60; c.vz = 0; c.landing = TRAY_Z; pusher.coin = null; }
    }
    if (pusher.F >= F1) pusher.state = "back";
  } else if (pusher.state === "back") {
    pusher.F = Math.max(F0, pusher.F - 130 * dt);
    if (pusher.F <= F0) pusher.state = "idle";
  }
}
function stepGate(dt) {
  if (gate.state === "open") {
    gate.g = Math.min(GATE_OPEN, gate.g + 230 * dt);
    if (gate.g >= GATE_OPEN) {
      const c = hop.shift();
      if (c) { c.mode = "fall"; c.vz = 0; }
      gate.state = "close";
    }
  } else if (gate.state === "close") {
    gate.g = Math.max(0, gate.g - 200 * dt);
    if (gate.g <= 0) {
      gate.state = "idle";
      retarget();
      while (hop.length < HOP_N) {
        const c = take(0, 0, HOP0 + hop.length * CH + CH);
        c.tz = HOP0 + hop.length * CH; c.a = 0; c.fadeIn = true;
        hop.push(c);
      }
    }
  }
}
function stepClock(dt) {
  st.phase += st.rate * dt;
  if (st.phase >= 1) {
    st.phase -= 1;
    if (gate.state === "idle") gate.state = "open";
  }
}
function stepCoin(c, dt) {
  if (c.free) return;
  if (c.fadeIn) { c.a = Math.min(1, c.a + dt / 0.25); if (c.a >= 1) c.fadeIn = false; }
  if (c.mode === "rest") {
    if (c.z > c.tz) { c.vz -= G * dt; c.z = Math.max(c.tz, c.z + c.vz * dt); if (c.z === c.tz) c.vz = 0; }
    else if (c.tz > c.z) { c.z = c.tz; }
  } else if (c.mode === "fall") {
    c.vz -= G * dt; c.z += c.vz * dt;
    const floor = stack.length < CAP ? BASE + stack.length * CH : BASE + CAP * CH;
    if (c.z <= floor) {
      c.z = floor;
      if (stack.length < CAP) { c.mode = "rest"; c.vz = 0; stack.push(c); retarget(); }
      else { c.mode = "spill"; c.vy = 0; c.vz = 0; st.spilled++; }
    }
  } else if (c.mode === "spill") {
    c.vy += 420 * dt; c.y += c.vy * dt;
    if (c.y > R + 1) { c.mode = "air"; c.vx = 0; c.landing = TRAY_Z; }
  } else if (c.mode === "air") {
    c.vz -= G * dt; c.z += c.vz * dt; c.x += c.vx * dt; c.y += c.vy * dt;
    if (c.z <= c.landing) { c.z = c.landing; c.mode = "fade"; c.t = 0; }
  } else if (c.mode === "fade") {
    c.t += dt; c.a = Math.max(0, 1 - c.t / 0.8);
    if (c.a <= 0) drop(c);
  }
}

function step(dt) {
  stepClock(dt);
  stepGate(dt);
  stepPusher(dt);
  [...stack, ...hop, ...pool.filter((c) => !c.free && !stack.includes(c) && !hop.includes(c))].forEach((c) => stepCoin(c, dt));
  flagHold = Math.max(0, flagHold - dt);
  flagLift += ((flagHold > 0 ? 9 : 0) - flagLift) * (1 - Math.exp(-dt / 0.07));
  buttonPress += (((pusher.F - F0) / (F1 - F0) > 0.04 && pusher.state !== "idle" ? 2.6 : 0) - buttonPress) * (1 - Math.exp(-dt / 0.04));
  st.gauge += (stack.length - st.gauge) * (1 - Math.exp(-dt / 0.1));
  const want = RATES.indexOf(st.rate);
  st.rateShown += (KNOB_ANGLES[want] - st.rateShown) * (1 - Math.exp(-dt / 0.12));
}

const key = (c) => depthOf([c.x, c.y, c.z], P);
let order = "";
function draw() {
  parts.gate.setAttribute("transform", translateAlong(P, [0, -gate.g, 0]));
  parts.slider.setAttribute("transform", translateAlong(P, [pusher.F - F0, 0, 0]));
  parts.button.setAttribute("transform", translateAlong(P, [0, 0, -buttonPress]));
  parts.flag.setAttribute("transform", translateAlong(P, [0, 0, flagLift]));
  const turn = clamp(st.gauge / CAP, 0, 1);
  const a = SWEEP_FROM + turn * SWEEP;
  parts.needle.setAttribute("d", lineOnTop([GAUGE[0] - Math.sin(a) * 3, GAUGE[1] + Math.cos(a) * 3], [GAUGE[0] + Math.sin(a) * (GAUGE_R - 3.6), GAUGE[1] - Math.cos(a) * (GAUGE_R - 3.6)], GAUGE_TOP + 0.2, P));
  const h = st.phase * Math.PI * 2;
  parts.hand.setAttribute("d", lineOnTop([CLOCK[0] - Math.sin(h) * 2, CLOCK[1] + Math.cos(h) * 2], [CLOCK[0] + Math.sin(h) * (CLOCK_R - 3), CLOCK[1] - Math.cos(h) * (CLOCK_R - 3)], CLOCK_Z + 0.2, P));
  const ka = st.rateShown;
  parts.pointer.setAttribute("d", lineOnTop(KNOB, [KNOB[0] + Math.sin(ka) * (KNOB_R - 0.6), KNOB[1] - Math.cos(ka) * (KNOB_R - 0.6)], 1.6 + KNOB_TOP + 0.1, P));
  const live = pool.filter((c) => !c.free).sort((m, n) => key(m) - key(n));
  live.forEach((c) => {
    c.el.setAttribute("transform", translateAlong(P, [c.x, c.y, c.z]));
    const o = c.a < 1 ? c.a.toFixed(2) : "1";
    if (c.shown !== o) { c.el.style.opacity = o; c.shown = o; }
  });
  const sig = live.map((c) => pool.indexOf(c)).join();
  if (sig !== order) { order = sig; live.forEach((c) => layer.appendChild(c.el)); }
  const text = "tokens " + stack.length + "/" + CAP + " · " + st.rate + "/s · allowed " + st.allowed + " · rejected " + st.rejected;
  if (readout.textContent !== text) readout.textContent = text;
  stage.setAttribute("aria-valuenow", String(stack.length));
  stage.setAttribute("aria-valuetext", text);
}

// idle tour: a burst bigger than the bucket, a steady trickle, then quiet until it spills
const TOUR = [];
for (let i = 0; i < 12; i++) TOUR.push(0.6 + i * 0.34);
for (let i = 0; i < 5; i++) TOUR.push(6.2 + i * 1.3);
const TOUR_LEN = 23;
let touring = !window.__SIM, clock = 0, tourIndex = 0, idleTimer = 0;
let frame = 0, last = 0, visible = false;
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  if (touring) {
    clock += dt;
    if (clock >= TOUR_LEN) { clock -= TOUR_LEN; tourIndex = 0; }
    while (tourIndex < TOUR.length && TOUR[tourIndex] <= clock) { tourIndex++; st.queue = Math.min(st.queue + 1, 8); }
  }
  const sub = 4;
  for (let i = 0; i < sub; i++) step(dt / sub);
  draw();
  frame = visible ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const pause = () => { touring = false; clearTimeout(idleTimer); idleTimer = setTimeout(() => { touring = !still.matches && !window.__SIM; clock = 0; tourIndex = 0; }, 6000); };
const request = () => { pause(); st.queue = Math.min(st.queue + 1, 8); run(); };
const setRate = (index) => { pause(); st.rate = RATES[clamp(index, 0, RATES.length - 1)]; run(); };
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
if (still.matches) touring = false;
stage.addEventListener("pointerdown", (event) => {
  const onKnob = event.target.closest && event.target.closest('[data-part="knob"]');
  if (onKnob) setRate((RATES.indexOf(st.rate) + 1) % RATES.length);
  else request();
});
stage.addEventListener("keydown", (event) => {
  const i = RATES.indexOf(st.rate);
  if (event.key === " " || event.key === "Enter") { event.preventDefault(); request(); }
  else if (event.key === "ArrowUp" || event.key === "ArrowRight") { event.preventDefault(); setRate(i + 1); }
  else if (event.key === "ArrowDown" || event.key === "ArrowLeft") { event.preventDefault(); setRate(i - 1); }
});
draw();
`;

const body = k.plateHtml({
  fig: "Fig 1",
  title: "Token bucket",
  hint: "Click: request · knob: refill rate",
  readout: `tokens ${CAP}/${CAP} · 1/s · allowed 0 · rejected 0`,
  keys: [
    { mark: "lit", label: "Pusher and gauge needle: a request taking a token, and the count" },
    { mark: "raised", label: "Coins: one token each, at most six in the tube" },
  ],
  caption:
    "A token bucket as a coin tube. A clock opens the gate once per refill period and a coin drops in; a full tube spills the extra over the weir. Every request pushes the bottom coin out, and if the tube is empty the pusher strokes through nothing and the flag rises. Short bursts pass until the tube runs dry, then requests get through only as fast as the refill: the average rate is capped and the burst is bounded by the tube.",
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Token bucket: Space or click sends a request, arrow keys change the refill rate" aria-valuemin="0" aria-valuemax="${CAP}" aria-valuenow="${CAP}">${svg}</div>`,
});

const name = theme === "light" ? "token-bucket-light.html" : "token-bucket.html";
writeFileSync(join(HERE, name), k.pageHtml({ title: "Token bucket", theme, body, script: kitScript() + live }));
console.log("wrote", name);
