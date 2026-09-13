"""Renders candidate app icons + a comparison sheet (large and at 48px)."""
from PIL import Image, ImageDraw, ImageChops, ImageFont
import math, os

S, F = 512, 4
CREAM = (250, 244, 232, 255)
SUN = (232, 155, 42, 255)
SUN_D = (206, 124, 20, 255)
SHADE = (74, 92, 58, 255)      # cool olive = the shady side
SHADE_L = (120, 140, 96, 255)
INK = (92, 58, 14, 255)
CARD = (255, 252, 246, 255)


def canvas():
    return Image.new("RGBA", (S * F, S * F), CREAM)


def diagonal_split(layer, shape_mask, n):
    """Repaint the lower-right half of `shape_mask` in the shade colour."""
    shade = Image.new("RGBA", (n, n), SHADE)
    diag = Image.new("L", (n, n), 0)
    ImageDraw.Draw(diag).polygon([(n, 0), (n, n), (0, n)], fill=255)
    layer.paste(shade, (0, 0), ImageChops.multiply(diag, shape_mask))


def rays(d, cx, cy, r, colour, count=8, start=0):
    for i in range(count):
        a = math.radians(start + i * (360 / count))
        d.line([(cx + math.cos(a) * r * 1.22, cy + math.sin(a) * r * 1.22),
                (cx + math.cos(a) * r * 1.55, cy + math.sin(a) * r * 1.55)],
               fill=colour, width=int(r * 0.16))


# ---------------------------------------------------------------- A: window
def opt_window():
    """A car side window, half in sun, half in shade."""
    img = canvas(); n = S * F; d = ImageDraw.Draw(img)
    # Window: a trapezoid with rounded corners, like a car door glass.
    box = [n * 0.16, n * 0.24, n * 0.84, n * 0.76]
    shape = Image.new("L", (n, n), 0)
    ImageDraw.Draw(shape).rounded_rectangle(box, radius=n * 0.10, fill=255)
    layer = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    layer.paste(Image.new("RGBA", (n, n), SUN), (0, 0), shape)
    diagonal_split(layer, shape, n)
    img.alpha_composite(layer)
    # Sun peeking in from the lit corner.
    d = ImageDraw.Draw(img)
    scx, scy, sr = n * 0.34, n * 0.42, n * 0.085
    d.ellipse([scx - sr, scy - sr, scx + sr, scy + sr], fill=CREAM)
    rays(d, scx, scy, sr, CREAM)
    d.rounded_rectangle(box, radius=n * 0.10, outline=INK, width=int(n * 0.022))
    return img


# ------------------------------------------------------------------ B: seats
def opt_seats():
    """Top-down car: one seat in sun, one in shade, the cool one ticked."""
    img = canvas(); n = S * F; d = ImageDraw.Draw(img)
    d.rounded_rectangle([n * 0.22, n * 0.14, n * 0.78, n * 0.86],
                        radius=n * 0.17, fill=CARD, outline=INK, width=int(n * 0.022))
    g, pad = n * 0.045, n * 0.30
    w = (n - 2 * pad - g) / 2
    top, h = n * 0.30, n * 0.20
    d.rounded_rectangle([pad, top, pad + w, top + h], radius=n * 0.04, fill=SUN)
    d.rounded_rectangle([pad + w + g, top, pad + 2 * w + g, top + h],
                        radius=n * 0.04, fill=SHADE)
    bot = top + h + g
    d.rounded_rectangle([pad, bot, pad + w, bot + h], radius=n * 0.04, fill=SUN)
    d.rounded_rectangle([pad + w + g, bot, pad + 2 * w + g, bot + h],
                        radius=n * 0.04, fill=SHADE)
    # Tick on the coolest seat.
    cx, cy, r = pad + 1.5 * w + g, bot + h / 2, n * 0.055
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=CREAM)
    d.line([(cx - r * 0.45, cy), (cx - r * 0.1, cy + r * 0.38), (cx + r * 0.5, cy - r * 0.4)],
           fill=SHADE, width=int(n * 0.022), joint="curve")
    # Sun outside the lit flank.
    scx, scy, sr = n * 0.10, n * 0.36, n * 0.062
    d.ellipse([scx - sr, scy - sr, scx + sr, scy + sr], fill=SUN_D)
    rays(d, scx, scy, sr, SUN_D, 6)
    return img


# ------------------------------------------------------------- C: sunglasses
def opt_shades():
    """The sun, wearing shades. Cute; about dodging sun, not about cars."""
    img = canvas(); n = S * F; d = ImageDraw.Draw(img)
    cx = cy = n / 2; r = n * 0.30
    rays(d, cx, cy, r, SUN_D)
    d.ellipse([cx - r, cy - r + r * 0.08, cx + r, cy + r + r * 0.08], fill=SUN_D)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=SUN)
    lw, lh, dx, ly = r * 0.42, r * 0.30, r * 0.44, cy - r * 0.10
    for sx in (-1, 1):
        ex = cx + sx * dx
        d.rounded_rectangle([ex - lw, ly - lh, ex + lw, ly + lh],
                            radius=r * 0.12, fill=INK)
    d.rectangle([cx - dx + lw * 0.6, ly - r * 0.06, cx + dx - lw * 0.6, ly + r * 0.06],
                fill=INK)
    sw, sh = r * 0.30, r * 0.26
    d.arc([cx - sw, cy + r * 0.32 - sh, cx + sw, cy + r * 0.32 + sh],
          start=20, end=160, fill=INK, width=int(r * 0.09))
    return img


# ------------------------------------------------------------------- D: seat
def opt_seat():
    """A single car seat, split sun/shade."""
    img = canvas(); n = S * F
    shape = Image.new("L", (n, n), 0)
    sd = ImageDraw.Draw(shape)
    sd.rounded_rectangle([n * 0.30, n * 0.18, n * 0.60, n * 0.66], radius=n * 0.10, fill=255)
    sd.rounded_rectangle([n * 0.30, n * 0.56, n * 0.80, n * 0.80], radius=n * 0.09, fill=255)
    layer = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    layer.paste(Image.new("RGBA", (n, n), SUN), (0, 0), shape)
    diagonal_split(layer, shape, n)
    img.alpha_composite(layer)
    d = ImageDraw.Draw(img)
    scx, scy, sr = n * 0.74, n * 0.28, n * 0.085
    d.ellipse([scx - sr, scy - sr, scx + sr, scy + sr], fill=SUN_D)
    rays(d, scx, scy, sr, SUN_D, 6)
    return img


OPTIONS = [("A · window", opt_window), ("B · seats", opt_seats),
           ("C · shades", opt_shades), ("D · seat", opt_seat)]

os.makedirs("assets/options", exist_ok=True)
rendered = []
for name, fn in OPTIONS:
    im = fn().resize((S, S), Image.LANCZOS)
    slug = name.split(" · ")[1]
    im.convert("RGB").save(f"assets/options/icon-{slug}.png")
    rendered.append((name, im))

# Contact sheet: big versions, with a 48px strip underneath for legibility.
pad, cell, small = 28, S, 48
sheet = Image.new("RGB", (pad + (cell + pad) * 4, cell + small + pad * 3 + 30), (238, 233, 221))
sd = ImageDraw.Draw(sheet)
try:
    font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 26)
except OSError:
    font = ImageFont.load_default()
for i, (name, im) in enumerate(rendered):
    x = pad + i * (cell + pad)
    sheet.paste(im.convert("RGB"), (x, pad))
    sd.text((x, pad + cell + 8), name, fill=(60, 50, 36), font=font)
    sheet.paste(im.resize((small, small), Image.LANCZOS).convert("RGB"),
                (x, pad + cell + 44))
sheet.save("assets/options/sheet.png")
print("wrote assets/options/ (4 icons + sheet.png)")
