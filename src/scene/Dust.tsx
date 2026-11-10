import { useFrame, useThree } from '@react-three/fiber'
import { useMemo } from 'react'
import { AdditiveBlending, Color, ShaderMaterial } from 'three'
import { palette } from '../theme/palette'
import { LAMP } from './layout'

type Props = {
  count: number
  /** Seed so each case gets different dust. */
  seed: number
}

const vertexShader = /* glsl */ `
  attribute vec4 aSeed; // x: angle, y: radius fraction, z: phase, w: speed
  uniform float uTime;
  uniform float uTop;
  uniform float uBottom;
  uniform float uTanA;
  uniform float uSize;
  varying float vAlpha;
  void main() {
    float h = max(uTop - uBottom, 1e-3);                  // never divide by zero
    float travel = mod(aSeed.z * h + uTime * aSeed.w, h); // slow fall, wraps
    float f = clamp(travel / h, 0.0, 1.0);
    float y = uTop - travel;
    float r = max(uTanA * (uTop - y) * aSeed.y * 0.9, 0.0);         // stays inside the cone
    float a = aSeed.x + uTime * aSeed.w * 3.0;
    vec3 p = vec3(
      cos(a) * r + sin(uTime * 0.25 + aSeed.z * 20.0) * 0.02,
      y,
      sin(a) * r + cos(uTime * 0.21 + aSeed.x * 7.0) * 0.02
    );
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(uSize / max(0.1, -mv.z), 0.0, 64.0);
    // Fade in at the lamp, out at the bottom: never pops.
    vAlpha = clamp(smoothstep(0.0, 0.12, f) * (1.0 - smoothstep(0.8, 1.0, f)), 0.0, 1.0);
  }
`

// NaN-safe: no normalize, guarded divisions, outputs clamped to [0, 1].
const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float soft = 1.0 - smoothstep(0.1, 0.5, d);
    gl_FragColor = vec4(clamp(uColor, 0.0, 1.0), clamp(soft * vAlpha * 0.55, 0.0, 1.0));
  }
`

// Small deterministic PRNG so rendering stays pure.
function mulberry32(seed: number) {
  let a = Math.floor(seed * 1000) >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Tiny dust specks drifting slowly inside a lamp's light cone. Animated on the GPU. */
export function Dust({ count, seed }: Props) {
  const dpr = useThree((s) => s.viewport.dpr)

  const { positions, seeds } = useMemo(() => {
    const rand = mulberry32(seed)
    const seeds = new Float32Array(count * 4)
    for (let i = 0; i < count; i++) {
      seeds[i * 4] = rand() * Math.PI * 2
      seeds[i * 4 + 1] = Math.sqrt(rand()) // uniform over the disc
      seeds[i * 4 + 2] = rand()
      seeds[i * 4 + 3] = 0.02 + rand() * 0.05 // m/s
    }
    return { positions: new Float32Array(count * 3), seeds }
  }, [count, seed])

  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uTop: { value: LAMP.y },
          uBottom: { value: LAMP.coneBottomY },
          uTanA: { value: Math.tan(LAMP.angle) },
          uSize: { value: 5 * dpr },
          uColor: { value: new Color(palette.lamp) },
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        fog: false,
      }),
    [dpr],
  )

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.elapsedTime
  })

  return (
    <points frustumCulled={false} material={material}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 4]} />
      </bufferGeometry>
    </points>
  )
}
