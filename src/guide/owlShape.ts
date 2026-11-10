// Procedural owl: points sampled from the surfaces of simple shapes.
// Local space: origin at the body centre, +y up, +z = the direction Üki faces.
// Units are metres (about 0.6 m from tail to ear tips).

/** Part ids stored per point (float attribute `aPart`). */
export const PART = { body: 0, head: 1, eye: 2, wing: 3, tail: 4 } as const

/** Fixed anatomy, shared with the shader as uniforms. */
export const OWL = {
  body: { radii: [0.13, 0.17, 0.11] as const },
  head: { center: [0, 0.22, 0.01] as const, radii: [0.115, 0.1, 0.1] as const },
  /** Neck pivot for head tilts. */
  neck: [0, 0.13, 0] as const,
  ear: { base: [0.07, 0.3, 0] as const, height: 0.085, radius: 0.026, outward: 0.35 },
  /** Right eye (left eye is mirrored in x). */
  eye: { center: [0.048, 0.232, 0.1] as const, radius: 0.036 },
  /** Right shoulder (left is mirrored in x). Wings rotate around the z axis here. */
  shoulder: [0.11, 0.08, -0.01] as const,
  wing: { length: 0.26, from: -1.75, to: -0.35 },
  tail: { root: [0, -0.15, -0.07] as const, length: 0.09 },
} as const

/** Share of points per part. Eyes are dense so they read as two bright lamps. */
const SHARE = { body: 0.3, head: 0.22, ears: 0.05, eyes: 0.14, wings: 0.24, tail: 0.05 }

export type OwlPoints = {
  count: number
  /** Rest pose (vec3). */
  position: Float32Array
  /** Where each point starts before the gather (vec3). Eyes start in place. */
  scatter: Float32Array
  /** PART id. */
  part: Float32Array
  /** -1 left, +1 right, 0 centre. */
  side: Float32Array
  /** 0..1 per-point random (gather delay, size, twinkle). */
  rand: Float32Array
}

// Deterministic PRNG so Üki looks the same on every load (and render stays pure).
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function buildOwlPoints(total: number, seed = 7): OwlPoints {
  const rand = mulberry32(seed)
  const position = new Float32Array(total * 3)
  const scatter = new Float32Array(total * 3)
  const part = new Float32Array(total)
  const side = new Float32Array(total)
  const rnd = new Float32Array(total)
  let i = 0

  const push = (x: number, y: number, z: number, p: number, s: number) => {
    if (i >= total) return
    position[i * 3] = x
    position[i * 3 + 1] = y
    position[i * 3 + 2] = z
    part[i] = p
    side[i] = s
    rnd[i] = rand()
    if (p === PART.eye) {
      scatter[i * 3] = x
      scatter[i * 3 + 1] = y
      scatter[i * 3 + 2] = z
    } else {
      // Loose cloud around Üki; the shader drifts these until they gather.
      const r = 0.35 + 0.65 * Math.cbrt(rand())
      const [dx, dy, dz] = unitVector(rand)
      scatter[i * 3] = dx * r
      scatter[i * 3 + 1] = 0.1 + dy * r * 0.8
      scatter[i * 3 + 2] = dz * r
    }
    i++
  }

  const n = (share: number) => Math.round(total * share)

  // Body: ellipsoid surface
  const [bx, by, bz] = OWL.body.radii
  for (let k = 0, m = n(SHARE.body); k < m; k++) {
    const [x, y, z] = unitVector(rand)
    push(x * bx, y * by, z * bz, PART.body, 0)
  }

  // Head: slightly wide sphere
  const [hcx, hcy, hcz] = OWL.head.center
  const [hx, hy, hz] = OWL.head.radii
  for (let k = 0, m = n(SHARE.head); k < m; k++) {
    const [x, y, z] = unitVector(rand)
    push(hcx + x * hx, hcy + y * hy, hcz + z * hz, PART.head, 0)
  }

  // Ear tufts: two pointed cones leaning outward
  for (let k = 0, m = n(SHARE.ears); k < m; k++) {
    const s = k % 2 === 0 ? 1 : -1
    const h = 1 - Math.sqrt(rand()) // area-weighted: more points near the base
    const a = rand() * Math.PI * 2
    const r = OWL.ear.radius * (1 - h)
    // Cone along +y, then lean outward around z
    const lx = Math.cos(a) * r
    const ly = h * OWL.ear.height
    const lz = Math.sin(a) * r * 0.7
    const lean = OWL.ear.outward * s
    const x = lx * Math.cos(lean) + ly * Math.sin(lean)
    const y = -lx * Math.sin(lean) + ly * Math.cos(lean)
    push(OWL.ear.base[0] * s + x, OWL.ear.base[1] + y, OWL.ear.base[2] + lz, PART.head, 0)
  }

  // Eyes: two large discs on the face, denser rim, a small dark pupil gap
  const [ex, ey, ez] = OWL.eye.center
  for (let k = 0, m = n(SHARE.eyes); k < m; k++) {
    const s = k % 2 === 0 ? 1 : -1
    const ring = rand() < 0.45
    const rr = ring ? 0.85 + 0.15 * rand() : 0.32 + 0.68 * Math.sqrt(rand())
    const a = rand() * Math.PI * 2
    const r = rr * OWL.eye.radius
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r
    // Follow the curve of the face a little
    const z = ez - (x * x + y * y) * 3
    push(ex * s + x, ey + y, z, PART.eye, s)
  }

  // Wings: flat, slightly curved fans hanging from the shoulders, scalloped edge
  const [sx, sy, sz] = OWL.shoulder
  const { length, from, to } = OWL.wing
  for (let k = 0, m = n(SHARE.wings); k < m; k++) {
    const s = k % 2 === 0 ? 1 : -1
    const phi = from + (to - from) * rand()
    const edge = length * (0.8 + 0.2 * Math.abs(Math.sin(phi * 9)))
    const rho = edge * Math.sqrt(rand())
    const f = rho / length
    const x = Math.cos(phi) * rho
    const y = Math.sin(phi) * rho
    const z = -0.06 * f * f - 0.015 * Math.sin(phi * 9) * f // curved back, feather ripple
    push(s * (sx + 0.02 + x), sy + y, sz + z, PART.wing, s)
  }

  // Tail: small fan pointing down and back
  const [tx, ty, tz] = OWL.tail.root
  while (i < total) {
    const phi = -2.1 + 1.05 * rand()
    const rho = OWL.tail.length * Math.sqrt(rand())
    push(tx + Math.cos(phi) * rho, ty + Math.sin(phi) * rho, tz - rho * 0.5, PART.tail, 0)
  }

  return { count: total, position, scatter, part, side, rand: rnd }
}

/** Uniform random direction (never the zero vector). */
function unitVector(rand: () => number): [number, number, number] {
  const z = rand() * 2 - 1
  const a = rand() * Math.PI * 2
  const r = Math.sqrt(Math.max(0, 1 - z * z))
  return [Math.cos(a) * r, z, Math.sin(a) * r]
}
