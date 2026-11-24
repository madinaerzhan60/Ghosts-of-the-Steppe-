import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, Color, MathUtils, type Group, type ShaderMaterial, type Sprite } from 'three'
import { LEOPARD_POINTS, REDUCED_MOTION } from '../config/quality'
import { getGlowTexture } from '../opening/glowTexture'
import { MODELS } from '../scene/models'
import { fitStatue } from '../scene/statueFit'
import { palette } from '../theme/palette'
import { seededRandom } from '../utils/random'
import { ghostFragmentShader, ghostVertexShader } from './ghostShaders'
import { sampleSurface } from './leopardPoints'
import { roomLive } from './roomLive'
import { LAYOUT, surfaceY } from './slopeShape'
import { epilogueProgress, storyLive } from './storyLive'

/** The cub is this much smaller than his mother. */
const CUB_SIZE = 0.42
/** Where he stands next to her, and which way he looks (toward the city, like her). */
const HOME = { x: LAYOUT.rock.x + 2.6, z: LAYOUT.rock.z + 1.4, heading: -1.25 }
/** Bright ending: he walks off along the ridge, grown. */
const WALK_END = { x: 9, z: -11 }
/**
 * Middle ending: he climbs to the ridge, follows it away, and vanishes over the far
 * mountains. Distance alone makes him small; at the end his light fades out.
 */
const RIDGE_CLIMB = { x: 4, z: -37 }
const RIDGE_END = { x: 17, z: -42 }
/** Share of the walk spent climbing to the ridge before following it. */
const CLIMB_SHARE = 0.55

/**
 * The cub: a small particle ghost next to his mother. He appears in the prologue and
 * plays his part in the epilogue (walks away grown / his light goes far / drifts away like snow).
 */
export function CubGhost() {
  const gltf = useGLTF(MODELS['snow-leopard'].url)
  const group = useRef<Group>(null)
  const material = useRef<ShaderMaterial>(null)
  const light = useRef<Sprite>(null)
  const lightColor = useMemo(() => new Color(palette.ghost), [])

  const data = useMemo(() => {
    // Built facing +x; the group turns him.
    const fitted = fitStatue(gltf.scene, {
      fill: LAYOUT.leopardLength * CUB_SIZE,
      viewAxis: { x: 1, z: 0 },
      maxHeight: 3,
      maxFootprint: 4,
      headToMinusX: MODELS['snow-leopard'].headToMinusX,
      yaw: 0,
    })
    const rand = seededRandom(44)
    const n = Math.floor(LEOPARD_POINTS / 4)
    const position = sampleSurface(fitted.object, n, rand)
    const seed = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) seed.set([rand(), rand(), 0.018 + rand() * 0.014], i * 3)
    return { position, seed }
  }, [gltf])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uBright: { value: 0.5 },
      uScale: { value: 500 },
      uBreathe: { value: REDUCED_MOTION ? 0 : 1 },
      uDrift: { value: 0 },
      uAppear: { value: 0 },
      uSizeK: { value: 0.85 },
      uStone: { value: new Color(palette.stone) },
      uAmber: { value: new Color(palette.ghost) },
    }),
    [],
  )

  useFrame(({ clock, size }) => {
    const u = material.current?.uniforms
    const g = group.current
    if (!u || !g) return
    const p = epilogueProgress()
    const kind = storyLive.epilogue
    const walk = kind === 'bright' ? p : 0
    const far = kind === 'middle' ? p : 0

    // Position and the direction he is heading (head along +x = rotation 0).
    let x = HOME.x
    let z = HOME.z
    let away = 0
    if (kind === 'middle') {
      const climb = Math.min(1, far / CLIMB_SHARE)
      const along = Math.max(0, (far - CLIMB_SHARE) / (1 - CLIMB_SHARE))
      x = MathUtils.lerp(MathUtils.lerp(HOME.x, RIDGE_CLIMB.x, climb), RIDGE_END.x, along)
      z = MathUtils.lerp(MathUtils.lerp(HOME.z, RIDGE_CLIMB.z, climb), RIDGE_END.z, along)
      const up = Math.atan2(-(RIDGE_CLIMB.z - HOME.z), RIDGE_CLIMB.x - HOME.x)
      const ridge = Math.atan2(-(RIDGE_END.z - RIDGE_CLIMB.z), RIDGE_END.x - RIDGE_CLIMB.x)
      away = MathUtils.lerp(up, ridge, MathUtils.smoothstep(far, CLIMB_SHARE - 0.1, CLIMB_SHARE + 0.1))
      g.rotation.y = MathUtils.lerp(HOME.heading, away, MathUtils.smoothstep(far, 0, 0.12))
    } else {
      x = MathUtils.lerp(HOME.x, WALK_END.x, walk)
      z = MathUtils.lerp(HOME.z, WALK_END.z, walk)
      away = Math.atan2(-(WALK_END.z - HOME.z), WALK_END.x - HOME.x)
      g.rotation.y = MathUtils.lerp(HOME.heading, away, MathUtils.smoothstep(walk, 0, 0.25))
    }
    const bob = REDUCED_MOTION || p === 0 ? 0 : 0.05 * Math.sin(clock.elapsedTime * 3)
    g.position.set(x, surfaceY(x, z) + bob, z)
    // Grown when he walks off (bright). Far away he stays his own size: distance makes him small.
    g.scale.setScalar(1 + 0.9 * walk)

    // Leaving, he turns into a small warm light that is still visible far away, then goes out.
    const l = light.current
    if (l) l.material.opacity = 0.9 * MathUtils.smoothstep(far, 0.08, 0.4) * (1 - MathUtils.smoothstep(far, 0.9, 0.99)) * storyLive.cub

    u.uTime.value = clock.elapsedTime
    // His light glows warmer as he leaves, then fades out over the far mountains.
    u.uBright.value = MathUtils.lerp(roomLive.leopard, 0.9, far)
    u.uAppear.value = storyLive.cub * (1 - MathUtils.smoothstep(far, 0.85, 0.99))
    u.uDrift.value = kind === 'faded' ? p : 0
    u.uScale.value = size.height * 0.62
  })

  return (
    <group ref={group}>
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.position, 3]} />
          <bufferAttribute attach="attributes-aSeed" args={[data.seed, 3]} />
        </bufferGeometry>
        <shaderMaterial
          ref={material}
          uniforms={uniforms}
          vertexShader={ghostVertexShader}
          fragmentShader={ghostFragmentShader}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>
      <sprite ref={light} position={[0, 0.7, 0]} scale={[1.3, 1.3, 1]}>
        <spriteMaterial
          map={getGlowTexture()}
          color={lightColor}
          transparent
          opacity={0}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </sprite>
    </group>
  )
}
