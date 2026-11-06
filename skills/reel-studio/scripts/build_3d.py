#!/usr/bin/env python3
"""Fill the 3D Studio template.  usage:
build_3d.py <out.html> --captions captions.json --icon cap=path.png --icon vn=path.png ...
Writes the composition (default template: assets/3d-studio/template.html). Edit the scene blocks in the OUTPUT afterwards."""
import sys,json,base64,argparse,os
ap=argparse.ArgumentParser();ap.add_argument("out");ap.add_argument("--captions");ap.add_argument("--icon",action="append",default=[]);ap.add_argument("--template",default=os.path.expanduser("~/.claude/skills/reel-studio/assets/3d-studio/template.html"))
a=ap.parse_args()
s=open(a.template).read()
icons={}
for it in a.icon:
    k,p=it.split("=",1);icons[k]="data:image/png;base64,"+base64.b64encode(open(os.path.expanduser(p),"rb").read()).decode()
s=s.replace("__ICONS__",json.dumps(icons))
s=s.replace("__CAPS__",open(a.captions).read() if a.captions else "[]")
open(a.out,"w").write(s);print("wrote",a.out,len(s))
