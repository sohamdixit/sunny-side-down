"""Mocks for the result screen's seat map: how much car to draw around the seats."""
from PIL import Image, ImageDraw, ImageFont
import os

F = 3
W, H = 440, 580
BG = (255, 255, 255, 255)
BODY = (253, 251, 246, 255)
EDGE = (216, 204, 182, 255)
GLASS = (232, 240, 244, 255)
TYRE = (74, 64, 52, 255)
SUN_SEAT = (246, 194, 122, 255)
MID_SEAT = (243, 217, 172, 255)
COOL_SEAT = (234, 240, 221, 255)
DRIVER = (229, 220, 203, 255)
SAGE = (124, 138, 90, 255)
ACCENT = (224, 123, 0, 255)
MUTED = (154, 139, 116, 255)


def seats(d, box, sel=(1, 1), tick=(1, 1)):
    """2x2 seat grid inside `box`. Front row = [passenger, driver]."""
    x0, y0, x1, y1 = box
    g = 14 * F
    sw = (x1 - x0 - g) / 2
    sh = (y1 - y0 - g) / 2
    fills = [[SUN_SEAT, DRIVER], [MID_SEAT, COOL_SEAT]]
    for r in range(2):
        for c in range(2):
            sx, sy = x0 + c * (sw + g), y0 + r * (sh + g)
            d.rounded_rectangle([sx, sy, sx + sw, sy + sh], radius=11 * F,
                                fill=fills[r][c])
            if (r, c) == (0, 1):  # driver: steering wheel
                cx, cy, rr = sx + sw / 2, sy + sh / 2, 15 * F
                d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], outline=MUTED,
                          width=3 * F)
                d.line([(cx - rr, cy), (cx + rr, cy)], fill=MUTED, width=3 * F)
                d.line([(cx, cy), (cx, cy + rr)], fill=MUTED, width=3 * F)
            if (r, c) == tick:
                d.rounded_rectangle([sx - 2 * F, sy - 2 * F, sx + sw + 2 * F, sy + sh + 2 * F],
                                    radius=13 * F, outline=ACCENT, width=3 * F)
                cx, cy, rr = sx + sw / 2, sy + sh * 0.30, 13 * F
                d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=SAGE)
                d.line([(cx - rr * 0.45, cy), (cx - rr * 0.1, cy + rr * 0.4),
                        (cx + rr * 0.5, cy - rr * 0.4)], fill=(255, 255, 255),
                       width=3 * F, joint="curve")


def base(fn):
    img = Image.new("RGBA", (W * F, H * F), BG)
    fn(img, ImageDraw.Draw(img))
    return img.resize((W, H), Image.LANCZOS)


# ------------------------------------------------------- 1: cabin + screen
def cabin(img, d):
    d.rounded_rectangle([70 * F, 70 * F, 370 * F, 510 * F], radius=58 * F,
                        fill=BODY, outline=EDGE, width=3 * F)
    # Windscreen band across the nose.
    d.pieslice([70 * F, 70 * F, 370 * F, 250 * F], start=180, end=360, fill=GLASS)
    d.arc([70 * F, 70 * F, 370 * F, 250 * F], start=180, end=360, fill=EDGE, width=3 * F)
    for sx in (56, 384):  # wing mirrors
        d.rounded_rectangle([sx * F - 12 * F, 158 * F, sx * F + 12 * F, 184 * F],
                            radius=6 * F, fill=EDGE)
    seats(d, (104 * F, 196 * F, 336 * F, 480 * F))


# ----------------------------------------------- 2: bonnet, cabin and boot
def bonnet_boot(img, d):
    d.rounded_rectangle([64 * F, 24 * F, 376 * F, 556 * F], radius=64 * F,
                        fill=BODY, outline=EDGE, width=3 * F)
    d.pieslice([84 * F, 40 * F, 356 * F, 190 * F], start=180, end=360, fill=GLASS)
    d.arc([84 * F, 40 * F, 356 * F, 190 * F], start=180, end=360, fill=EDGE, width=3 * F)
    d.rounded_rectangle([96 * F, 486 * F, 344 * F, 534 * F], radius=20 * F, fill=GLASS)
    for sx in (50, 390):
        d.rounded_rectangle([sx * F - 13 * F, 150 * F, sx * F + 13 * F, 178 * F],
                            radius=6 * F, fill=EDGE)
    seats(d, (104 * F, 196 * F, 336 * F, 464 * F))


# ------------------------------------------------------------ 3: wheels out
def wheels(img, d):
    for wy in (150, 400):
        for wx in (52, 388):
            d.rounded_rectangle([wx * F - 15 * F, wy * F - 34 * F,
                                 wx * F + 15 * F, wy * F + 34 * F],
                                radius=11 * F, fill=TYRE)
    d.rounded_rectangle([74 * F, 34 * F, 366 * F, 546 * F], radius=60 * F,
                        fill=BODY, outline=EDGE, width=3 * F)
    d.pieslice([92 * F, 48 * F, 348 * F, 194 * F], start=180, end=360, fill=GLASS)
    d.arc([92 * F, 48 * F, 348 * F, 194 * F], start=180, end=360, fill=EDGE, width=3 * F)
    d.rounded_rectangle([104 * F, 480 * F, 336 * F, 526 * F], radius=20 * F, fill=GLASS)
    seats(d, (108 * F, 200 * F, 332 * F, 462 * F))


# ------------------------------------------------------------- 4: detailed
def detailed(img, d):
    for wy in (160, 410):
        for wx in (54, 386):
            d.rounded_rectangle([wx * F - 16 * F, wy * F - 36 * F,
                                 wx * F + 16 * F, wy * F + 36 * F],
                                radius=12 * F, fill=TYRE)
    d.rounded_rectangle([72 * F, 20 * F, 368 * F, 560 * F], radius=66 * F,
                        fill=BODY, outline=EDGE, width=3 * F)
    # Bonnet crease lines.
    for lx in (168, 272):
        d.line([(lx * F, 44 * F), (lx * F, 96 * F)], fill=EDGE, width=3 * F)
    d.pieslice([88 * F, 62 * F, 352 * F, 208 * F], start=180, end=360, fill=GLASS)
    d.arc([88 * F, 62 * F, 352 * F, 208 * F], start=180, end=360, fill=EDGE, width=3 * F)
    d.line([(150 * F, 116 * F), (196 * F, 78 * F)], fill=(255, 255, 255), width=5 * F)
    for sx in (48, 392):
        d.rounded_rectangle([sx * F - 14 * F, 168 * F, sx * F + 14 * F, 198 * F],
                            radius=7 * F, fill=EDGE)
    d.rounded_rectangle([100 * F, 476 * F, 340 * F, 532 * F], radius=22 * F, fill=GLASS)
    seats(d, (108 * F, 214 * F, 332 * F, 458 * F))


MOCKS = [("1 · cabin", cabin), ("2 · bonnet + boot", bonnet_boot),
         ("3 · wheels", wheels), ("4 · detailed", detailed)]

os.makedirs("assets/car", exist_ok=True)
imgs = []
for name, fn in MOCKS:
    im = base(fn)
    im.convert("RGB").save(f"assets/car/car-{name.split(' · ')[0]}.png")
    imgs.append((name, im))

pad = 26
sheet = Image.new("RGB", (pad + (W + pad) * 4, H + pad * 2 + 40), (238, 233, 221))
sd = ImageDraw.Draw(sheet)
try:
    font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 24)
except OSError:
    font = ImageFont.load_default()
for i, (name, im) in enumerate(imgs):
    x = pad + i * (W + pad)
    sheet.paste(im.convert("RGB"), (x, pad))
    sd.text((x, pad + H + 8), name, fill=(60, 50, 36), font=font)
sheet.save("assets/car/sheet.png")
print("wrote assets/car/ (4 mocks + sheet.png)")
