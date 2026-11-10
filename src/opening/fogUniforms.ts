import { Color, type FogExp2, type Scene } from 'three'

// Custom shaders apply the scene's exponential-squared fog themselves (NaN-safe):
// factor = 1 - exp(-(density * depth)^2), depth >= 0, result clamped to [0, 1].

export function makeFogUniforms() {
  return { uFogColor: { value: new Color() }, uFogDensity: { value: 0 } }
}

export function syncFog(
  u: { uFogColor: { value: Color }; uFogDensity: { value: number } },
  scene: Scene,
) {
  const fog = scene.fog as FogExp2 | null
  if (!fog) {
    u.uFogDensity.value = 0
    return
  }
  u.uFogColor.value.copy(fog.color)
  u.uFogDensity.value = fog.density ?? 0
}

export const fogGlsl = /* glsl */ `
  uniform vec3 uFogColor;
  uniform float uFogDensity;
  vec3 applyFog(vec3 color, float depth) {
    float d = max(depth, 0.0) * max(uFogDensity, 0.0);
    float f = clamp(1.0 - exp(-d * d), 0.0, 1.0);
    return mix(color, uFogColor, f);
  }
`
