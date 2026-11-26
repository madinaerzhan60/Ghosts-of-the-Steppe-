import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, Color, type ShaderMaterial } from 'three'
import { CITY_LIGHTS, REDUCED_MOTION } from '../config/quality'
import { palette } from '../theme/palette'
import { seededRandom } from '../utils/random'
import { roomLive } from './roomLive'
import { LAYOUT, surfaceY } from './slopeShape'

/** Even with the city pushed back, this share of the lights stays in the valley. */
const MIN_REACH = 0.2

const vertexShader = /* glsl */ `
  attribute vec3 aSeed; // x rank (0 = lowest in the valley), y phase, z size
  uniform float uTime;
  uniform float uCity;
  uniform float uScale;
  uniform float uTwinkle;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float depth = max(-mv.z, 0.05);
    gl_PointSize = clamp(aSeed.z * uScale / depth, 1.5, 9.0);
    // A light is on while the city reaches past its rank; the edge fades over a soft band.
    float reach = ${MIN_REACH.toFixed(2)} + (1.1 - ${MIN_REACH.toFixed(2)}) * uCity;
    float on = 1.0 - smoothstep(reach - 0.08, reach, aSeed.x);
    float tw = 1.0 - uTwinkle * 0.25 * (0.5 + 0.5 * sin(uTime * (0.5 + aSeed.y) + aSeed.y * 40.0));
    vAlpha = on * tw * 0.9;
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    float r = length(gl_PointCoord - vec2(0.5));
    float a = (1.0 - smoothstep(0.0, 0.5, r)) * vAlpha;
    if (a < 0.003) discard;
    gl_FragColor = vec4(uColor * 1.5, a);
  }
`

/** City lights at the foot of the slope. They creep uphill as the city grows. */
export function CityLights() {
  const material = useRef<ShaderMaterial>(null)

  const data = useMemo(() => {
    const rand = seededRandom(31)
    const n = CITY_LIGHTS
    const position = new Float32Array(n * 3)
    const seed = new Float32Array(n * 3)
    const { cityBottom, citySpan } = LAYOUT
    for (let i = 0; i < n; i++) {
      const rank = rand()
      // The city thins out toward the top: more lights near the bottom.
      const z = cityBottom - Math.pow(rank, 1.25) * citySpan + (rand() - 0.5) * 0.6
      // Wider at the bottom, narrowing as it climbs; streets cluster along a few lines.
      const spread = 11 - rank * 4
      const lane = Math.round((rand() * 2 - 1) * 9) / 9
      const x = lane * spread * 0.85 + (rand() - 0.5) * 0.9
      position.set([x, surfaceY(x, z) + 0.12, z], i * 3)
      seed.set([rank, rand(), 0.07 + rand() * 0.06], i * 3)
    }
    return { position, seed }
  }, [])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uCity: { value: 0.5 },
      uScale: { value: 500 },
      uTwinkle: { value: REDUCED_MOTION ? 0 : 1 },
      uColor: { value: new Color(palette.city) },
    }),
    [],
  )

  useFrame(({ clock, size }) => {
    const u = material.current?.uniforms
    if (!u) return
    u.uTime.value = clock.elapsedTime
    u.uCity.value = roomLive.city
    u.uScale.value = size.height * 0.62
  })

  return (
    <points frustumCulled={false}>
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
