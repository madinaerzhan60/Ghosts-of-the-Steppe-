import { Color } from 'three'
import { palette } from './palette'

// Architectural surfaces, derived from the palette (no new hues): deep blue,
// never black, so the lit exhibits still stand out from them.
function mix(from: string, to: string, amount: number): string {
  return `#${new Color(from).lerp(new Color(to), amount).getHexString()}`
}

export const surfaces = {
  /** Hall walls: deep blue. */
  wall: mix(palette.ridgeNear, palette.ridgeFar, 0.2),
  /** Hall floor: dark blue, glossy enough to carry colored light. */
  floor: mix(palette.background, palette.ridgeNear, 0.7),
  pedestal: mix(palette.ridgeNear, palette.stone, 0.4),
  /** Old stone of the museum's outside walls, bluish in the moonlight. */
  exterior: mix(palette.ridgeNear, palette.ridgeFar, 0.55),
  /** Steppe ground and the path to the doors: dark teal-blue earth. */
  ground: mix(palette.ridgeNear, palette.fog, 0.2),
  path: mix(palette.ridgeNear, palette.stone, 0.35),
} as const
