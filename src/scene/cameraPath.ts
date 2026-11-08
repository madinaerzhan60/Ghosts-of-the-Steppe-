import { MathUtils, Vector3 } from 'three'
import { CASES, CORRIDOR, EYE_HEIGHT, HALF_WIDTH, STOP_DISTANCE } from './layout'

type Waypoint = { pos: Vector3; target: Vector3; dwell: number }

const CASE_EYE = 1.6
/** Camera never gets closer than this to any wall. */
const WALL_MARGIN = 0.6

const waypoints: Waypoint[] = [
  {
    pos: new Vector3(0, EYE_HEIGHT, -1),
    target: new Vector3(0, EYE_HEIGHT, -CORRIDOR.length),
    dwell: 1.5,
  },
  ...[...CASES]
    .sort((a, b) => b.z - a.z)
    .map((c) => ({
      // Shift slightly toward the opposite wall to face the case more directly.
      pos: new Vector3(-c.side * 0.6, EYE_HEIGHT, c.z + STOP_DISTANCE),
      target: new Vector3(c.x, CASE_EYE, c.z),
      dwell: 4,
    })),
]

type Segment = { a: number; b: number; from: Waypoint; to: Waypoint }
const segments: Segment[] = []
let total = 0
waypoints.forEach((w, i) => {
  segments.push({ a: total, b: total + w.dwell, from: w, to: w })
  total += w.dwell
  const next = waypoints[i + 1]
  if (next) {
    const len = Math.abs(next.pos.z - w.pos.z)
    segments.push({ a: total, b: total + len, from: w, to: next })
    total += len
  }
})

/** Number of viewport-heights of scrolling for the whole walk. */
export const SCROLL_PAGES = 9

/**
 * Camera pose for scroll progress 0..1. Each travel segment eases in and out,
 * so the camera comes to rest in front of every case.
 */
export function getCameraPose(progress: number, outPos: Vector3, outTarget: Vector3) {
  const u = MathUtils.clamp(progress, 0, 1) * total
  const seg = segments.find((s) => u <= s.b) ?? segments[segments.length - 1]
  const t = seg.b > seg.a ? (u - seg.a) / (seg.b - seg.a) : 1
  const k = MathUtils.smootherstep(t, 0, 1)

  outPos.lerpVectors(seg.from.pos, seg.to.pos, k)
  outTarget.lerpVectors(seg.from.target, seg.to.target, k)

  // Hard safety clamp: never leave the corridor volume.
  outPos.x = MathUtils.clamp(outPos.x, -(HALF_WIDTH - WALL_MARGIN), HALF_WIDTH - WALL_MARGIN)
  outPos.z = MathUtils.clamp(outPos.z, -CORRIDOR.length + WALL_MARGIN, -WALL_MARGIN)
}
