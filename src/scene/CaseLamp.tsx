import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { Color, type MeshBasicMaterial, type PointLight } from 'three'
import { palette } from '../theme/palette'

type Props = {
  position: [number, number, number]
  /** Different seed per lamp so they don't flicker in sync. */
  seed: number
}

const BASE_INTENSITY = 16
const baseColor = new Color(palette.fog)

/** Dim ceiling lamp with a slight, slow, smooth flicker (no strobing). */
export function CaseLamp({ position, seed }: Props) {
  const light = useRef<PointLight>(null)
  const fixture = useRef<MeshBasicMaterial>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    // Slow waves, all below ~2 Hz, small amplitude.
    const wobble =
      0.5 * Math.sin(t * 1.7 + seed) +
      0.3 * Math.sin(t * 5.3 + seed * 2.1) +
      0.2 * Math.sin(t * 11.7 + seed * 3.3)
    // Rare, soft dip lasting a moment.
    const dip = Math.pow(Math.max(0, Math.sin(t * 0.37 + seed * 1.9)), 40)
    const k = 1 + 0.06 * wobble - 0.25 * dip

    if (light.current) light.current.intensity = BASE_INTENSITY * k
    if (fixture.current) fixture.current.color.copy(baseColor).multiplyScalar(1.2 * k)
  })

  return (
    <group position={position}>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.06, 20]} />
        <meshBasicMaterial ref={fixture} color={palette.fog} toneMapped={false} />
      </mesh>
      <pointLight
        ref={light}
        position={[0, 0, 0]}
        color={palette.fog}
        intensity={BASE_INTENSITY}
        distance={7}
        decay={2}
      />
    </group>
  )
}
