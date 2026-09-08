# Bolt UI kit implementation handoff

Prepared from the working source on 2026-09-06. Planning only: the artwork exists, but application integration has not been performed.

## Scope and counting rule

Implement 32 assets across **61 mobile placement slots in 10 screens/states**. A slot means one semantic UI placement or conditional state, not one PNG reference or one DOM element. A button with an icon and a surface counts once. Each of the four ambient particles counts once. A repeated reward/roster template counts once regardless of how many rows render. Alternative assets within one slot (on/off or claimed/unclaimed) count once. The wallet counts once on each of its two screens, although only one shared component needs editing. Nickname modal reuse does not double-count its internals.

This is a proposed implementation inventory, not a claim that 61 existing Lucide tags exist. Some slots currently use raster art, emoji, or plain text. Seven additional web-only slots are documented separately and excluded from the mobile total.

| Screen/state | Slots | IDs |
| --- | ---: | --- |
| Intro | 9 | 01–09 |
| Hero selection | 11 | 10–20 |
| Daily reward modal | 7 | 21–27 |
| Settings modal | 6 | 28–33 |
| Nickname modal | 4 | 34–37 |
| Leaderboard | 5 | 38–42 |
| Loading screen | 2 | 43–44 |
| Gameplay HUD | 2 | 45–46 |
| Gameplay idle/start | 4 | 47–50 |
| Gameplay pause and results overlays | 11 | 51–61 |
| **Total** | **61** | |

## Paths

- Mobile root: `/Users/vekazhadzic/Desktop/kidsvolt-bolt-mobile`
- Shared web root: `/Users/vekazhadzic/Desktop/kidsvolt-web`
- Source art: `/Users/vekazhadzic/Desktop/kidsvolt-bolt-mobile/mobile-game-assests/bolt-ui-kit-v1`
- Shared gameplay source: `/Users/vekazhadzic/Desktop/kidsvolt-web/client/src/components/BoltGame3D.tsx`
- Mobile imports that shared source through the `@game` alias in `vite.config.ts`.

Paths below beginning `src/` are relative to the mobile root. Asset names omit `.png`; icons are in `icons/`, surfaces in `surfaces/`. Source anchors are given instead of brittle line numbers.

## Complete placement ledger

| ID | Source and existing anchor | Asset(s) and intended treatment |
| --- | --- | --- |
| 01 | `src/screens/IntroScreen.tsx` → `WalletPill` | `panel-wallet`; preserve live balance and animation; embedded bolt replaces separate Zap |
| 02 | Intro → Leaderboard button / Trophy | `trophy`; retain accessible name |
| 03 | Intro → AMBIENT[0] | `lightning` |
| 04 | Intro → AMBIENT[1] | `star` |
| 05 | Intro → AMBIENT[2], sparkle | `star`; decorative substitution |
| 06 | Intro → AMBIENT[3] | `lightning` |
| 07 | Intro → Daily rewards raster button | `gift`; keep the existing button handler and add real-text Daily rewards label |
| 08 | Intro → Settings raster button | `settings`; keep handler and real-text Settings label |
| 09 | Intro → Play raster button | `button-primary` + `play` + real-text Play; preserve entrance/pulse behavior |
| 10 | `src/screens/HeroSelectScreen.tsx` → WalletPill | `panel-wallet`; same shared implementation as 01 |
| 11 | Hero → Back to main menu | `arrow-left` |
| 12 | Hero → previous ArrowButton | `arrow-left`; retain disabled endpoint behavior |
| 13 | Hero → next ArrowButton | `arrow-right`; retain disabled endpoint behavior |
| 14 | HeroVisual → locked badge | `lock` |
| 15 | Hero roster → purchasable locked price badge | `lightning`; repeated template, retain numeric cost and Soon branch |
| 16 | Hero roster → selected and unlocked badge | `check`; repeated conditional template |
| 17 | Hero → SELECT GameButton | `button-primary`; text remains SELECT |
| 18 | Hero → COMING SOON status block | `button-disabled` + `lock`; keep noninteractive role=status |
| 19 | Hero → UNLOCK GameButton | `button-action` + `lock` + `lightning`; retain cost and unaffordable feedback |
| 20 | Hero → Collect more bolts helper | `lightning`; replace only the currency emoji |
| 21 | `src/screens/DailyRewardModal.tsx` → heading region | `panel-daily-reward` when !alreadyDone, `panel-reward-claimed` otherwise; real-text Daily Reward; embedded gift/check replaces heading Gift |
| 22 | Daily → See you tomorrow subtitle | `gift` replacing trailing emoji |
| 23 | Daily → REWARDS amount template | `lightning`; seven rendered day tiles, one template slot |
| 24 | Daily → claimed tile badge template | `check`; up to seven repeated badges |
| 25 | Daily → justClaimed feedback | `star` + `lightning`; replaces celebration/currency emoji, retains amount and animation |
| 26 | Daily → Claim reward button | `button-primary` + `gift`; preserve claim-once logic |
| 27 | Daily → Close button after claim | `button-secondary` + `close` |
| 28 | `src/screens/SettingsModal.tsx` → heading | `settings` |
| 29 | Settings → Music ToggleRow | `music`; keep icon stable and switch communicates on/off |
| 30 | Settings → Sound effects ToggleRow | `sound` when on, `mute` when off; one slot with two states |
| 31 | Settings → Vibration ToggleRow | `vibration` |
| 32 | Settings → Made with bolts footer | `lightning` replacing emoji |
| 33 | Settings → Done | `button-primary` |
| 34 | `src/screens/NicknameModal.tsx` → UserRound heading | `profile` |
| 35 | Nickname → ShieldAlert beside privacy guidance | `shield`; guidance remains visible text |
| 36 | Nickname → Save | `button-primary`; preserve validation and onSaved |
| 37 | Nickname → Not now | `button-secondary` + `close`; preserve onClose |
| 38 | `src/screens/LeaderboardScreen.tsx` → Back | `arrow-left` |
| 39 | Leaderboard → heading Trophy | `trophy` |
| 40 | Leaderboard → Change your name | `edit` |
| 41 | Leaderboard → failed state WifiOff | `offline` |
| 42 | Leaderboard → empty state Crown | `crown` |
| 43 | `src/LoadingScreen.tsx` → lightning tip | `lightning`; structured tip content |
| 44 | Loading → star tip | `star`; structured tip content |
| 45 | `BoltGame3D.tsx` → isActive && isFullscreen score | `lightning`; keep compact existing HUD, do not widen to a panel |
| 46 | Game → fullscreen pause control | `pause`; retain 48×48 hit target and safe area |
| 47 | Game → idle/start button Rocket | `button-primary` + `play`; retain START RUN and startGame |
| 48 | Game → fullscreen swipe hint ChevronLeft | `arrow-left` |
| 49 | Game → fullscreen swipe hint ChevronRight | `arrow-right` |
| 50 | Game → fullscreen jump hint ArrowUp | `arrow-up`; explanatory hint only, no new control |
| 51 | Game → paused overlay heading Pause | `pause` |
| 52 | Game → paused Score card | `lightning`; retain compact card and score |
| 53 | Game → paused Best card | `panel-personal-best`; embedded trophy; real Best label and Math.max(hiScore, score) |
| 54 | Game → Resume button | `button-primary` + `play`; same resumeGame |
| 55 | Game → Change Hero / Quit to Menu button | `button-secondary` + `profile` when onBackToHeroSelect exists, otherwise `home`; same quitToMenu |
| 56 | Game → game-over heading Skull | `replay`; friendlier end-of-run mark, retain GAME OVER text and state |
| 57 | Game → game-over Score card | `lightning`; retain lastSc |
| 58 | Game → game-over Best card | `panel-personal-best`; embedded trophy, retain hiScore |
| 59 | Game → newRec celebration | `crown`; retain condition and animation |
| 60 | Game → Play Again | `button-primary` + `replay`; same startGame |
| 61 | Game → Main Menu | `button-secondary` + `home`; retain onBackToMenu condition and handler |

All 32 assets have at least one assigned slot. The disabled surface is used for the existing Coming Soon state; do not disable the unaffordable Unlock button, which currently supplies denial feedback. No shield ability or new gameplay feature is implied by this artwork.

### Web-only exclusions (7)

In shared BoltGame3D: non-fullscreen active score, active sound/mute, active pause, active Best, idle sound/mute, lightning legend entry, star legend entry. Keep existing appearance when no mobile skin is supplied. The shared idle start button itself is already slot 47 and must also retain its web fallback. Mobile currently sets `immersive`, `standalone`, and `autoStart={false}` in App.tsx, so slots 47–50 are reachable.

Other exclusions: Three.js pickups/models, actual hero portraits and emoji fallback identities, app icon, intro background, loading progress bar, difficulty radios/tabs, nickname input, switch tracks/thumbs, and unrepresented robot/block/runner emoji. Do not replace hero identities with the generic profile mask, reintroduce stat bars, add touch arrows, or redesign unrelated layouts.

## Technical implementation contract

### 1. Inspect the exported artwork before using it

The files were cropped from generated atlases, not generated separately. Automated validation previously checked RGBA, dimensions, and transparent corners; it does not establish perfect edge quality. Inspect all 32 exports on light and dark backgrounds before integration. In particular check the wallet medallion tip and reward-panel edges for clipping or neighboring fragments. Do not rerun the export script blindly or replace originals. Report a crop problem if present and fix only the affected export using an authorized image workflow.

Icons are 256×256; surfaces are 768×256, with transparent padding and slightly different visible bounds. Rendering everything at the same outer width does not guarantee equal apparent size. Normal icons should be approximately 24–32 CSS px; the old 10–12 px badges need approximately 16–20 px and adjusted spacing to remain legible. Verify at actual phone scale.

### 2. Centralize mobile asset imports

Create `src/ui/boltAssets.ts` with explicit Vite PNG imports for all 32 individual files from `../../mobile-game-assests/bolt-ui-kit-v1/icons/` and `/surfaces/`. Export typed `boltIcons` and `boltSurfaces` objects and their key types. Use imports so Vite bundles hashed URLs; no absolute development filesystem URLs, runtime directory scans, or PNG imports from generated_images.

Do not import the two atlases into runtime. Do not duplicate assets into public or native folders manually. `scripts/sync-mobile-assets.mjs` clears public/models and public/game on builds, so manually copying UI assets there is especially fragile. Static imports avoid this pipeline issue.

Create `src/ui/BoltIcon.tsx`: typed name, numeric size with explicit width/height, optional className. Render an img with alt="", aria-hidden="true", draggable={false}, objectFit:contain, flexShrink:0, pointerEvents:none. Labels belong on the control or surrounding text. Do not carry over Lucide strokeWidth/fill/currentColor styling to PNGs. Preserve an existing informative textual label when replacing inline emoji.

### 3. Buttons and panels

Update `src/ui/GameButton.tsx` once for its seven existing call sites (two hero actions, two daily alternatives, one settings action, two nickname actions). Preserve public props, click SFX, hapticPress, tap/hover animation, fullWidth, ariaLabel, custom styles, and type=button.

Map primary→button-primary, gold→button-action, secondary→button-secondary. Use a separate decorative image layer behind real text. Provide reusable surface rendering for the Coming Soon status and existing raw Intro button without accidentally adding a second haptic call. The existing handlers remain the source of behavior. Coming Soon remains noninteractive.

Use image aspect ratio 3:1 as the starting layout for wide surfaces; use contain, never cover. Do not independently stretch width/height to fit the old short buttons. Wide labels sit within the inset face with enough horizontal padding for gold borders. Target roughly 240–300 px width / 80–100 px height for full-size buttons, adjusted to available space. Test the resulting vertical space before finalizing.

Wallet panels contain their own left medallion: remove the separate Zap and place real text to the right of it. Reserve roughly the first 35% of the panel for artwork, then tune from visual inspection. Give balances enough width for six digits with separators; do not shrink text into unreadability. Header wallet can be about 150×50 px with 14–16 px text. Preserve the keyed number animation.

Daily header panels also have an embedded emblem. Keep the 7-day tile grid as tiles with separate icons; the wide panel is only the heading region. Avoid applying a 3:1 surface to each square tile.

For paused/results Best panels, the current half-width cards are too narrow for a 3:1 plaque with readable label/value. In the mobile skin only, stack the compact Score card above a full-width Best plaque. Use a scrollable overlay content container with safe-area padding on short screens so all actions remain reachable. Preserve the default web two-column layout. Do not add wallet semantics to the run score.

### 4. Preserve the shared-project boundary

Add an optional `uiSkin` prop to shared BoltGame3DProps. Define/export a small structural type in shared `client/src/components/bolt/uiSkin.ts`; it contains only the URL strings used by gameplay. Shared code must never import a file from the mobile repo.

Suggested shape:

```ts
export interface BoltGameUiSkin {
  icons: Record<
    "lightning" | "pause" | "play" | "arrow-left" | "arrow-right" |
    "arrow-up" | "profile" | "home" | "replay" | "crown",
    string
  >;
  surfaces: Record<"button-primary" | "button-secondary" | "panel-personal-best", string>;
}
```

Pass a stable object assembled from the mobile manifest to `<BoltGame3D uiSkin={...} />` in `src/App.tsx`. In shared gameplay use small local helpers for decorative image rendering and surfaces, with explicit existing Lucide/style fallbacks when uiSkin is absent. Gate the mobile panel layout on the supplied skin. Preserve the existing web default and never request missing mobile URLs from the web app.

Keep rendering changes in the DOM overlay, outside Canvas/GameScene and frame callbacks. Do not alter scoring, physics, game clock, assetsWarm, loading progression, collision, audio state, touch gestures, or callbacks. Decorative images use pointer-events:none so controls still receive taps.

### 5. Screen-specific details

- Settings ToggleRow: replace `icon: LucideIcon` with typed `icon` and optional `offIcon` names. Render `on ? icon : offIcon ?? icon`. Pass music; sound/offIcon=mute; vibration. Preserve storage keys, switch role, aria-checked, custom settings event, and haptics.
- Intro ambient: replace emoji data with typed icon names; retain position, size, delay and motion wrapper. Each graphic is decorative.
- Loading tips: replace only the two matching strings with structured data/React content. Retain the 2600 ms timer, tip text, keys and loading behavior. Allow enough line height for icons so the existing h-6 crop does not clip them.
- Hero roster/rewards: replace icons inside existing map/conditional branches. Preserve prices, selected state, Coming Soon availability, reward amounts and claim persistence.
- A close image added beside Close or Not now does not introduce a new dismissal action. Keep backdrop dismissal behavior exactly as currently implemented.
- New-record text stays visible; icons never communicate success, currency, mute, or lock states alone.

## Implementation sequence and acceptance

1. Check working-tree changes in both repos and applicable local instructions; preserve unrelated work. Read this handoff and current files. Verify all 32 PNGs exist and inspect them.
2. Add mobile manifest/Icon/surface helpers, then update GameButton and WalletPill. Do not move persistence into visual helpers.
3. Complete mobile screens against IDs 01–44. Check disabled arrows, price/claim/selection conditional states and small badge readability.
4. Add optional shared uiSkin contract, connect App, and complete 45–61 while retaining no-skin web rendering.
5. Run `pnpm check` and `pnpm build` from mobile root. Report pre-existing versus introduced failures accurately. Verify generated assets are bundled and no atlas is shipped through the new manifest. Do not claim success if a command hangs.
6. Preview at 320×568, 390×844, and a landscape phone viewport. Test Intro, all hero states, daily before/after claim, all settings states, nickname valid/invalid, leaderboard empty/error/populated, loading tips, idle, active, pause, results and record. Use local/mock data for review states rather than posting scores to production. Inspect both light and dark icon edges and wide panels. Confirm no horizontal overflow, clipped text, duplicate baked emblems, stretched gold borders, or swallowed clicks. Keep interactive hit targets at least 44×44 CSS px, including currently smaller header controls.
7. Confirm shared web usage without uiSkin has no missing image requests and keeps its existing controls/layout. A skin change should not require mobile assets to be installed in web/public.
8. After web validation, run the existing Capacitor sync workflow when preparing native builds and verify image loading on iOS/Android. A desktop screenshot alone does not establish native validation. Do not submit store builds as part of this UI task.
9. Deliver changed-file list, completed slot IDs, checks actually performed, screenshots, and any remaining limitations. Do not claim completion until all assigned mobile slots and all 32 asset mappings are accounted for.

## Prompt to give the implementation model

Implement the Bolt UI image kit using this handoff as the scope and acceptance checklist. There are 32 existing individual assets and 61 mobile placement slots. Read the current source before editing. Use the explicit mobile asset manifest and optional uiSkin URL contract for the shared BoltGame3D; preserve its web fallback. Preserve all gameplay, persistence, claim/purchase, navigation, SFX/haptic and accessibility behavior. Work through the numbered ledger, verify responsive layouts and relevant states, run the project checks/build, and report exact validation evidence. The task is implementation of this plan, not generating replacement art or adding gameplay features.
