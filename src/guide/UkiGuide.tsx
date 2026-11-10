import { useFrame } from '@react-three/fiber'
import { useCallback, useRef, useState } from 'react'
import { MathUtils, QuadraticBezierCurve3, Vector3, type Group } from 'three'
import { UKI_DOOR, UKI_OUTSIDE_SCALE, UKI_PERCH, UKI_WELCOME } from '../opening/openingLayout'
import { getStage, openingLive, stageAtLeast } from '../opening/openingStore'
import { CASES, CORRIDOR } from '../scene/layout'
import { SPOT, type GuideSpot } from './guideSpots'
import { UkiOwl } from './UkiOwl'
import { UkiTrail } from './UkiTrail'


type Props = {
  speaking: boolean
  audio?: HTMLAudioElement | null
  /** Called when Üki has appeared, and every time it lands at a new spot. */
  onArrive?: (spot: GuideSpot) => void
  wingsOpen?: boolean
  pulseKey?: string
}

/** Seconds after the eyes start to open before Üki glides down to the visitor. */
const DESCEND_AFTER = 2.2

const INTRO = new Vector3(0.45, 1.95, -3.6)
const END = new Vector3(0, 2.0, -CORRIDOR.length + 3.5)

/** Hover spot beside a case: a little toward the aisle, above eye level, in front of the glass. */
function spotPosition(spot: GuideSpot, out: Vector3): Vector3 {
  if (spot === SPOT.welcome) return out.copy(UKI_WELCOME)
  if (spot === SPOT.perch) return out.copy(UKI_PERCH)
  if (spot === SPOT.door) return out.copy(UKI_DOOR)
  if (spot < 0) return out.copy(INTRO)
  const c = CASES[spot]
  if (!c) return out.copy(END)
  return out.set(c.x * 0.15, 1.95, c.z + 1.4)
}

/** Where Üki should be: follows the opening, then the first case still ahead of the camera. */
function desiredSpot(cameraZ: number, sinceMount: number): GuideSpot {
  const stage = getStage()
  // Eyes open above the doors; then Üki glides down, gathering, to meet the visitor.
  if (!stageAtLeast(stage, 'fly')) return sinceMount < DESCEND_AFTER ? SPOT.perch : SPOT.welcome
  // Üki slips in while the doors are still opening, ahead of the visitor
  // (who can walk on once they are 60% open).
  if (!stageAtLeast(stage, 'open')) return SPOT.door
  if (!stageAtLeast(stage, 'enter') && openingLive.doorOpen < 0.3) return SPOT.door
  if (cameraZ > -1.6) return SPOT.inside
  const i = CASES.findIndex((c) => c.z < cameraZ - 1.0)
  return i === -1 ? CASES.length : i
}

function dampAngle(current: number, target: number, lambda: number, dt: number) {
  const d = MathUtils.euclideanModulo(target - current + Math.PI, Math.PI * 2) - Math.PI
  return current + d * (1 - Math.exp(-lambda * dt))
}

const tmp = new Vector3()
const prev = new Vector3()

/** Places Üki and flies it ahead of the visitor: from the museum doors, then case to case. */
export function UkiGuide({ speaking, audio, onArrive, wingsOpen, pulseKey }: Props) {
  const group = useRef<Group>(null)
  const [flying, setFlying] = useState(false)
  const nav = useRef({
    placed: false,
    mountedAt: 0,
    appeared: false,
    spot: SPOT.perch as GuideSpot,
    arrived: null as GuideSpot | null, // last spot announced via onArrive
    curve: null as QuadraticBezierCurve3 | null,
    t0: 0,
    duration: 1,
    yaw: 0,
    flying: false,
  })

  const handleAppeared = useCallback(() => {
    nav.current.appeared = true
  }, [])

  useFrame((state, rawDelta) => {
    const g = group.current
    if (!g) return
    const n = nav.current
    const t = state.clock.elapsedTime
    const delta = Math.min(rawDelta, 0.1)
    const cam = state.camera.position

    // Place once (not via a JSX prop, which would reset the position on re-render).
    if (!n.placed) {
      n.placed = true
      n.mountedAt = t
      g.position.copy(UKI_PERCH)
      g.scale.setScalar(UKI_OUTSIDE_SCALE)
    }

    const want = desiredSpot(cam.z, t - n.mountedAt)
    openingLive.ukiWelcome = want === SPOT.welcome
    if (want !== n.spot) {
      n.spot = want
      const from = g.position.clone()
      const to = spotPosition(want, new Vector3())
      // Smooth arc: rises a little and bows toward the middle of the aisle.
      const ctrl = from.clone().add(to).multiplyScalar(0.5)
      ctrl.y += 0.5
      ctrl.x *= 0.4
      // Through the doorway: stay well under the lintel.
      if ((from.z > 0) !== (to.z > 0)) ctrl.y = Math.min(ctrl.y, 1.8)
      // Down to the visitor: a slow, gliding descent, no climb first.
      const welcome = want === SPOT.welcome
      if (welcome) ctrl.y = from.y
      n.curve = new QuadraticBezierCurve3(from, ctrl, to)
      n.t0 = t
      n.duration = welcome ? 3.2 : MathUtils.clamp(from.distanceTo(to) / 1.6, 1.4, 5)
    }

    prev.copy(g.position)
    let isFlying = false
    if (n.curve) {
      const p = MathUtils.clamp((t - n.t0) / Math.max(n.duration, 0.001), 0, 1)
      n.curve.getPoint(MathUtils.smootherstep(p, 0, 1), g.position)
      isFlying = p < 1
      if (!isFlying) n.curve = null
    }

    // Face the flight direction while flying, otherwise turn to the visitor.
    tmp.subVectors(g.position, prev)
    const moving = isFlying && tmp.x * tmp.x + tmp.z * tmp.z > 1e-8
    const yawTarget = moving
      ? Math.atan2(tmp.x, tmp.z)
      : Math.atan2(cam.x - g.position.x, cam.z - g.position.z)
    n.yaw = dampAngle(n.yaw, yawTarget, moving ? 4 : 2, delta)
    g.rotation.y = n.yaw
    const size = MathUtils.damp(g.scale.x, stageAtLeast(getStage(), 'enter') ? 1 : UKI_OUTSIDE_SCALE, 1.2, delta)
    g.scale.setScalar(size)

    if (isFlying !== n.flying) {
      n.flying = isFlying
      setFlying(isFlying)
    }

    if (n.appeared && !isFlying && n.arrived !== n.spot) {
      n.arrived = n.spot
      onArrive?.(n.spot)
    }
  })

  return (
    <>
      <group ref={group}>
        <UkiOwl
          speaking={speaking}
          audio={audio}
          flying={flying}
          onAppeared={handleAppeared}
          wingsOpen={wingsOpen}
          pulseKey={pulseKey}
        />
      </group>
      <UkiTrail source={group} flying={flying} />
    </>
  )
}
