// Makes the ad voiceovers with word timing, from marketing/ads/creatives/concepts.json. Spends
// ElevenLabs credits. The SDK reads ELEVENLABS_API_KEY, which comes from .env.local:
//
//   FFMPEG=<path to ffmpeg> node --env-file=.env.local marketing/ads/scripts/voiceover.mjs first
//   ... voiceover.mjs all               every hook in the British voice, plus the extra voices
//   ... voiceover.mjs g1-tinder british one ad, one voice
//
// Output: marketing/ads/creatives/vo/<id>-<voice>.mp3 and .json. Existing files are kept.
// Transcribing a whole script hides a misread app name, since speech-to-text corrects it from
// context, so this cuts out only the "A.I." in the name and transcribes that clip.
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const DIR = 'marketing/ads/creatives';
const C = JSON.parse(readFileSync(`${DIR}/concepts.json`, 'utf8'));
const client = new ElevenLabsClient();
mkdirSync(`${DIR}/vo`, { recursive: true });

const script = (hook) => [hook.say, ...C.bodies[hook.cat].map(s => s.say), C.cta].join(' ');

const toWords = (alignment) => {
  const words = [];
  let cur = '', start = null, end = 0;
  alignment.characters.forEach((ch, i) => {
    if (/\s/.test(ch)) {
      if (cur) words.push({ w: cur, s: start, e: end });
      cur = ''; start = null;
    } else {
      if (start === null) start = alignment.characterStartTimesSeconds[i];
      cur += ch; end = alignment.characterEndTimesSeconds[i];
    }
  });
  if (cur) words.push({ w: cur, s: start, e: end });
  return words;
};

async function make(hook, voice) {
  const base = `${DIR}/vo/${hook.id}-${voice}`;
  if (existsSync(`${base}.json`)) return console.log('have', base);
  const text = script(hook);
  for (let attempt = 1; attempt <= 3; attempt++) {
    const r = await client.textToSpeech.convertWithTimestamps(C.voices[voice], {
      text, modelId: 'eleven_v4', outputFormat: 'mp3_44100_128', seed: 40 + attempt,
      voiceSettings: { stability: 0.5, similarityBoost: 0.75 },
    });
    writeFileSync(`${base}.mp3`, Buffer.from(r.audioBase64, 'base64'));
    const words = toWords(r.alignment);
    if (words.map(w => w.w).join(' ') !== text) throw new Error(`word mismatch in ${hook.id}`);

    const i = words.findIndex((w, n) => w.w === 'A.I.' && words[n - 1]?.w === 'Matcher');
    const clip = `${base}-name.mp3`;
    execFileSync(process.env.FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error', '-ss', String(words[i - 1].e), '-to', String(words[i + 1].s), '-i', `${base}.mp3`, clip]);
    const heard = await client.speechToText.convert({ file: new Blob([readFileSync(clip)], { type: 'audio/mpeg' }), modelId: 'scribe_v2' });
    const ok = /^\W*a\W*i\W*$/i.test(heard.text.trim());
    console.log(`${hook.id} ${voice} try ${attempt}: name heard as ${JSON.stringify(heard.text)} ${ok ? 'PASS' : 'retry'}, ${words.at(-1).e.toFixed(1)}s, ${text.length} chars`);
    if (ok) { writeFileSync(`${base}.json`, JSON.stringify(words)); return; }
  }
  console.log(`${hook.id} ${voice}: FAILED the name check`);
}

const [what, voice] = process.argv.slice(2);
const byId = Object.fromEntries(C.hooks.map(h => [h.id, h]));
const jobs = what === 'first' ? C.first_batch
  : what === 'all' ? [...C.hooks.map(h => [h.id, 'british']), ...C.extra_voices.flatMap(id => [[id, 'american'], [id, 'female']])]
  : [[what, voice ?? 'british']];
for (const [id, v] of jobs) await make(byId[id], v);
