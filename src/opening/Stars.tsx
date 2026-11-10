import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, Color, type Points, type ShaderMaterial } from 'three'
import { STAR_COUNT } from '../config/quality'
import { palette } from '../theme/palette'
import { seededRandom } from '../utils/random'

const RADIUS = 52 // inside the camera's far plane (60)

const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  uniform float uTime;
  uniform float uScale;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(aSize * uScale, 1.0, 6.0);
    float tw = 0.65 + 0.35 * sin(uTime * (0.6 + aPhase * 0.3) + aPhase * 6.2831);
    // Fainter near the horizon, where the haze is.
    float h = clamp(position.y / ${RADIUS.toFixed(1)}, 0.0, 1.0);
    vAlpha = clamp(tw * smoothstep(0.02, 0.35, h) * 0.85, 0.0, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    float a = clamp((1.0 - smoothstep(0.0, 0.5, d)) * vAlpha, 0.0, 1.0);
    if (a < 0.003) discard;
    gl_FragColor = vec4(clamp(uColor, 0.0, 1.0), a);
  }
`

/** Starry night sky: a dome of twinkling points that follows the camera (never reached). */
export function Stars() {
  const points = useRef<Points>(null)
  const material = useRef<ShaderMaterial>(null)

  const data = useMemo(() => {
    const rand = seededRandom(99)
    const n = STAR_COUNT
    const position = new Float32Array(n * 3)
    const size = new Float32Array(n)
    const phase = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      // Upper hemisphere, uniform by area, above ~3°.
      const y = 0.05 + 0.95 * rand()
      const a = rand() * Math.PI * 2
      const r = Math.sqrt(Math.max(0, 1 - y * y))
      position[i * 3] = Math.cos(a) * r * RADIUS
      position[i * 3 + 1] = y * RADIUS
      position[i * 3 + 2] = Math.sin(a) * r * RADIUS
      size[i] = rand() < 0.06 ? 2.6 : 1.1 + rand()
      phase[i] = rand()
    }
    return { position, size, phase }
  }, [])

  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uScale: { value: 1 }, uColor: { value: new Color(palette.uki) } }),
    [],
  )

  useFrame(({ clock, camera, viewport }) => {
    const u = material.current?.uniforms
    if (u) {
      u.uTime.value = clock.elapsedTime
      u.uScale.value = viewport.dpr
    }
    points.current?.position.copy(camera.position)
  })

  return (
    <points ref={points} frustumCulled={false} renderOrder={-1}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.position, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[data.size, 1]} />
        <bufferAttribute attach="attributes-aPhase" args={[data.phase, 1]} />
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
