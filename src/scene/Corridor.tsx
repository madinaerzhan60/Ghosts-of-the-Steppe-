import { palette } from '../theme/palette'
import { CORRIDOR, HALF_WIDTH } from './layout'

const { length, width, height } = CORRIDOR
const midZ = -length / 2
const beamZs = Array.from({ length: 8 }, (_, i) => -2.5 - i * 5)

export function Corridor() {
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, midZ]}>
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial color={palette.stone} roughness={0.45} />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, height, midZ]}>
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial color={palette.background} roughness={1} />
      </mesh>

      {/* Left wall (faces +x) */}
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-HALF_WIDTH, height / 2, midZ]}>
        <planeGeometry args={[length, height]} />
        <meshStandardMaterial color={palette.stone} roughness={0.95} />
      </mesh>

      {/* Right wall (faces -x) */}
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[HALF_WIDTH, height / 2, midZ]}>
        <planeGeometry args={[length, height]} />
        <meshStandardMaterial color={palette.stone} roughness={0.95} />
      </mesh>

      {/* Far end wall (faces +z) */}
      <mesh position={[0, height / 2, -length]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={palette.stone} roughness={0.95} />
      </mesh>

      {/* Start wall behind the visitor (faces -z) */}
      <mesh rotation={[0, Math.PI, 0]} position={[0, height / 2, 0]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={palette.stone} roughness={0.95} />
      </mesh>

      {/* Ceiling beams: give a sense of depth and motion while walking */}
      {beamZs.map((z) => (
        <mesh key={z} position={[0, height - 0.12, z]}>
          <boxGeometry args={[width, 0.24, 0.3]} />
          <meshStandardMaterial color={palette.stone} roughness={0.95} />
        </mesh>
      ))}
    </group>
  )
}
