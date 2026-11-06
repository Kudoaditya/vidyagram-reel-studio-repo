#!/usr/bin/env python3
"""Mix voiceover + CC0 SFX kit, loudnorm -14 LUFS / TP -2, mux onto a rendered MP4.
usage: mix_sfx.py voice.mp3 video.mp4 out.mp4 cues.json
cues.json: {"whoosh":[t,..],"pop":[..],"impact":[..],"click":[..],"tick":[..]}"""
import sys,json,os,subprocess,tempfile
voice,video,out,cj=sys.argv[1:5]
MIX=os.path.join(tempfile.gettempdir(),"_mix.wav")
K=os.path.expanduser("~/.claude/skills/sound-effects/sfx/kit/")
G={"whoosh":-27,"pop":-20,"tick":-22,"impact":-17,"click":-20,"riser":-18}
cues=[(n,t) for n,ts in json.load(open(cj)).items() for t in ts]
ins=["-i",voice];fl=["[0:a]volume=0dB[v]"];labs=["[v]"]
for i,(n,t) in enumerate(cues):
    ins+=["-i",K+n+".ogg"];d=max(0,int(t*1000));fl.append(f"[{i+1}:a]volume={G[n]}dB,adelay={d}|{d}[s{i}]");labs.append(f"[s{i}]")
fl.append("".join(labs)+f"amix=inputs={len(labs)}:normalize=0:duration=first,loudnorm=I=-14:TP=-2:LRA=11[m]")
subprocess.run(["ffmpeg","-loglevel","error","-y",*ins,"-filter_complex",";".join(fl),"-map","[m]","-ar","48000",MIX],check=True)
subprocess.run(["ffmpeg","-loglevel","error","-y","-i",video,"-i",MIX,"-map","0:v","-map","1:a","-c:v","copy","-c:a","aac","-b:a","192k","-shortest",out],check=True)
r=subprocess.run(["ffmpeg","-nostats","-i",out,"-af","ebur128=peak=true","-f","null","-"],capture_output=True,text=True).stderr
print([l.strip() for l in r.splitlines() if "I:" in l or "Peak:" in l][-2:])
