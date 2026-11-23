import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, Color, type ShaderMaterial } from 'three'
import { IBEX_COUNT, IBEX_POINTS_EACH, REDUCED_MOTION } from '../config/quality'
import { palette } from '../theme/palette'
import { seededRandom } from '../utils/random'
import { roomLive } from './roomLive'
import { LAYOUT, surfaceY } from './slopeShape'

const vertexShader = /* glsl */ `
  attribute vec3 aSeed; // x animal rank (0..1), y phase, z size
  uniform float uTime;
  uniform float uIbex;
  uniform float uScale;
  uniform float uMove;
  varying float vAlpha;
  void main() {
    // Grazing: the head end of the little cluster dips slowly now and then.
    vec3 p = position;
    p.y -= uMove * 0.05 * (0.5 + 0.5 * sin(uTime * 0.35 + aSeed.y * 40.0));
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float depth = max(-mv.z, 0.05);
    gl_PointSize = clamp(aSeed.z * uScale / depth, 1.2, 7.0);
    // Animals fade in one by one as the value rises, and out again as it falls.
    float reach = uIbex * 1.1; // a little over 1, so the full herd is fully lit
    float on = 1.0 - smoothstep(reach - 0.1, reach, aSeed.x);
    vAlpha = on * 0.5;
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    float r = length(gl_PointCoord - vec2(0.5));
    float a = (1.0 - smoothstep(0.0, 0.5, r)) * vAlpha;
    if (a < 0.003) discard;
    gl_FragColor = vec4(uColor, a);
  }
`

/** Ibex higher up the slope: small, faint amber dots that appear and vanish with the ibex value. */
export function IbexHerd() {
  const material = useRef<ShaderMaterial>(null)

  const data = useMemo(() => {
    const rand = seededRandom(8)
    const per = IBEX_POINTS_EACH
    const n = IBEX_COUNT * per
    const position = new Float32Array(n * 3)
    const seed = new Float32Array(n * 3)
    const { ibexNear, ibexFar } = LAYOUT
    for (let a = 0; a < IBEX_COUNT; a++) {
      // Spread by a golden-ratio step so every herd size looks evenly scattered.
      const rank = (a + 0.5) / IBEX_COUNT
      const t = (a * 0.618034) % 1
      const z = ibexNear + (ibexFar - ibexNear) * t + (rand() - 0.5) * 1.5
      const x = (rand() * 2 - 1) * (7 + (ibexNear - z) * 0.35)
      for (let k = 0; k < per; k++) {
        const px = x + (rand() - 0.5) * 0.7 // body about 0.7 m long, small and low
        const pz = z + (rand() - 0.5) * 0.25
        const py = surfaceY(px, pz) + 0.25 + rand() * 0.35
        const i = a * per + k
        position.set([px, py, pz], i * 3)
        seed.set([rank, rand(), 0.045 + rand() * 0.03], i * 3)
      }
    }
    return { position, seed }
  }, [])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIbex: { value: 0.5 },
      uScale: { value: 500 },
      uMove: { value: REDUCED_MOTION ? 0 : 1 },
      uColor: { value: new Color(palette.ghost) },
    }),
    [],
  )

  useFrame(({ clock, size }) => {
    const u = material.current?.uniforms
    if (!u) return
    u.uTime.value = clock.elapsedTime
    u.uIbex.value = roomLive.ibex
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
