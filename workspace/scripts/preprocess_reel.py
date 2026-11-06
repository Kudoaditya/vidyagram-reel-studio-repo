#!/usr/bin/env python3
"""Preprocess a raw reel for the 9:16 pipeline.

  1. normalize  — any input (iPhone HEVC .mov, variable frame rate, rotated) → constant-fps H.264/AAC MP4
  2. cut        — remove dead air. Default "speech" mode uses voice detection (Silero VAD), so a
                  music bed or quiet talking doesn't fool it. "loudness" uses auto-editor's volume threshold.
  3. transcribe — faster-whisper word-level timestamps on the CUT video
  4. captions   — corrections applied, Remotion captions.json written

Usage:
    ./vp preprocess my_reel.mp4
    ./vp preprocess my_reel.mov --vocab "HyperFrames, Remotion, Revideo" --model medium
    ./vp preprocess my_reel.mp4 --cut loudness --threshold 6%
    ./vp preprocess my_reel.mp4 --cut none            # keep every frame, just transcribe
    ./vp captions my_reel                              # rebuild captions.json after editing transcript.json

Outputs (./processed_audio/<stem>/):
    <stem>_cut.mp4    jump-cut, normalized video  ← all timestamps refer to THIS file
    transcript.json   {source, video, fps, language, duration, text, segments[], words[]}
    transcript.txt    human-readable word list with times, for proofreading
    captions.json     @remotion/captions Caption[]
    corrections.json  (optional, you create it) {"wrong": "right", ...} — also ./corrections.json globally
"""
import argparse
import json
import re
import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INPUT_DIR = ROOT / "input_raw"
OUTPUT_DIR = ROOT / "processed_audio"
SAMPLE_RATE = 16000


def die(msg: str) -> None:
    sys.exit(f"error: {msg}")


def tool(name: str) -> str:
    exe = ".exe" if os.name == "nt" else ""
    venv_bin = ROOT / ".venv" / ("Scripts" if os.name == "nt" else "bin")
    for candidate in (venv_bin / f"{name}{exe}", ROOT / "bin" / f"{name}{exe}"):
        if candidate.exists():
            return str(candidate)
    found = shutil.which(name)
    if not found:
        die(f"{name} not found — run `./vp setup`")
    return found


def run(cmd: list[str], label: str) -> None:
    print(f"  → {label}")
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        die(f"{label} failed:\n{res.stderr[-2000:]}")


def resolve_input(arg: str) -> Path:
    p = Path(arg).expanduser()
    for candidate in (p, INPUT_DIR / p, INPUT_DIR / p.name):
        if candidate.is_file():
            return candidate.resolve()
    die(f"input not found: {arg} (looked in the current folder and {INPUT_DIR})")


def probe(path: Path) -> dict:
    res = subprocess.run(
        [tool("ffprobe"), "-v", "error", "-print_format", "json", "-show_streams", "-show_format", str(path)],
        capture_output=True, text=True)
    if res.returncode != 0:
        die(f"cannot read {path.name} — is it a video file?\n{res.stderr}")
    return json.loads(res.stdout)


def normalize(src: Path, dst: Path, fps: int, reframe: bool, wide: bool = False) -> None:
    info = probe(src)
    kinds = {s["codec_type"] for s in info["streams"]}
    if "video" not in kinds:
        die(f"{src.name} has no video stream")
    if "audio" not in kinds:
        die(f"{src.name} has no audio track — nothing to cut or transcribe")
    v = next(s for s in info["streams"] if s["codec_type"] == "video")
    print(f"[1/4] normalize {src.name}: {v.get('codec_name')} {v.get('width')}x{v.get('height')} "
          f"@ {v.get('avg_frame_rate')} → h264 {fps}fps CFR" + (", 1920x1080" if wide else ", 1080x1920" if reframe else ""))
    # ffmpeg auto-applies rotation metadata; fps filter makes VFR phone footage constant-rate.
    # reframe: center-crop to 9:16 (landscape/square footage), then scale to exactly 1080x1920.
    size = ("crop='min(iw,ih*16/9)':'min(ih,iw*9/16)',scale=1920:1080,setsar=1" if wide else
            "crop='min(iw,ih*9/16)':'min(ih,iw*16/9)',scale=1080:1920,setsar=1" if reframe
            else "scale=trunc(iw/2)*2:trunc(ih/2)*2")
    run([tool("ffmpeg"), "-y", "-v", "error", "-i", str(src),
         "-map", "0:v:0", "-map", "0:a:0",
         "-vf", f"fps={fps},{size},format=yuv420p",
         "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
         "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
         "-movflags", "+faststart", str(dst)], "ffmpeg normalize")


def speech_cut_ranges(video: Path, margin: float, min_silence: float) -> tuple[list[tuple[float, float]], float]:
    from faster_whisper.audio import decode_audio
    from faster_whisper.vad import VadOptions, get_speech_timestamps

    audio = decode_audio(str(video), sampling_rate=SAMPLE_RATE)
    total = len(audio) / SAMPLE_RATE
    speech = get_speech_timestamps(audio, VadOptions(
        min_silence_duration_ms=int(min_silence * 1000), speech_pad_ms=int(margin * 1000)))
    if not speech:
        die("no speech detected — use `--cut none` or `--cut loudness`")
    keep = [(s["start"] / SAMPLE_RATE, s["end"] / SAMPLE_RATE) for s in speech]
    cuts, cursor = [], 0.0
    for start, end in keep:
        if start - cursor >= min_silence:
            cuts.append((cursor, start))
        cursor = max(cursor, end)
    if total - cursor >= min_silence:
        cuts.append((cursor, total))
    return cuts, total


def cut(src: Path, dst: Path, mode: str, margin: float, min_silence: float, threshold: str) -> None:
    if mode == "none":
        print("[2/4] cut: skipped (--cut none)")
        shutil.copy2(src, dst)
        return
    cmd = [tool("auto-editor"), str(src), "--no-open", "--progress", "none", "-o", str(dst)]
    if mode == "loudness":
        print(f"[2/4] cut by loudness (threshold {threshold}, margin {margin}s)")
        cmd += ["--edit", f"audio:threshold={threshold}", "--margin", f"{margin}s"]
    else:
        ranges, total = speech_cut_ranges(src, margin, min_silence)
        removed = sum(b - a for a, b in ranges)
        print(f"[2/4] cut by speech detection: removing {len(ranges)} gaps, {removed:.1f}s of {total:.1f}s")
        if not ranges:
            shutil.copy2(src, dst)
            return
        cmd += ["--edit", "none"]
        for a, b in ranges:
            cmd += ["--cut-out", f"{a:.3f}s,{b:.3f}s"]
    run(cmd, "auto-editor")


def transcribe(video: Path, model_size: str, language: str | None, vocab: str | None) -> dict:
    from faster_whisper import WhisperModel

    print(f"[3/4] transcribe with faster-whisper '{model_size}' (first use downloads the model)")
    model = WhisperModel(model_size, device="auto", compute_type="int8")
    segments, info = model.transcribe(
        str(video), word_timestamps=True, vad_filter=True, language=language,
        # Vocabulary hints make names/jargon far more likely to be spelled right.
        initial_prompt=f"Glossary: {vocab}." if vocab else None, hotwords=vocab or None)
    seg_out = []
    for seg in segments:
        seg_out.append({
            "id": seg.id, "start": round(seg.start, 3), "end": round(seg.end, 3), "text": seg.text.strip(),
            "words": [{"word": w.word.strip(), "start": round(w.start, 3), "end": round(w.end, 3),
                       "probability": round(w.probability, 4)} for w in (seg.words or [])],
        })
    return {"language": info.language, "duration": round(info.duration, 3), "segments": seg_out}


def load_corrections(out_dir: Path) -> dict[str, str]:
    merged: dict[str, str] = {}
    for f in (ROOT / "corrections.json", out_dir / "corrections.json"):
        if f.exists():
            try:
                merged.update(json.loads(f.read_text()))
            except json.JSONDecodeError as e:
                die(f"{f} is not valid JSON: {e}")
    return merged


def apply_corrections(word: str, corrections: dict[str, str]) -> str:
    # Match on the bare word (case-insensitive), keep the original punctuation around it.
    m = re.match(r"^(\W*)(.*?)(\W*)$", word)
    lead, core, trail = m.groups() if m else ("", word, "")
    for wrong, right in corrections.items():
        if core.lower() == wrong.lower():
            return f"{lead}{right}{trail}"
    return word


def finalize(out_dir: Path) -> None:
    """Rebuild words/text/transcript.txt/captions.json from transcript.json segments + corrections."""
    tpath = out_dir / "transcript.json"
    if not tpath.exists():
        die(f"{tpath} not found — run `./vp preprocess` first")
    t = json.loads(tpath.read_text())
    corrections = load_corrections(out_dir)
    words = []
    for seg in t["segments"]:
        for w in seg["words"]:
            w["word"] = apply_corrections(w["word"], corrections)
        seg["text"] = " ".join(w["word"] for w in seg["words"]) or seg["text"]
        words.extend(seg["words"])
    t["words"] = words
    t["text"] = " ".join(s["text"] for s in t["segments"])
    tpath.write_text(json.dumps(t, indent=2, ensure_ascii=False))

    lines = [f"# {t.get('video', '')} — edit words in transcript.json (or add corrections.json), "
             "then run ./vp captions <stem>"]
    lines += [f"[{w['start']:7.2f} → {w['end']:7.2f}] {w['word']}" + ("   ← low confidence" if w["probability"] < 0.5 else "")
              for w in words]
    (out_dir / "transcript.txt").write_text("\n".join(lines) + "\n")

    captions = [{"text": (" " if i else "") + w["word"], "startMs": int(w["start"] * 1000),
                 "endMs": int(w["end"] * 1000), "timestampMs": int((w["start"] + w["end"]) / 2 * 1000),
                 "confidence": w["probability"]} for i, w in enumerate(words)]
    (out_dir / "captions.json").write_text(json.dumps(captions, indent=2, ensure_ascii=False))
    low = sum(1 for w in words if w["probability"] < 0.5)
    print(f"[4/4] captions: {len(words)} words, {len(corrections)} corrections rules, "
          f"{low} low-confidence words flagged in transcript.txt")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("input", help="video path, or filename inside ./input_raw (or a stem with --captions-only)")
    ap.add_argument("--cut", choices=["speech", "loudness", "none"], default="speech",
                    help="how to find dead air (default: speech — robust to background music)")
    ap.add_argument("--margin", type=float, default=0.15, help="seconds of padding kept around speech (default 0.15)")
    ap.add_argument("--min-silence", type=float, default=0.4, help="only cut pauses at least this long (default 0.4s)")
    ap.add_argument("--threshold", default="4%", help="loudness mode only: volume threshold (default 4%%)")
    ap.add_argument("--fps", type=int, default=30, help="output frame rate (default 30; use 60 for Reel60)")
    ap.add_argument("--no-reframe", action="store_true", help="keep the original size instead of 1080x1920 center-crop")
    ap.add_argument("--wide", action="store_true", help="long-form 16:9: center-crop/scale to 1920x1080 instead of 1080x1920")
    ap.add_argument("--model", default="small", help="whisper model: tiny/base/small/medium/large-v3 (default small)")
    ap.add_argument("--language", default=None, help="force a language code, e.g. en")
    ap.add_argument("--vocab", default=None, help='comma-separated names/jargon, e.g. "Remotion, GSAP, Priya"')
    ap.add_argument("--captions-only", action="store_true", help="only rebuild captions from an edited transcript.json")
    args = ap.parse_args()

    if args.captions_only:
        finalize(OUTPUT_DIR / Path(args.input).stem.removesuffix("_cut"))
        return

    src = resolve_input(args.input)
    out_dir = OUTPUT_DIR / src.stem
    out_dir.mkdir(parents=True, exist_ok=True)
    norm = out_dir / f"{src.stem}_norm.mp4"
    final = out_dir / f"{src.stem}_cut.mp4"

    normalize(src, norm, args.fps, not args.no_reframe, args.wide)
    cut(norm, final, args.cut, args.margin, args.min_silence, args.threshold)
    norm.unlink(missing_ok=True)

    t = transcribe(final, args.model, args.language, args.vocab)
    t = {"source": str(src), "video": final.name, "fps": args.fps, **t}
    (out_dir / "transcript.json").write_text(json.dumps(t, indent=2, ensure_ascii=False))
    finalize(out_dir)

    raw_len = float(probe(src)["format"]["duration"])
    cut_len = float(probe(final)["format"]["duration"])
    print(f"\ndone: {raw_len:.1f}s → {cut_len:.1f}s\n  {final}\n  proofread: {out_dir / 'transcript.txt'}")


if __name__ == "__main__":
    main()
