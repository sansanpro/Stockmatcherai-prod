# Renders the 9:16 video ads from marketing/ads/creatives/concepts.json, the app captures in
# marketing/ads/shots/ and the voiceovers from voiceover.mjs. Works on any OS.
#
#   pip install -r marketing/ads/requirements.txt
#   python marketing/ads/scripts/render_videos.py sheet [id-voice ...]   # review frames, no video
#   python marketing/ads/scripts/render_videos.py video [id-voice ...]   # writes creatives/videos/
#   python marketing/ads/scripts/render_videos.py stills [id ...]        # 9:16 image ads, no voice needed
#
# Text stays inside Meta's 9:16 safe zone (top 14%, bottom 35%, sides 6%); only the phone runs below it.
import sys, os, json, glob, subprocess
import imageio_ffmpeg
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ADS = os.path.dirname(HERE)
DIR = f'{ADS}/creatives'
C = json.load(open(f'{DIR}/concepts.json'))
W, H, FPS = 1080, 1920, 30
SAFE_T, SAFE_B, SAFE_X = 269, 1248, 66

THEMES = {
    # background, glow, text, accent, button text, app shots
    'g': dict(bg=(26, 15, 21), glow=(90, 34, 40), text=(250, 240, 236), accent=(255, 155, 118), on=(38, 18, 26), shots='dark'),
    'e': dict(bg=(255, 247, 243), glow=(251, 220, 207), text=(30, 18, 24), accent=(184, 68, 31), on=(255, 255, 255), shots='light'),
    'm': dict(bg=(58, 21, 45), glow=(122, 50, 56), text=(255, 243, 238), accent=(255, 155, 118), on=(38, 18, 26), shots='dark'),
}
DISPLAY = {'P.E.': 'P/E', 'A.I.': 'AI', 'A.I.?': 'AI?'}
OUTRO_LINE = ['Matches built around your values,', 'with AI to explain every company.']
DISCLAIMER = 'Educational only, not investment advice.'


# ---------- text ----------
fonts = {}
def F(size, weight=700):
    k = (size, weight)
    if k not in fonts:
        f = ImageFont.truetype(f'{ADS}/fonts/Inter.ttf', size)
        f.set_variation_by_axes([min(32, max(14, size)), weight])
        fonts[k] = f
    return fonts[k]

sprites = {}
def sprite(text, size, color, weight=700):
    k = (text, size, color, weight)
    if k not in sprites:
        f = F(size, weight)
        asc, desc = f.getmetrics()
        im = Image.new('RGBA', (int(f.getlength(text)) + 8, asc + desc + 6), (0, 0, 0, 0))
        ImageDraw.Draw(im).text((0, 0), text, font=f, fill=color + (255,))
        sprites[k] = im
    return sprites[k]

def clamp(x): return max(0.0, min(1.0, x))
def ease(x): return 1 - (1 - clamp(x)) ** 3
def smooth(x):
    v = clamp(x)
    return v * v * (3 - 2 * v)

def put(fr, im, x, y, o=1.0):
    if o <= 0: return
    if o < 1:
        im = im.copy()
        im.putalpha(im.getchannel('A').point(lambda v: int(v * o)))
    fr.paste(im, (int(x), int(y)), im)

def wrap(words, size, width, weight=700):
    f = F(size, weight); lines = [[]]; cur = 0
    sp = f.getlength(' ')
    for w in words:
        l = f.getlength(DISPLAY.get(w, w))
        if lines[-1] and cur + sp + l > width:
            lines.append([]); cur = 0
        cur += (sp if lines[-1] else 0) + l
        lines[-1].append(w)
    return lines


# ---------- phone ----------
SHOT_W, SHOT_H = 1179, 2556
BAND = 165   # status bar added above the capture
BEZEL = 34
PHONE_W = SHOT_W + 2 * BEZEL
PHONE_H = SHOT_H + BAND + 2 * BEZEL
CACHE = {}

def shot_path(theme, name):
    return f"{ADS}/shots/{theme['shots']}/{name}.png"

def rounded_mask(size, r):
    m = Image.new('L', (size[0] * 2, size[1] * 2), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, m.width - 1, m.height - 1), r * 2, fill=255)
    return m.resize(size, Image.LANCZOS)

def phone_shell(theme, name):
    """The phone with a screen image pasted in."""
    k = (theme['shots'], name)
    if k in CACHE: return CACHE[k]
    shot = Image.open(shot_path(theme, name)).convert('RGB')
    top = shot.getpixel((SHOT_W // 2, 4))
    dark = sum(top) < 380
    ink = (255, 255, 255) if dark else (24, 14, 18)
    screen = Image.new('RGB', (SHOT_W, SHOT_H + BAND), top)
    screen.paste(shot, (0, BAND))
    d = ImageDraw.Draw(screen)
    d.rounded_rectangle((SHOT_W // 2 - 190, 36, SHOT_W // 2 + 190, 140), 52, fill=(0, 0, 0))
    d.text((120, 66), '9:41', font=F(50, 600), fill=ink)
    for i, h in enumerate((18, 26, 34, 42)):
        d.rounded_rectangle((SHOT_W - 250 + i * 18, 106 - h, SHOT_W - 238 + i * 18, 106), 3, fill=ink)
    d.rounded_rectangle((SHOT_W - 150, 72, SHOT_W - 76, 108), 10, fill=ink)
    im = Image.new('RGBA', (PHONE_W, PHONE_H), (0, 0, 0, 0))
    ImageDraw.Draw(im).rounded_rectangle((0, 0, PHONE_W - 1, PHONE_H - 1), 170, fill=(10, 6, 8, 255),
                                         outline=(84, 70, 76, 255), width=5)
    screen = screen.convert('RGBA')
    screen.putalpha(rounded_mask(screen.size, 136))
    im.alpha_composite(screen, (BEZEL, BEZEL))
    CACHE[k] = im
    return im

CARD_TOP = 243  # where the swipe card starts in a deck capture

def card_sprite(theme, name):
    k = ('card', theme['shots'], name)
    if k not in CACHE:
        im = Image.open(shot_path(theme, name)).convert('RGBA')
        im.putalpha(rounded_mask(im.size, 66))
        CACHE[k] = im
    return CACHE[k]

def draw_phone(fr, theme, name, top, width, crop=None, card=None, room=0):
    """Draws the phone at `top`. crop = (y0, y1) as shares of the phone: zooms that band to full width.
    card = (sprite name, dx share of the screen width, rotation): a card flying off a deck screen."""
    src = phone_shell(theme, name)
    if card:
        src = src.copy()
        c = card_sprite(theme, card[0])
        rot = c.rotate(-card[2], resample=Image.BILINEAR, expand=True)
        x = BEZEL + (SHOT_W - rot.width) // 2 + int(card[1] * SHOT_W)
        y = BEZEL + BAND + CARD_TOP - (rot.height - c.height) // 2
        layer = Image.new('RGBA', src.size, (0, 0, 0, 0))
        layer.paste(rot, (x, y), rot)
        # Stays inside the screen, as it would on the phone
        mask = Image.new('L', src.size, 0)
        ImageDraw.Draw(mask).rounded_rectangle((BEZEL, BEZEL, PHONE_W - BEZEL, PHONE_H - BEZEL), 136, fill=255)
        src.paste(layer, (0, 0), Image.composite(layer.getchannel('A'), Image.new('L', src.size, 0), mask))
    scale = width / PHONE_W
    if crop:
        # A band of the screen itself, without the phone's edges, centered in the space it's given
        y0, y1 = int(crop[0] * PHONE_H), int(crop[1] * PHONE_H)
        band = src.crop((BEZEL, y0, PHONE_W - BEZEL, y1))
        scale = width / band.width
        im = band.resize((width, int(band.height * scale)), Image.BILINEAR)
        im.putalpha(rounded_mask(im.size, 36))
        fr.paste(im, ((W - width) // 2, int(top + max(0, (room - im.height) / 2))), im)
        return
    visible = min(PHONE_H, int((H - top) / scale) + 2)
    band = src.crop((0, 0, PHONE_W, visible))
    im = band.resize((width, int(visible * scale)), Image.BILINEAR)
    fr.paste(im, ((W - width) // 2, int(top)), im)


# ---------- an ad ----------
def background(theme):
    bg = Image.new('RGB', (W, H), theme['bg'])
    g = Image.new('L', (W, H), 0)
    ImageDraw.Draw(g).ellipse((-260, -760, W + 260, 760), fill=255)
    bg.paste(Image.new('RGB', (W, H), theme['glow']), (0, 0), g.filter(ImageFilter.GaussianBlur(190)))
    return bg

class Ad:
    def __init__(self, key):
        self.key = key
        hid, self.voice = key.rsplit('-', 1)
        self.hook = next(h for h in C['hooks'] if h['id'] == hid)
        self.theme = THEMES[self.hook['cat']]
        self.bg = background(self.theme)
        self.words = json.load(open(f'{DIR}/vo/{key}.json'))
        self.end = self.words[-1]['e'] + 2.2
        scenes = [dict(kind='hook', say=self.hook['say'], screen=self.hook['screen'])]
        scenes += [dict(s, kind='body') for s in C['bodies'][self.hook.get('body', self.hook['cat'])]]
        scenes.append(dict(kind='outro', say=C['cta']))
        i = 0
        for s in scenes:
            n = len(s['say'].split())
            s['a'], s['b'] = i, i + n
            i += n
        for j, s in enumerate(scenes):
            s['t0'] = 0 if j == 0 else self.words[s['a']]['s']
        for j, s in enumerate(scenes):
            s['t1'] = scenes[j + 1]['t0'] if j + 1 < len(scenes) else self.end + 1
        self.scenes = scenes
        real = self.hook.get('real')
        self.deck = ['deck-1', 'deck-2', 'deck-3'] if real else ['deck-1-masked', 'deck-2-masked', 'deck-3-masked']
        self.card = ['card-1', 'card-2', 'card-3'] if real else ['card-1-masked', 'card-2-masked', 'card-3-masked']

    def caption(self, fr, t, s):
        # Word-timed, in the safe zone, over the phone
        size = 48; f = F(size, 700)
        lines = []; cur = s['a']; width = 0
        for i in range(s['a'], s['b']):
            w = DISPLAY.get(self.words[i]['w'], self.words[i]['w'])
            width += f.getlength(w + ' ')
            nxt = DISPLAY.get(self.words[i + 1]['w'], self.words[i + 1]['w']) if i + 1 < s['b'] else ''
            if i == s['b'] - 1 or w[-1] in '.,?' or width + f.getlength(nxt) > 860:
                lines.append((cur, i + 1)); cur = i + 1; width = 0
        for a, b in lines:
            end = self.words[b]['s'] if b < len(self.words) else 1e9
            if self.words[a]['s'] - .05 <= t < end:
                shown = [DISPLAY.get(self.words[i]['w'], self.words[i]['w']) for i in range(a, b)]
                total = f.getlength(' '.join(shown))
                x = (W - total) / 2; y = SAFE_B - 92
                pill = Image.new('RGBA', (int(total + 72), 88), (0, 0, 0, 0))
                ImageDraw.Draw(pill).rounded_rectangle((0, 0, pill.width - 1, 87), 34, fill=(20, 10, 16, 240))
                put(fr, pill, x - 36, y - 13)
                for i, w in zip(range(a, b), shown):
                    on = self.words[i]['s'] - .03 <= t < (self.words[i + 1]['s'] if i + 1 < len(self.words) else 1e9)
                    put(fr, sprite(w, size, (255, 178, 140) if on else (255, 255, 255)), x, y)
                    x += f.getlength(w + ' ')
                return

    def hook_frame(self, fr, s, t):
        th = self.theme
        words = s['say'].split()
        size = 96
        lines = wrap(words, size, W - 2 * SAFE_X)
        while len(lines) > 3:
            size -= 6; lines = wrap(words, size, W - 2 * SAFE_X)
        lh = int(size * 1.14)
        block = len(lines) * lh
        ptop = SAFE_T + block + 46
        p = ease((t - .02) / .5)
        draw_phone(fr, th, s['screen'], ptop + (1 - p) * 120, 640)
        y = SAFE_T; i = s['a']; f = F(size)
        n_q = next((n for n, w in enumerate(words) if w[-1] in '.?'), len(words) - 1)
        for line in lines:
            x = SAFE_X
            for w in line:
                st = self.words[i]['s']
                q = ease((t - st + .06) / .24)
                col = th['accent'] if (i - s['a']) > n_q else th['text']
                shown = DISPLAY.get(w, w)
                if q > 0: put(fr, sprite(shown, size, col), x, y + (1 - q) * 26, min(1, q * 1.4))
                x += f.getlength(shown + ' '); i += 1
            y += lh

    def body_frame(self, fr, s, t):
        th = self.theme; t0 = s['t0']
        p = ease((t - t0) / .35)
        put(fr, sprite(s['head'], 74 if len(s['head']) < 27 else 62, th['text']), SAFE_X, SAFE_T + (1 - p) * 20, p)
        if 'anim' in s:
            right = s['anim'] == 'swipe-right'
            q = smooth((t - t0 - .15) / .7)
            base, flying = (self.deck[1], self.card[0]) if right else (self.deck[2], self.card[1])
            sign = 1 if right else -1
            draw_phone(fr, th, base, SAFE_T + 118, 680, card=(flying, sign * 1.25 * q, sign * 16 * q))
        elif 'zoom' in s:
            _, a, _, b = s['zoom']
            q = smooth((t - t0 - .05) / .5)
            top = SAFE_T + 110
            full = s.get('zoom_w', 948)
            w = int(full * (.86 + .14 * q))
            draw_phone(fr, th, s['screen'], top, w, crop=(a, b), room=SAFE_B - 110 - top)
        else:
            p2 = ease((t - t0) / .45)
            draw_phone(fr, th, s['screen'], SAFE_T + 118 + (1 - p2) * 90, 680)
        self.caption(fr, t, s)

    def outro_frame(self, fr, s, t):
        th = self.theme; t0 = s['t0']
        p = ease((t - t0) / .45); y = 372
        rows = [('StockMatcherAI', 108, th['text'], 800)] + [(l, 50, th['accent'], 600) for l in OUTRO_LINE]
        for txt, size, col, wg in rows:
            im = sprite(txt, size, col, wg)
            put(fr, im, (W - im.width) / 2, y + (1 - p) * 26, p)
            y += int(size * 1.34)
        q = ease((t - t0 - .25) / .4)
        bw, bh = 860, 148
        btn = Image.new('RGBA', (bw, bh), (0, 0, 0, 0))
        ImageDraw.Draw(btn).rounded_rectangle((0, 0, bw - 1, bh - 1), 40, fill=th['accent'] + (255,))
        put(fr, btn, (W - bw) / 2, 760 + (1 - q) * 30, q)
        lab = sprite('Download free on the App Store', 50, th['on'], 700)
        put(fr, lab, (W - lab.width) / 2, 760 + (bh - lab.height) / 2 + (1 - q) * 30, q)
        if self.hook.get('disclaimer'):
            d = sprite(DISCLAIMER, 34, th['text'], 500)
            put(fr, d, (W - d.width) / 2, SAFE_B - 60, q)

    def draw(self, s, t, fr):
        {'hook': self.hook_frame, 'body': self.body_frame, 'outro': self.outro_frame}[s['kind']](fr, s, t)

    def frame(self, t, xf=.2):
        for i, s in enumerate(self.scenes):
            if s['t0'] <= t < s['t1']:
                fr = self.bg.copy(); self.draw(s, t, fr)
                if i > 0 and t < s['t0'] + xf and 'anim' not in s:
                    o = self.bg.copy(); self.draw(self.scenes[i - 1], t, o)
                    fr = Image.blend(o, fr, smooth((t - s['t0']) / xf))
                return fr
        return self.frame(self.end - .05)


def still(hook):
    th = THEMES[hook['cat']]
    fr = background(th)
    words = hook['say'].replace('P.E.', 'P/E').replace('says just invest.', 'says "just invest."').split()
    size = 92
    lines = wrap(words, size, W - 2 * SAFE_X)
    while len(lines) > 3:
        size -= 6; lines = wrap(words, size, W - 2 * SAFE_X)
    y = SAFE_T
    for line in lines:
        put(fr, sprite(' '.join(line), size, th['text']), SAFE_X, y)
        y += int(size * 1.14)
    y += 14
    for line in wrap(hook['benefit'].split(), 42, W - 2 * SAFE_X, 500):
        put(fr, sprite(' '.join(line), 42, th['accent'], 500), SAFE_X, y)
        y += 54
    if hook.get('disclaimer'):
        put(fr, sprite(DISCLAIMER, 30, th['text'], 500), SAFE_X, y + 4)
        y += 40
    draw_phone(fr, th, hook['still_screen'], y + 26, 640)
    bw, bh = 800, 112
    btn = Image.new('RGBA', (bw, bh), (0, 0, 0, 0))
    ImageDraw.Draw(btn).rounded_rectangle((0, 0, bw - 1, bh - 1), 34, fill=th['accent'] + (255,))
    put(fr, btn, (W - bw) / 2, SAFE_B - bh)
    lab = sprite('Download free on the App Store', 46, th['on'], 700)
    put(fr, lab, (W - lab.width) / 2, SAFE_B - bh + (bh - lab.height) / 2)
    return fr


def keys(args):
    if args: return args
    return [os.path.basename(p)[:-5] for p in sorted(glob.glob(f'{DIR}/vo/*.json'))]

mode = sys.argv[1]
if mode == 'stills':
    os.makedirs(f'{DIR}/images', exist_ok=True)
    for h in C['hooks']:
        if sys.argv[2:] and h['id'] not in sys.argv[2:]: continue
        still(h).save(f"{DIR}/images/{h['id']}-9x16.png")
        print(h['id'])
    sys.exit()
names = keys(sys.argv[2:])
if mode == 'sheet':
    th = []
    for k in names:
        ad = Ad(k)
        for s in ad.scenes:
            th.append(ad.frame(min(s['t1'] - .1, s['t0'] + max(1.2, (s['t1'] - s['t0']) * .8))).resize((216, 384)))
    cols = 6
    rows = (len(th) + cols - 1) // cols
    sh = Image.new('RGB', (cols * 224 + 8, rows * 392 + 8), (70, 70, 70))
    for i, im in enumerate(th):
        sh.paste(im, (8 + (i % cols) * 224, 8 + (i // cols) * 392))
    out = f'{DIR}/previews-videos.png'
    sh.save(out); print(out, len(th))
else:
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    os.makedirs(f'{DIR}/videos', exist_ok=True)
    for k in names:
        ad = Ad(k)
        out = f'{DIR}/videos/{k}.mp4'
        n = int(ad.end * FPS)
        p = subprocess.Popen([ff, '-y', '-hide_banner', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS),
                              '-i', '-', '-i', f'{DIR}/vo/{k}.mp3', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11,apad', '-t', f'{n / FPS:.3f}',
                              '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-ar', '44100',
                              '-movflags', '+faststart', out], stdin=subprocess.PIPE)
        for i in range(n):
            p.stdin.write(ad.frame(i / FPS).tobytes())
        p.stdin.close(); p.wait()
        print(out, p.returncode, round(n / FPS, 1))
