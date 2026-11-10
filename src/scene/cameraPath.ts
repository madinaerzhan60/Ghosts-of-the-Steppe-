import { MathUtils, Vector3 } from 'three'
import { OUTSIDE_CAMERA } from '../opening/openingLayout'
import { CASES, CORRIDOR, EYE_HEIGHT, HALF_WIDTH, STOP_DISTANCE, STOP_SHIFT } from './layout'

// The walk is measured in "pages" (one viewport height of scrolling = one page).
// [0, OPENING_PAGES]           the opening, by fixed fractions (see OPENING below)
// [OPENING_PAGES, TOTAL_PAGES] the hall, from the entrance past every case

/** Pages of scrolling for the opening (title -> doors -> inside). */
export const OPENING_PAGES = 5
/** Pages of scrolling for the hall walk. */
export const HALL_PAGES = 9
export const TOTAL_PAGES = OPENING_PAGES + HALL_PAGES

/** Opening fractions (of OPENING_PAGES). */
export const OPENING = {
  /** 0–20%: the title glows and fades, the whisper line; the camera barely moves. */
  titleEnd: 0.2,
  /** 20–60%: walk through the grass; at 60% the walk stops at the closed doors. */
  doors: 0.6,
  /** 60–100%: through the opened doors into the hall. */
  inside: 1,
} as const

const CASE_EYE = 1.6
/** Inside the hall the camera never gets closer than this to any wall. */
const WALL_MARGIN = 0.6

type Pose = { pos: Vector3; target: Vector3 }
type Waypoint = Pose & { dwell: number }

const HALL_START: Waypoint = {
  pos: new Vector3(0, EYE_HEIGHT, -1),
  target: new Vector3(0, EYE_HEIGHT, -CORRIDOR.length),
  dwell: 1.5,
}

const hallWaypoints: Waypoint[] = [
  HALL_START,
  ...[...CASES]
    .sort((a, b) => b.z - a.z)
    .map((c) => ({
      // Shift slightly toward the opposite wall to face the case more directly.
      pos: new Vector3(-c.side * STOP_SHIFT, EYE_HEIGHT, c.z + STOP_DISTANCE),
      target: new Vector3(c.x, CASE_EYE, c.z),
      dwell: 4,
    })),
]

type Segment = { a: number; b: number; from: Pose; to: Pose }
const hallSegments: Segment[] = []
const hallArrive: number[] = []
let hallTotal = 0
hallWaypoints.forEach((w, i) => {
  hallArrive.push(hallTotal)
  hallSegments.push({ a: hallTotal, b: hallTotal + w.dwell, from: w, to: w })
  hallTotal += w.dwell
  const next = hallWaypoints[i + 1]
  if (next) {
    const len = next.pos.distanceTo(w.pos)
    hallSegments.push({ a: hallTotal, b: hallTotal + len, from: w, to: next })
    hallTotal += len
  }
})

/** Opening fraction 0..1 for a walk position in pages. */
export function openingFraction(pages: number) {
  return MathUtils.clamp(pages / OPENING_PAGES, 0, 1)
}

/** Resting points (pages): title end, doors, inside, then every case. */
export const WALK_STOPS: readonly number[] = [
  OPENING.titleEnd * OPENING_PAGES,
  OPENING.doors * OPENING_PAGES,
  OPENING_PAGES,
  ...hallArrive.slice(1).map((d) => OPENING_PAGES + (d / hallTotal) * HALL_PAGES),
]

function lerpPose(from: Pose, to: Pose, k: number, outPos: Vector3, outTarget: Vector3) {
  outPos.lerpVectors(from.pos, to.pos, k)
  outTarget.lerpVectors(from.target, to.target, k)
}

/** Camera pose for a walk position in pages. Segments ease in and out. */
export function getCameraPose(pages: number, outPos: Vector3, outTarget: Vector3) {
  if (pages < OPENING_PAGES) {
    const o = openingFraction(pages)
    if (o <= OPENING.doors) {
      // One eased walk start -> doors: barely moves during the title (0–20%).
      const k = MathUtils.smootherstep(o / OPENING.doors, 0, 1)
      lerpPose(OUTSIDE_CAMERA.start, OUTSIDE_CAMERA.door, k, outPos, outTarget)
    } else {
      const k = MathUtils.smootherstep((o - OPENING.doors) / (1 - OPENING.doors), 0, 1)
      lerpPose(OUTSIDE_CAMERA.door, HALL_START, k, outPos, outTarget)
    }
    return
  }

  const u = MathUtils.clamp((pages - OPENING_PAGES) / HALL_PAGES, 0, 1) * hallTotal
  const seg = hallSegments.find((s) => u <= s.b) ?? hallSegments[hallSegments.length - 1]
  const t = seg.b > seg.a ? (u - seg.a) / (seg.b - seg.a) : 1
  lerpPose(seg.from, seg.to, MathUtils.smootherstep(t, 0, 1), outPos, outTarget)

  // Safety clamp inside the hall: never leave the corridor volume.
  outPos.x = MathUtils.clamp(outPos.x, -(HALF_WIDTH - WALL_MARGIN), HALF_WIDTH - WALL_MARGIN)
  outPos.z = MathUtils.clamp(outPos.z, -CORRIDOR.length + WALL_MARGIN, -WALL_MARGIN)
}
