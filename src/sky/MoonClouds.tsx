import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Color, type ShaderMaterial } from 'three'
import { REDUCED_MOTION } from '../config/quality'
import { SKY } from '../opening/openingLayout'
import { palette } from '../theme/palette'
import { facingOrigin } from './facing'

const W = 64
const H = 16
/** The cloud plane sits a little lower than the moon so the bands cross its lower half. */
const DROP = 0.4

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Thin, stretched cloud bands drifting slowly sideways. Lit on their edges near the moon.
const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec2 uMoon;      // moon centre in plane uv
  uniform float uMoonR;    // moon radius in plane uv (x units)
  uniform vec3 uDark;
  uniform vec3 uLit;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  void main() {
    vec2 p = vec2(vUv.x * 7.0 + uTime * 0.006, vUv.y * 9.0);
    float n = 0.55 * noise(p) + 0.3 * noise(p * vec2(2.1, 2.7) + 4.0) + 0.15 * noise(p * 5.3 + 9.0);
    float bands = smoothstep(0.52, 0.78, n);
    // Soft fade at every edge of the plane: never a visible border.
    float edge = smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x) * smoothstep(0.0, 0.35, vUv.y) * smoothstep(1.0, 0.6, vUv.y);
    // Moonlit rim: brighter close to the moon.
    vec2 d = (vUv - uMoon) * vec2(1.0, ${(H / W).toFixed(4)});
    float near = exp(-max(length(d) - uMoonR, 0.0) * 9.0);
    vec3 col = mix(uDark, uLit, clamp(near * (0.4 + 0.6 * (1.0 - bands)), 0.0, 1.0));
    float a = clamp(bands * edge * 0.55, 0.0, 1.0);
    if (a < 0.003) discard;
    gl_FragColor = vec4(clamp(col, 0.0, 1.0), a);
  }
`

/** Thin clouds drifting across the moon. Lives inside SkyDome. */
export function MoonClouds() {
  const material = useRef<ShaderMaterial>(null)
  const { position, quaternion, uniforms } = useMemo(() => {
    const dist = SKY.moonDistance - 2
    const position = SKY.moonDir.clone().multiplyScalar(dist)
    position.y -= SKY.moonRadius * DROP
    const bg = new Color(palette.background)
    return {
      position,
      quaternion: facingOrigin(position),
      uniforms: {
        uTime: { value: 0 },
        uMoon: { value: [0.5, 0.5 + (SKY.moonRadius * DROP) / H] },
        uMoonR: { value: SKY.moonRadius / W },
        uDark: { value: bg.clone().lerp(new Color(palette.fog), 0.12) },
        uLit: { value: new Color(palette.fog).multiplyScalar(0.75) },
      },
    }
  }, [])

  useFrame(({ clock }) => {
    const u = material.current?.uniforms
    if (u) u.uTime.value = clock.elapsedTime * (REDUCED_MOTION ? 0.3 : 1)
  })

  return (
    <mesh position={position} quaternion={quaternion} renderOrder={-0.6}>
      <planeGeometry args={[W, H]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        fog={false}
      />
    </mesh>
  )
}
