import { palette } from '../theme/palette'
import { Floor } from './Floor'
import { CORRIDOR, HALF_WIDTH } from './layout'
import { Wall } from './Wall'

const { length, width, height } = CORRIDOR
const midZ = -length / 2

export function Corridor() {
  return (
    <group>
      <Floor />

      {/* Ceiling: plain, almost invisible in the dark */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, height, midZ]}>
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial color={palette.background} roughness={1} />
      </mesh>

      {/* Left wall (faces +x) */}
      <Wall
        rotation={[0, Math.PI / 2, 0]}
        position={[-HALF_WIDTH, height / 2, midZ]}
        width={length}
        height={height}
      />
      {/* Right wall (faces -x) */}
      <Wall
        rotation={[0, -Math.PI / 2, 0]}
        position={[HALF_WIDTH, height / 2, midZ]}
        width={length}
        height={height}
      />
      {/* Far end wall (faces +z) */}
      <Wall position={[0, height / 2, -length]} width={width} height={height} />
      {/* No start wall: the museum facade (opening/MuseumExterior) closes the hall, with the doors. */}
    </group>
  )
}
