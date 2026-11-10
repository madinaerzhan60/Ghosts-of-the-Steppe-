import { useFrame } from '@react-three/fiber'
import { use, useMemo, useRef, type RefObject } from 'react'
import { AdditiveBlending, Color, type ShaderMaterial, type Vector3 } from 'three'
import { TITLE_POINTS } from '../config/quality'
import { palette } from '../theme/palette'
import { seededRandom } from '../utils/random'
import { FONT, loadOpeningFonts } from './fonts'
import { GROUND_Y } from './openingLayout'
import { drawTextCanvas } from './textCanvas'

type Props = {
  text: string
  position: Vector3
  /** World width of the title, metres. */
  width: number
  /** Written every frame by the opening timeline. */
  timeline: RefObject<TitleTimeline>
}

export type TitleTimeline = {
  /** 0..1: particles rise out of the low fog and gather into the letters. */
  gather: number
  /** 0..1: the letters slowly dissolve back into the air. */
  dissolve: number
}

const vertexShader = /* glsl */ `
  attribute vec3 aStart;
  attribute float aRand;
  uniform float uTime;
  uniform float uGather;
  uniform float uDissolve;
  uniform float uSize;
  uniform float uScale;
  varying float vAlpha;

  void main() {
    float delay = aRand * 0.45;
    float g = smoothstep(delay, delay + 0.55, clamp(uGather, 0.0, 1.0));
    float ph = aRand * 37.0;
    // Before gathering: drift slowly inside the ground fog.
    vec3 drift = aStart + 0.25 * vec3(sin(uTime * 0.21 + ph), 0.3 * sin(uTime * 0.17 + ph * 1.3), cos(uTime * 0.19 + ph));
    vec3 p = mix(drift, position, g);
    p.y += sin(g * 3.14159) * 0.35 * (aRand - 0.3); // a soft swirl on the way up
    // Dissolve: drift up and apart while fading.
    float d = clamp(uDissolve, 0.0, 1.0);
    p += d * vec3(0.4 * sin(ph), 0.5 + 0.6 * aRand, 0.3 * cos(ph));
    // Breathing shimmer.
    p += 0.004 * vec3(sin(uTime * 1.7 + ph), sin(uTime * 2.1 + ph), 0.0);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(uSize * (0.7 + 0.6 * aRand) * uScale / max(-mv.z, 0.05), 0.0, 24.0);
    float twinkle = 0.8 + 0.2 * sin(uTime * 2.4 + ph);
    vAlpha = clamp((0.06 + 0.5 * g) * twinkle * (1.0 - d), 0.0, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    float r = length(gl_PointCoord - vec2(0.5));
    float a = clamp((1.0 - smoothstep(0.1, 0.5, r)) * vAlpha, 0.0, 1.0);
    if (a < 0.003) discard;
    gl_FragColor = vec4(clamp(uColor, 0.0, 1.0), a);
  }
`

/** Glowing title made of particles that gather out of the fog, then dissolve. */
export function TitleParticles({ text, position, width, timeline }: Props) {
  use(loadOpeningFonts())
  const material = useRef<ShaderMaterial>(null)

  const data = useMemo(() => {
    const { canvas } = drawTextCanvas(text, FONT.title, 180)
    const ctx = canvas.getContext('2d')!
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    const scale = width / canvas.width
    // Candidate pixels on a fine grid inside the letters.
    const cand: number[] = []
    const step = 2
    for (let y = 0; y < canvas.height; y += step) {
      for (let x = 0; x < canvas.width; x += step) {
        if (img[(y * canvas.width + x) * 4 + 3] > 140) cand.push(x, y)
      }
    }
    const rand = seededRandom(31)
    const total = cand.length / 2
    const n = Math.min(TITLE_POINTS, total)
    const target = new Float32Array(n * 3)
    const start = new Float32Array(n * 3)
    const rnd = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      const k = Math.floor(rand() * total)
      const px = cand[k * 2] + rand() * step
      const py = cand[k * 2 + 1] + rand() * step
      target[i * 3] = (px - canvas.width / 2) * scale
      target[i * 3 + 1] = (canvas.height / 2 - py) * scale
      target[i * 3 + 2] = (rand() - 0.5) * 0.04
      // Start low, in the ground fog, spread wide (local coords: title origin).
      start[i * 3] = target[i * 3] * 1.8 + (rand() - 0.5) * 6
      start[i * 3 + 1] = GROUND_Y + 0.1 + rand() * 0.6 - position.y
      start[i * 3 + 2] = (rand() - 0.5) * 8
      rnd[i] = rand()
    }
    return { target, start, rnd }
  }, [text, width, position])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uGather: { value: 0 },
      uDissolve: { value: 0 },
      uSize: { value: 0.028 },
      uScale: { value: 400 },
      uColor: { value: new Color(palette.fog) },
    }),
    [],
  )

  useFrame((state) => {
    const u = material.current?.uniforms
    if (!u) return
    u.uTime.value = state.clock.elapsedTime
    u.uGather.value = timeline.current.gather
    u.uDissolve.value = timeline.current.dissolve
    u.uScale.value = state.size.height * state.viewport.dpr * 0.5
  })

  return (
    <points position={position} frustumCulled={false} renderOrder={4}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.target, 3]} />
        <bufferAttribute attach="attributes-aStart" args={[data.start, 3]} />
        <bufferAttribute attach="attributes-aRand" args={[data.rnd, 1]} />
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
