import { useFrame } from '@react-three/fiber'
import { useMemo, type RefObject } from 'react'
import { AdditiveBlending, Color, DoubleSide, ShaderMaterial } from 'three'
import { palette } from '../theme/palette'
import { LAMP } from './layout'

const HEIGHT = LAMP.y - LAMP.coneBottomY
const RADIUS = Math.tan(LAMP.angle) * HEIGHT
const BASE_OPACITY = 0.1

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// NaN-safe: no normalize/divide, every value clamped to [0, 1].
const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    float t = clamp(1.0 - vUv.y, 0.0, 1.0);     // 0 at the lamp, 1 at the pedestal
    float vertical = (1.0 - t) * smoothstep(0.0, 0.12, t) * (1.0 - smoothstep(0.75, 1.0, t));
    float alpha = clamp(vertical * uOpacity, 0.0, 1.0);
    gl_FragColor = vec4(clamp(uColor, 0.0, 1.0), alpha);
  }
`

type Props = {
  /** Brightness multiplier, written by the lamp each frame. */
  level: RefObject<number>
}

/** Subtle light cone under a ceiling spot. Local origin = case group. */
export function LightCone({ level }: Props) {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uColor: { value: new Color(palette.lamp) },
          uOpacity: { value: BASE_OPACITY },
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        side: DoubleSide,
        fog: false,
      }),
    [],
  )

  useFrame(() => {
    const k = Number.isFinite(level.current) ? level.current : 1
    material.uniforms.uOpacity.value = BASE_OPACITY * k
  })

  return (
    <mesh position={[0, LAMP.coneBottomY + HEIGHT / 2, 0]} material={material} renderOrder={2}>
      <coneGeometry args={[RADIUS, HEIGHT, 32, 1, true]} />
    </mesh>
  )
}
