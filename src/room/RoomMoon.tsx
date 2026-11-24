import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, Color, type Sprite } from 'three'
import { getGlowTexture } from '../opening/glowTexture'
import { palette } from '../theme/palette'
import { epilogueProgress, storyLive } from './storyLive'

/** Bright ending: a pale moon rises over the ridge, slowly, while the cub walks away. */
export function RoomMoon() {
  const sprite = useRef<Sprite>(null)
  const color = useMemo(() => new Color(palette.fog), [])
  useFrame(() => {
    const s = sprite.current
    if (!s) return
    s.material.opacity = storyLive.epilogue === 'bright' ? Math.min(1, epilogueProgress() * 1.2) * 0.9 : 0
  })
  return (
    <sprite ref={sprite} position={[6, 22, -27]} scale={[7, 7, 1]} renderOrder={-1}>
      <spriteMaterial
        map={getGlowTexture()}
        color={color}
        transparent
        opacity={0}
        depthWrite={false}
        fog={false}
        blending={AdditiveBlending}
      />
    </sprite>
  )
}
