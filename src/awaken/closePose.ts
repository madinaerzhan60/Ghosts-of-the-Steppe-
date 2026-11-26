import { Vector3 } from 'three'
import { STOP_DISTANCE, STOP_SHIFT, type CaseDef } from '../scene/layout'

/** How close the camera glides to the glass, metres. */
const DISTANCE = 1.75
const EYE = 1.5
const LOOK_AT_Y = 1.45

/**
 * Where the camera ends up when a case is awakened: on the line from the case to the
 * visitor's usual stop, close in front of it, looking at the animal.
 */
export function getClosePose(def: CaseDef, outPos: Vector3, outTarget: Vector3) {
  const dx = -def.side * STOP_SHIFT - def.x
  const dz = STOP_DISTANCE
  const len = Math.hypot(dx, dz) || 1
  outPos.set(def.x + (dx / len) * DISTANCE, EYE, def.z + (dz / len) * DISTANCE)
  outTarget.set(def.x, LOOK_AT_Y, def.z)
}
