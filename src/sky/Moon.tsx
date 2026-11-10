import { useMemo } from 'react'
import { AdditiveBlending, Color } from 'three'
import { SKY } from '../opening/openingLayout'
import { palette } from '../theme/palette'
import { facingOrigin } from './facing'

const discVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Pale disc with a soft edge, slight limb darkening and faint grey "seas". NaN-safe.
const discFragment = /* glsl */ `
  uniform vec3 uColor;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 45758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    float disc = 1.0 - smoothstep(0.96, 1.0, r);
    if (disc < 0.002) discard;
    float limb = 0.82 + 0.18 * sqrt(max(0.0, 1.0 - r * r));
    float seas = smoothstep(0.45, 0.75, 0.6 * noise(p * 2.3 + 3.0) + 0.4 * noise(p * 5.1));
    vec3 col = uColor * limb * (1.0 - 0.16 * seas);
    gl_FragColor = vec4(clamp(col, 0.0, 1.0), disc);
  }
`

// Soft halo: exponential falloff, strongest just outside the disc.
const haloFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uInner; // disc radius as a fraction of the halo plane's half size
  varying vec2 vUv;
  void main() {
    float r = length(vUv * 2.0 - 1.0);
    float k = max(r - uInner, 0.0) / max(1.0 - uInner, 1e-3);
    float a = exp(-k * 5.0) * (1.0 - smoothstep(0.85, 1.0, r)) * 0.42;
    a = clamp(a, 0.0, 1.0);
    if (a < 0.002) discard;
    gl_FragColor = vec4(clamp(uColor, 0.0, 1.0), a);
  }
`

const HALO_SCALE = 4.2

/** A big low moon behind the museum, with a soft halo. Lives inside SkyDome. */
export function Moon() {
  const { position, quaternion, uniforms, halo } = useMemo(() => {
    const position = SKY.moonDir.clone().multiplyScalar(SKY.moonDistance)
    return {
      position,
      quaternion: facingOrigin(position),
      uniforms: { uColor: { value: new Color(palette.uki).multiplyScalar(0.92) } },
      halo: {
        uColor: { value: new Color(palette.fog) },
        uInner: { value: 1 / HALO_SCALE },
      },
    }
  }, [])

  return (
    <group position={position} quaternion={quaternion}>
      <mesh renderOrder={-0.8}>
        <planeGeometry args={[SKY.moonRadius * 2, SKY.moonRadius * 2]} />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={discVertex}
          fragmentShader={discFragment}
          transparent
          depthWrite={false}
          fog={false}
        />
      </mesh>
      <mesh renderOrder={-0.7} position={[0, 0, -0.1]}>
        <planeGeometry args={[SKY.moonRadius * 2 * HALO_SCALE, SKY.moonRadius * 2 * HALO_SCALE]} />
        <shaderMaterial
          uniforms={halo}
          vertexShader={discVertex}
          fragmentShader={haloFragment}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
          fog={false}
        />
      </mesh>
    </group>
  )
}
