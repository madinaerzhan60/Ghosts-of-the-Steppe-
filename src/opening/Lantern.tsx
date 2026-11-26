import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { AdditiveBlending, CanvasTexture, type MeshBasicMaterial, type MeshStandardMaterial, type SpriteMaterial } from 'three'
import { palette } from '../theme/palette'
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
  const halo = useRef<SpriteMaterial>(null)
  const seed = index * 7.31
  // Each lantern burns at its own pace, so they never flicker in step.
  const pace = 0.8 + 0.17 * index

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    // Slow, layered waves: a living oil flame, never strobing.
    const k =
      1 +
      0.1 * Math.sin(t * 2.3 * pace + seed) +
      0.06 * Math.sin(t * 5.1 * pace + seed * 1.7) +
      0.04 * Math.sin(t * 9.7 * pace + seed * 2.9)
    lanternLive.level[index] = k
    if (flame.current) flame.current.emissiveIntensity = 2.0 * k
    if (pool.current) pool.current.opacity = 0.42 * k
    if (halo.current) halo.current.opacity = 0.5 * k
  })

  const y0 = GROUND_Y
  return (
    <group position={[x, 0, z]}>
      {/* Post and a little arm leaning over the path */}
      <mesh position={[0, y0 + LANTERN_HEIGHT / 2, 0]}>
        <boxGeometry args={[POST, LANTERN_HEIGHT, POST]} />
        <meshStandardMaterial color={palette.bronze} roughness={0.7} metalness={0.1} flatShading />
      </mesh>
      {/* Lantern body: dark iron frame, warm glass, a small pyramid roof */}
      <group position={[0, y0 + LANTERN_HEIGHT + BODY.h / 2, 0]}>
        <mesh>
          <boxGeometry args={[BODY.w, BODY.h, BODY.w]} />
          <meshStandardMaterial color={palette.lanternGlass} emissive={palette.lanternGlass} emissiveIntensity={0.5} roughness={0.2} transparent opacity={0.4} />
        </mesh>
        <mesh>
          <boxGeometry args={[BODY.w * 0.66, BODY.h * 0.7, BODY.w * 0.66]} />
          <meshStandardMaterial ref={flame} color={palette.background} emissive={palette.lanternGlass} emissiveIntensity={2.0} />
        </mesh>
        {/* Bronze frame: four corner bars around the glass */}
        {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[(sx * BODY.w) / 2, 0, (sz * BODY.w) / 2]}>
            <boxGeometry args={[0.016, BODY.h + 0.02, 0.016]} />
            <meshStandardMaterial color={palette.bronze} roughness={0.7} metalness={0.1} />
          </mesh>
        )))}
        {/* Soft bloom halo around the light (camera-facing) */}
        <sprite scale={[0.8, 0.8, 1]} renderOrder={3}>
          <spriteMaterial
            ref={halo}
            map={glowMap}
            color={palette.lanternGlass}
            transparent
            opacity={0.5}
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </sprite>
        <mesh position={[0, BODY.h / 2 + 0.05, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[BODY.w * 0.8, 0.1, 4]} />
          <meshStandardMaterial color={palette.bronze} roughness={0.7} metalness={0.1} flatShading />
        </mesh>
      </group>
      {/* Warm pool of light on the ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y0 + 0.02, 0]} renderOrder={1}>
        <planeGeometry args={[4.2, 4.2]} />
        <meshBasicMaterial
          ref={pool}
          map={glowMap}
          color={palette.lanternGlass}
          transparent
          opacity={0.42}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
