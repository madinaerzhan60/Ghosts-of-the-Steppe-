export const CORRIDOR = { length: 40, width: 6, height: 4 } as const
export const HALF_WIDTH = CORRIDOR.width / 2

export const EYE_HEIGHT = 1.6
/** How far in front of a case (along the corridor) the camera stops. */
export const STOP_DISTANCE = 3.5

export type PlaceholderShape =
  | 'icosahedron'
  | 'dodecahedron'
  | 'torusKnot'
  | 'cone'
  | 'capsule'
  | 'octahedron'

export type CaseDef = {
  id: string
  /** -1 = left wall, 1 = right wall */
  side: -1 | 1
  x: number
  z: number
  shape: PlaceholderShape
}

const CASE_X = 2.0

// Staggered left/right so the visitor passes one case at a time.
export const CASES: readonly CaseDef[] = [
  { id: 'case-1', side: -1, x: -CASE_X, z: -8, shape: 'icosahedron' },
  { id: 'case-2', side: 1, x: CASE_X, z: -13, shape: 'torusKnot' },
  { id: 'case-3', side: -1, x: -CASE_X, z: -18, shape: 'cone' },
  { id: 'case-4', side: 1, x: CASE_X, z: -23, shape: 'dodecahedron' },
  { id: 'case-5', side: -1, x: -CASE_X, z: -28, shape: 'capsule' },
  { id: 'case-6', side: 1, x: CASE_X, z: -33, shape: 'octahedron' },
]
