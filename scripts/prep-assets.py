"""One-off asset prep: fetch and convert the four Unsplash photos.
Run from the repo root:  python scripts/prep-assets.py
Requires: pip install pillow
"""
from io import BytesIO
from pathlib import Path
from urllib.request import urlopen, Request

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
IMG = ROOT / "assets" / "img"
IMG.mkdir(parents=True, exist_ok=True)

# --- Photos -----------------------------------------------------------------
# name: (unsplash id, webp quality). The survey photo is a busy aerial rendered
# grayscale + multiply behind the process band, so it tolerates heavy compression.
PHOTOS = {
    "cairo":  ("1572252009286-268acec5ca0a", 78),  # Cairo skyline, historic mosques, haze
    "plant":  ("1513828646384-e4d8ec30d2bb", 78),  # stainless process plant, pipes and tanks
    "grid":   ("1473341304170-971dccb5ac1e", 78),  # transmission towers at sunset
    "survey": ("1541888946425-d81bb19240f5", 50),  # engineers on a construction site, aerial
}
for name, (pid, q) in PHOTOS.items():
    url = f"https://images.unsplash.com/photo-{pid}?auto=format&fit=crop&w=1600&q=80&fm=jpg"
    data = urlopen(Request(url, headers={"User-Agent": "prep"})).read()
    im = Image.open(BytesIO(data)).convert("RGB")
    if name == "survey":  # displayed grayscale; encode it that way so it compresses
        im = im.convert("L").filter(ImageFilter.GaussianBlur(1.4)).convert("RGB")
    for w in (1600, 800):
        r = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        r.save(IMG / f"{name}-{w}.webp", "WEBP", quality=q, method=6)
    im.save(IMG / f"{name}-1600.jpg", "JPEG", quality=min(q + 10, 76), optimize=True, progressive=True)
    print(name, im.size)

total = sum(p.stat().st_size for p in IMG.iterdir())
print(f"assets/img total {total/1024:.0f} KB")
