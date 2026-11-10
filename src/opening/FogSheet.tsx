import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Color, type ShaderMaterial } from 'three'
import { REDUCED_MOTION } from '../config/quality'
import { palette } from '../theme/palette'
import { GROUND_Y } from './openingLayout'

const vertexShader = /* glsl */ `
  varying vec2 vWorld;
  varying float vDist;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xz;
    vec4 mv = viewMatrix * world;
    vDist = max(-mv.z, 0.0);
    gl_Position = projectionMatrix * mv;
  }
`

// Value noise (no normalize / no division by variables).
const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uOpacity;
  uniform float uSeed;
  uniform vec2 uCenter; // sheet centre (x, z)
  uniform vec2 uHalf;   // half size (x, z), > 0
  varying vec2 vWorld;
  varying float vDist;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }

  void main() {
    vec2 p = vWorld * 0.09 + vec2(uTime * 0.012, uTime * 0.004) + uSeed;
    float n = 0.6 * noise(p) + 0.4 * noise(p * 2.3 + 7.0);
    float wisps = smoothstep(0.35, 0.85, n);
    // Fade out at the edges of the sheet and right in front of the camera,
    // so it never shows a hard edge.
    vec2 e = abs(vWorld - uCenter) / max(uHalf, vec2(0.01));
    float edge = 1.0 - smoothstep(0.6, 1.0, max(e.x, e.y));
    float near = smoothstep(0.8, 4.0, vDist);
    float a = clamp(wisps * edge * near * uOpacity, 0.0, 1.0);
    if (a < 0.002) discard;
    gl_FragColor = vec4(clamp(uColor, 0.0, 1.0), a);
  }
`

type Props = { y: number; opacity: number; seed: number; z: number; w: number; d: number }

/** One soft noise sheet of ground fog. */
export function FogSheet({ y, opacity, seed, z, w, d }: Props) {
  const material = useRef<ShaderMaterial>(null)
  const uniforms = useMemo(
    () => ({
      uColor: { value: new Color(palette.fog) },
      uTime: { value: 0 },
      uOpacity: { value: opacity },
      uSeed: { value: seed },
      uCenter: { value: [0, z] },
      uHalf: { value: [w / 2, d / 2] },
    }),
    [opacity, seed, z, w, d],
  )
  useFrame(({ clock }) => {
    const u = material.current?.uniforms
    if (u) u.uTime.value = clock.elapsedTime * (REDUCED_MOTION ? 0.3 : 1)
  })
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, GROUND_Y + y, z]} renderOrder={1}>
      <planeGeometry args={[w, d]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
      />
    </mesh>
  )
}
