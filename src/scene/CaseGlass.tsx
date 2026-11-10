import { useMemo } from 'react'
import { BoxGeometry } from 'three'
import { palette } from '../theme/palette'

type Props = {
  position: [number, number, number]
  width: number
  height: number
}

/** Simple transparent glass box over the statue (no transmission). */
export function CaseGlass({ position, width, height }: Props) {
  const edges = useMemo(() => new BoxGeometry(width, height, width), [width, height])

  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[width, height, width]} />
        <meshStandardMaterial
          color={palette.fog}
          transparent
          opacity={0.1}
          roughness={0.05}
          depthWrite={false}
        />
      </mesh>

      {/* Faint cold edges so the glass reads in the dark */}
      <lineSegments>
        <edgesGeometry args={[edges]} />
        <lineBasicMaterial color={palette.fog} transparent opacity={0.3} />
      </lineSegments>
    </group>
  )
}
