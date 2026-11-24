// Single source of truth for colors (see .kiro/steering/look.md): "blue hour night".
// Keep the first-paint background in src/index.css in sync with `background`.
// Each animal's own glow color lives in src/content/animals.json (see animalColor).
export const palette = {
  background: '#0f1136', // shadow: deep indigo, never pure black
  skyTop: '#1a1840', // sky gradient, top (deep indigo)
  skyMid: '#3b2a6b', // sky gradient, middle (violet)
  skyHorizon: '#1f6f78', // sky gradient, horizon (teal glow)
  ridgeFar: '#3d5a8a', // far mountain ridges (blue)
  ridgeNear: '#22305a', // near mountain ridges (deep blue)
  snow: '#dce9ff', // snow caps catching moonlight
  moon: '#bcd9ff', // big pale-blue moon
  fog: '#4fa3b0', // teal/blue fog and mist, always used at low opacity
  city: '#ffa24d', // city lights, warm orange
  cityHaze: '#ffc86b', // golden haze over the city
  uki: '#bfe3ec', // guide Üki, ice-blue
  ghost: '#f0b968', // Üki's amber eyes, lanterns and other warm accents
  stone: '#6f82b3', // statues (forgotten), blue slate
  lamp: '#ffe6c2', // warm-white ceiling spots
} as const
