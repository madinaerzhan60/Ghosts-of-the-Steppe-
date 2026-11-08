// Single source of truth for colors (see .kiro/steering/look.md).
// Keep the first-paint background in src/index.css in sync with `background`.
export const palette = {
  background: '#070a0d', // near-black
  fog: '#96b4be', // cold fog, always used at low opacity
  uki: '#bfe3ec', // guide Üki, ice-blue
  ghost: '#f0b968', // animal ghosts, warm amber
  stone: '#59636a', // statues, grey stone
} as const
