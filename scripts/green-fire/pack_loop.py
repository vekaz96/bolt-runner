"""Encode Blender-rendered frames as a portable animated GIF; requires Pillow."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT/'mobile-game-assests'/'green-fire-pickup-v1'/'previews'
frames_dir = Path((OUT/'loop-frames-path.txt').read_text())
frames = [Image.open(path).convert('RGB') for path in sorted(frames_dir.glob('*.png'))]
assert len(frames) == 24
palette = frames[0].quantize(colors=256)
frames = [frame.quantize(palette=palette,dither=Image.Dither.NONE) for frame in frames]
frames[0].save(OUT/'green-fire-idle.gif',save_all=True,append_images=frames[1:],duration=[80,80,90]*8,loop=0,disposal=2,optimize=False)
(OUT/'loop-frames-path.txt').unlink()
print(OUT/'green-fire-idle.gif')
