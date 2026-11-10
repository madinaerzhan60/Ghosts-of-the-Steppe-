import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { MathUtils, type Group } from 'three'
import { playCreak } from '../audio/ambience'
import { surfaces } from '../theme/surfaces'
import { doorLeaf } from './archShapes'
import { DOOR, FACADE } from './openingLayout'
import { getStage, openingLive, stageAtLeast } from './openingStore'

const OPEN_ANGLE = 1.5 // ~86°, swung into the hall
const DURATION = 4.8 // seconds: slow, by themselves
const LEAF_W = DOOR.width / 2
const LEAF_D = 0.08
/** Gap under the leaves: lets the warm line of light show beneath the doors. */
const SILL_GAP = 0.04

/** Tall arched double doors that creak open by themselves (inward) once Üki reaches them. */
export function MuseumDoors() {
  const left = useRef<Group>(null)
  const right = useRef<Group>(null)
  const anim = useRef({ start: -1 })

  const leaves = useMemo(
    () => ({
      // Leaves overlap a hair in the middle: no bright seam of hall light between them.
      left: doorLeaf(LEAF_W + 0.004, DOOR.height - SILL_GAP - 0.01, 1),
      right: doorLeaf(LEAF_W + 0.004, DOOR.height - SILL_GAP - 0.01, -1),
    }),
    [],
  )

  useFrame(({ clock }) => {
    const a = anim.current
    if (a.start < 0 && stageAtLeast(getStage(), 'open')) {
      a.start = clock.elapsedTime
      playCreak()
    }
    const t = a.start < 0 ? 0 : MathUtils.clamp((clock.elapsedTime - a.start) / DURATION, 0, 1)
    // Slow start (stiff old hinges), a tiny hesitation, then a gentle settle.
    const hesitate = 0.025 * Math.sin(t * Math.PI * 3) * (1 - t)
    const f = MathUtils.clamp(MathUtils.smootherstep(t, 0, 1) + hesitate, 0, 1)
    openingLive.doorOpen = f
    if (left.current) left.current.rotation.y = f * OPEN_ANGLE
    if (right.current) right.current.rotation.y = -f * OPEN_ANGLE
  })

  const z = FACADE.depth / 2 - LEAF_D / 2
  // (the right leaf sits 1 mm deeper so the overlapping edges never z-fight)
  return (
    <group>
      {[
        { ref: left, x: -DOOR.width / 2, dir: 1 as const, shape: leaves.left },
        { ref: right, x: DOOR.width / 2, dir: -1 as const, shape: leaves.right },
      ].map(({ ref, x, dir, shape }) => (
        // Pivot on the hinge; the leaf extends toward the middle.
        <group key={dir} ref={ref} position={[x, SILL_GAP, dir > 0 ? z : z - 0.001]}>
          <mesh>
            <extrudeGeometry args={[shape, { depth: LEAF_D, bevelEnabled: false, curveSegments: 10 }]} />
            <meshStandardMaterial color={surfaces.pedestal} roughness={0.85} flatShading />
          </mesh>
          {/* Raised panels on the outside face */}
          {[0.75, 2.0].map((y) => (
            <mesh key={y} position={[(dir * LEAF_W) / 2, y, LEAF_D + 0.01]}>
              <boxGeometry args={[LEAF_W * 0.6, y < 1 ? 0.95 : 1.2, 0.02]} />
              <meshStandardMaterial color={surfaces.exterior} roughness={0.9} />
            </mesh>
          ))}
          {/* Iron ring handle near the middle */}
          <mesh position={[dir * (LEAF_W - 0.14), 1.25, LEAF_D + 0.03]}>
            <torusGeometry args={[0.07, 0.012, 6, 12]} />
            <meshStandardMaterial color={surfaces.ground} roughness={0.6} metalness={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
