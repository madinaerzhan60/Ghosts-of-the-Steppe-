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
