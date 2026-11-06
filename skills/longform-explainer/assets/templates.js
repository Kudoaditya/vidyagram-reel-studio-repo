/* Long-form scene templates. Each builds DOM into #stage from D (scene JSON) and animates on `tl` (GSAP, paused).
   Text must be Hinglish in LATIN script (never Devanagari). Content stays inside the 1340x888 stage. */
const $stage = document.getElementById("stage");
const H = (html) => { const d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstChild; };
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;");
const DUR = D.dur;
// times to spread n items between a and b
const spread = (n, a = 0.7, b = DUR - 0.9) => Array.from({ length: n }, (_, i) => (n === 1 ? a : a + ((b - a) * i) / n));
const head = (kick, title, sub) =>
  `${kick ? `<div class="kick" id="kick">${esc(kick)}</div>` : ""}${title ? `<div class="h serif" id="ttl">${esc(title)}</div>` : ""}${sub ? `<div class="sub" id="sub">${esc(sub)}</div>` : ""}`;
const headIn = (tl) => {
  if (document.getElementById("kick")) tl.from("#kick", { opacity: 0, x: -20, duration: 0.5, ease: "power3.out" }, 0.1);
  if (document.getElementById("ttl")) tl.from("#ttl", { opacity: 0, y: 28, duration: 0.7, ease: "power3.out" }, 0.2);
  if (document.getElementById("sub")) tl.from("#sub", { opacity: 0, y: 18, duration: 0.6, ease: "power3.out" }, 0.45);
};
const fmt = (v, d) => (d.dec ? Number(v).toFixed(d.dec) : Math.round(v)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, d.comma === false ? "" : ",");

const ACC = D.accent || "#E8C48A";
const RGBA = (a) => { const n = parseInt(ACC.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const ACCD = (() => { const n = parseInt(ACC.slice(1), 16); const h = (v) => Math.round(v * 0.62).toString(16).padStart(2, "0"); return `#${h(n >> 16)}${h((n >> 8) & 255)}${h(n & 255)}`; })(); // darker start of accent gradients
const T = {};

/* title: {kick,lines:["Prompting ka","zamana gaya"],sub} */
T.title = (d, tl) => {
  $stage.append(H(`<div class="col" style="height:100%;justify-content:center">
    ${d.kick ? `<div class="kick" id="kick">${esc(d.kick)}</div>` : ""}
    <div class="serif" style="font-size:118px;line-height:1.04;margin-top:30px">${(d.lines || [d.text]).map((l, i) => `<div class="ov"><span class="ln">${esc(l)}</span></div>`).join("")}</div>
    ${d.sub ? `<div class="sub" id="sub" style="font-size:34px;margin-top:34px">${esc(d.sub)}</div>` : ""}
    <div id="rule" style="height:3px;width:160px;background:var(--acc);margin-top:44px;transform-origin:left"></div></div>`));
  tl.from("#kick", { opacity: 0, x: -20, duration: 0.5 }, 0.1)
    .from(".ln", { yPercent: 110, duration: 0.9, ease: "expo.out", stagger: 0.14 }, 0.2)
    .from("#rule", { scaleX: 0, duration: 0.8, ease: "power3.out" }, 0.9)
    .from("#sub", { opacity: 0, y: 16, duration: 0.6 }, 1.0);
};

/* quote: {text,by,role,hl:["brilliant"]} */
T.quote = (d, tl) => {
  const words = esc(d.text).split(" ").map((w) => {
    const hit = (d.hl || []).some((h) => w.toLowerCase().includes(h.toLowerCase()));
    return `<span class="w" style="display:inline-block;margin-right:.28em;${hit ? "color:var(--acc)" : ""}">${w}</span>`;
  }).join("");
  $stage.append(H(`<div class="col" style="height:100%;justify-content:center">
    <div class="serif acc" style="font-size:190px;line-height:.6;height:90px" id="qm">“</div>
    <div class="serif" style="font-size:68px;line-height:1.2;max-width:1260px;margin-top:20px">${words}</div>
    <div style="margin-top:44px;font-size:26px;color:var(--mut)" id="by">${esc(d.by || "")}${d.role ? ` <span style="color:var(--dim)">· ${esc(d.role)}</span>` : ""}</div></div>`));
  tl.from("#qm", { opacity: 0, scale: 0.6, duration: 0.6, ease: "back.out(2)" }, 0.1)
    .from(".w", { opacity: 0, y: 22, duration: 0.5, stagger: Math.min(0.12, (DUR - 2.4) / Math.max(1, d.text.split(" ").length)), ease: "power3.out" }, 0.4)
    .from("#by", { opacity: 0, y: 12, duration: 0.6 }, DUR - 1.6);
};

/* stat: {kick,label,value:50000,prefix:"$",suffix:"",dec:0,caption} */
T.stat = (d, tl) => {
  $stage.append(H(`<div class="col" style="height:100%;justify-content:center">${head(d.kick, d.label)}
    <div class="serif" id="num" style="font-size:250px;line-height:1;margin-top:30px;color:var(--acc)">${esc(d.prefix || "")}<span id="nv">0</span>${esc(d.suffix || "")}</div>
    <div id="bar" style="height:3px;width:100%;background:linear-gradient(90deg,var(--acc),transparent);margin-top:20px;transform-origin:left"></div>
    ${d.caption ? `<div class="sub" id="cap">${esc(d.caption)}</div>` : ""}</div>`));
  headIn(tl);
  const o = { v: 0 };
  tl.from("#num", { opacity: 0, y: 30, duration: 0.6 }, 0.5)
    .to(o, { v: d.value, duration: Math.min(2.2, DUR - 1.5), ease: "power3.out", onUpdate: () => (document.getElementById("nv").textContent = fmt(o.v, d)) }, 0.6)
    .from("#bar", { scaleX: 0, duration: 1.2, ease: "power3.out" }, 0.8)
    .from("#cap", { opacity: 0, y: 14, duration: 0.6 }, 1.6);
};

/* steps: {kick,title,items:[{k:"S",t:"Specific",d:"clear goal"}], active:true} */
T.steps = (d, tl) => {
  const n = d.items.length, w = Math.floor((1340 - (n - 1) * 24) / n);
  $stage.append(H(`<div>${head(d.kick, d.title, d.sub)}</div>`));
  $stage.append(H(`<div class="row" style="position:absolute;left:0;right:0;top:330px;gap:24px">${d.items.map((it, i) => `
    <div class="card st" id="st${i}" style="width:${w}px;height:420px;padding:34px 28px;position:relative">
      <div class="mono" style="color:var(--dim);font-size:22px">${String(i + 1).padStart(2, "0")}</div>
      <div class="serif" style="font-size:${n >= 5 ? 40 : n === 4 ? 48 : 56}px;margin-top:70px;line-height:1.1">${esc(it.t)}</div>
      ${it.d ? `<div style="font-size:24px;color:var(--mut);margin-top:18px;line-height:1.4">${esc(it.d)}</div>` : ""}
      <div class="ul" style="position:absolute;left:28px;bottom:30px;height:3px;width:60px;background:var(--acc);opacity:0"></div></div>`).join("")}</div>`));
  headIn(tl);
  const t = d.times || spread(n, 0.9);
  d.items.forEach((_, i) => {
    tl.from(`#st${i}`, { opacity: 0, y: 50, duration: 0.7, ease: "power3.out" }, t[i]);
    if (d.active !== false) {
      tl.to(`#st${i}`, { borderColor: RGBA(.7), y: -10, duration: 0.4 }, t[i] + 0.5)
        .to(`#st${i} .ul`, { opacity: 1, width: 140, duration: 0.5 }, t[i] + 0.5);
      if (i < n - 1) tl.to(`#st${i}`, { borderColor: "rgba(255,255,255,.10)", y: 0, duration: 0.4 }, t[i + 1] - 0.1);
    }
  });
};

/* compare: {kick,title,left:{h,items[]},right:{h,items[]},verdict} */
T.compare = (d, tl) => {
  const side = (s, id, hot) => `<div class="card" id="${id}" style="flex:1;padding:40px 44px;${hot ? `border-color:${RGBA(.55)}` : ""}">
    <div class="serif" style="font-size:44px;color:${hot ? "var(--acc)" : "var(--txt)"}">${esc(s.h)}</div>
    <div style="margin-top:28px">${s.items.map((x) => `<div class="it" style="font-size:28px;line-height:1.35;color:${hot ? "var(--txt)" : "var(--mut)"};padding:14px 0;border-top:1px solid var(--line)">${esc(x)}</div>`).join("")}</div></div>`;
  $stage.append(H(`<div>${head(d.kick, d.title)}</div>`));
  $stage.append(H(`<div class="row" style="position:absolute;left:0;right:0;top:210px;gap:28px">${side(d.left, "cl", false)}${side(d.right, "cr", true)}</div>`));
  if (d.verdict) $stage.append(H(`<div id="vd" class="serif acc" style="position:absolute;left:0;bottom:20px;font-size:40px">${esc(d.verdict)}</div>`));
  headIn(tl);
  tl.from("#cl", { opacity: 0, x: -50, duration: 0.8, ease: "power3.out" }, 0.8)
    .from("#cr", { opacity: 0, x: 50, duration: 0.8, ease: "power3.out" }, 1.3)
    .from("#cl .it", { opacity: 0, y: 14, duration: 0.4, stagger: 0.25 }, 1.2)
    .from("#cr .it", { opacity: 0, y: 14, duration: 0.4, stagger: 0.25 }, 1.8)
    .from("#vd", { opacity: 0, y: 16, duration: 0.6 }, DUR - 1.4);
};

/* bars: {kick,title,items:[{l,v}],unit:"%",hot:index|"max"} */
T.bars = (d, tl) => {
  const max = Math.max(...d.items.map((x) => x.v)), hot = d.hot === undefined || d.hot === "max" ? d.items.findIndex((x) => x.v === max) : d.hot;
  $stage.append(H(`<div>${head(d.kick, d.title, d.sub)}</div>`));
  $stage.append(H(`<div style="position:absolute;left:0;right:0;top:300px">${d.items.map((x, i) => `
    <div class="row" style="align-items:center;margin-bottom:26px;gap:24px" id="br${i}">
      <div style="width:260px;font-size:28px;color:${i === hot ? "var(--txt)" : "var(--mut)"}">${esc(x.l)}</div>
      <div style="flex:1;height:46px;background:rgba(255,255,255,.04);border-radius:10px;overflow:hidden"><div class="fill" style="height:100%;width:${(x.v / max) * 100}%;border-radius:10px;background:${i === hot ? `linear-gradient(90deg,${ACCD},var(--acc))` : "rgba(255,255,255,.28)"};transform-origin:left"></div></div>
      <div class="mono" style="width:150px;font-size:28px;color:${i === hot ? "var(--acc)" : "var(--mut)"}">${esc(d.prefix || "")}${x.v}${esc(d.unit || "")}</div></div>`).join("")}</div>`));
  headIn(tl);
  const t = spread(d.items.length, 0.9, DUR - 1.8);
  d.items.forEach((_, i) => tl.from(`#br${i}`, { opacity: 0, x: -30, duration: 0.5 }, t[i]).from(`#br${i} .fill`, { scaleX: 0, duration: 1.0, ease: "power3.out" }, t[i] + 0.1));
};

/* line: {kick,title,points:[..numbers],labels:[x labels],endLabel:"$600K"} */
T.line = (d, tl) => {
  const W = 1340, Hh = 480, p = d.points, mx = Math.max(...p) * 1.1, mn = Math.min(0, ...p);
  const X = (i) => 40 + (i / (p.length - 1)) * (W - 200), Y = (v) => Hh - 40 - ((v - mn) / (mx - mn)) * (Hh - 80);
  const path = p.map((v, i) => `${i ? "L" : "M"}${X(i)},${Y(v)}`).join(" ");
  $stage.append(H(`<div>${head(d.kick, d.title, d.sub)}</div>`));
  $stage.append(H(`<svg id="lc" width="${W}" height="${Hh}" style="position:absolute;left:0;top:340px">
    <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${ACC}" stop-opacity=".28"/><stop offset="1" stop-color="${ACC}" stop-opacity="0"/></linearGradient></defs>
    ${[0, 1, 2, 3].map((k) => `<line x1="40" x2="${W - 160}" y1="${40 + k * ((Hh - 80) / 3)}" y2="${40 + k * ((Hh - 80) / 3)}" stroke="rgba(255,255,255,.07)"/>`).join("")}
    <path id="area" d="${path} L${X(p.length - 1)},${Hh - 40} L${X(0)},${Hh - 40} Z" fill="url(#ag)"/>
    <path id="ln" d="${path}" fill="none" stroke="${ACC}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    ${p.map((v, i) => `<circle class="dt" cx="${X(i)}" cy="${Y(v)}" r="7" fill="#0b0b0c" stroke="${ACC}" stroke-width="3"/>`).join("")}
    ${(d.labels || []).map((l, i) => `<text x="${X(i)}" y="${Hh - 8}" fill="#8b8b92" font-size="20" text-anchor="middle">${esc(l)}</text>`).join("")}
    </svg>`));
  if (d.endLabel) $stage.append(H(`<div id="end" class="serif acc" style="position:absolute;left:${X(p.length - 1) + 24}px;top:${340 + Y(p[p.length - 1]) - 34}px;font-size:56px">${esc(d.endLabel)}</div>`));
  headIn(tl);
  const len = document.getElementById("ln").getTotalLength();
  gsap.set("#ln", { strokeDasharray: len, strokeDashoffset: len });
  tl.to("#ln", { strokeDashoffset: 0, duration: Math.min(3, DUR - 2), ease: "power2.inOut" }, 0.9)
    .from("#area", { opacity: 0, duration: 1.2 }, 1.6)
    .from(".dt", { scale: 0, transformOrigin: "50% 50%", duration: 0.35, stagger: Math.min(3, DUR - 2) / p.length, ease: "back.out(3)" }, 1.0)
    .from("#end", { opacity: 0, x: -20, duration: 0.6 }, DUR - 1.6);
};

/* flow: {kick,title,nodes:[{t,s}],loop:true} */
T.flow = (d, tl) => {
  const n = d.nodes.length, gap = 70, w = Math.floor((1340 - gap * (n - 1)) / n);
  $stage.append(H(`<div>${head(d.kick, d.title, d.sub)}</div>`));
  $stage.append(H(`<div class="row" id="fl" style="position:absolute;left:0;right:0;top:360px;align-items:center">${d.nodes.map((x, i) => `
    <div class="card nd" id="nd${i}" style="width:${w}px;height:230px;padding:28px;display:flex;flex-direction:column;justify-content:center;text-align:center">
      <div class="serif" style="font-size:40px;line-height:1.1">${esc(x.t)}</div>${x.s ? `<div style="font-size:22px;color:var(--mut);margin-top:12px">${esc(x.s)}</div>` : ""}</div>
    ${i < n - 1 ? `<svg width="${gap}" height="20" class="ar" id="ar${i}"><line x1="4" y1="10" x2="${gap - 14}" y2="10" stroke="${ACC}" stroke-width="3" stroke-dasharray="${gap}" class="al"/><path d="M${gap - 18},3 L${gap - 6},10 L${gap - 18},17" fill="none" stroke="${ACC}" stroke-width="3" class="ah"/></svg>` : ""}`).join("")}</div>`));
  headIn(tl);
  const t = spread(n, 0.9, DUR - 1.6);
  d.nodes.forEach((_, i) => {
    tl.from(`#nd${i}`, { opacity: 0, y: 36, duration: 0.6, ease: "power3.out" }, t[i]);
    if (i < n - 1) tl.from(`#ar${i} .al`, { strokeDashoffset: gap, duration: 0.5 }, t[i] + 0.4).from(`#ar${i} .ah`, { opacity: 0, duration: 0.2 }, t[i] + 0.8);
    tl.to(`#nd${i}`, { borderColor: RGBA(.65), duration: 0.3 }, t[i] + 0.7);
  });
};

/* checklist: {kick,title,items:["..."],style:"check"|"cross"} */
T.checklist = (d, tl) => {
  const cross = d.style === "cross";
  $stage.append(H(`<div>${head(d.kick, d.title, d.sub)}</div>`));
  $stage.append(H(`<div style="position:absolute;left:0;right:0;top:300px">${d.items.map((x, i) => `
    <div class="row ck" id="ck${i}" style="align-items:center;gap:26px;padding:22px 0;border-top:1px solid var(--line)">
      <div class="bx" style="width:44px;height:44px;border-radius:50%;border:2px solid ${cross ? "#c9776b" : "var(--acc)"};display:flex;align-items:center;justify-content:center;color:${cross ? "#c9776b" : "var(--acc)"};font-size:26px"><span style="opacity:0" class="mk">${cross ? "✕" : "✓"}</span></div>
      <div style="font-size:34px;line-height:1.3">${esc(x)}</div></div>`).join("")}</div>`));
  headIn(tl);
  const t = d.times || spread(d.items.length, 0.9, DUR - 1.5);
  d.items.forEach((_, i) => tl.from(`#ck${i}`, { opacity: 0, x: -30, duration: 0.5 }, t[i]).to(`#ck${i} .mk`, { opacity: 1, duration: 0.25 }, t[i] + 0.45).from(`#ck${i} .bx`, { scale: 0.7, duration: 0.4, ease: "back.out(3)" }, t[i] + 0.4));
};

/* calc: {kick,title,inputs:[{l,show,pct}],result:{l,value,prefix,suffix,comma}} */
T.calc = (d, tl) => {
  $stage.append(H(`<div>${head(d.kick, d.title, d.sub)}</div>`));
  $stage.append(H(`<div class="card" style="position:absolute;left:0;top:250px;width:1340px;height:560px;padding:50px 60px">
    <div class="row" style="gap:70px;height:100%;align-items:center">
     <div class="col" style="flex:1;gap:46px">${d.inputs.map((x, i) => `
       <div><div class="row" style="justify-content:space-between;font-size:26px;color:var(--mut)"><span>${esc(x.l)}</span><span class="serif" style="color:var(--txt);font-size:40px" id="iv${i}">${esc(x.show)}</span></div>
       <div style="height:8px;background:rgba(255,255,255,.1);border-radius:4px;margin-top:20px;position:relative"><div id="if${i}" style="height:100%;width:${x.pct}%;background:var(--acc);border-radius:4px;transform-origin:left"></div><div id="ih${i}" style="position:absolute;top:-10px;left:calc(${x.pct}% - 14px);width:28px;height:28px;border-radius:50%;background:#f4f3ef;box-shadow:0 4px 14px rgba(0,0,0,.5)"></div></div></div>`).join("")}</div>
     <div style="width:2px;height:70%;background:var(--line)"></div>
     <div class="col" style="flex:1;justify-content:center"><div style="font-size:26px;color:var(--mut)">${esc(d.result.l)}</div>
       <div class="serif acc" style="font-size:150px;line-height:1.05;margin-top:14px">${esc(d.result.prefix || "")}<span id="rv">0</span>${esc(d.result.suffix || "")}</div></div></div></div>`));
  headIn(tl);
  d.inputs.forEach((_, i) => tl.from(`#if${i}`, { scaleX: 0, duration: 1.0, ease: "power3.out" }, 0.9 + i * 0.3).from(`#ih${i}`, { opacity: 0, scale: 0, duration: 0.4 }, 1.4 + i * 0.3));
  const o = { v: 0 };
  tl.to(o, { v: d.result.value, duration: 1.8, ease: "power3.out", onUpdate: () => (document.getElementById("rv").textContent = fmt(o.v, d.result)) }, 1.8);
};

/* code: {kick,title?,file:"prompt.md",lines:["...","..."]} typed char by char */
T.code = (d, tl) => {
  $stage.append(H(`<div>${head(d.kick, d.title)}</div>`));
  $stage.append(H(`<div class="card" style="position:absolute;left:0;top:${d.title ? 230 : 150}px;width:1340px;padding:0;overflow:hidden">
    <div class="row" style="align-items:center;gap:10px;padding:18px 24px;border-bottom:1px solid var(--line)"><i style="width:14px;height:14px;border-radius:50%;background:#3a3a3e"></i><i style="width:14px;height:14px;border-radius:50%;background:#3a3a3e"></i><i style="width:14px;height:14px;border-radius:50%;background:#3a3a3e"></i><span class="mono" style="margin-left:18px;color:var(--mut);font-size:20px">${esc(d.file || "prompt.md")}</span></div>
    <div class="mono" id="cd" style="padding:34px 40px;font-size:30px;line-height:1.6;min-height:420px">${d.lines.map((_, i) => `<div id="cl${i}" style="white-space:pre-wrap"><span class="ln${i}"></span></div>`).join("")}<span id="cur" style="display:inline-block;width:14px;height:30px;background:var(--acc);vertical-align:-5px"></span></div></div>`));
  headIn(tl);
  const total = d.lines.join("").length, per = Math.min(0.05, (DUR - 2) / total);
  let t = 0.9;
  d.lines.forEach((ln, i) => {
    const o = { c: 0 }, dur = ln.length * per;
    const el = () => document.querySelector(`.ln${i}`);
    tl.to(o, { c: ln.length, duration: dur, ease: "none", onUpdate: () => (el().textContent = ln.slice(0, Math.round(o.c))) }, t);
    t += dur + 0.15;
  });
  tl.to("#cur", { opacity: 0, repeat: 9, yoyo: true, duration: 0.4 }, 0.9);
};

/* chat: {kick,title?,items:[{who:"me"|"ai",text}]} */
T.chat = (d, tl) => {
  $stage.append(H(`<div>${head(d.kick, d.title)}</div>`));
  $stage.append(H(`<div class="col" style="position:absolute;left:0;right:0;top:${d.title ? 240 : 130}px;gap:26px">${d.items.map((x, i) => `
    <div id="cb${i}" style="align-self:${x.who === "me" ? "flex-end" : "flex-start"};max-width:960px;padding:26px 34px;border-radius:28px;font-size:32px;line-height:1.4;
      background:${x.who === "me" ? "var(--acc)" : "var(--panel2)"};color:${x.who === "me" ? "#161207" : "var(--txt)"};border:1px solid var(--line)">${esc(x.text)}</div>`).join("")}</div>`));
  headIn(tl);
  const t = spread(d.items.length, 0.9, DUR - 1.4);
  d.items.forEach((_, i) => tl.from(`#cb${i}`, { opacity: 0, y: 30, scale: 0.96, duration: 0.55, ease: "power3.out" }, t[i]));
};

/* tree: {kick,title,root:"Head",children:["A","B","C"],grand:[["a1","a2"],[..],[..]]} */
T.tree = (d, tl) => {
  const k = d.children.length, cw = Math.floor(1340 / k);
  $stage.append(H(`<div>${head(d.kick, d.title)}</div>`));
  $stage.append(H(`<div style="position:absolute;left:0;right:0;top:250px">
    <div class="card" id="tr0" style="width:300px;margin:0 auto;padding:24px;text-align:center"><div class="serif" style="font-size:38px">${esc(d.root)}</div></div>
    <div id="tc" class="row" style="margin-top:90px">${d.children.map((c, i) => `
      <div class="col" style="width:${cw}px;align-items:center;gap:22px"><div class="card tn" style="padding:18px 30px;text-align:center;border-color:${RGBA(.4)}"><div class="serif" style="font-size:32px">${esc(c)}</div></div>
      ${((d.grand || [])[i] || []).map((g) => `<div class="card tg" style="padding:12px 24px;font-size:24px;color:var(--mut)">${esc(g)}</div>`).join("")}</div>`).join("")}</div></div>`));
  headIn(tl);
  tl.from("#tr0", { opacity: 0, y: 20, duration: 0.6 }, 0.9).from(".tn", { opacity: 0, y: 30, duration: 0.6, stagger: 0.25 }, 1.4).from(".tg", { opacity: 0, y: 20, duration: 0.4, stagger: 0.12 }, 2.3);
};

/* pricing: {kick,title,tiers:[{n,price,unit,note,hot}]} */
T.pricing = (d, tl) => {
  const k = d.tiers.length, w = Math.floor((1340 - (k - 1) * 28) / k);
  $stage.append(H(`<div>${head(d.kick, d.title, d.sub)}</div>`));
  $stage.append(H(`<div class="row" style="position:absolute;left:0;right:0;top:290px;gap:28px;align-items:stretch">${d.tiers.map((x, i) => `
    <div class="card pt" id="pt${i}" style="width:${w}px;padding:40px 36px;${x.hot ? `border-color:${RGBA(.7)};transform:translateY(-14px)` : ""}">
      <div class="serif" style="font-size:42px;${x.hot ? "color:var(--acc)" : ""}">${esc(x.n)}</div>
      <div class="serif" style="font-size:110px;line-height:1;margin-top:34px">${esc(x.price)}</div>
      <div style="font-size:22px;color:var(--mut);margin-top:10px">${esc(x.unit || "")}</div>
      <div style="font-size:26px;margin-top:34px;padding-top:24px;border-top:1px solid var(--line);color:var(--mut)">${esc(x.note || "")}</div></div>`).join("")}</div>`));
  headIn(tl);
  const t = spread(k, 0.9, DUR - 1.6);
  d.tiers.forEach((_, i) => tl.from(`#pt${i}`, { opacity: 0, y: 50, duration: 0.7, ease: "power3.out" }, t[i]));
};

/* scale: {kick,title,left:{l,v},right:{l,v}} - two weights, balance tilts to the heavier */
T.scale = (d, tl) => {
  const tilt = (d.right.v > d.left.v ? 1 : -1) * 7;
  $stage.append(H(`<div>${head(d.kick, d.title)}</div>`));
  $stage.append(H(`<div style="position:absolute;left:0;right:0;top:300px;height:520px">
    <div id="beam" style="position:absolute;left:150px;right:150px;top:150px;height:8px;border-radius:4px;background:var(--mut);transform-origin:50% 50%">
      <div class="col pan" style="position:absolute;left:-30px;top:8px;width:420px;align-items:center"><div class="serif" style="font-size:90px">${esc(d.left.v)}</div><div style="font-size:26px;color:var(--mut);margin-top:10px">${esc(d.left.l)}</div></div>
      <div class="col pan" style="position:absolute;right:-30px;top:8px;width:420px;align-items:center"><div class="serif acc" style="font-size:90px">${esc(d.right.v)}</div><div style="font-size:26px;color:var(--mut);margin-top:10px">${esc(d.right.l)}</div></div></div>
    <div style="position:absolute;left:calc(50% - 40px);top:158px;width:0;height:0;border-left:40px solid transparent;border-right:40px solid transparent;border-bottom:90px solid #2a2a2e"></div></div>`));
  headIn(tl);
  tl.from("#beam", { opacity: 0, duration: 0.6 }, 0.8).from(".pan", { opacity: 0, y: 30, duration: 0.6, stagger: 0.4 }, 1.0).to("#beam", { rotation: tilt, duration: 1.4, ease: "elastic.out(1,.6)" }, 2.0);
};


/* fill: {kick,title?,prefix:"I go to",cands:[{w,p}],note} - sentence with blinking blank, word probabilities, winner drops into the blank */
T.fill = (d, tl) => {
  const max = Math.max(...d.cands.map((c) => c.p)), win = d.cands.findIndex((c) => c.p === max);
  $stage.append(H(`<div>${head(d.kick, d.title)}</div>`));
  $stage.append(H(`<div class="serif" id="fs" style="position:absolute;left:0;top:${d.title ? 250 : 160}px;font-size:92px;line-height:1.1;white-space:nowrap">
    ${d.prefix.split(" ").map((w) => `<span class="fw" style="display:inline-block;margin-right:.26em">${esc(w)}</span>`).join("")}<span id="blank" style="display:inline-block;min-width:3.2em;border-bottom:4px solid var(--acc);text-align:center;color:var(--acc)"><span id="bw" style="opacity:0">${esc(d.cands[win].w)}</span></span></div>`));
  $stage.append(H(`<div style="position:absolute;left:0;right:0;top:${d.title ? 470 : 380}px">${d.cands.map((c, i) => `
    <div class="row cr" id="cr${i}" style="align-items:center;gap:24px;margin-bottom:20px">
      <div style="width:200px;font-size:32px;color:${i === win ? "var(--txt)" : "var(--mut)"}">${esc(c.w)}</div>
      <div style="flex:1;height:34px;background:rgba(255,255,255,.05);border-radius:8px;overflow:hidden"><div class="cf" style="height:100%;width:${Math.max(0.6, (c.p / max) * 100)}%;border-radius:8px;transform-origin:left;background:${i === win ? `linear-gradient(90deg,${ACCD},var(--acc))` : "rgba(255,255,255,.28)"}"></div></div>
      <div class="mono" style="width:110px;font-size:26px;color:${i === win ? "var(--acc)" : "var(--mut)"}">${c.p}%</div></div>`).join("")}</div>`));
  if (d.note) $stage.append(H(`<div class="mut" id="fnote" style="position:absolute;left:0;bottom:30px;font-size:22px">${esc(d.note)}</div>`));
  headIn(tl);
  tl.from(".fw", { opacity: 0, y: 24, duration: 0.5, stagger: 0.18, ease: "power3.out" }, 0.5)
    .to("#blank", { borderBottomColor: RGBA(.25), repeat: 5, yoyo: true, duration: 0.35 }, 1.2);
  const t = spread(d.cands.length, 2.2, 2.2 + d.cands.length * 0.55);
  d.cands.forEach((_, i) => tl.from(`#cr${i}`, { opacity: 0, x: -30, duration: 0.45 }, t[i]).from(`#cr${i} .cf`, { scaleX: 0, duration: 0.9, ease: "power3.out" }, t[i] + 0.1));
  tl.to("#bw", { opacity: 1, duration: 0.4 }, DUR - 2.2).from("#bw", { y: -40, scale: 0.9, duration: 0.6, ease: "power3.out" }, DUR - 2.2).from("#fnote", { opacity: 0, duration: 0.6 }, 2.4);
};

/* tokens: {kick,title,chips:["How","does","AI"],ids:[2437,1587,...],note} - text breaks into chips, each flips to a number */
T.tokens = (d, tl) => {
  $stage.append(H(`<div>${head(d.kick, d.title)}</div>`));
  $stage.append(H(`<div class="row" id="tk" style="position:absolute;left:0;right:0;top:330px;gap:16px;flex-wrap:wrap">${d.chips.map((c, i) => `
    <div class="col tc" id="tc${i}" style="align-items:center;gap:16px">
      <div class="card" style="padding:18px 28px;font-size:46px;font-family:'Iowan Old Style',Georgia,serif;border-color:${RGBA(.35)}">${esc(c)}</div>
      <div class="mono tn" style="font-size:30px;color:var(--acc);height:36px;opacity:0">${d.ids[i]}</div></div>`).join("")}</div>`));
  if (d.note) $stage.append(H(`<div class="mut" id="tnote" style="position:absolute;left:0;bottom:30px;font-size:22px">${esc(d.note)}</div>`));
  headIn(tl);
  const t = spread(d.chips.length, 0.8, DUR - 2.2);
  d.chips.forEach((_, i) => tl.from(`#tc${i} .card`, { opacity: 0, y: 30, duration: 0.5, ease: "power3.out" }, t[i] * 0.55 + 0.4));
  d.chips.forEach((_, i) => tl.from(`#tc${i} .tn`, { rotationX: 90, y: -10, duration: 0.5, ease: "back.out(2)", transformOrigin: "50% 0%" }, (d.flipAt ?? 1.6) + i * 0.28).to(`#tc${i} .tn`, { opacity: 1, duration: 0.2 }, (d.flipAt ?? 1.6) + i * 0.28));
  tl.from("#tnote", { opacity: 0, duration: 0.6 }, 2.0);
};

/* attention: {kick,title,rows:[{words:[..],focus:i,w:[weights 0-1]}],note} - focus word lights up, lines to context words, thickness = attention */
T.attention = (d, tl) => {
  $stage.append(H(`<div>${head(d.kick, d.title)}</div>`));
  const rowH = 230;
  $stage.append(H(`<div id="at" style="position:absolute;left:0;right:0;top:${d.title ? 250 : 170}px">${d.rows.map((r, ri) => `
    <div class="row at-row" id="ar${ri}" style="height:${rowH}px;align-items:flex-end;gap:34px;padding-bottom:20px;position:relative">${r.words.map((w, i) => `
      <span class="serif aw" id="aw${ri}_${i}" style="font-size:60px;${i === r.focus ? "color:var(--acc)" : "color:#d8d6cf"}">${esc(w)}</span>`).join("")}</div>`).join("")}
    <svg id="asv" width="1340" height="${rowH * d.rows.length}" style="position:absolute;left:0;top:0;pointer-events:none"></svg></div>`));
  if (d.note) $stage.append(H(`<div class="mut" style="position:absolute;left:0;bottom:30px;font-size:22px">${esc(d.note)}</div>`));
  headIn(tl);
  const svg = document.getElementById("asv"), base = document.getElementById("at").getBoundingClientRect();
  d.rows.forEach((r, ri) => {
    const f = document.getElementById(`aw${ri}_${r.focus}`).getBoundingClientRect();
    const fx = f.left - base.left + f.width / 2, fy = f.top - base.top - 6;
    r.words.forEach((_, i) => {
      if (i === r.focus) return;
      const e = document.getElementById(`aw${ri}_${i}`).getBoundingClientRect();
      const ex = e.left - base.left + e.width / 2, ey = e.top - base.top - 6, wgt = r.w[i] ?? 0.1, up = 46 + 70 * wgt;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", `M${fx},${fy} C${fx},${fy - up} ${ex},${ey - up} ${ex},${ey}`);
      path.setAttribute("fill", "none"); path.setAttribute("stroke", ACC);
      path.setAttribute("stroke-width", 2 + 12 * wgt); path.setAttribute("stroke-linecap", "round"); path.setAttribute("opacity", 0.18 + 0.7 * wgt);
      path.classList.add("al" + ri); svg.appendChild(path);
    });
  });
  const per = (DUR - 1.2) / d.rows.length;
  d.rows.forEach((r, ri) => {
    const t0 = d.rowAt ? d.rowAt[ri] : 0.8 + ri * per;
    tl.from(`#ar${ri}`, { opacity: 0, y: 24, duration: 0.6 }, t0);
    d.rows[ri].words.forEach((_, i) => { if (i === r.focus) tl.from(`#aw${ri}_${i}`, { scale: 1.25, transformOrigin: "50% 100%", duration: 0.5, ease: "back.out(2)" }, t0 + 0.5); });
    document.querySelectorAll(".al" + ri).forEach((p) => { const L = p.getTotalLength(); gsap.set(p, { strokeDasharray: L, strokeDashoffset: L }); tl.to(p, { strokeDashoffset: 0, duration: 0.8, ease: "power2.out" }, d.drawAt ? d.drawAt[ri] : t0 + 1.0); });
  });
};

/* merge: {kick,title,items:["Elephant","Century","Bat"],result:"Blue elephant hits a century"} - bubbles slide together and click into one idea */
T.merge = (d, tl) => {
  const n = d.items.length;
  $stage.append(H(`<div>${head(d.kick, d.title)}</div>`));
  $stage.append(H(`<div id="mg" style="position:absolute;left:0;right:0;top:330px;height:480px">
    ${d.items.map((x, i) => `<div class="card mb" id="mb${i}" style="position:absolute;left:${(1340 / n) * i + (1340 / n - 300) / 2}px;top:40px;width:300px;height:150px;display:flex;align-items:center;justify-content:center;font-size:44px" ><span class="serif">${esc(x)}</span></div>`).join("")}
    <div class="card" id="mres" style="position:absolute;left:170px;top:330px;width:1000px;height:170px;display:flex;align-items:center;justify-content:center;border-color:${RGBA(.7)}"><span class="serif acc" style="font-size:62px">${esc(d.result)}</span></div></div>`));
  headIn(tl);
  const t = d.times || spread(n, 0.8, 0.8 + n * 0.5);
  const J = d.joinAt ?? 2.4;
  d.items.forEach((_, i) => tl.from(`#mb${i}`, { opacity: 0, y: -40, duration: 0.6, ease: "power3.out" }, t[i]));
  const cw = 300, tot = n * cw + (n - 1) * 20, x0 = (1340 - tot) / 2;
  d.items.forEach((_, i) => tl.to(`#mb${i}`, { left: x0 + i * (cw + 20), top: 90, duration: 0.8, ease: "power3.inOut" }, J).to(`#mb${i}`, { borderColor: RGBA(.8), duration: 0.3 }, J + 0.8));
  tl.from("#mres", { opacity: 0, y: 40, scale: 0.96, duration: 0.8, ease: "power3.out" }, J + 1.1);
};

/* loop: {kick,title,steps:["Guess","Check","Fix"],count:{to:1000,suffix:"B",label:"rounds"}} - cycle that speeds up while a counter climbs */
T.loop = (d, tl) => {
  const cx = 420, cy = 360, R = 230, n = d.steps.length, ang = (i) => (-90 + (360 / n) * i) * (Math.PI / 180);
  $stage.append(H(`<div>${head(d.kick, d.title)}</div>`));
  $stage.append(H(`<svg id="lp" width="1340" height="760" style="position:absolute;left:0;top:210px">
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="3" stroke-dasharray="6 10"/>
    ${d.steps.map((s, i) => `<g class="ln2" id="ls${i}"><circle cx="${cx + R * Math.cos(ang(i))}" cy="${cy + R * Math.sin(ang(i))}" r="62" fill="#151517" stroke="rgba(255,255,255,.2)" stroke-width="2" class="lc"/>
      <text x="${cx + R * Math.cos(ang(i))}" y="${cy + R * Math.sin(ang(i)) + 8}" text-anchor="middle" fill="#f4f3ef" font-size="24" font-family="Iowan Old Style,Georgia,serif">${esc(s)}</text></g>`).join("")}
    <circle id="dot" r="12" fill="${ACC}"/>
    </svg>`));
  $stage.append(H(`<div style="position:absolute;left:860px;top:360px;width:480px"><div class="mut" style="font-size:26px">${esc(d.count.label)}</div>
    <div class="serif acc" style="font-size:150px;line-height:1.05;margin-top:10px"><span id="cn">0</span>${esc(d.count.suffix || "")}</div></div>`));
  headIn(tl);
  const o = { a: 0, v: 0 }, turns = 6;
  tl.from(".ln2", { opacity: 0, scale: 0.85, transformOrigin: "50% 50%", duration: 0.5, stagger: 0.2 }, 0.7)
    .to(o, { a: turns, v: 1, duration: DUR - 2.0, ease: "power2.in", onUpdate: () => {
      const th = -Math.PI / 2 + o.a * 2 * Math.PI; const dot = document.getElementById("dot");
      dot.setAttribute("cx", cx + R * Math.cos(th)); dot.setAttribute("cy", cy + R * Math.sin(th));
      document.getElementById("cn").textContent = Math.round(o.v * o.v * d.count.to);
    } }, 1.4);
};

/* truth: {kick,left:"Truth",right:"Sounds right",symbol:"!=",tag:"Hallucination"} */
T.truth = (d, tl) => {
  $stage.append(H(`<div class="col" style="height:100%;justify-content:center">${d.kick ? `<div class="kick" id="kick">${esc(d.kick)}</div>` : ""}
    <div class="row" style="align-items:center;gap:36px;margin-top:50px">
      <div class="card tb" id="tbl" style="flex:1;height:240px;display:flex;align-items:center;justify-content:center"><span class="serif" style="font-size:64px">${esc(d.left)}</span></div>
      <div class="serif acc" id="tsy" style="font-size:150px;line-height:1">${esc(d.symbol || "≠")}</div>
      <div class="card tb" id="tbr" style="flex:1;height:240px;display:flex;align-items:center;justify-content:center;border-color:${RGBA(.6)}"><span class="serif" style="font-size:64px">${esc(d.right)}</span></div></div>
    <div class="serif acc" id="ttag" style="font-size:56px;margin-top:50px">${esc(d.tag || "")}</div></div>`));
  tl.from("#kick", { opacity: 0, x: -20, duration: 0.5 }, 0.1)
    .from("#tbl", { opacity: 0, x: -60, duration: 0.8, ease: "power3.out" }, 0.4).from("#tbr", { opacity: 0, x: 60, duration: 0.8, ease: "power3.out" }, 0.7)
    .from("#tsy", { scale: 3, opacity: 0, duration: 0.5, ease: "back.out(1.6)" }, 1.4).from("#ttag", { opacity: 0, y: 20, duration: 0.7 }, 2.4);
};


/* elephant: {kick,prompt,score:100,tag} - illustrated cricket scene: blue elephant swings, ball flies, scoreboard hits a century */
T.elephant = (d, tl) => {
  const crowd = Array.from({ length: 150 }, (_, i) => `<circle cx="${30 + (i * 67) % 940}" cy="${118 + ((i * 29) % 5) * 15}" r="${3 + (i % 3)}" fill="rgba(255,255,255,${0.07 + (i % 5) * 0.025})"/>`).join("");
  $stage.append(H(`<div>${head(d.kick, "")}
    <div class="mono" id="pr" style="margin-top:20px;font-size:30px;color:var(--mut);height:44px"><span class="acc">&gt; </span><span id="prt"></span><span id="prc" style="display:inline-block;width:12px;height:28px;background:var(--acc);vertical-align:-5px"></span></div></div>`));
  $stage.append(H(`<div id="ecard" class="card" style="position:absolute;left:0;top:200px;width:1340px;height:690px;overflow:hidden;padding:0">
    <svg viewBox="0 0 1000 515" width="1340" height="690" style="display:block">
      <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#101a2c"/><stop offset="1" stop-color="#17202e"/></linearGradient>
        <linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d2b22"/><stop offset="1" stop-color="#121a15"/></linearGradient></defs>
      <rect width="1000" height="515" fill="url(#sky)"/>
      ${crowd}
      <g fill="${ACC}" opacity=".85"><circle cx="300" cy="22" r="9"/><circle cx="330" cy="22" r="9"/><circle cx="640" cy="22" r="9"/><circle cx="670" cy="22" r="9"/></g>
      <rect y="400" width="1000" height="115" fill="url(#gr)"/><line x1="0" y1="402" x2="1000" y2="402" stroke="rgba(255,255,255,.18)" stroke-width="2"/>
      <rect x="620" y="395" width="260" height="10" rx="5" fill="rgba(255,255,255,.08)"/>
      <g id="el">
        <path d="M232,335 Q205,330 200,395" fill="none" stroke="#4d78b0" stroke-width="12" stroke-linecap="round"/>
        <rect x="270" y="390" width="46" height="95" rx="18" fill="#4d78b0"/><rect x="400" y="390" width="46" height="95" rx="18" fill="#4d78b0"/>
        <ellipse cx="350" cy="340" rx="140" ry="100" fill="#6f9bd1"/>
        <rect x="320" y="395" width="46" height="92" rx="18" fill="#6f9bd1"/><rect x="440" y="395" width="46" height="92" rx="18" fill="#6f9bd1"/>
        <circle cx="490" cy="270" r="78" fill="#6f9bd1"/>
        <ellipse cx="448" cy="275" rx="52" ry="78" fill="#5b88c2" transform="rotate(-8 448 275)"/>
        <path d="M468,205 Q490,175 535,200 L530,222 Q495,205 475,228 Z" fill="${ACC}"/>
        <circle cx="520" cy="258" r="8" fill="#0b0f18"/><circle cx="523" cy="255" r="2.5" fill="#fff"/>
        <path id="trunk" d="M550,290 Q612,305 604,362" fill="none" stroke="#6f9bd1" stroke-width="34" stroke-linecap="round"/>
        <g id="bat" transform="rotate(10 604 362)"><rect x="596" y="130" width="17" height="235" rx="8" fill="#c9a36b"/><rect x="598" y="334" width="13" height="40" rx="6" fill="#8a6a3f"/></g>
      </g>
      <circle id="ball" r="12" cx="1040" cy="240" fill="#f4f3ef"/>
      <g id="burst" opacity="0" transform="translate(900 120)">${Array.from({ length: 12 }, (_, i) => `<line x1="0" y1="-46" x2="0" y2="-82" stroke="${ACC}" stroke-width="5" stroke-linecap="round" transform="rotate(${i * 30})"/>`).join("")}</g>
      ${Array.from({ length: 28 }, (_, i) => `<rect class="cf" x="${420 + (i * 53) % 560}" y="-20" width="9" height="14" rx="2" fill="${i % 3 ? ACC : "#9DB4D6"}" opacity="0"/>`).join("")}
    </svg>
    <div class="abs" style="left:34px;top:26px;text-align:left"><div class="mut" style="font-size:20px;letter-spacing:.16em">WORLD CUP FINAL</div>
      <div class="serif" style="font-size:96px;line-height:1;margin-top:6px"><span id="sc" class="acc">0</span><span class="mut" style="font-size:46px">*</span></div></div>
    <div id="cent" class="serif acc abs" style="right:46px;top:34px;font-size:64px;opacity:0">CENTURY!</div>
  </div>`));
  if (d.tag) $stage.append(H(`<div id="etag" class="serif" style="position:absolute;left:0;bottom:-6px;font-size:36px;color:var(--mut)">${esc(d.tag)}</div>`));
  headIn(tl);
  const o = { n: 0, k: 0 }, txt = d.prompt;
  tl.to(o, { k: txt.length, duration: Math.min(2.6, DUR * 0.3), ease: "none", onUpdate: () => (document.getElementById("prt").textContent = txt.slice(0, Math.round(o.k))) }, 0.4)
    .to("#prc", { opacity: 0, repeat: 7, yoyo: true, duration: 0.3 }, 0.4)
    .from("#ecard", { opacity: 0, y: 40, duration: 0.8, ease: "power3.out" }, 1.6)
    .from("#el", { x: -90, opacity: 0, duration: 0.9, ease: "power3.out" }, 2.0);
  const H0 = DUR >= 8 ? 4.1 : 3.4;   // time of the hit
  tl.to("#ball", { attr: { cx: 790, cy: 374 }, duration: 0.6, ease: "power2.in" }, H0 - 0.65)
    .to("#bat", { rotation: 96, svgOrigin: "604 362", duration: 0.3, ease: "power3.in" }, H0 - 0.3)
    .to("#ball", { attr: { cx: 950, cy: 40, r: 8 }, duration: 0.9, ease: "power2.out" }, H0)
    .to("#el", { y: -8, duration: 0.18, yoyo: true, repeat: 1, ease: "power2.out" }, H0)
    .to(o, { n: d.score || 100, duration: 1.4, ease: "power2.out", onUpdate: () => (document.getElementById("sc").textContent = Math.round(o.n)) }, H0 + 0.2)
    .to("#burst", { opacity: 1, scale: 1, duration: 0.2 }, H0 + 1.0).fromTo("#burst", { scale: 0.4 }, { scale: 1.2, duration: 0.5, ease: "power2.out" }, H0 + 1.0).to("#burst", { opacity: 0, duration: 0.4 }, H0 + 1.5)
    .to("#cent", { opacity: 1, duration: 0.3 }, H0 + 1.1);
  document.querySelectorAll(".cf").forEach((c, i) => tl.to(c, { attr: { y: 520 }, opacity: 1, duration: 1.6 + (i % 4) * 0.25, ease: "power1.in" }, H0 + 1.1 + (i % 7) * 0.08));
  tl.from("#etag", { opacity: 0, y: 16, duration: 0.6 }, DUR - 1.8);
};

/* wordbyword: {kick,prompt,words:[..],note} - chat reply that appears one word at a time, newest word highlighted */
T.wordbyword = (d, tl) => {
  $stage.append(H(`<div>${head(d.kick, "")}</div>`));
  $stage.append(H(`<div class="col" style="position:absolute;left:0;right:0;top:170px;gap:34px">
    <div id="wu" style="align-self:flex-end;max-width:800px;padding:26px 36px;border-radius:28px;background:${ACC};color:#161207;font-size:34px">${esc(d.prompt)}</div>
    <div id="wa" class="card" style="align-self:flex-start;max-width:1120px;padding:44px 54px;border-radius:28px;min-height:250px">
      <div class="row" style="align-items:center;gap:12px;margin-bottom:22px"><span style="width:12px;height:12px;border-radius:50%;background:var(--acc)"></span><span class="mut" style="font-size:22px;letter-spacing:.14em">AI</span></div>
      <div class="serif" style="font-size:60px;line-height:1.28">${d.words.map((w, i) => `<span class="ww" id="ww${i}" style="display:inline-block;margin-right:.26em;opacity:0">${esc(w)}</span>`).join("")}<span id="wc" style="display:inline-block;width:14px;height:54px;background:var(--acc);vertical-align:-8px"></span></div></div></div>`));
  if (d.note) $stage.append(H(`<div id="wn" class="serif acc" style="position:absolute;left:0;bottom:6px;font-size:40px">${esc(d.note)}</div>`));
  headIn(tl);
  tl.from("#wu", { opacity: 0, y: 30, duration: 0.6, ease: "power3.out" }, 0.4).from("#wa", { opacity: 0, y: 30, duration: 0.6, ease: "power3.out" }, 1.2);
  const n = d.words.length, step = Math.min(0.62, (DUR - 4.6) / n);
  d.words.forEach((_, i) => {
    const t = 2.0 + i * step;
    tl.set(`#ww${i}`, { opacity: 1, color: ACC }, t).from(`#ww${i}`, { y: 14, duration: 0.3, ease: "power2.out" }, t);
    tl.set(`#ww${i}`, { color: "#f4f3ef" }, t + step * 0.95);
  });
  tl.to("#wc", { opacity: 0, repeat: 20, yoyo: true, duration: 0.35 }, 2.0).from("#wn", { opacity: 0, y: 14, duration: 0.6 }, DUR - 2.2);
};


/* funnel: {kick,title,items:["Books","Websites"],target:"AI",note} - sources stream dots into one box */
T.funnel = (d, tl) => {
  const n = d.items.length, X0 = 0, XW = 250, BX = 880, BW = 400, BY = 250, BH = 330, srcY = (i) => 120 + i * (360 / (n - 1 || 1));
  $stage.append(H(`<div>${head(d.kick, d.title)}</div>`));
  $stage.append(H(`<svg id="fn" width="1340" height="700" style="position:absolute;left:0;top:210px;overflow:visible">
    ${d.items.map((_, i) => `<path d="M${XW},${srcY(i) + 30} C${XW + 300},${srcY(i) + 30} ${BX - 300},${BY + BH / 2} ${BX},${BY + BH / 2}" fill="none" stroke="rgba(255,255,255,.10)" stroke-width="2" id="fp${i}"/>`).join("")}
    <rect id="fb" x="${BX}" y="${BY}" width="${BW}" height="${BH}" rx="26" fill="#151517" stroke="${RGBA(.6)}" stroke-width="2"/>
    <text x="${BX + BW / 2}" y="${BY + BH / 2 + 28}" text-anchor="middle" font-size="96" fill="${ACC}" font-family="Iowan Old Style,Georgia,serif" id="ft">${esc(d.target || "AI")}</text>
    ${d.items.map((x, i) => `<g class="fc" id="fc${i}"><rect x="${X0}" y="${srcY(i)}" width="${XW}" height="60" rx="16" fill="#1c1c1f" stroke="rgba(255,255,255,.14)"/><text x="${X0 + XW / 2}" y="${srcY(i) + 39}" text-anchor="middle" font-size="30" fill="#f4f3ef" font-family="Iowan Old Style,Georgia,serif">${esc(x)}</text></g>`).join("")}
    ${d.items.flatMap((_, i) => Array.from({ length: 6 }, (_, k) => `<circle class="fd fd${i}" r="7" cx="0" cy="0" fill="${ACC}" opacity="0"/>`)).join("")}
    </svg>`));
  if (d.note) $stage.append(H(`<div id="fnn" class="serif acc" style="position:absolute;left:0;bottom:8px;font-size:40px">${esc(d.note)}</div>`));
  headIn(tl);
  const bez = (i, t) => { const y0 = srcY(i) + 30, x0 = XW, x3 = BX, y3 = BY + BH / 2, x1 = XW + 300, x2 = BX - 300, u = 1 - t;
    return [u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3, u * u * u * y0 + 3 * u * u * t * y0 + 3 * u * t * t * y3 + t * t * t * y3]; };
  d.items.forEach((_, i) => tl.from(`#fc${i}`, { opacity: 0, x: -40, duration: 0.5, ease: "power3.out" }, 0.4 + i * 0.35));
  tl.from("#fb", { opacity: 0, scale: 0.92, transformOrigin: "50% 50%", duration: 0.6 }, 0.6).from("#ft", { opacity: 0, duration: 0.6 }, 0.9);
  const run = Math.max(1.2, DUR - 3.2);
  d.items.forEach((_, i) => document.querySelectorAll(`.fd${i}`).forEach((c, k) => {
    const o = { t: 0 };
    tl.set(c, { opacity: 1 }, 1.6 + i * 0.12 + k * (run / 6)).to(o, { t: 1, duration: 1.4, ease: "power1.in", onUpdate: () => { const [x, y] = bez(i, o.t); c.setAttribute("cx", x); c.setAttribute("cy", y); } }, 1.6 + i * 0.12 + k * (run / 6)).set(c, { opacity: 0 }, 1.6 + i * 0.12 + k * (run / 6) + 1.4);
  }));
  tl.to("#fb", { attr: { "stroke-width": 5 }, repeat: 5, yoyo: true, duration: 0.5 }, 2.6).from("#fnn", { opacity: 0, y: 14, duration: 0.6 }, DUR - 2.4);
};

/* chatpair: {kick,title,left:{msg,read},right:{msg,read},note} - same words, different feel */
T.chatpair = (d, tl) => {
  const panel = (x, id, side, hot) => `<div class="card cp" id="${id}" style="flex:1;height:420px;padding:34px 38px;position:relative;${hot ? `border-color:${RGBA(.6)}` : ""}">
    <div class="mut" style="font-size:20px;letter-spacing:.16em;margin-bottom:32px">CHAT</div>
    <div class="mb" style="display:inline-block;padding:20px 34px;border-radius:26px;font-size:46px;background:${hot ? ACC : "var(--panel2)"};color:${hot ? "#161207" : "var(--txt)"};border:1px solid var(--line)">${esc(side.msg)}</div>
    <div class="rd serif" style="margin-top:44px;font-size:42px;color:${hot ? "var(--acc)" : "var(--mut)"}">${esc(side.read)}</div></div>`;
  $stage.append(H(`<div>${head(d.kick, d.title)}</div>`));
  $stage.append(H(`<div class="row" style="position:absolute;left:0;right:0;top:260px;gap:30px">${panel(0, "cpl", d.left, false)}${panel(0, "cpr", d.right, true)}</div>`));
  if (d.note) $stage.append(H(`<div id="cpn" class="serif acc" style="position:absolute;left:0;bottom:8px;font-size:40px">${esc(d.note)}</div>`));
  headIn(tl);
  tl.from("#cpl", { opacity: 0, x: -50, duration: 0.8, ease: "power3.out" }, 0.8).from("#cpr", { opacity: 0, x: 50, duration: 0.8, ease: "power3.out" }, 1.1)
    .from("#cpl .mb", { opacity: 0, scale: 0.8, transformOrigin: "0% 50%", duration: 0.5, ease: "back.out(2)" }, 1.8).from("#cpr .mb", { opacity: 0, scale: 0.8, transformOrigin: "0% 50%", duration: 0.5, ease: "back.out(2)" }, 2.3)
    .from("#cpl .rd", { opacity: 0, y: 18, duration: 0.6 }, 3.6).from("#cpr .rd", { opacity: 0, y: 18, duration: 0.6 }, 4.4).from("#cpn", { opacity: 0, y: 14, duration: 0.6 }, DUR - 2.0);
};

/* ---- build ---- */
document.getElementById("root").style.setProperty("--acc", D.accent || ACC);
const tl = gsap.timeline({ paused: true });
T[D.type](D, tl);
window.__timelines = window.__timelines || {};
window.__timelines["main"] = tl;
tl.seek(0);
