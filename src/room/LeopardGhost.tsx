import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, Color, type ShaderMaterial } from 'three'
import { LEOPARD_POINTS, REDUCED_MOTION } from '../config/quality'
import { MODELS } from '../scene/models'
import { fitStatue } from '../scene/statueFit'
import { palette } from '../theme/palette'
import { animalColor } from '../content/animalColor'
import { seededRandom } from '../utils/random'
import { sampleSurface } from '../utils/sampleSurface'
import { ghostFragmentShader, ghostVertexShader } from './ghostShaders'
import { roomLive } from './roomLive'
import { epilogueProgress, storyLive } from './storyLive'
import { LAYOUT, surfaceY } from './slopeShape'

/** Top of the rock above the slope, metres (see LeopardRock). */
const ROCK_TOP = 1.15
/** Turns the head (+x) toward the city: right and toward the camera. */
const YAW = -0.95

/**
 * The snow leopard as a particle ghost, sitting on her rock and facing the city.
 * `roomLive.leopard` sets how bright she is: grey stone grains when forgotten,
 * amber glowing particles as she is remembered.
 */
export function LeopardGhost() {
  const gltf = useGLTF(MODELS['snow-leopard'].url)
  const material = useRef<ShaderMaterial>(null)

  const data = useMemo(() => {
    const fitted = fitStatue(gltf.scene, {
      fill: LAYOUT.leopardLength,
      viewAxis: { x: Math.cos(YAW), z: -Math.sin(YAW) },
      maxHeight: 3.8,
      maxFootprint: 5.4,
      headToMinusX: MODELS['snow-leopard'].headToMinusX,
      yaw: YAW,
    })
    const rand = seededRandom(12)
    const n = LEOPARD_POINTS
    const position = sampleSurface(fitted.object, n, rand)
    const seed = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) seed.set([rand(), rand(), 0.016 + rand() * 0.014], i * 3)
    return { position, seed }
  }, [gltf])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uBright: { value: 0.5 },
      uScale: { value: 500 },
      uBreathe: { value: REDUCED_MOTION ? 0 : 1 },
      uDrift: { value: 0 },
      uAppear: { value: 1 },
      uSizeK: { value: 1 },
      uStone: { value: new Color(palette.stone) },
      uGlow: { value: new Color(animalColor('snow-leopard')) },
    }),
    [],
  )

  useFrame(({ clock, size }) => {
    const u = material.current?.uniforms
    if (!u) return
    u.uTime.value = clock.elapsedTime
    u.uBright.value = roomLive.leopard
    // In the faded epilogue her particles blow away like snow.
    u.uDrift.value = storyLive.epilogue === 'faded' ? epilogueProgress() : 0
    u.uScale.value = size.height * 0.62
  })

  const { x, z } = LAYOUT.rock
  return (
    <points position={[x, surfaceY(x, z) + ROCK_TOP, z]} frustumCulled={false}>
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
  )
}
