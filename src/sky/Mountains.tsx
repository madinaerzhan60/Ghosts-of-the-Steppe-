import { useMemo } from 'react'
import { BufferGeometry, Color, DoubleSide, Float32BufferAttribute, MathUtils } from 'three'
import { palette } from '../theme/palette'
import { seededRandom } from '../utils/random'

// Distant, layered blue ridges around the horizon (camera-relative, inside SkyDome).
// Four layers: the farthest are tallest, paler and lost in teal mist; the nearest are
// deepest blue. Snow caps catch the moonlight, and every ridge has a thin moonlit rim.
// `shade` blends the ridge colour from near (0) to far (1); `mist` is how much teal haze
// covers it.
const LAYERS = [
  { radius: 56, minDeg: 1.8, maxDeg: 10, shade: 1, mist: 0.42, snow: 1, seed: 11, segments: 110 },
  { radius: 52, minDeg: 1.2, maxDeg: 7.2, shade: 0.7, mist: 0.28, snow: 0.8, seed: 23, segments: 100 },
  { radius: 48, minDeg: 0.7, maxDeg: 5, shade: 0.35, mist: 0.16, snow: 0.55, seed: 37, segments: 80 },
  { radius: 44, minDeg: 0.3, maxDeg: 3.2, shade: 0, mist: 0.06, snow: 0.3, seed: 41, segments: 70 },
]
/** Soft teal glow along the horizon, behind every ridge. */
const GLOW = { radius: 58, height: 12 }
const SPAN = MathUtils.degToRad(115) // each side of straight ahead (-z)
const BASE = -1.4 // just below the horizon line: the feet sink into the mist

const vertexShader = /* glsl */ `
  attribute float aT; // 0 at the base, 1 on the ridge
  attribute float aE; // how high this part of the ridge is, 0..1 (peaks are high)
  varying float vT;
  varying float vE;
  void main() {
    vT = aT;
    vE = aE;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uMist;
  uniform vec3 uSnow;
  uniform vec3 uRim;
  uniform float uSnowAmount;
  varying float vT;
  varying float vE;
  void main() {
    float t = clamp(vT, 0.0, 1.0);
    float e = clamp(vE, 0.0, 1.0);
    // Slightly lighter toward the crest, as if the moon touched the slope.
    vec3 col = mix(uColor, uColor * 1.35, smoothstep(0.4, 1.0, t));
    // Snow: a band under each crest, thicker on the high peaks.
    float band = 0.03 + 0.16 * e;
    float snow = smoothstep(1.0 - band, 1.0 - band * 0.35, t) * smoothstep(0.45, 0.8, e) * uSnowAmount;
    col = mix(col, uSnow, snow);
    // Thin moonlit rim along the very top.
    col = mix(col, uRim, smoothstep(0.965, 1.0, t) * 0.45);
    // The foot of every ridge dissolves into teal mist.
    col = mix(uMist, col, smoothstep(0.1, 0.8, t));
    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
  }
`

// Horizon glow band behind the ridges.
const hazeFragment = /* glsl */ `
  uniform vec3 uHaze;
  varying float vT;
  void main() {
    float t = clamp(vT, 0.0, 1.0);
    float a = clamp(smoothstep(0.0, 0.2, t) * (1.0 - smoothstep(0.2, 1.0, t)) * 0.7, 0.0, 1.0);
    if (a < 0.003) discard;
    gl_FragColor = vec4(clamp(uHaze, 0.0, 1.0), a);
  }
`

function ridgeGeometry(radius: number, minDeg: number, maxDeg: number, seed: number, segments: number) {
  const rand = seededRandom(seed)
  const pos: number[] = []
  const t: number[] = []
  const ev: number[] = []
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
    ev.push(e, e)
    if (i > 0) {
      const b = (i - 1) * 2
      index.push(b, b + 2, b + 1, b + 1, b + 2, b + 3)
    }
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setAttribute('aT', new Float32BufferAttribute(t, 1))
  g.setAttribute('aE', new Float32BufferAttribute(ev, 1))
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
  g.setAttribute('aE', new Float32BufferAttribute(t.map(() => 0), 1))
  g.setIndex(index)
  return g
}

/** Distant mountain silhouettes on the horizon, layered and fading into fog. */
export function Mountains() {
  const data = useMemo(() => {
    const near = new Color(palette.ridgeNear)
    const far = new Color(palette.ridgeFar)
    const mist = new Color(palette.skyHorizon).lerp(new Color(palette.fog), 0.5)
    const glow = new Color(palette.skyHorizon).lerp(new Color(palette.fog), 0.35)
    return {
      layers: LAYERS.map((l) => ({
        key: l.seed,
        geometry: ridgeGeometry(l.radius, l.minDeg, l.maxDeg, l.seed, l.segments),
        uniforms: {
          // Nearer = deeper blue; farther = paler blue, with more teal mist over it.
          uColor: { value: near.clone().lerp(far, l.shade).lerp(mist, l.mist) },
          uMist: { value: mist },
          uSnow: { value: new Color(palette.snow) },
          uRim: { value: new Color(palette.moon) },
          uSnowAmount: { value: l.snow },
        },
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
