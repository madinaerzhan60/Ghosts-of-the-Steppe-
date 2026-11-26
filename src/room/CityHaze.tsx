import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, Color, type Sprite } from 'three'
import { getGlowTexture } from '../opening/glowTexture'
import { palette } from '../theme/palette'
import { roomLive } from './roomLive'
import { LAYOUT, surfaceY } from './slopeShape'

/** A soft golden haze over the city lights. It grows with the city. */
export function CityHaze() {
  const sprite = useRef<Sprite>(null)
  const color = useMemo(() => new Color(palette.cityHaze), [])
  const z = LAYOUT.cityBottom - 1
  useFrame(() => {
    const s = sprite.current
    if (!s) return
    s.material.opacity = 0.07 + 0.12 * roomLive.city
    s.scale.set(20 + 6 * roomLive.city, 6 + 3 * roomLive.city, 1)
  })
  return (
    <sprite ref={sprite} position={[0, surfaceY(0, z) + 1.2, z]} renderOrder={1}>
      <spriteMaterial
        map={getGlowTexture()}
        color={color}
        transparent
        opacity={0.2}
        depthWrite={false}
        blending={AdditiveBlending}
        fog={false}
      />
    </sprite>
  )
}
