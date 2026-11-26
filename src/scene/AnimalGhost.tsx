import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, BufferGeometry, Color, Float32BufferAttribute, Sphere, Vector3, type ShaderMaterial } from 'three'
import { caseProgress } from '../awaken/caseProgress'
import { REDUCED_MOTION } from '../config/quality'
import { palette } from '../theme/palette'
import { seededRandom } from '../utils/random'
import { hallGhostFragment, hallGhostVertex } from './hallGhostShaders'

type Props = {
  caseId: string
  /** Points on the statue's surface (x, y, z per point), in the statue's own space. */
  samples: Float32Array
  /** The animal's glow color (from animals.json). */
  color: string
}

/** How far the broken statue's particles drift outward, metres. */
const SPREAD = 0.55

/** Builds the particle geometry: the surface points, plus a outward direction and a seed for each. */
function buildGeometry(samples: Float32Array, seed: number): BufferGeometry {
  const rand = seededRandom(seed)
  const n = samples.length / 3
  const center = new Vector3()
  for (let i = 0; i < n; i++) center.add(new Vector3(samples[i * 3], samples[i * 3 + 1], samples[i * 3 + 2]))
  if (n > 0) center.divideScalar(n)

  const dirs = new Float32Array(n * 3)
  const seeds = new Float32Array(n * 4)
  const d = new Vector3()
  for (let i = 0; i < n; i++) {
    d.set(samples[i * 3]! - center.x, samples[i * 3 + 1]! - center.y, samples[i * 3 + 2]! - center.z)
    // Outward from the middle, with some scatter and a lift; never a zero-length vector.
    d.add(new Vector3(rand() - 0.5, rand() - 0.3, rand() - 0.5).multiplyScalar(0.5))
    d.y += 0.15
    if (d.lengthSq() < 1e-6) d.set(0, 1, 0)
    d.normalize()
    dirs.set([d.x, d.y, d.z], i * 3)
    seeds.set([rand(), 0.009 + rand() * 0.007, rand(), rand()], i * 4)
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(samples, 3))
  g.setAttribute('aDir', new Float32BufferAttribute(dirs, 3))
  g.setAttribute('aSeed', new Float32BufferAttribute(seeds, 4))
  // Generous bounds: the particles drift away from the statue.
  g.boundingSphere = new Sphere(center, 2)
  return g
}

/**
 * The animal as particles: breaks out of the stone, drifts, then gathers back into a
 * glowing ghost in its own color that breathes slowly. Reads its progress from the
 * awakening store, so it works the same for every case.
 */
export function AnimalGhost({ caseId, samples, color }: Props) {
  const material = useRef<ShaderMaterial>(null)
  const geometry = useMemo(() => buildGeometry(samples, caseId.length * 7919 + samples.length), [samples, caseId])
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uShatter: { value: 0 },
      uGather: { value: 0 },
      uSpread: { value: SPREAD },
      uScale: { value: 500 },
      uBreathe: { value: REDUCED_MOTION ? 0 : 1 },
      uStone: { value: new Color(palette.stone) },
      uGlow: { value: new Color(color) },
    }),
    [color],
  )

  useFrame(({ clock, size }) => {
    const u = material.current?.uniforms
    if (!u) return
    const p = caseProgress(caseId)
    u.uTime.value = clock.elapsedTime
    u.uShatter.value = p.shatter
    u.uGather.value = p.gather
    u.uScale.value = size.height * 0.62
  })

  return (
    <points geometry={geometry}>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={hallGhostVertex}
        fragmentShader={hallGhostFragment}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        fog={false}
      />
    </points>
  )
}
