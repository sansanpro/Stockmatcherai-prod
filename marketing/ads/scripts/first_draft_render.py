import sys, os, json, subprocess, glob
import imageio_ffmpeg
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
repo = os.path.dirname(os.path.dirname(ROOT))
voice, mode = sys.argv[1:3]
W, H, FPS = 1080, 1920, 30
CREAM = (255, 248, 244); TINT = (254, 238, 230); INK = (30, 20, 24)
ACC = (184, 68, 31); BRIGHT = (232, 100, 60); MUTE = (92, 76, 70)


def F(n, s):
    return ImageFont.truetype(f'C:/Windows/Fonts/{n}.ttf', s)


words = json.load(open(f'{ROOT}/vo/{voice}.json'))


def T(i):
    return words[i]['s']


END = words[-1]['e'] + 1.7


def clamp(x):
    return max(0.0, min(1.0, x))


def ease(x):
    return 1 - (1 - clamp(x)) ** 3


def smooth(x):
    v = clamp(x)
    return v * v * (3 - 2 * v)


# Background: top glow and decorative arc, matching the Canva layout
bg = Image.new('RGB', (W, H), CREAM)
g = Image.new('L', (W, H), 0)
ImageDraw.Draw(g).ellipse((-300, -700, W + 300, 560), fill=255)
g = g.filter(ImageFilter.GaussianBlur(170))
bg.paste(Image.new('RGB', (W, H), TINT), (0, 0), g)
d = ImageDraw.Draw(bg)
d.arc((-1120, 1600, 480, 3200), 225, 335, fill=ACC, width=10)
d.rectangle((66, 92, 72, 160), fill=ACC)
d.text((92, 100), 'StockMatcherAI', font=F('seguisb', 42), fill=INK)

# Strip that keeps zoomed phones from running under the headline
strip = bg.crop((0, 0, W, 470)).convert('RGBA')
a = Image.new('L', (W, 470), 255)
ad = ImageDraw.Draw(a)
for y in range(390, 470):
    ad.line((0, y, W, y), fill=int(255 * (470 - y) / 80))
strip.putalpha(a)

PAD = 70
PW = 1048


def phone(name):
    im = Image.open(glob.glob(f'{ROOT}/phones/{name}*.png')[0]).convert('RGBA')
    c = Image.new('RGBA', (im.width + 2 * PAD, im.height + 2 * PAD), (0, 0, 0, 0))
    s = Image.new('L', c.size, 0)
    s.paste(im.getchannel('A'), (PAD, PAD + 20))
    s = s.filter(ImageFilter.GaussianBlur(30)).point(lambda v: int(v * .3))
    c.paste((60, 30, 20, 255), (0, 0), s)
    c.alpha_composite(im, (PAD, PAD))
    return c


P2, P4 = phone('2-'), phone('4-')
cache = {}


def sprite(text, font, size, color):
    k = (text, font, size, color)
    if k not in cache:
        f = F(font, size)
        b = f.getbbox(text)
        asc, desc = f.getmetrics()
        im = Image.new('RGBA', (b[2] + 4, asc + desc + 4), (0, 0, 0, 0))
        ImageDraw.Draw(im).text((0, 0), text, font=f, fill=color)
        cache[k] = im
    return cache[k]


def put(fr, im, x, y, o=1.0):
    if o <= 0:
        return
    if o < 1:
        im = im.copy()
        im.putalpha(im.getchannel('A').point(lambda v: int(v * o)))
    fr.paste(im, (int(x), int(y)), im)


def layout(items, size, font, x0, y0, maxw, lh):
    f = F(font, size)
    gap = f.getlength(' ')
    x, y = x0, y0
    out = []
    for w, c, s in items:
        l = f.getlength(w)
        if x + l > x0 + maxw and x > x0:
            x = x0
            y += lh
        out.append((w, c, s, x, y))
        x += l + gap
    return out


def kinetic(fr, t, placed, size, font):
    for w, c, s, x, y in placed:
        p = ease((t - s) / .28)
        if p > 0:
            put(fr, sprite(w, font, size, c), x, y + (1 - p) * 34, min(1, p * 1.4))


def headline(fr, lines, t, t0, size=84):
    p = ease((t - t0) / .35)
    y = 196
    for txt, c in lines:
        put(fr, sprite(txt, 'seguisb', size, c), 66, y + (1 - p) * 24, p)
        y += int(size * 1.13)


def draw_phone(fr, P, scale, cx, top):
    w = int(P.width * scale * 560 / PW)
    h = int(P.height * scale * 560 / PW)
    im = P.resize((w, h), Image.BILINEAR)
    k = w / P.width
    x = cx - w / 2
    y = top - PAD * k
    fr.paste(im, (int(x), int(y)), im)
    return (lambda px, py: (x + (px + PAD) * k, y + (py + PAD) * k)), k


def row_ring(fr, mapf, k, box, t, t0):
    p = t - t0
    if p < 0:
        return
    x0, y0 = mapf(box[0], box[1])
    x1, y1 = mapf(box[2], box[3])
    grow = (1 - ease(p / .35)) * 26
    o = Image.new('RGBA', (int(x1 - x0 + 120), int(y1 - y0 + 120)), (0, 0, 0, 0))
    alpha = int(255 * min(1, p / .15))
    ImageDraw.Draw(o).rounded_rectangle(
        (60 - grow, 60 - grow, x1 - x0 + 60 + grow, y1 - y0 + 60 + grow),
        radius=int(110 * k), outline=BRIGHT + (alpha,), width=9)
    fr.paste(o, (int(x0 - 60), int(y0 - 60)), o)


GROUPS = [(13, 18), (19, 24), (25, 30), (31, 35)]


def disp(i):
    # The script spells the name phonetically so the voice says it clearly
    return {25: 'StockMatcherAI', 26: None, 27: None, 28: None}.get(i, words[i]['w'])


def caption(fr, t):
    for a, b in GROUPS:
        if T(a) - .05 <= t < T(b + 1):
            f = F('seguisb', 50)
            items = [(i, disp(i)) for i in range(a, b + 1) if disp(i)]
            total = sum(f.getlength(w) for _, w in items) + f.getlength(' ') * (len(items) - 1)
            x = (W - total) / 2
            y = 1432
            pill = Image.new('RGBA', (int(total + 72), 92), (0, 0, 0, 0))
            ImageDraw.Draw(pill).rounded_rectangle((0, 0, pill.width - 1, 91), 34, fill=(30, 20, 24, 236))
            put(fr, pill, x - 36, y - 10)
            for i, w in items:
                nxt = i + 1
                while disp(nxt) is None:
                    nxt += 1
                on = T(i) - .03 <= t < T(nxt)
                col = (255, 178, 140) if on else (255, 255, 255)
                put(fr, sprite(w, 'seguisb', 50, col), x, y)
                x += f.getlength(w + ' ')
            return


def footer(fr):
    s = sprite('Educational only, not investment advice.', 'segoeui', 32, MUTE)
    put(fr, s, (W - s.width) / 2, 1650)


ROW1 = (86, 991, 975, 1166)
ROW3 = (86, 1400, 975, 1575)
hook = layout([(words[i]['w'], ACC if i >= 5 else INK, T(i)) for i in range(6)], 132, 'seguisb', 66, 520, 950, 158)
last = layout([('In', INK, T(36)), ('plain', INK, T(37)), ('English.', INK, T(38))], 120, 'seguisb', 66, 600, 950, 142)
last += layout([(words[i]['w'].capitalize() if i == 39 else words[i]['w'], ACC, T(i)) for i in range(39, 43)],
               120, 'seguisb', 66, 800, 950, 142)
# Sprout from the app's opening screen, feathered into the cream background
icon = Image.open(f'{repo}/marketing/app-store/1-hook-invest-in-what-you-believe.jpg').convert('RGBA').crop((440, 1010, 880, 1470))
icon = icon.resize((250, 261), Image.LANCZOS)
m = Image.new('L', icon.size, 0)
ImageDraw.Draw(m).ellipse((16, 12, 234, 249), fill=255)
icon.putalpha(m.filter(ImageFilter.GaussianBlur(11)))
SCALED = 2213 * 560 / PW


def s1(t, fr):
    kinetic(fr, t, hook, 132, 'seguisb')


def s2(t, fr):
    p = ease((t - T(6)) / .55)
    zp = smooth((t - T(20) + .1) / .8)
    z = 1 + .3 * zp
    top = 1625 - SCALED * z + (1 - p) * 420
    mp, k = draw_phone(fr, P2, z, W / 2, top)
    row_ring(fr, mp, k, ROW1, t, T(21))
    row_ring(fr, mp, k, ROW3, t, T(23))
    fr.paste(strip, (0, 0), strip)
    if t < T(13):
        headline(fr, [('What do you want', INK), ('it to say?', ACC)], t, T(6))
    else:
        headline(fr, [('Pick the causes', INK), ('you care about', ACC)], t, T(13))
    footer(fr)
    caption(fr, t)


def s3(t, fr):
    p = ease((t - T(25)) / .55)
    z = 1 + .16 * smooth((t - T(27)) / 5)
    top = 1625 - SCALED * z + (1 - p) * 420
    draw_phone(fr, P4, z, W / 2, top)
    fr.paste(strip, (0, 0), strip)
    headline(fr, [('Real companies.', INK), ('Your causes.', ACC)], t, T(25))
    footer(fr)
    caption(fr, t)


def s4(t, fr):
    kinetic(fr, t, last, 120, 'seguisb')


def s5(t, fr):
    p = ease((t - T(43)) / .45)
    put(fr, icon, (W - 250) / 2, 500 + (1 - p) * 40, p)
    for txt, c, y, sz, fn in [('StockMatcherAI', INK, 790, 92, 'seguisb'),
                              ('Invest in what you believe in', ACC, 915, 60, 'seguisb'),
                              ('Educational only,', MUTE, 1090, 50, 'segoeui'),
                              ('not investment advice.', MUTE, 1156, 50, 'segoeui')]:
        s = sprite(txt, fn, sz, c)
        put(fr, s, (W - s.width) / 2, y + (1 - p) * 30, p)


SC = [(0, T(6), s1), (T(6), T(25), s2), (T(25), T(36), s3), (T(36), T(43), s4), (T(43), END + 1, s5)]
XF = .22


def frame(t):
    for i, (a, b, fn) in enumerate(SC):
        if a <= t < b:
            fr = bg.copy()
            fn(t, fr)
            if i > 0 and t < a + XF:
                o = bg.copy()
                SC[i - 1][2](t, o)
                fr = Image.blend(o, fr, smooth((t - a) / XF))
            return fr
    raise ValueError(t)


if mode == 'stills':
    ts = [.9, T(5) + .4, T(9), T(16), T(21) + .4, T(23) + .5, T(28), T(33), T(38), T(42), T(44) + .5, END - .1]
    sh = Image.new('RGB', (6 * 280 + 10, 2 * 490 + 10), (70, 70, 70))
    for i, t in enumerate(ts):
        sh.paste(frame(t).resize((270, 480)), (10 + (i % 6) * 280, 10 + (i // 6) * 490))
    sh.save(f'{ROOT}/previews/preview_{voice}.png')
    print('ok', round(END, 2))
else:
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    out = f'{ROOT}/drafts/video-believe-{voice}.mp4'
    n = int(END * FPS)
    p = subprocess.Popen([ff, '-y', '-hide_banner', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24',
                          '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-i', f'{ROOT}/vo/{voice}.mp3',
                          '-af', 'apad', '-t', f'{n / FPS:.3f}', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
                          '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', out],
                         stdin=subprocess.PIPE)
    for i in range(n):
        p.stdin.write(frame(i / FPS).tobytes())
    p.stdin.close()
    p.wait()
    print(out, p.returncode, round(n / FPS, 2))
