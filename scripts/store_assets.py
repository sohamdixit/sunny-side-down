"""Builds the Play Console listing assets.

  store/icon-512.png          512x512   app icon
  store/feature-graphic.png   1024x500  feature graphic
  store/screenshot-N.png      1080x1920 (9:16) phone screenshots

Play wants 16:9 or 9:16, but the emulator captures at 1080x2400 (9:20), so the
captures are placed on a branded 9:16 canvas rather than cropped - which also
gives room for a caption.
"""
from PIL import Image, ImageDraw, ImageFont
import os, sys

SP = sys.argv[1] if len(sys.argv) > 1 else '.'
CREAM, INK, MUTED = (250, 247, 240), (43, 33, 23), (138, 123, 104)
SLATE, WHITE, AMBER = (15, 23, 42), (248, 250, 252), (232, 155, 42)


def font(size, bold=True):
    for path, idx in [('/System/Library/Fonts/Supplemental/Avenir Next.ttc', 0 if bold else 2),
                      ('/System/Library/Fonts/Supplemental/Trebuchet MS Bold.ttf', 0),
                      ('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 0)]:
        try:
            return ImageFont.truetype(path, size, index=idx)
        except Exception:
            continue
    return ImageFont.load_default()


def centred(d, y, text, f, fill, w=1080):
    tw = d.textbbox((0, 0), text, font=f)[2]
    d.text(((w - tw) / 2, y), text, font=f, fill=fill)


# ---------------------------------------------------------------- icon 512
Image.open('assets/icon.png').convert('RGB').resize((512, 512), Image.LANCZOS) \
    .save('store/icon-512.png')

# ------------------------------------------------------- feature graphic
fg = Image.new('RGB', (1024, 500), SLATE)
art = Image.open('assets/icon-foreground.png').convert('RGBA').resize((430, 430), Image.LANCZOS)
fg.paste(art, (36, 35), art)
d = ImageDraw.Draw(fg)
d.text((470, 170), 'Sunny Side Down', font=font(58), fill=WHITE)
d.text((472, 248), 'Find the seat the sun', font=font(34, False), fill=AMBER)
d.text((472, 292), "can't reach.", font=font(34, False), fill=AMBER)
fg.save('store/feature-graphic.png')

# ------------------------------------------------------------ screenshots
SHOTS = [('shot-home.png',    'Tell it where you’re going'),
         ('shot-result.png',  'See which seat stays shaded'),
         ('shot-compare.png', 'Tap any seat to compare')]

for i, (src, caption) in enumerate(SHOTS, start=1):
    path = os.path.join(SP, src)
    if not os.path.exists(path):
        print('missing:', path); continue
    canvas = Image.new('RGB', (1080, 1920), CREAM)
    d = ImageDraw.Draw(canvas)
    centred(d, 92, caption, font(56), INK)

    phone = Image.open(path).convert('RGB')
    phone = phone.crop((0, 60, phone.width, phone.height))  # drop the status bar
    max_h = 1920 - 300 - 60
    scale = min(max_h / phone.height, (1080 - 200) / phone.width)
    phone = phone.resize((int(phone.width * scale), int(phone.height * scale)), Image.LANCZOS)

    # Rounded corners so it reads as a device rather than a flat paste.
    mask = Image.new('L', phone.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, phone.size[0], phone.size[1]], radius=34, fill=255)
    canvas.paste(phone, ((1080 - phone.width) // 2, 280), mask)
    canvas.save(f'store/screenshot-{i}.png')

for f in sorted(os.listdir('store')):
    im = Image.open(os.path.join('store', f))
    kb = os.path.getsize(os.path.join('store', f)) / 1024
    print(f'{f:<24} {im.size[0]}x{im.size[1]}  {kb:.0f} KB')
