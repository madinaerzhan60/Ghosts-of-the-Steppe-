import { useMemo } from 'react'
import { BufferGeometry, Color, DoubleSide, Float32BufferAttribute, MathUtils } from 'three'
import { palette } from '../theme/palette'
import { seededRandom } from '../utils/random'

// Distant, layered low-poly ridges around the horizon (camera-relative, inside SkyDome).
// Far layers are paler and lower-contrast, fading into the haze.
// Silhouettes are darker than the faint horizon glow behind them; nearer = darker.
const LAYERS = [
  { radius: 55, minDeg: 1.5, maxDeg: 8.5, fogMix: 0.075, seed: 11, segments: 110 },
  { radius: 50, minDeg: 0.9, maxDeg: 5.8, fogMix: 0.045, seed: 23, segments: 90 },
  { radius: 45, minDeg: 0.4, maxDeg: 3.4, fogMix: 0.018, seed: 37, segments: 70 },
]
/** Faint glow along the horizon, behind every ridge. */
const GLOW = { radius: 58, height: 9 }
const SPAN = MathUtils.degToRad(115) // each side of straight ahead (-z)
const BASE = -1.4 // just below the horizon line: the feet sink into the haze

const vertexShader = /* glsl */ `
  attribute float aT; // 0 at the base, 1 on the ridge
  varying float vT;
  void main() {
    vT = aT;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uHaze;
  varying float vT;
  void main() {
    // The foot of every ridge dissolves into the haze.
    float k = smoothstep(0.35, 1.0, clamp(vT, 0.0, 1.0));
    gl_FragColor = vec4(clamp(mix(uHaze, uColor, k), 0.0, 1.0), 1.0);
  }
`

// Horizon glow band behind the ridges.
const hazeFragment = /* glsl */ `
  uniform vec3 uHaze;
  varying float vT;
  void main() {
    float t = clamp(vT, 0.0, 1.0);
    float a = clamp(smoothstep(0.0, 0.2, t) * (1.0 - smoothstep(0.2, 1.0, t)) * 0.4, 0.0, 1.0);
    if (a < 0.003) discard;
    gl_FragColor = vec4(clamp(uHaze, 0.0, 1.0), a);
  }
`

function ridgeGeometry(radius: number, minDeg: number, maxDeg: number, seed: number, segments: number) {
  const rand = seededRandom(seed)
  const pos: number[] = []
  const t: number[] = []
  const index: number[] = []
  // A few broad peaks plus jagged detail; sharp corners keep it low-poly.
  const peaks = Array.from({ length: 9 }, () => ({ at: rand() * 2 - 1, w: 0.03 + rand() * 0.12, h: 0.35 + 0.65 * rand() }))
  for (let i = 0; i <= segments; i++) {
    const u = (i / segments) * 2 - 1 // -1 .. 1
    const a = u * SPAN
    // Jagged detail on top of a few broad peaks; squared so the peaks stand out.
    let e = 0.1 + 0.22 * rand()
    // Triangular (not round) peaks: sharp crests read as old, worn rock.
    for (const p of peaks) e += p.h * Math.max(0, 1 - Math.abs((u - p.at) / p.w))
    e = Math.min(1, e / 1.25) ** 1.6
    const deg = minDeg + (maxDeg - minDeg) * e
    const top = Math.tan(MathUtils.degToRad(deg)) * radius
    const x = Math.sin(a) * radius
    const z = -Math.cos(a) * radius
    pos.push(x, BASE, z, x, top, z)
    t.push(0, 1)
    if (i > 0) {
      const b = (i - 1) * 2
      index.push(b, b + 2, b + 1, b + 1, b + 2, b + 3)
    }
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setAttribute('aT', new Float32BufferAttribute(t, 1))
  g.setIndex(index)
  return g
}

function hazeGeometry(radius: number, height: number) {
  const pos: number[] = []
  const t: number[] = []
  const index: number[] = []
  const n = 40
  for (let i = 0; i <= n; i++) {
    const a = ((i / n) * 2 - 1) * SPAN
    const x = Math.sin(a) * radius
    const z = -Math.cos(a) * radius
    pos.push(x, BASE, z, x, height, z)
    t.push(0, 1)
    if (i > 0) {
      const b = (i - 1) * 2
      index.push(b, b + 2, b + 1, b + 1, b + 2, b + 3)
    }
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setAttribute('aT', new Float32BufferAttribute(t, 1))
  g.setIndex(index)
  return g
}

/** Distant mountain silhouettes on the horizon, layered and fading into fog. */
export function Mountains() {
  const data = useMemo(() => {
    const bg = new Color(palette.background)
    const fog = new Color(palette.fog)
    const haze = bg.clone().lerp(fog, 0.06)
    const glow = bg.clone().lerp(fog, 0.16)
    return {
      layers: LAYERS.map((l) => ({
        key: l.seed,
        geometry: ridgeGeometry(l.radius, l.minDeg, l.maxDeg, l.seed, l.segments),
        uniforms: { uColor: { value: bg.clone().lerp(fog, l.fogMix) }, uHaze: { value: haze } },
      })),
      haze: { geometry: hazeGeometry(GLOW.radius, GLOW.height), uniforms: { uHaze: { value: glow } } },
    }
  }, [])

  return (
    <group>
      {data.layers.map((l) => (
        <mesh key={l.key} geometry={l.geometry} frustumCulled={false} renderOrder={-0.9}>
          <shaderMaterial
            uniforms={l.uniforms}
            vertexShader={vertexShader}
            fragmentShader={fragmentShader}
            side={DoubleSide}
            fog={false}
          />
        </mesh>
      ))}
      <mesh geometry={data.haze.geometry} frustumCulled={false} renderOrder={-0.95}>
        <shaderMaterial
          uniforms={data.haze.uniforms}
          vertexShader={vertexShader}
          fragmentShader={hazeFragment}
          side={DoubleSide}
          transparent
          depthWrite={false}
          fog={false}
        />
      </mesh>
    </group>
  )
}
