import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, Color, type ShaderMaterial } from 'three'
import { LEOPARD_POINTS, REDUCED_MOTION } from '../config/quality'
import { MODELS } from '../scene/models'
import { fitStatue } from '../scene/statueFit'
import { palette } from '../theme/palette'
import { seededRandom } from '../utils/random'
import { sampleSurface } from './leopardPoints'
import { roomLive } from './roomLive'
import { LAYOUT, surfaceY } from './slopeShape'

/** Top of the rock above the slope, metres (see LeopardRock). */
const ROCK_TOP = 1.15
/** Turns the head (+x) toward the city: right and toward the camera. */
const YAW = -0.95

const vertexShader = /* glsl */ `
  attribute vec3 aSeed; // x phase, y rank (0..1), z size
  uniform float uTime;
  uniform float uBright;
  uniform float uScale;
  uniform float uBreathe;
  uniform vec3 uStone;
  uniform vec3 uAmber;
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    vec3 p = position;
    // Slow breathing: the chest rises a little.
    p.y += uBreathe * 0.03 * sin(uTime * 0.9 + aSeed.x * 6.2831) * smoothstep(0.2, 1.2, position.y);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float depth = max(-mv.z, 0.05);
    gl_PointSize = clamp(aSeed.z * (0.55 + 0.6 * uBright) * uScale / depth, 1.2, 9.0);

    // State 1 -> 2: faint grey-stone grains become amber, glowing particles as the leopard brightens.
    // When she fades, the outermost grains go first, but a stone outline stays.
    float keep = mix(0.4, 1.0, smoothstep(0.0, 0.7, uBright));
    float present = 1.0 - smoothstep(keep - 0.15, keep, aSeed.y);
    float twinkle = 0.8 + 0.2 * sin(uTime * (0.7 + aSeed.x) + aSeed.x * 50.0) * uBreathe;
    vAlpha = present * mix(0.22, 0.85, uBright) * twinkle;
    vColor = mix(uStone, uAmber * (1.0 + 0.6 * uBright), smoothstep(0.05, 0.5, uBright));
  }
`

const fragmentShader = /* glsl */ `
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    float r = length(gl_PointCoord - vec2(0.5));
    float a = (1.0 - smoothstep(0.0, 0.5, r)) * vAlpha;
    if (a < 0.003) discard;
    gl_FragColor = vec4(vColor, a);
  }
`

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
      uStone: { value: new Color(palette.stone) },
      uAmber: { value: new Color(palette.ghost) },
    }),
    [],
  )

  useFrame(({ clock, size }) => {
    const u = material.current?.uniforms
    if (!u) return
    u.uTime.value = clock.elapsedTime
    u.uBright.value = roomLive.leopard
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
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  )
}
