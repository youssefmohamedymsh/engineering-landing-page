"""Assemble the deployable site into dist/ (site files only, no docs or scripts).
Run from the repo root:  python scripts/build-dist.py
"""
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
if DIST.exists():
    shutil.rmtree(DIST)
DIST.mkdir()
shutil.copy2(ROOT / "index.html", DIST / "index.html")
for folder in ("css", "js", "assets"):
    shutil.copytree(ROOT / folder, DIST / folder)
# Cloudflare Pages: cache immutable assets hard, HTML briefly.
(DIST / "_headers").write_text(
    "/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n"
    "/css/*\n  Cache-Control: public, max-age=86400\n"
    "/js/*\n  Cache-Control: public, max-age=86400\n"
    "/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n",
    encoding="utf-8",
)
size = sum(p.stat().st_size for p in DIST.rglob("*") if p.is_file())
print(f"dist/ ready: {sum(1 for p in DIST.rglob('*') if p.is_file())} files, {size/1024:.0f} KB")
