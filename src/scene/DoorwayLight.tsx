import { useMemo } from 'react'
import { Shape } from 'three'
import { palette } from '../theme/palette'
import { DoorwayFloorGlow } from './DoorwayFloorGlow'
import { CORRIDOR } from './layout'

const W = 1.4
const H = 2.6
const R = W / 2

/** Arched doorway shape: rectangle topped with a half circle. */
function archShape(): Shape {
  const s = new Shape()
  s.moveTo(-R, 0)
  s.lineTo(R, 0)
  s.lineTo(R, H - R)
  s.absarc(0, H - R, R, 0, Math.PI, false)
  s.lineTo(-R, 0)
  return s
}

/** Far arched doorway: emissive warm amber so bloom makes it glow softly. */
export function DoorwayLight() {
  const z = -CORRIDOR.length + 0.05
  const shape = useMemo(archShape, [])

  return (
    <group>
      <mesh position={[0, 0, z]}>
        <shapeGeometry args={[shape, 24]} />
        {/* fog={false}: stays faintly visible as a distant hint of warmth */}
        <meshStandardMaterial
          color={palette.background}
          emissive={palette.ghost}
          emissiveIntensity={1.4}
          fog={false}
        />
      </mesh>
      <DoorwayFloorGlow />
      <pointLight
        position={[0, 1.5, z + 1.5]}
        color={palette.ghost}
        intensity={4}
        distance={10}
        decay={2}
      />
    </group>
  )
}
