/** Shape and layout of the night slope. World units are metres; +z is toward the city and the camera. */

/** Metres of height gained per metre of distance up the slope (-z). */
const RISE = 0.5

/** Ground height at (x, z): a broad slope with a shallow valley and soft bumps. */
export function surfaceY(x: number, z: number): number {
  const bumps = 0.32 * Math.sin(x * 0.42 + z * 0.31) + 0.22 * Math.sin(x * 0.95 - z * 0.57 + 1.3)
  const valley = 0.006 * x * x
  // Flatter near the city, rougher higher up.
  const rough = Math.min(1, Math.max(0, (6 - z) / 14))
  return -RISE * z + valley + bumps * (0.3 + 0.7 * rough)
}

export const LAYOUT = {
  /** Camera position and look target. */
  camera: { x: 0, y: -0.3, z: 11, targetX: -0.8, targetY: 1.2, targetZ: -2 },
  /** The leopard's rock. */
  rock: { x: -2.2, z: -1.5 },
  /** The leopard's body length, metres. */
  leopardLength: 5,
  /** City lights fill z from `cityBottom` up to `cityBottom - citySpan`. */
  cityBottom: 5,
  citySpan: 13,
  /** Ibex graze between these z values (higher on the slope than the rock). */
  ibexNear: -7,
  ibexFar: -22,
} as const
