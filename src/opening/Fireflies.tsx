import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, Color, type ShaderMaterial } from 'three'
import { FIREFLIES, REDUCED_MOTION } from '../config/quality'
import { palette } from '../theme/palette'
import { seededRandom } from '../utils/random'
import { GROUND_Y } from './openingLayout'

// Warm ember sparks drifting slowly over the steppe, glowing in and out softly.
const AREA = { x: 11, z0: 2.5, z1: 24 }

const vertexShader = /* glsl */ `
  attribute vec4 aSeed; // x phase, y speed, z blink period, w size
  uniform float uTime;
  uniform float uScale;
  varying float vAlpha;
  void main() {
    float ph = aSeed.x * 6.2831;
    float t = uTime * aSeed.y;
    // Slow wandering loop around the home position, rising and sinking a little.
    vec3 p = position + vec3(
      0.55 * sin(t * 0.7 + ph) + 0.25 * sin(t * 1.9 + ph * 2.0),
      0.3 * sin(t * 0.5 + ph * 1.3),
      0.55 * cos(t * 0.6 + ph) + 0.2 * cos(t * 1.7 + ph * 3.0)
    );
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float depth = max(-mv.z, 0.05);
    gl_PointSize = clamp(aSeed.w * uScale / depth, 0.0, 14.0);
    // Glow in and out (period 3–7 s), never a flash; fade with distance.
    float period = max(aSeed.z, 0.5);
    float b = 0.5 + 0.5 * sin(uTime * 6.2831 / period + ph);
    float glow = smoothstep(0.35, 1.0, b);
    vAlpha = clamp(glow * (1.0 - smoothstep(14.0, 30.0, depth)) * 0.9, 0.0, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    float r = length(gl_PointCoord - vec2(0.5));
    float a = clamp((1.0 - smoothstep(0.0, 0.5, r)) * vAlpha, 0.0, 1.0);
    if (a < 0.003) discard;
    gl_FragColor = vec4(clamp(uColor, 0.0, 1.0), a);
  }
`

export function Fireflies() {
  const material = useRef<ShaderMaterial>(null)

  const data = useMemo(() => {
    const rand = seededRandom(77)
    const n = FIREFLIES
    const position = new Float32Array(n * 3)
    const seed = new Float32Array(n * 4)
    for (let i = 0; i < n; i++) {
      // More of them near the path, where the visitor walks.
      const side = rand() < 0.5 ? -1 : 1
      position[i * 3] = side * (0.6 + Math.pow(rand(), 1.6) * AREA.x)
      position[i * 3 + 1] = GROUND_Y + 0.25 + rand() * 1.9
      position[i * 3 + 2] = AREA.z0 + rand() * (AREA.z1 - AREA.z0)
      seed[i * 4] = rand()
      seed[i * 4 + 1] = (REDUCED_MOTION ? 0.15 : 0.35) + rand() * 0.35
      seed[i * 4 + 2] = 3 + rand() * 4
      seed[i * 4 + 3] = 0.018 + rand() * 0.02
    }
    return { position, seed }
  }, [])

  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uScale: { value: 400 }, uColor: { value: new Color(palette.ghost) } }),
    [],
  )

  useFrame((state) => {
    const u = material.current?.uniforms
    if (!u) return
    u.uTime.value = state.clock.elapsedTime
    u.uScale.value = state.size.height * state.viewport.dpr * 0.5
  })

  return (
    <points frustumCulled={false} renderOrder={3}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.position, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[data.seed, 4]} />
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
