// "Light mode" lowers rendering cost on weak devices
// (see .kiro/steering/three.md): no glass transmission, fewer particles,
// no MSAA, lower pixel ratio.
// Override with ?light=1 (force on) or ?light=0 (force off).
function detectLightMode(): boolean {
  if (typeof window === 'undefined') return false

  const forced = new URLSearchParams(window.location.search).get('light')
  if (forced === '1') return true
  if (forced === '0') return false

  const nav = navigator as Navigator & { deviceMemory?: number }
  const fewCores = (nav.hardwareConcurrency ?? 8) <= 4
  const lowMemory = (nav.deviceMemory ?? 8) <= 4
  const touchOnly = window.matchMedia?.('(pointer: coarse)').matches ?? false
  return fewCores || lowMemory || touchOnly
}

export const LIGHT_MODE = detectLightMode()

/** Upper bound of points for a single ghost. */
export const MAX_POINTS_PER_GHOST = 20_000
export const GHOST_POINTS = LIGHT_MODE ? 6_000 : MAX_POINTS_PER_GHOST

/** Üki, the guide owl (a ghost, so within MAX_POINTS_PER_GHOST). */
export const UKI_POINTS = LIGHT_MODE ? 2_500 : 6_000
/** Ring buffer of fading trail particles while Üki flies. */
export const UKI_TRAIL_POINTS = LIGHT_MODE ? 90 : 300

/** Respect the OS "reduce motion" setting (calmer grass and drifting). */
export const REDUCED_MOTION =
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)

// Opening (night steppe)
export const GRASS_BLADES = LIGHT_MODE ? 7_000 : 15_000
export const STAR_COUNT = LIGHT_MODE ? 500 : 1_400
export const GROUND_FOG_LAYERS = LIGHT_MODE ? 2 : 3
export const FIREFLIES = LIGHT_MODE ? 50 : 140
/** Title particles (a ghost-like effect, so within MAX_POINTS_PER_GHOST). */
export const TITLE_POINTS = LIGHT_MODE ? 3_000 : 6_000
