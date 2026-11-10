import { Effect } from 'postprocessing'
import { Uniform } from 'three'

// Linear exposure, applied right before ACES filmic tone mapping.
// (ToneMappingEffect's ACES path does not reliably receive the renderer's
// toneMappingExposure inside an EffectPass, so the gain is explicit here.)
const fragmentShader = /* glsl */ `
  uniform float exposure;
  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec3 c = max(inputColor.rgb, vec3(0.0)) * max(exposure, 0.0);
    outputColor = vec4(c, inputColor.a);
  }
`

export class ExposureEffect extends Effect {
  constructor({ exposure = 1 }: { exposure?: number } = {}) {
    super('ExposureEffect', fragmentShader, {
      uniforms: new Map([['exposure', new Uniform(exposure)]]),
    })
  }
}
