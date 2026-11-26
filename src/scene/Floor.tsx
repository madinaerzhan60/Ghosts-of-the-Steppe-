import { surfaces } from '../theme/surfaces'
import { CORRIDOR } from './layout'

const { length, width } = CORRIDOR

/** Dark blue, glossy stone floor. Specular highlights only, no reflection pass;
 * the colored pools of light in front of each case (CaseFloorGlow) fake the reflection. */
export function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -length / 2]}>
      <planeGeometry args={[width, length]} />
      <meshStandardMaterial
        color={surfaces.floor}
        emissive={surfaces.floor}
        emissiveIntensity={0.35}
        roughness={0.5}
        metalness={0.12}
      />
    </mesh>
  )
}
