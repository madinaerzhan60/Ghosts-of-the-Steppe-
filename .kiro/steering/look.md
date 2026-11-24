---
inclusion: always
---

# Look and Tone

## Mood
- Eerie, dreamy, mysterious night museum, in the spirit of nocturnaldream.com.
- Eerie but colorful: a "blue hour" night. Never flat black, never grey.
- Never use jump scares: no sudden loud sounds, flashes, or abrupt camera moves. Everything fades in and out slowly.

## Palette — "blue hour night"
| Role | Color |
|---|---|
| Shadow / background (never pure black) | `#0f1136` (deep indigo) |
| Sky top | `#1a1840` (deep indigo) |
| Sky middle | `#3b2a6b` (violet) |
| Sky horizon | `#1f6f78` (teal glow) |
| Mountains, far | `#3d5a8a` (blue) |
| Mountains, near | `#22305a` (deep blue) |
| Snow caps | `#dce9ff` (moonlit white-blue) |
| Moon | `#bcd9ff` (pale blue, with a soft halo) |
| Fog and mist | `#4fa3b0` (teal/blue, at low opacity, never grey) |
| City lights | `#ffa24d` (warm orange, with a golden haze `#ffc86b`) |
| Guide Üki | `#bfe3ec` (ice-blue), with amber eyes `#f0b968` |
| Warm lamps (hall spots) | `#ffe6c2` (warm white) |
| Statues (forgotten) | `#6f82b3` (blue slate) |

Define these once as shared constants/CSS variables (`src/theme/palette.ts`) and reuse them. Do not introduce new colors without asking.

- Nothing important is pure black. Shadows are deep blue or violet.
- Keep the exposure high enough that the scene reads clearly on a laptop screen.

## Each animal glows in its own color
The color lives in `src/content/animals.json` (`"color"`). Use it for the animal's ghost particles, the subtitles of that animal, its plaque, and the light it casts on the hall floor.

| Animal | Color |
|---|---|
| Turan tiger | `#ff8a3d` (fire orange) |
| Snow leopard (and cub) | `#9fe8ff` (icy cyan-white) |
| Saiga | `#ffd166` (gold) |
| Cheetah | `#ff9e8a` (rose gold) |
| Przewalski's horse | `#c9b8ff` (silver-lilac) |
| Caspian seal | `#5ee6d0` (aqua) |

## Fonts
- **Forum**: titles and quotes.
- **Golos Text**: UI.
- **PT Mono**: small labels.

## Three states of every animal
1. **Stone statue** (forgotten): blue-slate stone `#6f82b3`.
2. **Glowing particle ghost** (remembered): particles in the animal's own color.
3. **Warm solid light** (saved): solid light in the animal's own color.

Every animal must support all three states and transition between them smoothly.

## Hall
- Deep blue walls and ceiling instead of black.
- Light cones slightly warm.
- The floor reflects the colored light of each animal's case.

## Accessibility
- Every screen must work with sound off: subtitles are always on.
- Never convey information through audio alone.
