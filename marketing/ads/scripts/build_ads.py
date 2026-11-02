import sys, os, json, base64, glob, re, uuid, subprocess, winreg, urllib.request, urllib.error
import imageio_ffmpeg
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
repo = os.path.dirname(os.path.dirname(ROOT))
mode = sys.argv[1]
only = sys.argv[2:] or None
W, H, FPS = 1080, 1920, 30
CREAM = (255, 248, 244); TINT = (254, 238, 230); INK = (30, 20, 24)
ACC = (184, 68, 31); BRIGHT = (232, 100, 60); MUTE = (92, 76, 70)
VOICE = 'EXAVITQu4vr4xnSDxMaL'  # Sarah
VO = f'{ROOT}/vo2'
OUT = f'{repo}/marketing/ads/drafts'
os.makedirs(VO, exist_ok=True)

OUTRO = {'t': 'outro', 'say': 'Stock Matcher A.I. Find companies working on the causes you care about. Educational only, not investment advice.'}
RISE = {'screen': '2-', 'head': [('Pick your causes', INK)]}
ROW1 = (86, 991, 975, 1166)
ROW3 = (86, 1400, 975, 1575)
CONCEPTS = {
    '1-where-to-begin': [
        {'t': 'k', 'size': 118, 'lines': [('Want to start investing,', INK), ('but no idea where to begin?', ACC)]},
        {'t': 'k', 'size': 132, 'lines': [('Start with what you care about.', INK)]},
        {'t': 'phone', 'screen': '2-', 'head': [('Pick your causes', INK)], 'zoom': 'like', 'rings': [(ROW1, 'cancer'), (ROW3, 'energy')],
         'say': 'Pick your causes, like beating cancer or clean energy.'},
        {'t': 'phone', 'screen': '4-', 'head': [('Real companies.', INK), ('Your causes.', ACC)],
         'say': 'Then see real companies working on them, explained in plain English.'},
        OUTRO],
    '2-could-you-name-one': [
        {'t': 'k', 'size': 118, 'lines': [('You care about beating cancer.', INK), ('You care about clean energy.', INK)]},
        {'t': 'k', 'size': 124, 'lines': [('But could you name one company working on either?', ACC)]},
        {'t': 'phone', 'screen': '2-', 'head': [('Pick your causes', INK)], 'rings': [(ROW1, 'Pick'), (ROW3, 'causes,')], 'say': 'Pick your causes,'},
        {'t': 'phone', 'screen': '4-', 'head': [('Real companies.', INK), ('Your causes.', ACC)], 'say': 'and see real companies doing that work,'},
        {'t': 'tiles', 'head': [('Not just a claim', INK)], 'say': 'with proof that the work is real, and a source you can check.',
         'tiles': [('proof', 'PROOF', 'One fact showing the work is real', 'green'), ('source', 'SOURCE', 'A link you can open and check', 'white')]},
        OUTRO],
    '3-another-language': [
        {'t': 'k', 'size': 132, 'lines': [('P.E. ratio. Market cap.', INK), ('Sound like another language?', ACC)]},
        {'t': 'k', 'size': 150, 'lines': [("You're not the problem.", INK)]},
        {'t': 'card', 'head': [('The story', INK), ('comes first', ACC)], 'say': 'This app starts with the story: what a company does, in one plain sentence.'},
        {'t': 'tile_img', 'head': [('Then the numbers,', INK), ('in plain words', ACC)], 'say': 'Then it explains the numbers in plain words.'},
        OUTRO],
    '4-wont-tell-you': [
        {'t': 'k', 'size': 132, 'lines': [("This app won't tell you what stock to buy.", INK)]},
        {'t': 'k', 'size': 132, 'lines': [('No stock tips.', INK), ('No buy button.', ACC)]},
        {'t': 'tiles', 'head': [('What it shows you', INK)],
         'say': 'It shows you what a company does, the proof that the work is real, and the things to know, like losses, lawsuits, and debt.',
         'tiles': [('what', 'WHAT IT DOES', 'One plain sentence', 'white'), ('proof', 'PROOF', 'That the work is real', 'green'),
                   ('things', 'THINGS TO KNOW', 'Losses, lawsuits, debt', 'amber')]},
        {'t': 'k', 'size': 132, 'lines': [('Then you decide what matters to you.', ACC)]},
        OUTRO],
    '5-not-a-casino': [
        {'t': 'k', 'size': 132, 'lines': [('Investing apps can feel like a casino.', INK)]},
        {'t': 'k', 'size': 132, 'lines': [("This one's different.", ACC), ('No buy button. No pressure.', INK)]},
        {'t': 'phone', 'screen': '4-', 'head': [('Seven companies', INK), ('a day', ACC)],
         'say': 'Just seven companies a day, matched to the causes you care about.'},
        {'t': 'swipe', 'head': [('Read the story.', INK), ('Swipe to save it.', ACC)], 'swipe': 'Swipe', 'say': 'Read the story. Swipe right to save it to your list.'},
        OUTRO],
}
DISPLAY = {'P.E.': 'P/E'}


def seg_text(s):
    return s['say'] if 'say' in s else ' '.join(l[0] for l in s['lines'])


def script(c):
    return ' '.join(seg_text(s) for s in CONCEPTS[c])


# ---------- voiceover ----------
def api_key():
    k = winreg.OpenKey(winreg.HKEY_CURRENT_USER, 'Environment')
    return winreg.QueryValueEx(k, 'ELEVEN_LABS_API')[0].strip()


def stt(path, key):
    b = uuid.uuid4().hex
    body = (f'--{b}\r\nContent-Disposition: form-data; name="model_id"\r\n\r\nscribe_v1\r\n'
            f'--{b}\r\nContent-Disposition: form-data; name="file"; filename="a.mp3"\r\nContent-Type: audio/mpeg\r\n\r\n').encode() + open(path, 'rb').read() + f'\r\n--{b}--\r\n'.encode()
    req = urllib.request.Request('https://api.elevenlabs.io/v1/speech-to-text', data=body,
                                 headers={'xi-api-key': key, 'Content-Type': f'multipart/form-data; boundary={b}'})
    return json.load(urllib.request.urlopen(req, timeout=120)).get('text', '')


def tts(c):
    key = api_key()
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    text = script(c)
    for attempt in range(1, 6):
        body = json.dumps({'text': text, 'model_id': 'eleven_multilingual_v2', 'seed': 40 + attempt,
                           'voice_settings': {'stability': 0.5, 'similarity_boost': 0.75, 'style': 0.15, 'use_speaker_boost': True}}).encode()
        req = urllib.request.Request(f'https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128',
                                     data=body, headers={'xi-api-key': key, 'Content-Type': 'application/json'})
        d = json.load(urllib.request.urlopen(req, timeout=180))
        p = f'{VO}/{c}.mp3'
        open(p, 'wb').write(base64.b64decode(d['audio_base64']))
        a = d['alignment']
        words = []; cur = ''; start = None; end = 0
        for ch, s, e in zip(a['characters'], a['character_start_times_seconds'], a['character_end_times_seconds']):
            if ch.isspace():
                if cur:
                    words.append({'w': cur, 's': start, 'e': end}); cur = ''; start = None
            else:
                if start is None:
                    start = s
                cur += ch; end = e
        if cur:
            words.append({'w': cur, 's': start, 'e': end})
        assert [w['w'] for w in words] == text.split(), 'word mismatch'
        i = [n for n, w in enumerate(words) if w['w'] == 'A.I.'][0]
        clip = f'{VO}/{c}-name.mp3'
        subprocess.run([ff, '-y', '-hide_banner', '-loglevel', 'error', '-ss', f"{words[i - 1]['e']:.3f}", '-to', f"{words[i + 1]['s']:.3f}", '-i', p, clip])
        heard = stt(clip, key)
        ok = re.fullmatch(r'\W*a\W*i\W*', heard.strip(), re.I) is not None
        print(f'{c} try {attempt}: name clip heard as {heard!r} -> {"PASS" if ok else "retry"}')
        if ok:
            json.dump(words, open(f'{VO}/{c}.json', 'w'))
            print('  full transcript:', stt(p, key))
            print(f"  length {words[-1]['e']:.1f}s")
            return
    print(f'{c}: FAILED name check')


# ---------- render ----------
def F(n, s):
    return ImageFont.truetype(f'C:/Windows/Fonts/{n}.ttf', s)


def clamp(x):
    return max(0.0, min(1.0, x))


def ease(x):
    return 1 - (1 - clamp(x)) ** 3


def smooth(x):
    v = clamp(x)
    return v * v * (3 - 2 * v)


bg = Image.new('RGB', (W, H), CREAM)
g = Image.new('L', (W, H), 0)
ImageDraw.Draw(g).ellipse((-300, -700, W + 300, 560), fill=255)
bg.paste(Image.new('RGB', (W, H), TINT), (0, 0), g.filter(ImageFilter.GaussianBlur(170)))
d = ImageDraw.Draw(bg)
d.arc((-1120, 1600, 480, 3200), 225, 335, fill=ACC, width=10)
d.rectangle((66, 92, 72, 160), fill=ACC)
d.text((92, 100), 'StockMatcherAI', font=F('seguisb', 42), fill=INK)
strip = bg.crop((0, 0, W, 470)).convert('RGBA')
a = Image.new('L', (W, 470), 255)
ad = ImageDraw.Draw(a)
for y in range(390, 470):
    ad.line((0, y, W, y), fill=int(255 * (470 - y) / 80))
strip.putalpha(a)

PAD, PW = 70, 1048
SCALED = 2213 * 560 / PW


def phone(name):
    im = Image.open(glob.glob(f'{ROOT}/phones/{name}*.png')[0]).convert('RGBA')
    c = Image.new('RGBA', (im.width + 2 * PAD, im.height + 2 * PAD), (0, 0, 0, 0))
    s = Image.new('L', c.size, 0)
    s.paste(im.getchannel('A'), (PAD, PAD + 20))
    c.paste((60, 30, 20, 255), (0, 0), s.filter(ImageFilter.GaussianBlur(30)).point(lambda v: int(v * .3)))
    c.alpha_composite(im, (PAD, PAD))
    return c


PHONES = {'2-': phone('2-'), '4-': phone('4-')}
SHOT5 = Image.open(f'{repo}/marketing/app-store/5-card-story-first-card.jpg').convert('RGBA')
SHOT1 = Image.open(f'{repo}/marketing/app-store/1-hook-invest-in-what-you-believe.jpg').convert('RGBA')


def rounded(im, r):
    m = Image.new('L', (im.width * 3, im.height * 3), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, m.width - 1, m.height - 1), r * 3, fill=255)
    im = im.copy()
    im.putalpha(m.resize(im.size, Image.LANCZOS))
    return im


def shadowed(im, p=50):
    c = Image.new('RGBA', (im.width + 2 * p, im.height + 2 * p), (0, 0, 0, 0))
    s = Image.new('L', c.size, 0)
    s.paste(im.getchannel('A'), (p, p + 14))
    c.paste((60, 30, 20, 255), (0, 0), s.filter(ImageFilter.GaussianBlur(24)).point(lambda v: int(v * .26)))
    c.alpha_composite(im, (p, p))
    return c


# Real app pieces with no company name, price or return in frame
CARD = SHOT5.crop((211, 1112, 1111, 1402))
CARD = shadowed(rounded(CARD.resize((1000, 322), Image.LANCZOS), 36))
TILE = SHOT5.crop((668, 2121, 1073, 2296))
TILE = shadowed(rounded(TILE.resize((TILE.width * 2, TILE.height * 2), Image.LANCZOS), 40))
CTRL = SHOT5.crop((387, 2319, 932, 2520)).resize((818, 302), Image.LANCZOS)
CTRL_M = Image.new('L', CTRL.size, 0)
ImageDraw.Draw(CTRL_M).rounded_rectangle((14, 14, CTRL.width - 14, CTRL.height - 14), 40, fill=255)
CTRL.putalpha(CTRL_M.filter(ImageFilter.GaussianBlur(10)))
ICON = SHOT1.crop((440, 1010, 880, 1470)).resize((250, 261), Image.LANCZOS)
m = Image.new('L', ICON.size, 0)
ImageDraw.Draw(m).ellipse((16, 12, 234, 249), fill=255)
ICON.putalpha(m.filter(ImageFilter.GaussianBlur(11)))
TONES = {'white': ((255, 255, 255), (92, 76, 70), (222, 210, 202)), 'green': ((236, 244, 230), (52, 105, 52), (190, 216, 176)),
         'amber': ((251, 240, 222), (133, 84, 12), (232, 212, 170))}
cache = {}


def sprite(text, font, size, color):
    k = (text, font, size, color)
    if k not in cache:
        f = F(font, size)
        asc, desc = f.getmetrics()
        im = Image.new('RGBA', (int(f.getlength(text)) + 8, asc + desc + 4), (0, 0, 0, 0))
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


def headline(fr, lines, t, t0, size=84):
    p = ease((t - t0) / .35)
    y = 196
    for txt, c in lines:
        put(fr, sprite(txt, 'seguisb', size, c), 66, y + (1 - p) * 24, p)
        y += int(size * 1.13)


def footer(fr):
    s = sprite('Educational only, not investment advice.', 'segoeui', 32, MUTE)
    put(fr, s, (W - s.width) / 2, 1650)


class Ad:
    def __init__(self, name):
        self.name = name
        self.words = json.load(open(f'{VO}/{name}.json'))
        self.end = self.words[-1]['e'] + 1.7
        self.scenes = []
        i = 0
        for s in CONCEPTS[name]:
            n = len(seg_text(s).split())
            self.scenes.append({**s, 'a': i, 'b': i + n})
            i += n
        for j, s in enumerate(self.scenes):
            s['t0'] = 0 if j == 0 else self.T(s['a'])
            s['t1'] = self.scenes[j + 1]['t0'] if False else None
        for j, s in enumerate(self.scenes):
            s['t1'] = self.T(s['b']) if j < len(self.scenes) - 1 else self.end + 1
            s['caps'] = self.chunks(s['a'], s['b'])
            if s['t'] == 'k':
                self.place(s)

    def T(self, i):
        return self.words[i]['s']

    def word(self, s, token):
        for i in range(s['a'], s['b']):
            if self.words[i]['w'].strip('.,:?').lower() == token.strip('.,:?').lower():
                return self.T(i)
        raise ValueError(token)

    def chunks(self, a, b):
        out = []; cur = a; f = F('seguisb', 50); width = 0
        for i in range(a, b):
            w = self.words[i]['w']
            width += f.getlength(w + ' ')
            brk = w[-1] in '.,:?' and i - cur >= 2
            nxt = self.words[i + 1]['w'] if i + 1 < b else ''
            if i == b - 1 or brk or width + f.getlength(nxt) > 860:
                out.append((cur, i + 1)); cur = i + 1; width = 0
        # Never strand one word: merge it back, or borrow a word from the chunk before
        fixed = []
        for a2, b2 in out:
            if b2 - a2 == 1 and fixed:
                pa, pb = fixed[-1]
                wide = sum(f.getlength(self.words[k]['w'] + ' ') for k in range(pa, b2))
                if wide <= 960:
                    fixed[-1] = (pa, b2)
                else:
                    fixed[-1] = (pa, pb - 1)
                    fixed.append((pb - 1, b2))
            else:
                fixed.append((a2, b2))
        return fixed

    def place(self, s):
        size = s['size']; f = F('seguisb', size); lh = int(size * 1.18)
        placed = []; x = 66; y = 0; i = s['a']
        for li, (text, col) in enumerate(s['lines']):
            for w in text.split():
                shown = DISPLAY.get(w, w)
                l = f.getlength(shown)
                if x + l > 1014 and x > 66:
                    x = 66; y += lh
                placed.append((shown, col, self.T(i), x, y))
                x += l + f.getlength(' '); i += 1
            x = 66; y += lh + (24 if li < len(s['lines']) - 1 else 0)
        off = 880 - y / 2
        s['placed'] = [(w, c, st, px, py + off) for w, c, st, px, py in placed]

    def caption(self, fr, t, s):
        for a, b in s['caps']:
            end = self.T(b) if b < len(self.words) else 1e9
            if self.T(a) - .05 <= t < end:
                f = F('seguisb', 50)
                shown = [(i, self.words[i]['w']) for i in range(a, b)]
                total = sum(f.getlength(w) for _, w in shown) + f.getlength(' ') * (len(shown) - 1)
                x = (W - total) / 2; y = 1432
                pill = Image.new('RGBA', (int(total + 72), 92), (0, 0, 0, 0))
                ImageDraw.Draw(pill).rounded_rectangle((0, 0, pill.width - 1, 91), 34, fill=(30, 20, 24, 236))
                put(fr, pill, x - 36, y - 10)
                for i, w in shown:
                    on = self.T(i) - .03 <= t < (self.T(i + 1) if i + 1 < len(self.words) else 1e9)
                    put(fr, sprite(w, 'seguisb', 50, (255, 178, 140) if on else (255, 255, 255)), x, y)
                    x += f.getlength(w + ' ')
                return

    def draw(self, s, t, fr):
        ty = s['t']; t0 = s['t0']
        if ty == 'k':
            for w, c, st, x, y in s['placed']:
                p = ease((t - st) / .28)
                if p > 0:
                    put(fr, sprite(w, 'seguisb', s['size'], c), x, y + (1 - p) * 34, min(1, p * 1.4))
            footer(fr)
        elif ty == 'phone':
            P = PHONES[s['screen']]
            p = ease((t - t0) / .55)
            if 'zoom' in s:
                zp = smooth((t - self.word(s, s['zoom']) + .1) / .8); z = 1 + .3 * zp
            else:
                z = 1 + .06 * smooth((t - t0 - .4) / 5)
            top = 1625 - SCALED * z + (1 - p) * 420
            w = int(P.width * z * 560 / PW); h = int(P.height * z * 560 / PW)
            im = P.resize((w, h), Image.BILINEAR); k = w / P.width
            x = W / 2 - w / 2; y = top - PAD * k
            fr.paste(im, (int(x), int(y)), im)
            for box, tok in s.get('rings', []):
                pr = t - self.word(s, tok)
                if pr >= 0:
                    x0, y0 = x + (box[0] + PAD) * k, y + (box[1] + PAD) * k
                    x1, y1 = x + (box[2] + PAD) * k, y + (box[3] + PAD) * k
                    grow = (1 - ease(pr / .35)) * 26
                    o = Image.new('RGBA', (int(x1 - x0 + 120), int(y1 - y0 + 120)), (0, 0, 0, 0))
                    ImageDraw.Draw(o).rounded_rectangle((60 - grow, 60 - grow, x1 - x0 + 60 + grow, y1 - y0 + 60 + grow), radius=int(110 * k),
                                                        outline=BRIGHT + (int(255 * min(1, pr / .15)),), width=9)
                    fr.paste(o, (int(x0 - 60), int(y0 - 60)), o)
            fr.paste(strip, (0, 0), strip)
            headline(fr, s['head'], t, t0)
            footer(fr); self.caption(fr, t, s)
        elif ty == 'card':
            p = ease((t - t0 - .05) / .5)
            put(fr, CARD, (W - CARD.width) / 2, 720 + (1 - p) * 120, p)
            headline(fr, s['head'], t, t0); footer(fr); self.caption(fr, t, s)
        elif ty == 'tile_img':
            p = ease((t - t0 - .05) / .5)
            put(fr, TILE, (W - TILE.width) / 2, 720 + (1 - p) * 120, p)
            headline(fr, s['head'], t, t0); footer(fr); self.caption(fr, t, s)
        elif ty == 'tiles':
            n = len(s['tiles']); hgt = 230; gap = 34
            y = 560 if n == 3 else 660
            for tok, label, body, tone in s['tiles']:
                st = self.word(s, tok); p = ease((t - st + .05) / .4)
                if p > 0:
                    fill, lab, edge = TONES[tone]
                    tile = Image.new('RGBA', (948, hgt), (0, 0, 0, 0))
                    ImageDraw.Draw(tile).rounded_rectangle((0, 0, 947, hgt - 1), 36, fill=fill + (255,), outline=edge + (255,), width=3)
                    tile.alpha_composite(sprite(label, 'seguisb', 36, lab), (40, 40))
                    tile.alpha_composite(sprite(body, 'seguisb', 58, INK), (40, 104))
                    put(fr, tile, 66 + (1 - p) * 70, y, min(1, p * 1.3))
                y += hgt + gap
            headline(fr, s['head'], t, t0); footer(fr); self.caption(fr, t, s)
        elif ty == 'swipe':
            st = self.word(s, s['swipe'])
            p = ease((t - t0 - .05) / .5); q = smooth((t - st - .1) / .55)
            cy = 620 + (1 - p) * 120
            if q < 1:
                c = CARD.rotate(-14 * q, resample=Image.BILINEAR, expand=True) if q > 0 else CARD
                put(fr, c, (W - c.width) / 2 + 1150 * q, cy - (c.height - CARD.height) / 2, p * (1 - q * .6))
            put(fr, CTRL, (W - CTRL.width) / 2, 1040, p)
            pop = ease((t - st - .55) / .35)
            if pop > 0:
                msg = sprite('Saved to your list', 'seguisb', 66, ACC)
                put(fr, msg, (W - msg.width) / 2, 770 + (1 - pop) * 26, pop)
            headline(fr, s['head'], t, t0); footer(fr); self.caption(fr, t, s)
        elif ty == 'outro':
            p = ease((t - t0) / .45)
            put(fr, ICON, (W - 250) / 2, 440 + (1 - p) * 40, p)
            rows = [('StockMatcherAI', INK, 720, 92, 'seguisb'), ('Find companies working', ACC, 850, 60, 'seguisb'),
                    ('on the causes you care about', ACC, 924, 60, 'seguisb'), ('Educational only,', MUTE, 1090, 50, 'segoeui'),
                    ('not investment advice.', MUTE, 1156, 50, 'segoeui')]
            for txt, c, y, sz, fn in rows:
                im = sprite(txt, fn, sz, c)
                put(fr, im, (W - im.width) / 2, y + (1 - p) * 30, p)

    def frame(self, t, xf=.22):
        for i, s in enumerate(self.scenes):
            if s['t0'] <= t < s['t1']:
                fr = bg.copy(); self.draw(s, t, fr)
                if i > 0 and t < s['t0'] + xf:
                    o = bg.copy(); self.draw(self.scenes[i - 1], t, o)
                    fr = Image.blend(o, fr, smooth((t - s['t0']) / xf))
                return fr
        raise ValueError(t)


names = only or list(CONCEPTS)
if mode == 'tts':
    for c in names:
        tts(c)
elif mode == 'stills':
    th = []
    for c in names:
        ad = Ad(c)
        for s in ad.scenes[:-1]:
            th.append(ad.frame(min(s['t1'] - .08, s['t0'] + max(1.6, (s['t1'] - s['t0']) * .85))).resize((216, 384)))
        th.append(ad.frame(ad.end - .1).resize((216, 384)))
    cols = 9
    rows = (len(th) + cols - 1) // cols
    sh = Image.new('RGB', (cols * 224 + 8, rows * 392 + 8), (70, 70, 70))
    for i, im in enumerate(th):
        sh.paste(im, (8 + (i % cols) * 224, 8 + (i // cols) * 392))
    sh.save(f'{ROOT}/previews/preview2.png')
    print('ok', len(th))
else:
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    for c in names:
        ad = Ad(c)
        out = f'{OUT}/ad-{c}.mp4'
        n = int(ad.end * FPS)
        p = subprocess.Popen([ff, '-y', '-hide_banner', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS),
                              '-i', '-', '-i', f'{VO}/{c}.mp3', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11,apad', '-t', f'{n / FPS:.3f}',
                              '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-ar', '44100',
                              '-movflags', '+faststart', out], stdin=subprocess.PIPE)
        for i in range(n):
            p.stdin.write(ad.frame(i / FPS).tobytes())
        p.stdin.close(); p.wait()
        print(out, p.returncode, round(n / FPS, 1))
