import { surfaces } from '../theme/surfaces'
import { GROUND_Y, STEPS_FRONT_Z } from './openingLayout'

const PATH_START = STEPS_FRONT_Z

/**
 * Dark earth under the grass, and a worn path to the steps.
 * Unlit (basic) materials: this plane covers half the screen, and a lit material
 * would evaluate every hall spotlight for every pixel of it.
 */
export function SteppeGround() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, GROUND_Y, 14]}>
        <planeGeometry args={[90, 80]} />
        <meshBasicMaterial color={surfaces.ground} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, GROUND_Y + 0.005, PATH_START + 15]}>
        <planeGeometry args={[1.4, 30]} />
        <meshBasicMaterial color={surfaces.path} />
      </mesh>
    </group>
  )
}
