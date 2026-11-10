import type { ModelId } from './models'

export const CORRIDOR = { length: 40, width: 6, height: 4 } as const
export const HALF_WIDTH = CORRIDOR.width / 2

export const EYE_HEIGHT = 1.6
/** How far in front of a case (along the corridor) the camera stops. */
export const STOP_DISTANCE = 3.5
/** At a stop the camera shifts this far toward the opposite wall to face the case more directly. */
export const STOP_SHIFT = 0.6

export type CaseDef = {
  id: string
  /** -1 = left wall, 1 = right wall */
  side: -1 | 1
  x: number
  z: number
  /** Animal statue shown in this case. */
  model: ModelId
}

/** Ceiling spot above each case (coordinates local to the case group). */
export const LAMP = {
  y: 3.7,
  /** Cone half-angle in radians. */
  angle: 0.2,
  penumbra: 0.6,
  /** Where the visible light cone ends (top of the pedestal). */
  coneBottomY: 1.0,
  /** Where the spot aims (centre of the statue). */
  targetY: 1.6,
} as const

const CASE_X = 2.0

// Staggered left/right so the visitor passes one case at a time.
export const CASES: readonly CaseDef[] = [
  { id: 'case-1', side: -1, x: -CASE_X, z: -8, model: 'tiger' },
  { id: 'case-2', side: 1, x: CASE_X, z: -13, model: 'cheetah' },
  { id: 'case-3', side: -1, x: -CASE_X, z: -18, model: 'snow-leopard' },
  { id: 'case-4', side: 1, x: CASE_X, z: -23, model: 'horse' },
  { id: 'case-5', side: -1, x: -CASE_X, z: -28, model: 'seal' },
  { id: 'case-6', side: 1, x: CASE_X, z: -33, model: 'saiga' },
]
