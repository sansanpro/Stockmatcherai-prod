// Swaps the five weakest ads (fewest link clicks by 2026-11-05) for five cold-open videos, one for
// one in the same ad sets, so each ad set keeps three ads and its budget.
//
//   node --env-file=.env.local scripts/meta-rotate-ads.mjs create   uploads and creates the new ads, PAUSED
//   node --env-file=.env.local scripts/meta-rotate-ads.mjs swap     turns the new ads on and pauses the old ones
//
// IDs go in marketing/ads/meta-created.json, as with create-meta-campaigns.mjs.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const API = 'https://graph.facebook.com/v23.0';
const ACCOUNT = 'act_1775000777063627';
const PAGE = '1166306203222793';
const STORE = 'https://www.stockmatcherai.com/download';
const DIR = 'marketing/ads/creatives';
const LEDGER = 'marketing/ads/meta-created.json';
const HEADLINE = 'Download StockMatcherAI free';
const MORE = 'Swipe right on real companies working on causes you pick.';

const SWAPS = [
  { out: 'g2-ticker', set: 'gamified', id: 'x2-revenue', hook: "It's Tinder, except the matches have revenue." },
  { out: 'g3-swipes', set: 'gamified', id: 'x5-wrapped', hook: 'Spotify Wrapped, but for where your money could go.' },
  { out: 'e3-degree', set: 'educational', id: 'x8-paralysis', hook: "Analysis paralysis isn't research. It's fear with a spreadsheet." },
  { out: 'm1-saying', set: 'values', id: 'x6-new-year', hook: 'New year, new portfolio. Start with what you actually believe.' },
  { out: 'm3-fight', set: 'values', id: 'x7-three-years', hook: "You've been about to start investing for three years now." },
];

const mode = process.argv[2];
const token = process.env.META_ACCESS_TOKEN;
if (!token) throw new Error('META_ACCESS_TOKEN is missing');
const done = existsSync(LEDGER) ? JSON.parse(readFileSync(LEDGER, 'utf8')) : {};
const save = () => writeFileSync(LEDGER, `${JSON.stringify(done, null, 2)}\n`);
const scrub = (s) => String(s).split(token).join('<token>');

const post = async (path, body) => {
  const form = body instanceof FormData ? body : new FormData();
  if (!(body instanceof FormData)) {
    for (const [k, v] of Object.entries(body)) form.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
  }
  form.append('access_token', token);
  const json = await (await fetch(`${API}/${path}`, { method: 'POST', body: form })).json();
  if (json.error) throw new Error(scrub(`${path}: ${json.error.message} ${json.error.error_user_msg ?? ''}`));
  return json;
};
const get = async (path, fields) => {
  const json = await (await fetch(`${API}/${path}?fields=${fields}&access_token=${encodeURIComponent(token)}`)).json();
  if (json.error) throw new Error(scrub(`${path}: ${json.error.message}`));
  return json;
};
const once = async (key, make) => {
  if (done[key]) return done[key];
  done[key] = await make();
  save();
  console.log('created', key, done[key]);
  return done[key];
};
const fileBlob = (path, type) => new File([readFileSync(path)], path.split('/').pop(), { type });

if (mode === 'create') {
  for (const s of SWAPS) {
    const video_id = await once(`video:${s.id}-british`, async () => {
      const form = new FormData();
      form.append('name', `${s.id}-british`);
      form.append('source', fileBlob(`${DIR}/videos/${s.id}-british.mp4`, 'video/mp4'));
      const { id } = await post(`${ACCOUNT}/advideos`, form);
      for (let i = 0; i < 60; i++) {
        const { status } = await get(id, 'status');
        if (status?.video_status === 'ready') return id;
        if (status?.video_status === 'error') throw new Error(`video ${s.id} failed processing`);
        await new Promise(r => setTimeout(r, 5000));
      }
      throw new Error(`video ${s.id} still processing`);
    });
    const image_hash = await once(`image:${s.id}-9x16`, async () => {
      const form = new FormData();
      form.append('filename', fileBlob(`${DIR}/images/${s.id}-9x16.png`, 'image/png'));
      return Object.values((await post(`${ACCOUNT}/adimages`, form)).images)[0].hash;
    });
    const spec = { page_id: PAGE, video_data: {
      video_id, image_hash, message: `${s.hook} ${MORE}`, title: HEADLINE, call_to_action: { type: 'DOWNLOAD', value: { link: STORE } },
    } };
    const creative = await once(`creative:${s.id}`, async () => (await post(`${ACCOUNT}/adcreatives`, { name: s.id, object_story_spec: spec })).id);
    await once(`ad:${s.id}`, async () => (await post(`${ACCOUNT}/ads`, {
      name: s.id, adset_id: done[`adset:${s.set}`], creative: { creative_id: creative }, status: 'PAUSED',
    })).id);
  }
} else if (mode === 'swap') {
  // New ads first, so an ad set is never left with fewer ads running if a call fails
  for (const s of SWAPS) await post(done[`ad:${s.id}`], { status: 'ACTIVE' });
  for (const s of SWAPS) await post(done[`ad:${s.out}`], { status: 'PAUSED' });
} else {
  throw new Error('usage: meta-rotate-ads.mjs create|swap');
}

console.log(new Date().toISOString());
for (const s of SWAPS) {
  for (const name of [s.id, s.out]) {
    const a = await get(done[`ad:${name}`], 'name,status,effective_status,ad_review_feedback');
    console.log(s.set, a.name, a.status, a.effective_status, a.ad_review_feedback ? JSON.stringify(a.ad_review_feedback) : '');
  }
}
