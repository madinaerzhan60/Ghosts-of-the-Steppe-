import { palette } from '../theme/palette'
import type { PlaceholderShape as Shape } from './layout'

/** Grey stone stand-in for an animal statue ("forgotten" state). */
export function PlaceholderShape({ shape }: { shape: Shape }) {
  return (
    <mesh>
      {shape === 'icosahedron' && <icosahedronGeometry args={[0.3, 0]} />}
      {shape === 'dodecahedron' && <dodecahedronGeometry args={[0.3, 0]} />}
      {shape === 'octahedron' && <octahedronGeometry args={[0.32, 0]} />}
      {shape === 'torusKnot' && <torusKnotGeometry args={[0.2, 0.07, 96, 12]} />}
      {shape === 'cone' && <coneGeometry args={[0.25, 0.6, 7]} />}
      {shape === 'capsule' && <capsuleGeometry args={[0.18, 0.35, 6, 12]} />}
      <meshStandardMaterial color={palette.stone} roughness={0.85} flatShading />
    </mesh>
  )
}
