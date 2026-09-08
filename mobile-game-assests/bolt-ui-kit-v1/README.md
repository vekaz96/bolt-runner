# Bolt UI image kit

Generated with built-in ImageGen. Both PNG sheets have transparent backgrounds. These are design assets; they have not been applied to the app.

The `icons` folder contains 24 individual 256×256 transparent PNG files. The `surfaces` folder contains eight individual 768×256 transparent PNG files. The original sheets are preserved alongside them.

## Icons — six columns, four rows

Read each row from left to right in `bolt-icons.png`:

1. Lightning, star, gift, trophy, crown, shield
2. Settings, music, sound, mute, vibration, profile
3. Left, right, up, home, pause, play
4. Replay, lock, check, close, edit, offline

Use these across the home screen, hero selection, daily rewards, settings, nickname entry, leaderboard, and gameplay controls.

## Surfaces — two columns, four rows

Read each row from left to right in `bolt-surfaces.png`:

1. Green primary button, gold action button
2. Dark green secondary button, subdued disabled button
3. Lightning wallet panel, trophy personal-best panel
4. Gift reward panel, claimed reward panel

Keep button labels and changing values as app text over these backgrounds. Preserve accessible labels and existing interaction behavior when integrating.

The sheets use approximate spacing. Individual artwork needs carefully measured crop bounds before integration; do not assume equal grid cells provide safe crops. Check legibility at actual mobile display sizes.

The exact generation prompts are in `prompts.json`.
