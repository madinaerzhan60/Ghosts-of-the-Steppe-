import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { BoxGeometry, type Group, type LineBasicMaterial, type MeshStandardMaterial } from 'three'
import { caseProgress } from '../awaken/caseProgress'
import { palette } from '../theme/palette'
import { CaseCracks } from './CaseCracks'

type Props = {
  caseId: string
  /** Animal id in animals.json (the cracks glow in its color). */
  animal: string
  position: [number, number, number]
  width: number
  height: number
}

const GLASS_OPACITY = 0.1
const EDGE_OPACITY = 0.3

/**
 * Simple transparent glass box over the statue (no transmission).
 * When the case wakes, cracks spread over it and it fades away softly.
 */
export function CaseGlass({ caseId, animal, position, width, height }: Props) {
  const edges = useMemo(() => new BoxGeometry(width, height, width), [width, height])
  const group = useRef<Group>(null)
  const glass = useRef<MeshStandardMaterial>(null)
  const lines = useRef<LineBasicMaterial>(null)

  useFrame(() => {
    const fade = 1 - caseProgress(caseId).glass
    if (glass.current) glass.current.opacity = GLASS_OPACITY * fade
    if (lines.current) lines.current.opacity = EDGE_OPACITY * fade
    if (group.current) group.current.visible = fade > 0.002
  })

  return (
    <group ref={group} position={position}>
      <mesh>
        <boxGeometry args={[width, height, width]} />
        <meshStandardMaterial
          ref={glass}
          color={palette.fog}
          transparent
          opacity={GLASS_OPACITY}
          roughness={0.05}
          depthWrite={false}
        />
      </mesh>

      {/* Faint teal edges so the glass reads in the dark */}
      <lineSegments>
        <edgesGeometry args={[edges]} />
        <lineBasicMaterial ref={lines} color={palette.fog} transparent opacity={EDGE_OPACITY} />
      </lineSegments>

      <CaseCracks caseId={caseId} animal={animal} width={width} height={height} />
    </group>
  )
}
