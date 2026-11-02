import sys, os, json, base64, winreg, urllib.request, urllib.error, uuid

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
repo = os.path.dirname(os.path.dirname(ROOT))
k = winreg.OpenKey(winreg.HKEY_CURRENT_USER, 'Environment')
key = winreg.QueryValueEx(k, 'ELEVEN_LABS_API')[0].strip()
out = os.path.join(ROOT, 'pron')
os.makedirs(out, exist_ok=True)
VOICE = 'EXAVITQu4vr4xnSDxMaL'  # Sarah
variants = {
    'old-A-I': 'Stock Matcher A I shows you real companies.',
    'dots': 'Stock Matcher A.I. shows you real companies.',
    'caps': 'Stock Matcher AI shows you real companies.',
    'hyphen': 'Stock Matcher A-I shows you real companies.',
    'ay-eye': 'Stock Matcher ay eye shows you real companies.',
    'ay-comma-eye': 'Stock Matcher, ay, eye. It shows you real companies.',
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
        return f'STT HTTP {e.code}: {e.read()[:160]}'


for name, text in variants.items():
    body = json.dumps({'text': text, 'model_id': 'eleven_multilingual_v2',
                       'voice_settings': {'stability': 0.5, 'similarity_boost': 0.75, 'style': 0.15, 'use_speaker_boost': True}}).encode()
    req = urllib.request.Request(f'https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128',
                                 data=body, headers={'xi-api-key': key, 'Content-Type': 'application/json'})
    d = json.load(urllib.request.urlopen(req, timeout=120))
    p = os.path.join(out, name + '.mp3')
    open(p, 'wb').write(base64.b64decode(d['audio_base64']))
    a = d.get('normalized_alignment') or d['alignment']
    idx = ''.join(a['characters']).find('Matcher') + 7
    span = round(a['character_end_times_seconds'][min(idx + 8, len(a['characters']) - 1)] - a['character_start_times_seconds'][idx], 2)
    print(f'{name:14} | {text:55} | STT: {stt(p)}')
