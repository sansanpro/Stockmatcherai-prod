import os, json, base64, winreg, urllib.request, urllib.error, uuid, subprocess
import imageio_ffmpeg

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
repo = os.path.dirname(os.path.dirname(ROOT))
ff = imageio_ffmpeg.get_ffmpeg_exe()
k = winreg.OpenKey(winreg.HKEY_CURRENT_USER, 'Environment')
key = winreg.QueryValueEx(k, 'ELEVEN_LABS_API')[0].strip()
out = os.path.join(ROOT, 'pron')
os.makedirs(out, exist_ok=True)
VOICE = 'EXAVITQu4vr4xnSDxMaL'  # Sarah
V2 = 'eleven_multilingual_v2'
TURBO = 'eleven_turbo_v2'
PH = '<phoneme alphabet="cmu-arpabet" ph="EY1 AY1">AI</phoneme>'
tail = ' shows you real companies working on them, in plain English.'
variants = {
    'old-A-I': ('Stock Matcher A I' + tail, V2),
    'dots': ('Stock Matcher A.I.' + tail, V2),
    'ay-eye': ('Stock Matcher ay eye' + tail, V2),
    'Ay-Eye-caps': ('Stock Matcher Ay Eye' + tail, V2),
    'hyphen-ay-eye': ('Stock Matcher ay-eye' + tail, V2),
    'phoneme-turbo': ('Stock Matcher ' + PH + tail, TURBO),
    'caps-turbo': ('Stock Matcher AI' + tail, TURBO),
}


def stt(path):
    b = uuid.uuid4().hex
    data = open(path, 'rb').read()
    body = (f'--{b}\r\nContent-Disposition: form-data; name="model_id"\r\n\r\nscribe_v1\r\n'
            f'--{b}\r\nContent-Disposition: form-data; name="file"; filename="a.mp3"\r\nContent-Type: audio/mpeg\r\n\r\n').encode() + data + f'\r\n--{b}--\r\n'.encode()
    req = urllib.request.Request('https://api.elevenlabs.io/v1/speech-to-text', data=body,
                                 headers={'xi-api-key': key, 'Content-Type': f'multipart/form-data; boundary={b}'})
    try:
        return json.load(urllib.request.urlopen(req, timeout=120)).get('text')
    except urllib.error.HTTPError as e:
        return f'HTTP {e.code}'


def region(a):
    # Time from the end of "Matcher" to the start of "shows"
    s = ''.join(a['characters'])
    m = s.find('Matcher') + 6
    n = s.find('shows')
    return a['character_end_times_seconds'][m], a['character_start_times_seconds'][n]


print('variant        | letters_s | clip heard as')
for name, (text, model) in variants.items():
    body = json.dumps({'text': text, 'model_id': model,
                       'voice_settings': {'stability': 0.5, 'similarity_boost': 0.75, 'style': 0.15, 'use_speaker_boost': True}}).encode()
    req = urllib.request.Request(f'https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128',
                                 data=body, headers={'xi-api-key': key, 'Content-Type': 'application/json'})
    try:
        d = json.load(urllib.request.urlopen(req, timeout=120))
    except urllib.error.HTTPError as e:
        print(f'{name:14} | TTS HTTP {e.code} {e.read()[:120]}')
        continue
    p = os.path.join(out, name + '.mp3')
    open(p, 'wb').write(base64.b64decode(d['audio_base64']))
    a = d.get('normalized_alignment') or d['alignment']
    s, e = region(a)
    clip = os.path.join(out, name + '-clip.mp3')
    subprocess.run([ff, '-y', '-hide_banner', '-loglevel', 'error', '-ss', f'{s:.3f}', '-to', f'{e:.3f}', '-i', p, clip])
    print(f'{name:14} | {e - s:9.2f} | {stt(clip)!r}')

print('--- the audio you actually heard, full file then letters only')
for v in ['will', 'jessica', 'sarah']:
    words = json.load(open(f'{ROOT}/vo/{v}.json'))
    i = [n for n, w in enumerate(words) if w['w'] == 'Matcher'][0]
    s, e = words[i]['e'], words[i + 3]['s']
    clip = os.path.join(out, f'heard-{v}-clip.mp3')
    subprocess.run([ff, '-y', '-hide_banner', '-loglevel', 'error', '-ss', f'{s:.3f}', '-to', f'{e:.3f}', '-i', f'{ROOT}/vo/{v}.mp3', clip])
    print(f'{v:14} | {e - s:9.2f} | A={words[i+1]["e"]-words[i+1]["s"]:.2f}s I={words[i+2]["e"]-words[i+2]["s"]:.2f}s | {stt(clip)!r}')
