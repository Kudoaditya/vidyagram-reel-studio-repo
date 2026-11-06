#!/usr/bin/env python3
"""TEMPLATE (copy and edit): Instagram origin reel: Vox-style paper collage, animated, with a CSS-3D camera on every scene."""
import os, json, base64, re
S = os.path.dirname(os.path.abspath(__file__))
SRC = open(S + "/storyboard_frames.py").read()
head = SRC[:SRC.index("# 1\npage(")]
scenes_src = SRC[SRC.index("# 1\npage("):SRC.index("for k in range(1,9):")]
D = S
ns = {"__file__": D + "/storyboard_frames.py"}
exec(head, ns)
BODIES = {}
ns["page"] = lambda n, body: BODIES.__setitem__(n, body)
ns["cap"] = lambda *a, **k: ""
exec(scenes_src, ns)
PATCH = ns["patch"]; PATCHES = ns["PATCHES"]; TORN = ns["TORN"]
A = os.path.expanduser("~/claude-video/assets/insta/")
mime = {"jpg": "image/jpeg", "png": "image/png"}
def inline(body):
    def r(m):
        p = A + m.group(1)
        return "data:" + mime[p.rsplit('.', 1)[1]] + ";base64," + base64.b64encode(open(p, "rb").read()).decode()
    return re.sub(r"file://~/claude-video/assets/insta/([\w.\-]+)", r, body)

# ---- extra scene: people chose photos (real 2011 filters photo)
FIL = f'file://~/claude-video/assets/insta/filters.jpg'
BODIES["v3b"] = (ns["swash_for"](150, 298, 780) + '<div class="a h">People Chose Photos</div>'
  + f'<div class="a paper pw" style="left:120px;top:520px;width:840px;padding:18px;z-index:3"><img src="{FIL}" style="width:100%;display:block"></div>'
  + '<div class="a tape" style="left:160px;top:505px;transform:rotate(-8deg);z-index:5"></div>'
  + '<svg class="a" style="left:120px;top:1010px;z-index:3" width="840" height="300" viewBox="0 0 840 300" fill="none"><g stroke="#15130f" stroke-width="6"><rect x="150" y="190" width="170" height="90" fill="#D8CDAA"/><rect x="520" y="30" width="170" height="250" fill="#FFD93B"/></g><path d="M20 285H820" stroke="#15130f" stroke-width="6"/></svg>'
  + '<div class="a lbl" style="left:130px;top:1255px;z-index:6">CHECK-IN</div><div class="a lbl" style="left:625px;top:1255px;z-index:6;background:#C8281D">PHOTOS</div>'
  + '<div class="a src">Photo: Jessica Zollman · CC BY-SA 3.0 · Wikimedia Commons</div>')
BODIES["v5"] = BODIES["v5"].replace("1,000,000", '<span id="cnt">0</span>') + '<div class="a stamp" style="left:140px;top:1215px;z-index:6;transform:rotate(-4deg);font-size:36px;opacity:0" id="launch">LAUNCH · 6 OCT 2010</div>'
BODIES["v6"] = re.sub(r'<div class="a" style="left:740px;top:690px;z-index:2;opacity:\.0">.*?</svg></div>', "", BODIES["v6"], flags=re.S)
for k in BODIES: BODIES[k] = inline(BODIES[k])
PATCHES["v3b"] = [(-50, 400, 340, 280, -3), (720, 380, 380, 250, 3)]

# scene timings and per-child delay overrides {child_index: absolute_time}
SC = [
 ("v1", 0.0, 5.4, {}),
 ("v2", 5.2, 7.8, {}),
 ("v3", 7.6, 12.7, {}),
 ("v3b", 12.5, 17.2, {2: 12.9, 3: 13.0, 4: 15.2, 5: 15.4, 6: 15.5, 7: 15.7}),
 ("v4", 17.0, 21.8, {}),
 ("v5", 21.6, 29.4, {2: 26.0, 3: 25.7, 4: 26.4, 5: 27.5, 6: 28.5, 7: 25.9, 8: 22.6}),
 ("v6", 29.2, 34.8, {}),
 ("v7", 34.6, 41.6, {}),
 ("v8", 41.4, 47.0, {}),
]
CAPS = json.load(open(S + "/sample_captions.json"))
for c in CAPS:
    for w in c["words"]:
        if w["w"] == "toh" and w["t"] == 16.0: w["t"] = 16.95
    if c["t0"] == 16.0: c["t0"] = 16.95
for i, c in enumerate(CAPS):
    c["t1"] = (CAPS[i + 1]["t0"] if i + 1 < len(CAPS) else 46.9)
DUR = 47.0

css = f""".a{{position:absolute}}.m{{font-family:Menlo,monospace}}
.h{{left:100px;width:880px;text-align:center;font:800 92px/1.02 'Didot','Bodoni 72',Georgia,serif;letter-spacing:-.02em;color:#15130f;top:262px;z-index:5}}
.swash{{position:absolute;background:#FFD93B;clip-path:polygon(0 30%,3% 10%,10% 22%,22% 4%,40% 14%,60% 2%,80% 12%,100% 0,98% 40%,100% 70%,97% 100%,80% 88%,60% 100%,40% 86%,20% 98%,6% 84%,0 100%,2% 60%);filter:url(#r)}}
.paper{{background:#FBF6E8;{TORN}}}.pw{{filter:drop-shadow(8px 12px 0 rgba(40,25,5,.28))}}
.duo{{position:relative;overflow:hidden;background:#222}}.duo img{{width:100%;height:100%;object-fit:cover;object-position:50% 18%;filter:grayscale(1) contrast(1.3) brightness(1.05);display:block}}
.duo:after{{content:"";position:absolute;inset:0;background-image:radial-gradient(rgba(0,0,0,.6) 24%,transparent 26%);background-size:6px 6px;mix-blend-mode:multiply;opacity:.5}}
.tape{{width:150px;height:44px;background:rgba(240,225,160,.82);box-shadow:0 2px 0 rgba(0,0,0,.12)}}
.stamp{{color:#C8281D;border:7px solid #C8281D;padding:8px 18px;font:900 44px 'Helvetica Neue';letter-spacing:.04em;filter:url(#r2)}}
.lbl{{background:#15130f;color:#F6EFD9;font:800 26px 'Helvetica Neue';padding:8px 14px;letter-spacing:.04em}}
.hand{{font:700 42px 'Marker Felt','Bradley Hand',cursive;color:#15130f}}
html,body{{margin:0;width:1080px;height:1920px;overflow:hidden;background:#EFE9D8}}
#root{{position:relative;width:1080px;height:1920px;overflow:hidden;background:#EFE9D8}}
.scene{{position:absolute;inset:0;opacity:0;perspective:1900px;perspective-origin:50% 45%}}
.cam{{position:absolute;left:-110px;top:-110px;width:1300px;height:2140px;transform-origin:50% 45%;will-change:transform}}
.cam .inner{{position:absolute;left:110px;top:110px;width:1080px;height:1920px}}
.capwrap{{position:absolute;left:0;top:1385px;width:1080px;height:100px;display:flex;justify-content:center;z-index:50}}
.strip{{position:absolute;opacity:0;background:#15130f;color:#F6EFD9;font:800 40px 'Helvetica Neue';padding:16px 34px;white-space:nowrap;clip-path:polygon(0 8%,3% 0,97% 6%,100% 0,100% 92%,97% 100%,3% 94%,0 100%);box-shadow:0 0 0 4px #15130f}}
.strip span{{display:inline-block;padding:2px 5px;margin:0 -2px;border-radius:5px}}"""

grid = "<div class='a' style='inset:0;background-image:linear-gradient(rgba(70,90,130,.10) 1px,transparent 1px),linear-gradient(90deg,rgba(70,90,130,.10) 1px,transparent 1px);background-size:44px 44px'></div>"
defs = ns["RF"]
overlays = ns["CREASE"] + ns["GRAIN"]

scene_html = ""
for name, t0, t1, ov in SC:
    pat = "".join(PATCH(*p) for p in PATCHES[name])
    scene_html += f'<div class="scene" id="s_{name}"><div class="cam" id="c_{name}">{grid}<div class="inner" id="i_{name}">{pat}{BODIES[name]}</div></div></div>\n'

js = r'''
const tl=gsap.timeline({paused:true});
const SC=__SC__;
const CAPS=__CAPS__;
SC.forEach(([name,t0,t1,ov],si)=>{
  const sc=document.getElementById("s_"+name),cam=document.getElementById("c_"+name),inner=document.getElementById("i_"+name);
  tl.fromTo(sc,{opacity:0},{opacity:1,duration:.55,ease:"power1.inOut",immediateRender:true},t0);
  if(si<SC.length-1)tl.to(sc,{opacity:0,duration:.55,ease:"power1.inOut"},t1-.1);
  const dir=si%2?1:-1;
  tl.fromTo(cam,{scale:1.0,rotationY:-3.2*dir,rotationX:2.2,x:-18*dir,y:10},{scale:1.075,rotationY:3.2*dir,rotationX:-1.4,x:18*dir,y:-14,duration:t1-t0+.6,ease:"none",immediateRender:true},t0);
  const kids=[...inner.children].filter(k=>!k.classList.contains("src")||true);
  const items=kids.slice(0);
  // skip the torn newspaper patches (they are the first children with overflow hidden and no id) -> animate them as background fade
  const bg=items.filter(k=>k.style.opacity&&k.style.overflow==="hidden"&&k.style.background.indexOf("243, 235, 214")>-1||k.style.background&&k.style.background.indexOf("rgb(243, 235, 214)")>-1);
  bg.forEach(b=>tl.fromTo(b,{opacity:0},{opacity:.9,duration:.8,immediateRender:true},t0+.1));
  const fg=items.filter(k=>bg.indexOf(k)<0);
  const span=Math.max(1.4,(t1-t0)*.55),gap=span/Math.max(1,fg.length-1);
  fg.forEach((k,i)=>{
    const at=(ov&&ov[i]!==undefined)?ov[i]:t0+.15+i*gap;
    const isSw=k.classList.contains("swash"),isH=k.classList.contains("h"),isArrow=k.tagName==="svg"&&k.style.zIndex==="4";
    const isStampHid=k.id==="launch";
    if(isSw)tl.fromTo(k,{scaleX:0,transformOrigin:"0% 50%"},{scaleX:1,duration:.5,ease:"power3.out",immediateRender:true},at);
    else if(isH)tl.fromTo(k,{opacity:0,y:44},{opacity:1,y:0,duration:.55,ease:"power3.out",immediateRender:true},at+.05);
    else if(isArrow)tl.fromTo(k,{clipPath:"inset(0 100% 0 0)"},{clipPath:"inset(0 0% 0 0)",duration:.7,ease:"power2.inOut",immediateRender:true},at);
    else tl.fromTo(k,{opacity:0,y:40,scale:.9},{opacity:1,y:0,scale:1,duration:.5,ease:"back.out(1.6)",immediateRender:true},at);
    // keep every element visible until the scene ends (scene fade handles exit)
  });
});
// count-up 0 -> 1,000,000
const co={v:0};tl.to(co,{v:1000000,duration:1.9,ease:"power2.out",onUpdate(){document.getElementById("cnt").textContent=Math.round(co.v).toLocaleString("en-US")}},26.8);
// captions
(function(){const wrap=document.getElementById("capwrap");
 CAPS.forEach(c=>{const e=document.createElement("div");e.className="strip";e.innerHTML=c.words.map(w=>`<span>${w.w}</span>`).join(" ");wrap.appendChild(e);const sp=[...e.children];
  tl.fromTo(e,{opacity:0,y:14,scale:.97},{opacity:1,y:0,scale:1,duration:.16,ease:"power2.out",immediateRender:true},c.t0);tl.set(e,{opacity:0},c.t1);
  c.words.forEach((w,i)=>{tl.set(sp[i],{backgroundColor:"#FFD93B",color:"#15130f"},w.t);if(i<c.words.length-1)tl.set(sp[i],{backgroundColor:"rgba(255,217,59,0)",color:"#F6EFD9"},c.words[i+1].t);else tl.set(sp[i],{backgroundColor:"rgba(255,217,59,0)",color:"#F6EFD9"},c.t1-.05)})})})();
tl.fromTo("#launch",{opacity:0,scale:1.6},{opacity:.9,scale:1,duration:.35,ease:"power3.out",immediateRender:true},22.6);
window.__timelines=window.__timelines||{};window.__timelines["main"]=tl;tl.seek(0);
'''.replace("__SC__", json.dumps([[n, a, b, {str(k): v for k, v in o.items()}] for n, a, b, o in SC])).replace("__CAPS__", json.dumps(CAPS, ensure_ascii=False))

html = f'''<!doctype html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=1080, height=1920"/>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<style>@font-face{{font-family:'Didot';src:local('Didot')}}@font-face{{font-family:'Helvetica Neue';src:local('Helvetica Neue')}}@font-face{{font-family:'Marker Felt';src:local('Marker Felt')}}@font-face{{font-family:'Georgia';src:local('Georgia')}}@font-face{{font-family:'Menlo';src:local('Menlo')}}
*{{margin:0;padding:0;box-sizing:border-box}}{css}</style></head><body>
<div id="root" data-composition-id="main" data-start="0" data-width="1080" data-height="1920" data-duration="{DUR}">
<div id="all" class="clip" data-start="0" data-duration="{DUR}" data-track-index="0" style="position:absolute;inset:0">
{defs}
{scene_html}
<div style="position:absolute;inset:0;pointer-events:none;z-index:40">{overlays}</div>
<div class="capwrap" id="capwrap"></div>
</div></div>
<script>{js}</script></body></html>'''
dest = os.path.expanduser("~/claude-video/engines/hyperframes-app/compositions/insta-origin.html")
open(dest, "w").write(html)
print("wrote", dest, len(html))
