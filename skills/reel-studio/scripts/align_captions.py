#!/usr/bin/env python3
"""Align the SCRIPT text (truth for spelling) to Whisper word timestamps -> caption chunks JSON.
usage: align_captions.py script.txt whisper_words.json out.json
whisper_words.json: [{"w": "word", "s": start_seconds}, ...]  (merge segments' words; re-transcribe weak spans with clip_timestamps)
out: [{"t0","t1","words":[{"w","t"}]}]  (<=4 words / <=26 chars / break on punctuation)"""
import sys,re,json,difflib
script,wj,out=sys.argv[1:4]
toks=open(script).read().split()
W=[(w["w"].strip(),w["s"]) for w in json.load(open(wj))]
norm=lambda x:re.sub(r"[^\wऀ-ॿ]","",x.lower())
n,m=len(toks),len(W);gap=-.35
sc=[[0]*(m+1) for _ in range(n+1)];bt=[[0]*(m+1) for _ in range(n+1)]
for i in range(1,n+1):sc[i][0]=i*gap;bt[i][0]=1
for j in range(1,m+1):sc[0][j]=j*gap;bt[0][j]=2
for i in range(1,n+1):
    for j in range(1,m+1):
        r=difflib.SequenceMatcher(None,norm(toks[i-1]),norm(W[j-1][0])).ratio()
        sc[i][j],bt[i][j]=max((sc[i-1][j-1]+r-.35,0),(sc[i-1][j]+gap,1),(sc[i][j-1]+gap,2))
i,j=n,m;mp={}
while i>0 or j>0:
    b=bt[i][j]
    if i>0 and j>0 and b==0: mp[i-1]=W[j-1][1];i-=1;j-=1
    elif i>0 and (b==1 or j==0): i-=1
    else: j-=1
ts=[mp.get(k) for k in range(n)]
for k in range(n):
    if ts[k] is None:
        p=next((q for q in range(k-1,-1,-1) if ts[q] is not None),None);nx=next((q for q in range(k+1,n) if ts[q] is not None),None)
        a=ts[p] if p is not None else 0;pi=p if p is not None else -1
        ts[k]=a+.2 if nx is None else a+(ts[nx]-a)*(k-pi)/(nx-pi)
for k in range(1,n):
    if ts[k]<=ts[k-1]: ts[k]=ts[k-1]+.12
chunks=[];cur=[]
for k,t in enumerate(toks):
    cur.append((t,ts[k]))
    if re.search(r"[,।.!?…]$",t) or len(cur)>=4 or sum(len(x[0]) for x in cur)>26: chunks.append(cur);cur=[]
if cur:chunks.append(cur)
res=[{"t0":round(c[0][1],2),"words":[{"w":w.replace("।",""),"t":round(t,2)} for w,t in c]} for c in chunks]
for k,c in enumerate(res):
    nxt=res[k+1]["t0"] if k+1<len(res) else 999
    c["t1"]=round(min(nxt-.02,c["words"][-1]["t"]+.7),2)
json.dump(res,open(out,"w"),ensure_ascii=False)
print(len(res),"chunks ->",out)
