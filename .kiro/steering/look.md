---
inclusion: always
---

# Look and Tone

## Mood
- Eerie, dreamy, mysterious night museum, in the spirit of nocturnaldream.com.
- Never use jump scares: no sudden loud sounds, flashes, or abrupt camera moves. Everything fades in and out slowly.

## Palette
| Role | Color |
|---|---|
| Background | `#070a0d` (near-black) |
| Fog | `#96b4be` at low opacity |
| Guide Üki | `#bfe3ec` (ice-blue) |
| Animal ghosts | `#f0b968` (warm amber) |
| Statues | `#59636a` (grey stone) |

Define these once as shared constants/CSS variables and reuse them. Do not introduce new colors without asking.

## Fonts
- **Forum**: titles and quotes.
- **Golos Text**: UI.
- **PT Mono**: small labels.

## Three states of every animal
1. **Stone statue** (forgotten): grey stone `#59636a`.
2. **Glowing particle ghost** (remembered): amber `#f0b968` particles.
3. **Warm solid light** (saved): solid warm amber light.

Every animal must support all three states and transition between them smoothly.

## Accessibility
- Every screen must work with sound off: subtitles are always on.
- Never convey information through audio alone.
