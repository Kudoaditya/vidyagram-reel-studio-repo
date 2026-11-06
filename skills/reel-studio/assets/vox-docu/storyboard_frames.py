import os, subprocess, glob, random
random.seed(11)
D=os.path.dirname(os.path.abspath(__file__));A="file://~/claude-video/assets/insta/"
CH=sorted(glob.glob(os.path.expanduser("~/.cache/puppeteer/chrome-headless-shell/*/*/chrome-headless-shell")))[-1]
W="the of and to in a that is was for on with as by at from his her it said app users photo check people later first new year company founder launch million city mobile network share picture software social filter feed phone news report market rapid growth deal sold bought service company shortly after release friends location venture seed funding team build idea early public".split()
def news(cols=5,rows=118,x0=-20,w=240):
    out=""
    for c in range(cols):
        t=""
        for r in range(rows):
            if r%17==3: t+=f'<div style="font:900 21px/1.05 Georgia;color:rgba(20,15,5,.55);margin:6px 0 4px">{" ".join(random.choice(W).upper() for _ in range(random.randint(2,4)))}</div>'
            t+='<div style="font:13px/1.28 Georgia;color:rgba(20,15,5,.30);white-space:nowrap;overflow:hidden">'+" ".join(random.choice(W) for _ in range(random.randint(7,9)))+"</div>"
        out+=f'<div class="a" style="left:{x0+c*(w+8)}px;top:-10px;width:{w}px;height:1960px;overflow:hidden">{t}</div>'
    return f'<div class="a" style="inset:0;overflow:hidden;opacity:.85">{out}</div>'
def patch(x,y,w,h,rot=0,op=.9):
    cols=max(1,int(w//200)+1)
    return f'<div class="a" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px;transform:rotate({rot}deg);overflow:hidden;opacity:{op};{TORN};background:#F3EBD6">'+news(cols,int(h/17)+3,0,190).replace('inset:0','left:0;top:0;width:100%;height:100%').replace('height:1960px',f'height:{h+30}px')+'</div>'
PATCHES={"v1":[(-60,330,430,420,-3),(700,1000,420,330,4)],"v2":[(560,380,520,300,3),(-40,1020,380,300,-4)],"v3":[(-50,420,330,380,-2),(740,1060,360,300,3)],
"v4":[(-30,1010,420,330,3),(660,360,440,260,-3)],"v5":[(-50,380,380,340,-3),(700,1040,420,310,4)],"v6":[(-40,1000,430,330,-3),(640,330,460,250,3)],
"v7":[(700,380,420,300,3),(-50,1000,420,320,-4)],"v8":[(-40,400,380,340,-3),(680,1050,440,300,3)]}
NEWS=''
GRID="<div class='a' style='inset:0;background-image:linear-gradient(rgba(70,90,130,.10) 1px,transparent 1px),linear-gradient(90deg,rgba(70,90,130,.10) 1px,transparent 1px);background-size:44px 44px'></div>"
GRAIN="<svg class='a' style='left:0;top:0;pointer-events:none;mix-blend-mode:multiply;opacity:.5' width='1080' height='1920'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' seed='7'/><feColorMatrix values='0 0 0 0 .35  0 0 0 0 .3  0 0 0 0 .22  0 0 0 .45 0'/></filter><rect width='1080' height='1920' filter='url(#g)'/></svg>"
CREASE="<svg class='a' style='left:0;top:0;pointer-events:none;mix-blend-mode:multiply;opacity:.22' width='1080' height='1920'><filter id='c'><feTurbulence type='turbulence' baseFrequency='.004 .02' numOctaves='3' seed='5'/><feColorMatrix values='0 0 0 0 .3  0 0 0 0 .27  0 0 0 0 .2  0 0 0 1.4 -.35'/></filter><rect width='1080' height='1920' filter='url(#c)'/></svg>"
RF="<svg width='0' height='0' class='a'><filter id='r'><feTurbulence baseFrequency='.03' numOctaves='2' seed='4'/><feDisplacementMap in='SourceGraphic' scale='5'/></filter><filter id='r2'><feTurbulence baseFrequency='.05' numOctaves='2' seed='9'/><feDisplacementMap in='SourceGraphic' scale='9'/></filter></svg>"
TORN="clip-path:polygon(0 2%,5% 0,12% 2.5%,22% 0,34% 2%,46% 0,58% 2.5%,70% 0,82% 2%,93% 0,100% 2.5%,100% 97%,93% 100%,82% 97.5%,68% 100%,54% 97%,40% 100%,26% 97.5%,12% 100%,4% 97%,0 100%)"
OUT="filter:drop-shadow(7px 0 0 #FFD93B) drop-shadow(-7px 0 0 #FFD93B) drop-shadow(0 7px 0 #FFD93B) drop-shadow(0 -7px 0 #FFD93B) drop-shadow(9px 12px 0 rgba(40,25,5,.3))"
CSS=f""".a{{position:absolute}}.m{{font-family:Menlo,monospace}}
.h{{left:100px;width:880px;text-align:center;font:800 92px/1.02 'Didot','Bodoni 72',Georgia,serif;letter-spacing:-.02em;color:#15130f;top:262px;z-index:5}}
.swash{{position:absolute;background:#FFD93B;clip-path:polygon(0 30%,3% 10%,10% 22%,22% 4%,40% 14%,60% 2%,80% 12%,100% 0,98% 40%,100% 70%,97% 100%,80% 88%,60% 100%,40% 86%,20% 98%,6% 84%,0 100%,2% 60%);filter:url(#r)}}
.paper{{background:#FBF6E8;{TORN}}}.pw{{filter:drop-shadow(8px 12px 0 rgba(40,25,5,.28))}}
.duo{{position:relative;overflow:hidden;background:#222}}.duo img{{width:100%;height:100%;object-fit:cover;object-position:50% 18%;filter:grayscale(1) contrast(1.3) brightness(1.05);display:block}}
.duo:after{{content:"";position:absolute;inset:0;background-image:radial-gradient(rgba(0,0,0,.6) 24%,transparent 26%);background-size:6px 6px;mix-blend-mode:multiply;opacity:.5}}
.tape{{width:150px;height:44px;background:rgba(240,225,160,.82);box-shadow:0 2px 0 rgba(0,0,0,.12)}}
.stamp{{color:#C8281D;border:7px solid #C8281D;padding:8px 18px;font:900 44px 'Helvetica Neue';letter-spacing:.04em;filter:url(#r2);opacity:.9}}
.lbl{{background:#15130f;color:#F6EFD9;font:800 26px 'Helvetica Neue';padding:8px 14px;letter-spacing:.04em}}
.hand{{font:700 42px 'Marker Felt','Bradley Hand',cursive;color:#15130f}}
.cap{{left:0;top:1385px;width:1080px;display:flex;justify-content:center;z-index:9}}
.cap .strip{{background:#15130f;color:#F6EFD9;font:800 40px 'Helvetica Neue';padding:16px 34px;white-space:nowrap;clip-path:polygon(0 8%,3% 0,97% 6%,100% 0,100% 92%,97% 100%,3% 94%,0 100%);box-shadow:0 0 0 4px #15130f}}
.cap .hot{{background:#FFD93B;color:#15130f;padding:2px 10px;margin:0 2px;border-radius:5px;display:inline-block;transform:rotate(-1.2deg)}}
.src{{left:120px;width:840px;text-align:center;top:1338px;font:600 18px Menlo;color:#5c5139}}"""
# --- line-art engravings
ST='fill="none" stroke="#2a2418" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"'
def hatch(x,y,w,h,n=10,a=-30): return "".join(f'<path d="M{x+i*w/n} {y+h}L{x+i*w/n+h*0.5} {y}" stroke="#2a2418" stroke-width="1.6" opacity=".7"/>' for i in range(n))
CAM=f'<svg width="260" height="200" viewBox="0 0 260 200" {ST}><rect x="20" y="60" width="210" height="110" rx="10" fill="#f3ecd6"/><rect x="20" y="95" width="210" height="48" fill="#cfc4a3" opacity=".6"/><circle cx="125" cy="115" r="46" fill="#e4dcc2"/><circle cx="125" cy="115" r="32"/><circle cx="125" cy="115" r="18" fill="#2a2418" opacity=".85"/><rect x="50" y="38" width="46" height="24" rx="4" fill="#f3ecd6"/><rect x="170" y="42" width="34" height="18" fill="#f3ecd6"/><path d="M30 80H70M185 80H220"/>{hatch(26,150,200,18,18)}</svg>'
PHONE=f'<svg width="170" height="300" viewBox="0 0 170 300" {ST}><rect x="14" y="10" width="142" height="280" rx="24" fill="#f3ecd6"/><rect x="30" y="44" width="110" height="170" rx="6" fill="#e9e1c8"/><circle cx="85" cy="250" r="16"/><path d="M60 24H110"/>{hatch(34,48,100,160,12)}</svg>'
GLASS=f'<svg width="180" height="260" viewBox="0 0 180 260" {ST}><path d="M30 30H150L136 170H44Z" fill="#f1e1b4"/><path d="M38 90H142L136 170H44Z" fill="#c98e3d" opacity=".75"/><path d="M90 170V225M50 232H130"/><path d="M52 60L60 78M70 52L80 74" opacity=".6"/></svg>'
BLDG=f'<svg width="230" height="320" viewBox="0 0 230 320" {ST}><path d="M40 300V60L130 20V300Z" fill="#efe7cf"/><path d="M130 300V50L200 80V300Z" fill="#d8cdaa"/>'+"".join(f'<path d="M{54+(i%2)*38} {80+(i//2)*40}h24M{146+(i%2)*26} {100+(i//2)*40}h14" />' for i in range(12))+f'{hatch(134,60,60,230,6)}</svg>'
COINS=f'<svg width="240" height="170" viewBox="0 0 240 170" {ST}>'+"".join(f'<ellipse cx="{80+i*8}" cy="{140-i*18}" rx="70" ry="20" fill="#efe1a0"/><path d="M10 {140-i*18}v14a70 20 0 0 0 140 0v-14" fill="#d9c673"/>' for i in range(4))+'<ellipse cx="180" cy="110" rx="46" ry="46" fill="#efe1a0"/><text x="180" y="124" font-size="44" font-weight="900" text-anchor="middle" fill="#2a2418" stroke="none" font-family="Georgia">$</text></svg>'
PIN='<svg width="90" height="120" viewBox="0 0 90 120"><path d="M45 6a34 34 0 0 1 34 34c0 28-34 74-34 74S11 68 11 40A34 34 0 0 1 45 6z" fill="#E0302A" stroke="#15130f" stroke-width="5"/><circle cx="45" cy="40" r="12" fill="#fff"/></svg>'
CAL=f'<svg width="200" height="210" viewBox="0 0 200 210" {ST}><rect x="14" y="26" width="172" height="170" rx="10" fill="#fbf6e8"/><rect x="14" y="26" width="172" height="40" fill="#E0302A"/><path d="M52 10v30M148 10v30"/><text x="100" y="152" font-size="86" font-weight="900" text-anchor="middle" fill="#15130f" stroke="none" font-family="Didot,Georgia">2</text><text x="100" y="182" font-size="24" font-weight="800" text-anchor="middle" fill="#15130f" stroke="none" font-family="Helvetica Neue">MONTHS</text></svg>'
def arrow(x,y,w,h,d,col="#F26A1B",head=""): return f'<svg class="a" style="left:{x}px;top:{y}px;z-index:4" width="{w}" height="{h}" viewBox="0 0 {w} {h}" fill="none"><path d="{d}" stroke="{col}" stroke-width="7" stroke-dasharray="14 12" stroke-linecap="round"/>{head}</svg>'
def head_(x,y,a): return f'<path d="M{x-26} {y-18}L{x} {y}L{x-22} {y+24}" stroke="#F26A1B" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" transform="rotate({a} {x} {y})"/>'
def circle(x,y,w,h,rot=-6): return f'<svg class="a" style="left:{x}px;top:{y}px;z-index:4;filter:url(#r)" width="{w}" height="{h}" viewBox="0 0 {w} {h}" fill="none"><ellipse cx="{w/2}" cy="{h/2}" rx="{w/2-8}" ry="{h/2-8}" stroke="#E0302A" stroke-width="7" transform="rotate({rot} {w/2} {h/2})"/><ellipse cx="{w/2}" cy="{h/2}" rx="{w/2-16}" ry="{h/2-14}" stroke="#E0302A" stroke-width="4" opacity=".6" transform="rotate({rot+5} {w/2} {h/2})"/></svg>'
def dot(x,y,r=60): return f'<div class="a" style="left:{x}px;top:{y}px;width:{r*2}px;height:{r*2}px;border-radius:50%;background:#E0302A"></div>'
def badge(x,y,r,inner): return f'<div class="a" style="left:{x}px;top:{y}px;width:{r*2}px;height:{r*2}px;border-radius:50%;background:#FFD93B;border:6px solid #15130f;display:flex;align-items:center;justify-content:center;z-index:3;box-shadow:8px 10px 0 rgba(40,25,5,.3)">{inner}</div>'
def clip(x,y,w,txt,rot,size=30): return f'<div class="a paper pw" style="left:{x}px;top:{y}px;width:{w}px;padding:20px 22px;font:900 {size}px/1.15 Georgia;color:#2a2418;transform:rotate({rot}deg);z-index:2">{txt}</div>'
def title(t,sw=(0,0)): return f'<div class="swash" style="left:{sw[0]}px;top:{sw[1]}px;width:{sw[2] if len(sw)>2 else 700}px;height:84px;z-index:4"></div><div class="a h">{t}</div>'
def page(n,body): open(f"{D}/{n}.html","w").write('<!doctype html><meta charset=utf-8><style>*{margin:0;padding:0;box-sizing:border-box}body{width:1080px;height:1920px;overflow:hidden;position:relative;background:#EFE9D8}'+CSS+'</style><body>'+RF+GRID+''.join(patch(*p) for p in PATCHES[n])+body+CREASE+GRAIN+'</body>')
def cap(pre,hot,post=""): return f'<div class="a cap"><div class="strip">{pre} <span class="hot">{hot}</span> {post}</div></div>'
def swash_for(x,y,w): return f'<div class="swash" style="left:{x}px;top:{y}px;width:{w}px;height:78px;z-index:4"></div>'
IGLOGO=f'<img src="{A}ig2016.png" style="width:210px">'
# 1
page("v1",swash_for(220,298,640)+'<div class="a h">Not A Photo App</div>'
 +badge(330,560,210,f'<img src="{A}ig2016.png" style="width:250px">')
 +circle(280,520,520,520,-5)+'<div class="a hand" style="left:690px;top:520px;z-index:6;transform:rotate(8deg);font-size:80px;color:#E0302A">?</div>'
 +f'<div class="a" style="left:100px;top:860px;z-index:3">{CAM}</div>'
 +arrow(230,830,240,120,"M10 100C60 40 120 20 220 10",head=head_(220,10,-15))
 +clip(620,1040,340,"SOCIAL CHECK-IN APP SEEKS USERS",3,27)+clip(120,1130,400,"“Where are you right now?”",-3,27)
 +dot(-40,1300,70)+dot(930,300,40)+cap("Instagram pehle","photo app","thi hi nahi"))
# 2
page("v2",swash_for(205,298,670)+'<div class="a h">Before Instagram…</div>'
 +f'<div class="a pw" style="left:150px;top:560px;width:780px;height:330px;z-index:3"><div class="paper" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center"><img src="{A}burbn.png" style="width:600px;filter:contrast(1.3)"></div></div>'
 +'<div class="a tape" style="left:160px;top:545px;transform:rotate(-8deg);z-index:5"></div><div class="a tape" style="left:770px;top:550px;transform:rotate(7deg);z-index:5"></div>'
 +f'<div class="a" style="left:90px;top:930px;z-index:3">{GLASS}</div>'
 +arrow(260,960,430,200,"M10 120C130 30 260 50 400 130",head=head_(400,130,25))
 +badge(700,960,115,'<div style="font:900 56px Didot,Georgia;text-align:center;line-height:1">2009</div>')
 +clip(300,1130,360,"BOURBON → BURBN",-3,30)
 +dot(920,1180,55)+cap("iska pehla naam tha","Burbn"))
# 3
MAPSVG='<svg width="700" height="520" viewBox="0 0 700 520" fill="none"><rect x="10" y="10" width="680" height="500" fill="#E4D9B7" stroke="#15130f" stroke-width="7"/><path d="M10 170H690M10 330H690M200 10V510M430 10V510" stroke="#BFB28A" stroke-width="7"/><path d="M40 480C150 380 240 400 320 300S520 160 660 90" stroke="#E0302A" stroke-width="9" stroke-dasharray="4 22" stroke-linecap="round"/></svg>'
page("v3",swash_for(250,298,590)+'<div class="a h">Check In. Show Off.</div>'
 +f'<div class="a pw" style="left:230px;top:540px;z-index:3;transform:perspective(1300px) rotateX(24deg) rotateY(-14deg) rotate(-2deg)">{MAPSVG}</div>'
 +f'<div class="a" style="left:260px;top:700px;z-index:4">{PIN}</div><div class="a" style="left:520px;top:600px;z-index:4">{PIN}</div><div class="a" style="left:680px;top:760px;z-index:4">{PIN}</div>'
 +circle(500,570,150,190,-6)+f'<div class="a" style="left:110px;top:900px;z-index:3;transform:rotate(-8deg)">{PHONE}</div>'
 +arrow(260,1010,360,230,"M10 200C100 220 230 160 340 50",head=head_(340,50,-35))
 +'<div class="a paper pw hand" style="left:620px;top:1090px;width:330px;padding:24px;transform:rotate(4deg);z-index:3;background:#FFE98A;font-size:40px">“Main yahan hoon!”</div>'
 +cap("log bata sakte the ki","wo kahan hain"))
# 4
page("v4",swash_for(300,298,480)+'<div class="a h">Two Founders</div>'
 +f'<div class="a" style="left:90px;top:520px;width:440px;height:580px;transform:rotate(-4deg);z-index:3;{OUT}"><div class="duo" style="width:100%;height:100%;{TORN}"><img src="{A}systrom.jpg"></div></div>'
 +f'<div class="a" style="left:560px;top:570px;width:440px;height:580px;transform:rotate(4deg);z-index:3;{OUT}"><div class="duo" style="width:100%;height:100%;{TORN}"><img src="{A}krieger.jpg"></div></div>'
 +'<div class="a lbl" style="left:120px;top:1100px;z-index:6;transform:rotate(-3deg)">KEVIN SYSTROM</div><div class="a lbl" style="left:620px;top:1150px;z-index:6;transform:rotate(3deg)">MIKE KRIEGER</div>'
 +clip(360,1180,330,"ONE BIG DECISION",-2,28)
 +'<div class="a src">Photos: Christopher Michel · CC BY 2.0 / CC BY-SA 4.0 · Wikimedia Commons</div>'+cap("founders ne","baaki sab hata diya"))
# 5
page("v5",swash_for(160,298,760)+'<div class="a h">1 Million. 2 Months.</div>'
 +'<div class="a" style="left:100px;width:880px;top:450px;text-align:center;font:900 210px/1 Didot,Georgia,serif;letter-spacing:-.04em;color:#15130f;z-index:3">1,000,000</div>'
 +f'<div class="a paper pw" style="left:120px;top:710px;width:840px;height:200px;padding:16px;z-index:3;overflow:hidden"><div style="width:100%;height:100%;overflow:hidden;position:relative"><img src="{A}wiki-million.png" style="position:absolute;left:-610px;top:-62px;width:1500px;mix-blend-mode:multiply"></div></div>'
 +f'<div class="a" style="left:60px;top:960px;z-index:4;transform:rotate(-6deg)">{CAL}</div>'
 +'<svg class="a" style="left:520px;top:960px;z-index:3" width="460" height="330" viewBox="0 0 460 330" fill="none"><g stroke="#15130f" stroke-width="6"><rect x="20" y="230" width="70" height="80" fill="#D8CDAA"/><rect x="120" y="190" width="70" height="120" fill="#D8CDAA"/><rect x="220" y="130" width="70" height="180" fill="#D8CDAA"/><rect x="320" y="30" width="80" height="280" fill="#FFD93B"/></g><path d="M20 210C150 190 230 120 380 14" stroke="#E0302A" stroke-width="7" stroke-dasharray="12 12" stroke-linecap="round"/></svg>'
 +circle(110,425,860,240,-1)+'<div class="a src">source: Wikipedia · "Instagram"</div>'+cap("sirf do mahine me","ek million users"))
# 6
page("v6",swash_for(260,298,560)+'<div class="a h">The $1 Billion Deal</div>'
 +f'<div class="a" style="left:80px;top:520px;width:420px;height:560px;transform:rotate(-4deg);z-index:3;{OUT}"><div class="duo" style="width:100%;height:100%;{TORN}"><img src="{A}zuckerberg.jpg"></div></div>'
 +'<div class="a" style="left:530px;top:500px;width:430px;font:900 138px/.92 Didot,Georgia,serif;letter-spacing:-.04em;color:#15130f;z-index:3">$1<br>billion</div>'
 +f'<div class="a" style="left:530px;top:850px;z-index:3">{COINS}</div>'
 +'<div class="a stamp" style="left:690px;top:1100px;transform:rotate(-6deg);z-index:5;font-size:38px">APRIL 2012</div>'
 +f'<div class="a" style="left:740px;top:690px;z-index:2;opacity:.0">{BLDG}</div>'
 +badge(760,860,95,f'<img src="{A}meta.png" style="width:115px">')
 +'<div class="a lbl" style="left:110px;top:1110px;background:#1877F2;z-index:6">MARK ZUCKERBERG · FACEBOOK CEO</div>'+clip(110,1170,400,"FACEBOOK BUYS INSTAGRAM",-2,28)
 +'<div class="a src">Photo: The White House · public domain · Wikimedia Commons</div>'+cap("Facebook ne ise","ek billion dollar","me khareeda"))
# 7
page("v7",swash_for(250,298,590)+'<div class="a h">Follow The Users</div>'
 +'<svg class="a" style="left:100px;top:520px;z-index:3" width="880" height="740" viewBox="0 0 880 740" fill="none"><g style="transform:perspective(1300px) rotateX(16deg) rotateY(-14deg);transform-origin:440px 560px" stroke="#15130f" stroke-width="6"><rect x="60" y="470" width="150" height="230" fill="#D8CDAA"/><rect x="260" y="570" width="150" height="130" fill="#D8CDAA"/><rect x="460" y="270" width="150" height="430" fill="#FFD93B"/><rect x="660" y="520" width="150" height="180" fill="#D8CDAA"/></g><circle cx="560" cy="170" r="140" stroke="#15130f" stroke-width="14" fill="rgba(255,255,255,.4)"/><path d="M660 270L780 390" stroke="#15130f" stroke-width="24" stroke-linecap="round"/></svg>'
 +f'<div class="a" style="left:-20px;top:520px;z-index:4;transform:rotate(-8deg) scale(.8);opacity:.95">{PHONE}</div>'
 +circle(520,770,240,450,-3)+clip(560,1235,400,"WHAT ARE PEOPLE USING?",2,29)
 +arrow(180,1180,380,120,"M10 90C120 20 250 20 360 50",head=head_(360,50,15))+cap("dekho log","kya use kar rahe hain"))
# 8
dots="".join(f'<circle cx="{110+(i%5)*125}" cy="{70+(i//5)*115}" r="42" fill="#D8CDAA" stroke="#15130f" stroke-width="5"/>' for i in range(15))
page("v8",swash_for(330,298,420)+'<div class="a h">Your Turn</div>'
 +f'<svg class="a" style="left:190px;top:500px;z-index:3" width="700" height="400" viewBox="0 0 700 400" fill="none">{dots}<circle cx="360" cy="185" r="94" fill="#FFD93B" stroke="#15130f" stroke-width="9"/></svg>'
 +circle(420,560,260,260,-4)
 +'<div class="a paper pw" style="left:120px;top:1010px;width:840px;padding:34px;display:flex;gap:26px;align-items:center;z-index:3"><div style="width:84px;height:84px;border-radius:42px;background:#E0302A;flex:none"></div><div style="font:800 38px/1.3 \'Helvetica Neue\'">Kis cheez ko chhod ke sirf ek par focus kar sakte ho?</div></div>'
 +dot(930,330,34)+cap("comment me","batao"))
for k in range(1,9):
    f=f"{D}/v{k}";subprocess.run([CH,"--no-sandbox","--hide-scrollbars","--allow-file-access-from-files","--window-size=1080,1920",f"--screenshot={f}.png",f"file://{f}.html"],check=True,capture_output=True)
print("ok")
