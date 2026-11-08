import { useMemo } from 'react'
import { BoxGeometry } from 'three'
import { LIGHT_MODE } from '../config/quality'
import { palette } from '../theme/palette'
import { CaseLamp } from './CaseLamp'
import type { CaseDef } from './layout'
import { PlaceholderShape } from './PlaceholderShape'

type Props = {
  def: CaseDef
  onSelect: (id: string) => void
}

const PEDESTAL_H = 1.0
const GLASS = { w: 0.84, h: 1.2 }
const GLASS_Y = PEDESTAL_H + GLASS.h / 2

export function DisplayCase({ def, onSelect }: Props) {
  const edges = useMemo(() => new BoxGeometry(GLASS.w, GLASS.h, GLASS.w), [])

  return (
    <group position={[def.x, 0, def.z]}>
      {/* Clickable area: pedestal + glass + placeholder */}
      <group
        onClick={(e) => {
          e.stopPropagation()
          onSelect(def.id)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          document.body.style.cursor = ''
        }}
      >
        {/* Pedestal */}
        <mesh position={[0, PEDESTAL_H / 2, 0]}>
          <boxGeometry args={[1.0, PEDESTAL_H, 1.0]} />
          <meshStandardMaterial color={palette.stone} roughness={0.8} />
        </mesh>

        {/* Statue placeholder */}
        <group position={[0, GLASS_Y, 0]}>
          <PlaceholderShape shape={def.shape} />
        </group>

        {/* Glass: real transmission normally, cheap transparency in light mode */}
        <mesh position={[0, GLASS_Y, 0]}>
          <boxGeometry args={[GLASS.w, GLASS.h, GLASS.w]} />
          {LIGHT_MODE ? (
            <meshPhysicalMaterial
              color={palette.fog}
              transparent
              opacity={0.1}
              roughness={0.05}
              depthWrite={false}
            />
          ) : (
            <meshPhysicalMaterial
              color={palette.fog}
              transmission={1}
              thickness={0.08}
              ior={1.3}
              roughness={0.04}
            />
          )}
        </mesh>

        {/* Faint cold edges so the glass reads in the dark */}
        <lineSegments position={[0, GLASS_Y, 0]}>
          <edgesGeometry args={[edges]} />
          <lineBasicMaterial color={palette.fog} transparent opacity={0.35} />
        </lineSegments>
      </group>

      {/* Ceiling lamp directly above the case */}
      <CaseLamp position={[0, 3.7, 0]} seed={def.z} />
    </group>
  )
}
