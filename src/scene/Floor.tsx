import { surfaces } from '../theme/surfaces'
import { CORRIDOR } from './layout'

const { length, width } = CORRIDOR

/** Dark, slightly glossy stone floor. Specular highlights only, no reflection pass. */
export function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -length / 2]}>
      <planeGeometry args={[width, length]} />
      <meshStandardMaterial color={surfaces.floor} roughness={0.55} metalness={0.1} />
    </mesh>
  )
}
