# Phase 4: 3D motion graphics

Concept from `docs/phase-0.md` (section 6): on the recap, the companies you liked circle the 3D emblem of your top cause. I built it three ways on a hidden lab route, measured all three the same way, and shipped the one that won.

## What shipped

**The cause orbit** (`src/components/values/CauseOrbit.tsx`, CSS in `src/index.css`):
- It's on the recap's "What your likes say about you" slide. Up to 8 liked companies circle the top cause's emblem on a ring tipped back 68°, one turn every 24 seconds. Likes for that cause come first. With a single like, the slide keeps today's floating art.
- It's built only from CSS 3D transforms. Every logo runs the same keyframes, offset by a negative delay, so the browser's compositor does all the work and no JavaScript runs per frame.
- The emblem stands upright in the same 3D space, so logos pass behind it and in front of it.
- Under reduced motion, the ring holds still with the logos in place, and the emblem fades in.
- It's decorative (`aria-hidden`). The persona and facts below carry the meaning.

## Measurements

Every option ran on the lab route (`/lab/orbit?v=…`) for 10 s after a 1 s warm-up, from a production build. The tools: `e2e/orbit-perf.spec.ts`, plus Mobile Safari in the iOS Simulator (iPhone 16), which posted results to a local receiver. Raw results: `docs/phase4/perf-*.json`.

| | Today (static art) | **CSS orbit (shipped)** | Lottie | three.js |
|---|---|---|---|---|
| Lazy download (compressed) | 0 | **0.6 KB** (+0.24 KB CSS) | 49.5 KB | 135.1 KB |
| iOS Simulator Safari: frame time, median / 95th percentile | 17 / 17 ms | **17 / 17 ms** | 17 / 17 ms | 17 / 17 ms |
| iOS Simulator Safari: late frames (over 25 ms), of about 600 | 0 | **0** | 0 to 1 | 0 |
| iOS Simulator Safari: time to first frame | 31 ms | **49 to 55 ms** | 31 to 39 ms | **1,414 ms** first visit, 72 ms cached |
| Chromium on the Mac's real GPU, CPU slowed 4×: 95th percentile, late frames | 16.8 ms, 0 | **16.8 ms, 0** | 16.8 ms, 0 | 16.8 ms, 0 |
| Chromium on the Mac's real GPU, CPU slowed 4×: time to first frame | 54 ms | **34 ms** | 64 ms | 129 ms |
| JavaScript per frame (95th percentile) | 0 | **0** | 0.5 ms | 0.6 ms |
| Main thread busy (Chromium, normal speed; a battery proxy) | 3.1% | **4.7%** | 7.7% | 6.7% |
| Shows missing logos | n/a | **yes (initials)** | no: broken-image icon | yes (initials) |

Every option holds 60 frames per second here. So the choice came down to cost, start-up time and what each can show. The CSS orbit:
- downloads 200 times less than three.js;
- runs no script per frame;
- starts as fast as today's art;
- keeps the initials fallback for logos that don't load.

Against the hard goals:

| Goal | Result |
|---|---|
| 60 frames per second | Yes: 0 late frames in the iOS Simulator and in Chromium with the CPU slowed 4×. Not measured on a real iPhone 12 (no device yet); the simulator draws with the Mac's GPU. |
| Touch response under 100 ms | Not affected: the orbit takes no touches, and the recap's tap zones are unchanged. |
| 3D lazy-loaded; initial bundle growth under 150 KB compressed | **+0.45 KB JavaScript, +0.24 KB CSS** (main script 356.15 → 356.60 KB). The emblem images already load on demand. Phases 1 to 4 together: about 6.8 KB. |
| Every animation has a reduced-motion fallback | Yes, tested: no animation, logos hold still. |
| Existing tests | **42 passed** (1 new orbit test, plus a recap assertion), deck rules pass |

Screens: `docs/phase4/side-by-side.png` (all four in iOS Safari) and `docs/phase4/screens/` (`ios-recap.png` is the real recap slide on iOS).

## Tried and dropped

- **Rive.** The runtime is about 457 KB compressed: 118 KB of JavaScript plus a 339 KB WebAssembly engine. Phase 0 estimated 70 to 150 KB. Rive scenes also have to be made in Rive's own editor. Dropped before prototyping. Lottie took its place as the vector option; the brief allows Three.js, Rive or Lottie.
- **three.js** (`src/lab/ThreeOrbit.tsx`). It's built with production techniques: one scene, 36 instanced sparkles, a lit ring, rendering paused off screen, and the pixel ratio dropped when frames run long.
  - It held 60 fps, but its first frame took 1.4 s on a first visit in iOS Safari, while WebGL started up and compiled shaders.
  - It adds 135 KB.
  - The logo host (finnhub) sends no cross-origin (CORS) headers, so WebGL can't draw the logos as textures without a server-side image proxy. That would be a server change. Logos had to be HTML layered over the canvas.
  - At this size, the lit ring and sparkles add little you can see.
- **Lottie** (`src/lab/LottieOrbit.tsx`, light SVG player).
  - It held 60 fps and adds 49.5 KB.
  - Lottie draws layers in a fixed order, so each logo is drawn twice and swapped by depth.
  - A logo that doesn't exist shows a broken-image icon.
  - Its files are normally drawn in an animation tool. Generating one from code removes its main advantage.

These prototypes stay on the lab route as a record. `three` and `lottie-web` are development-only dependencies. The route exists only in dev or with `VITE_LAB=1`, so normal builds contain none of it (checked).

## Measurement notes

- **Headless Chromium draws WebGL in software** (SwiftShader), which would make three.js look unfairly slow. The `orbit-gpu` Playwright project starts Chromium on the Mac's real GPU (ANGLE Metal).
- **Playwright's headless WebKit flattens CSS 3D.** It doesn't composite 3D layers, so its screenshots show the logos lying flat on the ring. iOS Safari (simulator) and Chromium draw it correctly, and the orbit test checks depth by hit-testing, which WebKit does in 3D. For how it really looks, use the `ios-*` screenshots, not the WebKit ones. WebKit's frame timer also jitters with nothing moving (16 late frames for the static art), so its frame numbers are relative only.
- **Safari rounds `performance.now()` to whole milliseconds**, so iOS frame times read 17 ms, not 16.7.

## Still open

- **Preference check.** The brief ships an option only if it "beats the baseline in a side-by-side preference check". I can't run that with users. `docs/phase4/side-by-side.png` shows all four for the owner to judge. If the static art wins, the orbit can be removed in a single line in `DailyRecap.tsx`.
- **A real iPhone** for frame times and 120 Hz ProMotion, when device testing starts.
- **Onboarding emblems** still use the floating art (`Art3D`). The orbit needs liked companies, so it fits only the recap.
