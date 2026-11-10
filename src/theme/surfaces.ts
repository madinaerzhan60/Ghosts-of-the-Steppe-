import { Color } from 'three'
import { palette } from './palette'

// Dark architectural surfaces, derived from the palette (no new hues):
// the hall stays dark so lit exhibits are the brightest things in the scene.
function mix(amount: number): string {
  return `#${new Color(palette.background).lerp(new Color(palette.stone), amount).getHexString()}`
}

export const surfaces = {
  wall: mix(0.36),
  floor: mix(0.22),
  pedestal: mix(0.55),
  /** Old stone of the museum's outside walls. */
  exterior: mix(0.5),
  /** Steppe ground and the path to the doors. */
  ground: mix(0.12),
  path: mix(0.2),
} as const
