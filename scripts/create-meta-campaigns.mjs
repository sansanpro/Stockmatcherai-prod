// Creates the StockMatcherAI app-install campaign on Meta, everything PAUSED. Nothing spends until
// someone turns it on in Ads Manager. Copy and files come from marketing/ads/creatives.
//
//   node --env-file=.env.local scripts/create-meta-campaigns.mjs            prints the plan, calls nothing
//   node --env-file=.env.local scripts/create-meta-campaigns.mjs --apply    creates it
//
// Needs META_ACCESS_TOKEN (ads_management). Created IDs go in marketing/ads/meta-created.json, so
// a re-run after a failure carries on instead of making duplicates. If Meta asks for a verified
// advertiser, add --regional=<categories, comma separated> to attach the verified identity.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const API = 'https://graph.facebook.com/v23.0';
const ACCOUNT = 'act_1775000777063627';
const PAGE = '1166306203222793';
const APP = '2047386062877252';
const STORE = 'http://itunes.apple.com/app/id6758280940'; // as registered on the Meta app
const IMAGES = 'marketing/ads/creatives/images';
const VIDEOS = 'marketing/ads/creatives/videos';
const LEDGER = 'marketing/ads/meta-created.json';
const DAILY_CENTS = 1000;
const CAMPAIGN = 'StockMatcherAI app installs - iOS 15+';
const IDENTITY = '1713935727401611'; // the advertiser verified in Ads Manager
const USER_OS = 'iOS_ver_15.0_and_above'; // the app's minimum

const SETS = [
  { key: 'gamified', name: 'Gamified hooks', ads: [
    { id: 'g1-tinder', video: 'g1-tinder-british', hook: "It's like Tinder, but for stocks.", more: 'Swipe right on companies that match your values.' },
    { id: 'g2-ticker', hook: 'Your next match has a ticker symbol.', more: 'Matches built around your values, with AI to explain every company.' },
    { id: 'g3-swipes', hook: 'Your swipes reveal what kind of investor you are.', more: 'Like a few companies. See what your likes say about you.' },
  ] },
  { key: 'educational', name: 'Educational hooks', ads: [
    { id: 'e1-just-invest', video: 'e1-just-invest-british', hook: 'Everyone says "just invest." Nobody explains in what.', more: 'See what each company does, the proof, and what to know.' },
    { id: 'e2-pe-ratio', hook: 'Nobody ever explained what a P/E ratio actually means.', more: 'The numbers, in plain words. Ask AI the rest. Educational only, not investment advice.' },
    { id: 'e3-degree', hook: "You don't need a finance degree to understand a stock.", more: 'Plain English, with AI to explain every company.' },
  ] },
  { key: 'values', name: 'Values hooks', ads: [
    { id: 'm2-donate', video: 'm2-donate-british', hook: "You'd donate to fight cancer. Could you name one company working on it?", more: 'See real companies working on your causes, with proof. Educational only, not investment advice.' },
    { id: 'm1-saying', hook: 'Your money is already saying something. Is it what you believe?', more: 'Find companies working on the things you care about.' },
    { id: 'm3-fight', hook: 'What do you want your money to fight for?', more: 'Cancer, clean energy, clean water and more. You pick.' },
  ] },
];
const HEADLINE = 'Download StockMatcherAI free';

const apply = process.argv.includes('--apply');
const regional = process.argv.find(a => a.startsWith('--regional='))?.slice(11).split(',');
const token = process.env.META_ACCESS_TOKEN;
if (!token) throw new Error('META_ACCESS_TOKEN is missing');
const done = existsSync(LEDGER) ? JSON.parse(readFileSync(LEDGER, 'utf8')) : {};
const save = () => writeFileSync(LEDGER, `${JSON.stringify(done, null, 2)}\n`);

const post = async (path, body) => {
  const form = body instanceof FormData ? body : new FormData();
  if (!(body instanceof FormData)) {
    for (const [k, v] of Object.entries(body)) form.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
  }
  form.append('access_token', token);
  const res = await fetch(`${API}/${path}`, { method: 'POST', body: form });
  const json = await res.json();
  if (json.error) throw new Error(`${path}: ${json.error.message} ${json.error.error_user_msg ?? ''}`.split(token).join('<token>'));
  return json;
};
const get = async (path, fields) => {
  const res = await fetch(`${API}/${path}?fields=${fields}&access_token=${encodeURIComponent(token)}`);
  const json = await res.json();
  if (json.error) throw new Error(`${path}: ${json.error.message}`);
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

const uploadImage = (id, size) => once(`image:${id}-${size}`, async () => {
  const form = new FormData();
  form.append('filename', fileBlob(`${IMAGES}/${id}-${size}.png`, 'image/png'));
  const json = await post(`${ACCOUNT}/adimages`, form);
  return Object.values(json.images)[0].hash;
});
const uploadVideo = (name) => once(`video:${name}`, async () => {
  const form = new FormData();
  form.append('name', name);
  form.append('source', fileBlob(`${VIDEOS}/${name}.mp4`, 'video/mp4'));
  const { id } = await post(`${ACCOUNT}/advideos`, form);
  for (let i = 0; i < 60; i++) {
    const { status } = await get(id, 'status');
    if (status?.video_status === 'ready') return id;
    if (status?.video_status === 'error') throw new Error(`video ${name} failed processing`);
    await new Promise(r => setTimeout(r, 5000));
  }
  throw new Error(`video ${name} still processing`);
});

const adSetBody = (set, campaignId) => ({
  name: set.name,
  campaign_id: campaignId,
  status: 'PAUSED',
  daily_budget: DAILY_CENTS,
  billing_event: 'IMPRESSIONS',
  optimization_goal: 'APP_INSTALLS',
  bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
  promoted_object: { application_id: APP, object_store_url: STORE },
  campaign_attribution: 'SKADNETWORK',
  ...(regional && {
    regional_regulated_categories: regional,
    regional_regulation_identities: { universal_beneficiary: IDENTITY, universal_payer: IDENTITY },
  }),
  targeting: {
    geo_locations: { countries: ['US'] },
    age_min: 18,
    age_max: 65,
    age_range: [18, 44], // a suggestion to Advantage+ audience, which may go older
    device_platforms: ['mobile'],
    user_os: [USER_OS],
    targeting_automation: { advantage_audience: 1 },
    publisher_platforms: ['facebook', 'instagram', 'threads'],
    facebook_positions: ['feed', 'instream_video', 'marketplace', 'story', 'search', 'biz_disco_feed', 'facebook_reels', 'facebook_reels_overlay', 'profile_feed'],
    instagram_positions: ['stream', 'story', 'explore', 'reels', 'explore_home', 'profile_feed', 'ig_search'],
    threads_positions: ['threads_stream'],
  },
});
const message = (ad) => `${ad.hook} ${ad.more}`;
const cta = { type: 'DOWNLOAD', value: { link: STORE, application: APP } };

if (!apply) {
  console.log(`Campaign: ${CAMPAIGN} (PAUSED), account ${ACCOUNT}, page ${PAGE}`);
  for (const set of SETS) {
    console.log(`\nAd set: ${set.name}, $${DAILY_CENTS / 100}/day, US, 18-44 (Advantage+ audience), iOS 15+, PAUSED`);
    for (const ad of set.ads) {
      const files = ad.video ? [`${VIDEOS}/${ad.video}.mp4`] : [`${IMAGES}/${ad.id}-4x5.png`];
      for (const f of files) if (!existsSync(f)) throw new Error(`missing ${f}`);
      console.log(`  ${ad.video ? 'video' : 'image'}  ${ad.id}: ${message(ad)}`);
    }
  }
  console.log('\nNothing created. Add --apply to create it, paused.');
  process.exit();
}

const campaignId = await once('campaign', async () => (await post(`${ACCOUNT}/campaigns`, {
  name: CAMPAIGN, objective: 'OUTCOME_APP_PROMOTION', status: 'PAUSED', special_ad_categories: [], is_adset_budget_sharing_enabled: false,
  is_skadnetwork_attribution: true, // can't be changed once published, and without it Meta stops at iOS 14.4
  promoted_object: { application_id: APP, object_store_url: STORE },
})).id);
for (const set of SETS) {
  const adSetId = await once(`adset:${set.key}`, async () => (await post(`${ACCOUNT}/adsets`, adSetBody(set, campaignId))).id);
  for (const ad of set.ads) {
    const spec = { page_id: PAGE };
    if (ad.video) {
      const video_id = await uploadVideo(ad.video);
      const image_hash = await uploadImage(ad.id, '9x16');
      spec.video_data = { video_id, image_hash, message: message(ad), title: HEADLINE, call_to_action: cta };
    } else {
      const image_hash = await uploadImage(ad.id, '4x5');
      spec.link_data = { image_hash, link: STORE, message: message(ad), name: HEADLINE, call_to_action: cta };
    }
    const creative = await once(`creative:${ad.id}`, async () => (await post(`${ACCOUNT}/adcreatives`, { name: ad.id, object_story_spec: spec })).id);
    await once(`ad:${ad.id}`, async () => (await post(`${ACCOUNT}/ads`, { name: ad.id, adset_id: adSetId, creative: { creative_id: creative }, status: 'PAUSED' })).id);
  }
}

// Read back what Meta stored
const camp = await get(campaignId, 'name,status,objective,is_skadnetwork_attribution');
console.log('\ncampaign', camp.name, camp.status, camp.objective, 'iOS 14+ type:', camp.is_skadnetwork_attribution);
for (const set of SETS) {
  const s = await get(done[`adset:${set.key}`], 'name,status,daily_budget,targeting');
  console.log('ad set', s.name, s.status, `$${s.daily_budget / 100}/day`, s.targeting.user_os);
  if (s.targeting.user_os?.join() !== USER_OS) throw new Error(`${s.name}: Meta stored ${s.targeting.user_os}, not ${USER_OS}`);
  for (const ad of set.ads) {
    const a = await get(done[`ad:${ad.id}`], 'name,status,effective_status,creative{object_story_spec}');
    const spec = a.creative?.object_story_spec ?? {};
    const c = (spec.video_data ?? spec.link_data)?.call_to_action?.type;
    console.log('  ad', a.name, a.status, a.effective_status, c);
  }
}
console.log(`\nhttps://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${ACCOUNT.slice(4)}`);
