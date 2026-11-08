import { palette } from '../theme/palette'
import { CORRIDOR } from './layout'

/** Faint warm doorway at the far end, glimmering through the fog. */
export function DoorwayLight() {
  const z = -CORRIDOR.length + 0.05

  return (
    <group>
      <mesh position={[0, 1.3, z]}>
        <planeGeometry args={[1.4, 2.6]} />
        {/* fog={false}: stays faintly visible as a distant hint of warmth */}
        <meshBasicMaterial
          color={palette.ghost}
          transparent
          opacity={0.45}
          fog={false}
          toneMapped={false}
        />
      </mesh>
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
