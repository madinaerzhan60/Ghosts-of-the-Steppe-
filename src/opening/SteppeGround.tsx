import { surfaces } from '../theme/surfaces'
import { useMemo } from 'react'
import { GROUND_Y, STEPS_FRONT_Z } from './openingLayout'
import { getPathTexture, PATH_TILE } from './pathTexture'

const PATH_START = STEPS_FRONT_Z

/**
 * Dark earth under the grass, and a path of worn stone slabs to the steps.
 * Unlit (basic) materials: this plane covers half the screen, and a lit material
 * would evaluate every hall spotlight for every pixel of it.
 */
const PATH_LENGTH = 30

export function SteppeGround() {
  const pathMap = useMemo(() => {
    const t = getPathTexture().clone()
    t.repeat.set(1, PATH_LENGTH / PATH_TILE.length)
    t.needsUpdate = true
    return t
  }, [])
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, GROUND_Y, 14]}>
        <planeGeometry args={[90, 80]} />
        <meshBasicMaterial color={surfaces.ground} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, GROUND_Y + 0.005, PATH_START + 15]}>
        <planeGeometry args={[PATH_TILE.width, PATH_LENGTH]} />
        <meshBasicMaterial map={pathMap} />
      </mesh>
    </group>
  )
}
