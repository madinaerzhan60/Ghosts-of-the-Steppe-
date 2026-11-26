import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Color, type ShaderMaterial } from 'three'
import { palette } from '../theme/palette'
import { LAYOUT, surfaceY } from './slopeShape'
import { epilogueProgress, storyLive } from './storyLive'

const PRINTS = 22

const vertexShader = /* glsl */ `
  attribute float aOrder; // 0..1 along the trail, from her rock to the city
  uniform float uProgress;
  uniform float uScale;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float depth = max(-mv.z, 0.05);
    gl_PointSize = clamp(0.13 * uScale / depth, 2.0, 16.0);
    // Prints appear one after another, each fading in slowly.
    vAlpha = smoothstep(aOrder, aOrder + 0.08, uProgress) * 0.75;
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    float r = length(gl_PointCoord - vec2(0.5));
    float a = (1.0 - smoothstep(0.15, 0.5, r)) * vAlpha;
    if (a < 0.003) discard;
    gl_FragColor = vec4(uColor, a);
  }
`

/** Faded ending: only her footprints are left, a trail from her rock down to the city lights. */
export function Footprints() {
  const material = useRef<ShaderMaterial>(null)

  const data = useMemo(() => {
    const position = new Float32Array(PRINTS * 3)
    const order = new Float32Array(PRINTS)
    const from = { x: LAYOUT.rock.x + 0.4, z: LAYOUT.rock.z + 1.6 }
    const to = { x: 1.2, z: LAYOUT.cityBottom - 4 }
    for (let i = 0; i < PRINTS; i++) {
      const t = i / (PRINTS - 1)
      // A gently winding line, left and right paws alternating.
      const side = i % 2 === 0 ? -1 : 1
      const x = from.x + (to.x - from.x) * t + Math.sin(t * 5) * 0.5 + side * 0.17
      const z = from.z + (to.z - from.z) * t
      position.set([x, surfaceY(x, z) + 0.06, z], i * 3)
      order[i] = t * 0.85
    }
    return { position, order }
  }, [])

  const uniforms = useMemo(
    () => ({ uProgress: { value: 0 }, uScale: { value: 500 }, uColor: { value: new Color(palette.fog) } }),
    [],
  )

  useFrame(({ size }) => {
    const u = material.current?.uniforms
    if (!u) return
    // Starts once her particles have begun to drift (the trail is the last thing left).
    u.uProgress.value = storyLive.epilogue === 'faded' ? epilogueProgress() * 1.1 : 0
    u.uScale.value = size.height * 0.62
  })

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.position, 3]} />
        <bufferAttribute attach="attributes-aOrder" args={[data.order, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
      />
    </points>
  )
}
