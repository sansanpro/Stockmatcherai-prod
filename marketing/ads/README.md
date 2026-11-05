# Ads

Draft video and still ads. Nothing here has run as a paid ad or had a legal review.

The videos are built locally from the App Store screenshots with Pillow and ffmpeg. The voiceover comes from the ElevenLabs API. They use the cream design, which the app moved away from on 2026-10-30, so rebuild them from new screenshots before using them.

## New creatives (current app design)

`creatives/` holds the current ads, from captures of the app as it is in the repo.

- `node scripts/capture-ad-shots.mjs` (dev server running) captures `shots/`, light and dark. Not committed. Doesn't touch `marketing/app-store/`.
- `creatives/concepts.json`: the hooks (gamified, educational, values), video scripts, voices, still copy.
- `creatives/images/`: `*-4x5.png` exported from the editable Canva designs; `*-9x16.png` from `render_videos.py stills`.
- `scripts/voiceover.mjs`: ElevenLabs voiceovers with word timing, via the SDK. The key is in `.env.local` (gitignored). Spends credits. `FFMPEG=<path> node --env-file=.env.local marketing/ads/scripts/voiceover.mjs first`
- `scripts/render_videos.py sheet|video|stills`: review frames, videos, 9:16 stills. Works on any OS.
- `x1-` and `x2-` are experiments with a cold open (`opening` in concepts.json): something moves on frame one, and George speaks faster. `creatives/hand-phone.png` is an AI-generated photo from Canva, cut out by `scripts/make_hand_asset.py`, with the real app screen placed behind the thumb.
- Real share price and move on G1 and E2; other card shots use a copy with them hidden. Prices are a snapshot from the capture date.
- Added disclaimer on E2, E4, M2 and M5 only. Matching is rule-based, so copy says "matches built around your values, with AI to explain every company", not "AI-assisted matching".

Everything below describes the older cream drafts.

## Layout

- `drafts/`: finished ads. `ad-*.mp4` are the current concepts; `video-believe-*.mp4` are the superseded first drafts, one per voice.
- `scripts/build_ads.py`: the current pipeline. The scripts and scenes are in `CONCEPTS`, and the voice is `VOICE`.
- `scripts/crop_phones.py`: cuts the phone screens out of `marketing/app-store/` into `phones/`.
- `scripts/first_draft_tts.py`, `first_draft_render.py`: built the superseded drafts. Their voiceover is in `vo/`.
- `scripts/pronunciation_test_1.py`, `pronunciation_test_2.py`: compared spellings of the app name. Their audio is in `pron/`.
- `vo2/`: voiceover and word timing for the current ads, plus the clip of the name that the check transcribes.
- `voice/`: the voice samples.
- `previews/`: contact sheets, review frames and a Canva export test.

## Running

```
pip install -r marketing/ads/requirements.txt
python marketing/ads/scripts/build_ads.py tts [concept]     # spends ElevenLabs credits
python marketing/ads/scripts/build_ads.py stills [concept]  # writes previews/preview2.png
python marketing/ads/scripts/build_ads.py video [concept]   # writes drafts/ad-<concept>.mp4
```

Windows only: fonts come from `C:/Windows/Fonts`, and the key is read from the `ELEVEN_LABS_API` user environment variable in the registry.

## The app name

The script spells the name `Stock Matcher A.I.`, because `A I` was read as "A". Transcribing a whole script hides this, since speech-to-text corrects the name from context. So `tts` cuts out only the letters, transcribes that clip, and regenerates if it fails. This is still a machine check, so listen to the result.

## Canva

The 9:16 still is an editable design: https://canva.link/qsdop9sqqtrtniq
