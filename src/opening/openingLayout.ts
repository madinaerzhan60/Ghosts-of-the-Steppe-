import { MathUtils, Vector3 } from 'three'

// The steppe lies in front of the museum (z > 0). The hall starts behind the
// facade at z = 0 and runs to -z (see scene/layout.ts). Hall floor is y = 0;
// the steppe is lower: a porch and a few steps lead up to the doors.

export const GROUND_Y = -0.75

export const FACADE = {
  width: 11,
  depth: 0.4,
  /** Top of the cornice (the pediment rises above it). */
  top: 5.4,
  pedimentRise: 1.6,
} as const

/** Tall arched door opening, centred on x = 0, standing on the hall floor. */
export const DOOR = { width: 2.0, height: 3.3 } as const
/** Where the door arch springs (the semicircle sits on top). */
export const DOOR_SPRING = DOOR.height - DOOR.width / 2

/** Arched window above the doors. */
export const WINDOW = { bottom: 4.15, width: 0.62, height: 0.75 } as const

/** Stone porch in front of the doors, level with the hall floor. */
export const PORCH = { depth: 1.1, width: 9.2 } as const
/** A few steps down from the porch to the steppe. */
export const STEPS = { count: 5, depth: 0.38, width: 9.2 } as const
/** Front edge of the lowest step. */
export const STEPS_FRONT_Z = FACADE.depth + PORCH.depth + STEPS.count * STEPS.depth

export const COLUMNS = {
  xs: [-3.45, -1.65, 1.65, 3.45],
  z: FACADE.depth + 0.55,
  radius: 0.24,
  /** Columns carry an architrave just under the cornice. */
  height: FACADE.top - 0.45,
} as const

/** Camera waypoints outside (eye height ~1.65 m above the ground). */
export const OUTSIDE_CAMERA = {
  start: { pos: new Vector3(0, GROUND_Y + 1.65, 22), target: new Vector3(0, 2.9, 0) },
  // A few paces before the steps: the doors, the window and Üki all in view.
  door: { pos: new Vector3(0, GROUND_Y + 1.65, STEPS_FRONT_Z + 3.6), target: new Vector3(0, 2.6, 0) },
} as const

/** Üki: eyes open above the doors (under the window)... */
export const UKI_PERCH = new Vector3(0, 3.45, FACADE.depth + 0.2)
/** ...then it glides down and forms in front of the doors, close to the visitor... */
export const UKI_WELCOME = new Vector3(0, 1.2, 2.4)
/** ...and after the welcome flies to the doors. */
export const UKI_DOOR = new Vector3(0, 2.0, FACADE.depth + PORCH.depth * 0.8)
/** Üki is larger outside, seen against the big facade; normal size in the hall. */
export const UKI_OUTSIDE_SCALE = 1.4

/**
 * Sky (camera-relative, "at infinity"): a big low moon behind the right shoulder
 * of the museum roof, seen from the start of the path.
 */
const MOON_EL = MathUtils.degToRad(13)
const MOON_AZ = MathUtils.degToRad(6) // to the right
export const SKY = {
  moonDir: new Vector3(Math.sin(MOON_AZ) * Math.cos(MOON_EL), Math.sin(MOON_EL), -Math.cos(MOON_AZ) * Math.cos(MOON_EL)),
  moonDistance: 50,
  /** Radius in metres at moonDistance (~4.5° across). */
  moonRadius: 50 * Math.tan(MathUtils.degToRad(4.5)),
} as const

/** Small oil lanterns along the path (x, z on the ground), alternating sides. */
export const LANTERNS: readonly [number, number][] = [
  [1.15, 17.5],
  [-1.15, 14],
  [1.15, 10.5],
  [-1.15, 7.2],
]
export const LANTERN_HEIGHT = 1.05

/** 3D text placement in the steppe, facing the visitor (above the pediment). */
export const OPENING_TEXT = {
  title: { pos: new Vector3(0, 4.75, 14), width: 7.2 },
  whisper: { pos: new Vector3(0, 3.95, 14), height: 0.32 },
} as const
