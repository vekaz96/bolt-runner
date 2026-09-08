# Bolt Runner — iOS & Android

Standalone Capacitor app for the Bolt 3D runner. Game logic and assets come from the sibling [`kidsvolt-web`](../kidsvolt-web) repo — **no duplicated game code**.

## Prerequisites

- Node 20+
- pnpm
- `kidsvolt-web` cloned as a sibling: `Desktop/kidsvolt-web` + `Desktop/kidsvolt-bolt-mobile`
- For native builds: Xcode (iOS), Android Studio (Android)

## Setup

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm build        # dist/ for Capacitor
pnpm cap:sync     # build + cap sync
pnpm cap:ios      # open Xcode
pnpm cap:android  # open Android Studio
```

Override web repo path:

```bash
KIDS_VOLT_WEB_ROOT=/path/to/kidsvolt-web pnpm dev
```

## Pinning a web release (production)

For store builds, point at a specific `kidsvolt-web` commit:

```bash
git submodule add git@github.com:vekazBloom/kidsvolt-web.git vendor/kidsvolt-web
cd vendor/kidsvolt-web && git checkout <tag-or-sha>
KIDS_VOLT_WEB_ROOT=./vendor/kidsvolt-web pnpm build
```

Run the positioning parity checklist after every submodule bump.

## Model positioning parity

- Game scene code is imported from `kidsvolt-web` unchanged (`BoltGame3D`, `bolt/*`, `BoltModel`)
- Assets served from `kidsvolt-web/client/public` (FBX, GLB, MP3)
- Canvas keeps web aspect ratio (~800×420) via letterbox shell in `src/App.tsx`
- Pin identical `three`, `@react-three/fiber`, `@react-three/drei` versions in both repos

## App ID

`com.kidsvolt.bolt` — change in `capacitor.config.ts` before store submission if needed.
