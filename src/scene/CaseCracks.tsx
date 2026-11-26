import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, BufferGeometry, Color, Float32BufferAttribute, type ShaderMaterial } from 'three'
import { caseProgress } from '../awaken/caseProgress'
import { animalColor } from '../content/animalColor'
import { CRACK_BRANCHES } from '../config/quality'
import { seededRandom } from '../utils/random'

type Props = {
  caseId: string
  /** Animal id in animals.json: the cracks glow in its color. */
  animal: string
  width: number
  height: number
}

const vertexShader = /* glsl */ `
  attribute float aReach; // 0 at the point of impact .. 1 at the tip of the crack
  uniform float uSpread;
  varying float vAlpha;
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    // The crack grows outward from the impact; its tip is brightest.
    float grown = 1.0 - smoothstep(uSpread - 0.15, uSpread, aReach);
    float tip = exp(-abs(uSpread - aReach) * 9.0);
    vAlpha = clamp(grown * (0.55 + 0.45 * tip), 0.0, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uFade;
  varying float vAlpha;
  void main() {
    float a = clamp(vAlpha * uFade, 0.0, 1.0);
    if (a < 0.003) discard;
    gl_FragColor = vec4(clamp(uColor * 1.6, 0.0, 4.0), a);
  }
`

/** Thin crack lines on the four sides of the glass: radial from an impact point, with a few branches. */
function buildCracks(width: number, height: number, seed: number): BufferGeometry {
  const rand = seededRandom(seed)
  const pos: number[] = []
  const reach: number[] = []
  const half = width / 2 + 0.003 // just outside the glass, so the lines never z-fight with it

  // Each of the 4 side faces: a point on the face, mapped to 3D by (u, v) -> world.
  const faces: ((u: number, v: number) => [number, number, number])[] = [
    (u, v) => [u, v, half],
    (u, v) => [u, v, -half],
    (u, v) => [half, v, u],
    (u, v) => [-half, v, u],
  ]
  for (const face of faces) {
    const cx = (rand() - 0.5) * width * 0.5
    const cy = (rand() - 0.35) * height * 0.5
    const maxLen = Math.hypot(width, height) * 0.55
    for (let b = 0; b < CRACK_BRANCHES; b++) {
      let a = (b / CRACK_BRANCHES) * Math.PI * 2 + (rand() - 0.5) * 0.7
      let x = cx
      let y = cy
      let len = 0
      const steps = 4 + Math.floor(rand() * 4)
      for (let s = 0; s < steps; s++) {
        const step = (0.05 + rand() * 0.09) * Math.max(width, height)
        a += (rand() - 0.5) * 0.9 // the crack wanders
        const nx = x + Math.cos(a) * step
        const ny = y + Math.sin(a) * step
        // Stop at the edge of the pane.
        if (Math.abs(nx) > width / 2 || Math.abs(ny) > height / 2) break
        const l0 = len / maxLen
        len += step
        const l1 = Math.min(1, len / maxLen)
        pos.push(...face(x, y), ...face(nx, ny))
        reach.push(l0, l1)
        x = nx
        y = ny
      }
    }
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setAttribute('aReach', new Float32BufferAttribute(reach, 1))
  return g
}

/** Glowing cracks that spread over the glass (step 2 of the awakening), then fade with it. */
export function CaseCracks({ caseId, animal, width, height }: Props) {
  const material = useRef<ShaderMaterial>(null)
  const geometry = useMemo(() => buildCracks(width, height, caseId.length * 101 + 9), [width, height, caseId])
  const uniforms = useMemo(
    () => ({ uSpread: { value: 0 }, uFade: { value: 1 }, uColor: { value: new Color(animalColor(animal)) } }),
    [animal],
  )

  useFrame(() => {
    const u = material.current?.uniforms
    if (!u) return
    const p = caseProgress(caseId)
    // Spread slightly past 1 so the last cracks reach their tips; fade with the glass.
    u.uSpread.value = p.cracks * 1.15
    u.uFade.value = 1 - p.glass
  })

  return (
    <lineSegments geometry={geometry} renderOrder={3}>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        fog={false}
      />
    </lineSegments>
  )
}
