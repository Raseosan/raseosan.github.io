"""Cut each game clip into scroll frames: N evenly spaced frames, packed 4x4 per JPEG sheet.

Why sheets, not video: phone browsers (iOS Safari above all) seek video badly, so a clip
driven by scroll froze or barely moved. Drawing a frame from an already-decoded image is
instant everywhere. 16 frames per sheet keeps each image under ~5 MP, inside iOS decode limits.

Run from the repo root:  python tools/make-frames.py
Writes assets/games/<game>/frames/sheet-1.jpg ... and prints the numbers index.html needs.
"""
import json, os, subprocess, sys

GAMES = ["rock-rise", "castaway", "a-maze", "corporate-ladder", "seed"]
FRAMES = 64          # frames per clip: enough to feel fluid under a finger, light enough for phones
COLS = ROWS = 4      # 16 frames per sheet
LAND_W = 640         # landscape frame width
PORT_W = 400         # portrait frame width
QUALITY = "7"        # ffmpeg mjpeg -q:v (2 best .. 31 worst)

def probe(path):
    out = subprocess.check_output(["ffprobe", "-v", "error", "-select_streams", "v:0",
        "-show_entries", "stream=width,height:format=duration", "-of", "json", path])
    j = json.loads(out)
    s = j["streams"][0]
    return s["width"], s["height"], float(j["format"]["duration"])

meta = {}
for g in GAMES:
    d = os.path.join("assets", "games", g)
    # The original loop.mp4 (kept locally, git-ignored) is sharper than the web scrub.mp4.
    src = os.path.join(d, "loop.mp4")
    if not os.path.exists(src):
        src = os.path.join(d, "scrub.mp4")
    w, h, dur = probe(src)
    fw = LAND_W if w >= h else PORT_W
    fh = round(h * fw / w / 2) * 2
    out = os.path.join(d, "frames")
    os.makedirs(out, exist_ok=True)
    for f in os.listdir(out):
        os.remove(os.path.join(out, f))
    subprocess.check_call(["ffmpeg", "-v", "error", "-y", "-i", src, "-vf",
        f"fps={FRAMES}/{dur:.3f},scale={fw}:{fh},tile={COLS}x{ROWS}",
        "-frames:v", str(-(-FRAMES // (COLS * ROWS))), "-q:v", QUALITY,
        os.path.join(out, "sheet-%d.jpg")])
    size = sum(os.path.getsize(os.path.join(out, f)) for f in os.listdir(out))
    meta[g] = {"n": FRAMES, "w": fw, "h": fh, "sheets": len(os.listdir(out)), "kb": size // 1024, "src": os.path.basename(src)}
    print(g, meta[g])
print("total KB", sum(m["kb"] for m in meta.values()))
