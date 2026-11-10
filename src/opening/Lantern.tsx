import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { AdditiveBlending, CanvasTexture, type MeshBasicMaterial, type MeshStandardMaterial } from 'three'
import { palette } from '../theme/palette'
import { surfaces } from '../theme/surfaces'
import { lanternLive } from './lanternLive'
import { GROUND_Y, LANTERN_HEIGHT } from './openingLayout'

type Props = { index: number; x: number; z: number; glowMap: CanvasTexture }

const POST = 0.05
const BODY = { w: 0.16, h: 0.22 }

/**
 * A small old oil lantern on a post, beside the path. Flickers softly (no flashes):
 * the flame (emissive, so bloom makes it glow) and a warm pool on the ground.
 * No real light: the grass reads the flicker from lanternLive in its own shader.
 */
export function Lantern({ index, x, z, glowMap }: Props) {
  const flame = useRef<MeshStandardMaterial>(null)
  const pool = useRef<MeshBasicMaterial>(null)
  const seed = index * 7.31

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    // Slow, layered waves: a living oil flame, never strobing.
    const k =
      1 +
      0.1 * Math.sin(t * 2.3 + seed) +
      0.06 * Math.sin(t * 5.1 + seed * 1.7) +
      0.04 * Math.sin(t * 9.7 + seed * 2.9)
    lanternLive.level[index] = k
    if (flame.current) flame.current.emissiveIntensity = 1.6 * k
    if (pool.current) pool.current.opacity = 0.32 * k
  })

  const y0 = GROUND_Y
  return (
    <group position={[x, 0, z]}>
      {/* Post and a little arm leaning over the path */}
      <mesh position={[0, y0 + LANTERN_HEIGHT / 2, 0]}>
        <boxGeometry args={[POST, LANTERN_HEIGHT, POST]} />
        <meshStandardMaterial color={surfaces.pedestal} roughness={0.9} flatShading />
      </mesh>
      {/* Lantern body: dark iron frame, warm glass, a small pyramid roof */}
      <group position={[0, y0 + LANTERN_HEIGHT + BODY.h / 2, 0]}>
        <mesh>
          <boxGeometry args={[BODY.w, BODY.h, BODY.w]} />
          <meshStandardMaterial color={surfaces.ground} roughness={0.6} metalness={0.3} transparent opacity={0.55} />
        </mesh>
        <mesh>
          <boxGeometry args={[BODY.w * 0.66, BODY.h * 0.7, BODY.w * 0.66]} />
          <meshStandardMaterial ref={flame} color={palette.background} emissive={palette.ghost} emissiveIntensity={1.6} />
        </mesh>
        <mesh position={[0, BODY.h / 2 + 0.05, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[BODY.w * 0.8, 0.1, 4]} />
          <meshStandardMaterial color={surfaces.ground} roughness={0.7} flatShading />
        </mesh>
      </group>
      {/* Warm pool of light on the ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y0 + 0.02, 0]} renderOrder={1}>
        <planeGeometry args={[3.2, 3.2]} />
        <meshBasicMaterial
          ref={pool}
          map={glowMap}
          color={palette.ghost}
          transparent
          opacity={0.32}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
