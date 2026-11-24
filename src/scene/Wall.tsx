import { surfaces } from '../theme/surfaces'
import { getPanelTexture } from './panelTexture'

type Props = {
  position: [number, number, number]
  rotation?: [number, number, number]
  width: number
  height: number
}

const TILE = 2 // metres per panel

/** Deep blue stone wall with faint panel lines. A little self-glow keeps it blue, never black, between the spots. */
export function Wall({ position, rotation, width, height }: Props) {
  const map = getPanelTexture(
    Math.max(1, Math.round(width / TILE)),
    Math.max(1, Math.round(height / TILE)),
  )
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial
        color={surfaces.wall}
        map={map}
        emissive={surfaces.wall}
        emissiveMap={map}
        emissiveIntensity={0.55}
        roughness={0.95}
      />
    </mesh>
  )
}
