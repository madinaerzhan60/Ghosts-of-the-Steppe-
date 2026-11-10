import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import {
  Color,
  Vector4,
  DoubleSide,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Float32BufferAttribute,
  type ShaderMaterial,
} from 'three'
import { GRASS_BLADES, REDUCED_MOTION } from '../config/quality'
import { palette } from '../theme/palette'
import { seededRandom } from '../utils/random'
import { fogGlsl, makeFogUniforms, syncFog } from './fogUniforms'
import { lanternLive } from './lanternLive'
import { FACADE, GROUND_Y, LANTERN_HEIGHT, LANTERNS, STEPS_FRONT_Z } from './openingLayout'

// Steppe area (world x/z). Kept clear: the path to the doors and the building.
const AREA = { x0: -28, x1: 28, z0: -14, z1: 42 }
const PATH_HALF = 0.75
const BUILDING_HALF = FACADE.width / 2 + 0.4
const CLEAR_FRONT_Z = STEPS_FRONT_Z + 0.3

const vertexShader = /* glsl */ `
  attribute vec2 aOffset;  // world x, z
  attribute float aHeight;
  attribute float aYaw;
  attribute float aPhase;
  uniform float uTime;
  uniform float uWind;
  uniform float uGround;
  uniform float uWidth;
  uniform vec4 uLanterns[${LANTERNS.length}]; // xyz flame position, w flicker level
  varying float vT;
  varying float vDepth;
  varying float vShade;
  varying float vWarm;

  void main() {
    float t = clamp(position.y, 0.0, 1.0);          // 0 root .. 1 tip
    vec3 p = vec3(position.x * uWidth * (1.0 - 0.75 * t), t * aHeight, 0.0);
    float c = cos(aYaw);
    float s = sin(aYaw);
    p.xz = vec2(c * p.x - s * p.z, s * p.x + c * p.z);

    // Wind: a slow travelling wave across the steppe plus a small per-blade flutter.
    float wave = sin(uTime * 0.9 + aOffset.x * 0.18 + aOffset.y * 0.11);
    float gust = 0.5 + 0.5 * sin(uTime * 0.23 + aOffset.y * 0.05);
    float flutter = 0.25 * sin(uTime * 2.6 + aPhase);
    float bend = uWind * (0.35 + 0.65 * gust) * (wave + flutter) * t * t * aHeight;
    p.x += bend * 0.8;
    p.z += bend * 0.35;
    p.y -= abs(bend) * 0.25 * t;

    vec3 world = vec3(aOffset.x, uGround, aOffset.y) + p;
    vec4 mv = viewMatrix * vec4(world, 1.0);
    gl_Position = projectionMatrix * mv;
    vT = t;
    vDepth = max(-mv.z, 0.0);
    vShade = 0.75 + 0.25 * sin(aPhase * 3.0);

    // Warm lantern light on nearby blades (soft falloff, no real light needed).
    float warm = 0.0;
    for (int i = 0; i < ${LANTERNS.length}; i++) {
      vec3 d = world - uLanterns[i].xyz;
      warm += max(uLanterns[i].w, 0.0) / (1.0 + dot(d, d) * 1.6);
    }
    vWarm = clamp(warm, 0.0, 1.5) * (0.35 + 0.65 * t);
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uRoot;
  uniform vec3 uTip;
  uniform vec3 uAmber;
  ${fogGlsl}
  varying float vT;
  varying float vDepth;
  varying float vShade;
  varying float vWarm;
  void main() {
    vec3 col = mix(uRoot, uTip, clamp(vT, 0.0, 1.0)) * clamp(vShade, 0.0, 1.0);
    col += uAmber * clamp(vWarm, 0.0, 1.5) * 0.28;
    gl_FragColor = vec4(clamp(applyFog(col, vDepth), 0.0, 1.0), 1.0);
  }
`

function keepClear(x: number, z: number) {
  if (Math.abs(x) < PATH_HALF && z > 0) return true // the path to the doors
  if (Math.abs(x) < BUILDING_HALF && z < CLEAR_FRONT_Z) return true // building + steps
  return false
}

/** Dark steppe grass: instanced blades swaying in the wind, all on the GPU. */
export function Grass() {
  const material = useRef<ShaderMaterial>(null)

  const geometry = useMemo(() => {
    // One blade: 3 segments, tapering to a tip (7 vertices).
    const g = new InstancedBufferGeometry()
    const ys = [0, 1 / 3, 2 / 3]
    const pos: number[] = []
    for (const y of ys) pos.push(-0.5, y, 0, 0.5, y, 0)
    pos.push(0, 1, 0)
    g.setAttribute('position', new Float32BufferAttribute(pos, 3))
    g.setIndex([0, 1, 2, 2, 1, 3, 2, 3, 4, 4, 3, 5, 4, 5, 6])

    const rand = seededRandom(2024)
    const n = GRASS_BLADES
    const offset = new Float32Array(n * 2)
    const height = new Float32Array(n)
    const yaw = new Float32Array(n)
    const phase = new Float32Array(n)
    let i = 0
    while (i < n) {
      const x = AREA.x0 + (AREA.x1 - AREA.x0) * rand()
      const z = AREA.z0 + (AREA.z1 - AREA.z0) * rand()
      if (keepClear(x, z)) continue
      // Shorter, sparser grass right next to the path.
      const nearPath = Math.min(1, Math.max(0, (Math.abs(x) - PATH_HALF) / 1.5))
      if (rand() > 0.35 + 0.65 * nearPath) continue
      offset[i * 2] = x
      offset[i * 2 + 1] = z
      height[i] = (0.22 + 0.4 * rand()) * (0.55 + 0.45 * nearPath)
      yaw[i] = rand() * Math.PI
      phase[i] = rand() * Math.PI * 2
      i++
    }
    g.setAttribute('aOffset', new InstancedBufferAttribute(offset, 2))
    g.setAttribute('aHeight', new InstancedBufferAttribute(height, 1))
    g.setAttribute('aYaw', new InstancedBufferAttribute(yaw, 1))
    g.setAttribute('aPhase', new InstancedBufferAttribute(phase, 1))
    g.instanceCount = n
    return g
  }, [])

  const uniforms = useMemo(() => {
    const bg = new Color(palette.background)
    const fog = new Color(palette.fog)
    return {
      uTime: { value: 0 },
      uWind: { value: REDUCED_MOTION ? 0.08 : 0.22 },
      uGround: { value: GROUND_Y },
      uWidth: { value: 0.045 },
      // Grass colours are the palette's night tones (no new hues).
      uRoot: { value: bg.clone().lerp(fog, 0.05) },
      uTip: { value: bg.clone().lerp(fog, 0.2) },
      uAmber: { value: new Color(palette.ghost) },
      uLanterns: {
        value: LANTERNS.map(([x, z]) => new Vector4(x, GROUND_Y + LANTERN_HEIGHT + 0.1, z, 1)),
      },
      ...makeFogUniforms(),
    }
  }, [])

  useFrame(({ clock, scene }) => {
    const u = material.current?.uniforms
    if (!u) return
    u.uTime.value = clock.elapsedTime
    const lanterns = u.uLanterns.value as Vector4[]
    for (let i = 0; i < lanterns.length; i++) lanterns[i].w = lanternLive.level[i] ?? 1
    syncFog(u as typeof uniforms, scene)
  })

  return (
    <mesh geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        side={DoubleSide}
      />
    </mesh>
  )
}
