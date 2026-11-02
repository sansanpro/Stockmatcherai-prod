import sys, os, json, base64, winreg, urllib.request
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
repo = os.path.dirname(os.path.dirname(ROOT))
k=winreg.OpenKey(winreg.HKEY_CURRENT_USER,'Environment'); key=winreg.QueryValueEx(k,'ELEVEN_LABS_API')[0].strip()
text=("Your money is already saying something. What do you want it to say? "
"Pick the causes you care about, like beating cancer or clean energy. "
"Stock Matcher A I shows you real companies working on them, in plain English, with the risks included. "
"Educational only, not investment advice.")
voices={'will':'bIHbv24MWmeRgasZH58o','jessica':'cgSgspJ2msm6clMCkdW9','sarah':'EXAVITQu4vr4xnSDxMaL'}
for n,v in voices.items():
    body=json.dumps({'text':text,'model_id':'eleven_multilingual_v2','voice_settings':{'stability':0.5,'similarity_boost':0.75,'style':0.15,'use_speaker_boost':True}}).encode()
    req=urllib.request.Request(f'https://api.elevenlabs.io/v1/text-to-speech/{v}/with-timestamps?output_format=mp3_44100_128',data=body,headers={'xi-api-key':key,'Content-Type':'application/json'})
    d=json.load(urllib.request.urlopen(req,timeout=120))
    open(os.path.join(ROOT,'vo',n+'.mp3'),'wb').write(base64.b64decode(d['audio_base64']))
    a=d.get('normalized_alignment') or d['alignment']
    words=[];cur='';start=None;end=0
    for c,s,e in zip(a['characters'],a['character_start_times_seconds'],a['character_end_times_seconds']):
        if c.isspace():
            if cur: words.append({'w':cur,'s':start,'e':end}); cur='';start=None
        else:
            if start is None:start=s
            cur+=c;end=e
    if cur: words.append({'w':cur,'s':start,'e':end})
    json.dump(words,open(os.path.join(ROOT,'vo',n+'.json'),'w'),indent=0)
    print(n,len(words),'words',round(words[-1]['e'],2),'s',[w['w'] for w in words[:3]])
