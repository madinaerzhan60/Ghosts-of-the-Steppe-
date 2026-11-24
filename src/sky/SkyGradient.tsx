import { useMemo } from 'react'
import { BackSide, Color } from 'three'
import { palette } from '../theme/palette'

const RADIUS = 58 // inside the camera's far plane (60), behind stars, moon and ridges

const vertexShader = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Vertical gradient: teal glow at the horizon, violet higher, deep indigo at the top.
// Below the horizon it sinks into the shadow colour. NaN-safe (no normalize of zero).
const fragmentShader = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uMid;
  uniform vec3 uHorizon;
  uniform vec3 uBelow;
  varying vec3 vDir;
  void main() {
    float h = clamp(vDir.y / ${RADIUS.toFixed(1)}, -1.0, 1.0);
    float up = pow(clamp(h, 0.0, 1.0), 0.6);
    vec3 col = mix(uHorizon, uMid, smoothstep(0.0, 0.45, up));
    col = mix(col, uTop, smoothstep(0.4, 1.0, up));
    col = mix(col, uBelow, smoothstep(0.0, 0.25, clamp(-h, 0.0, 1.0)));
    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
  }
`

/** The sky: a vertical gradient dome. Lives inside SkyDome, so it follows the camera. */
export function SkyGradient() {
  const uniforms = useMemo(
    () => ({
      uTop: { value: new Color(palette.skyTop) },
      uMid: { value: new Color(palette.skyMid) },
      uHorizon: { value: new Color(palette.skyHorizon) },
      uBelow: { value: new Color(palette.background) },
    }),
    [],
  )
  return (
    <mesh renderOrder={-3} frustumCulled={false}>
      <sphereGeometry args={[RADIUS, 32, 16]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        side={BackSide}
        depthWrite={false}
        depthTest={false}
        fog={false}
      />
    </mesh>
  )
}
