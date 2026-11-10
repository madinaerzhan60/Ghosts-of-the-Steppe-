import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { MathUtils, Vector3, type PerspectiveCamera } from 'three'
import { getStage, openingLive, stageAtLeast } from '../opening/openingStore'
import { getWelcomePose } from '../opening/welcomeFraming'
import { getWalkTarget, setWalkLimits } from '../walk/walkInput'
import { getCameraPose, OPENING, OPENING_PAGES, openingFraction, TOTAL_PAGES } from './cameraPath'
import { CASES } from './layout'
import { nearestCase } from './nearestCase'

const pos = new Vector3()
const target = new Vector3()
const closePos = new Vector3()
const closeTarget = new Vector3()

/** How quickly the camera catches up with the walk target (slow, dreamy, never abrupt). */
const FOLLOW = 2.2

export function CameraRig() {
  const rig = useRef({ pages: 0, close: 0 })

  useFrame(({ camera }, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1)
    const stage = getStage()

    // The welcome gates the walk: it stops at the closed doors until they open,
    // and once inside the visitor can't walk back out.
    const doors = OPENING.doors * OPENING_PAGES
    if (!stageAtLeast(stage, 'enter')) setWalkLimits(0, doors)
    else if (!stageAtLeast(stage, 'hall')) setWalkLimits(doors, TOTAL_PAGES)
    else setWalkLimits(OPENING_PAGES, TOTAL_PAGES)

    const r = rig.current
    r.pages = MathUtils.damp(r.pages, getWalkTarget(), FOLLOW, delta)
    openingLive.cameraPages = r.pages
    openingLive.opening = openingFraction(r.pages)

    getCameraPose(r.pages, pos, target)

    // Üki's welcome: the camera slowly moves in close while she glides down and
    // speaks, then eases back as she flies to the doors.
    const close = (stage === 'arrive' && openingLive.ukiWelcome) || stage === 'speak'
    r.close = MathUtils.damp(r.close, close ? 1 : 0, close ? 0.75 : 0.9, delta)
    if (r.close > 1e-3) {
      getWelcomePose(camera as PerspectiveCamera, closePos, closeTarget)
      const k = MathUtils.smootherstep(r.close, 0, 1)
      pos.lerp(closePos, k)
      target.lerp(closeTarget, k)
    }

    camera.position.copy(pos)
    camera.lookAt(target)

    let best = Infinity
    for (const c of CASES) {
      const d = (c.x - pos.x) ** 2 + (c.z - pos.z) ** 2
      if (d < best) {
        best = d
        nearestCase.id = c.id
      }
    }
  })

  return null
}
