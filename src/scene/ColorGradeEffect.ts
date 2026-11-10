import { Effect } from 'postprocessing'
import { Color, Uniform } from 'three'

// Night grade, applied after ACES: shadows and darks are pulled toward a deep,
// cold blue (from the palette), while warm, bright amber accents (window, lanterns,
// eyes) keep their colour. Small amounts only; NaN-safe.
const fragmentShader = /* glsl */ `
  uniform vec3 uNight;   // deep blue tint for the darks
  uniform float uAmount;
  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec3 c = clamp(inputColor.rgb, 0.0, 1.0);
    float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
    // How warm is this pixel? (red/green above blue = amber.)
    float warm = clamp((c.r + c.g) * 0.5 - c.b, 0.0, 1.0) * 4.0;
    float darks = 1.0 - smoothstep(0.0, 0.45, l);
    float k = clamp(uAmount * darks * (1.0 - clamp(warm, 0.0, 1.0)), 0.0, 1.0);
    // Tint the darks: keep their luminance, shift their hue toward night blue, and lift them a hair.
    vec3 tinted = uNight * (l / max(dot(uNight, vec3(0.2126, 0.7152, 0.0722)), 1e-3));
    vec3 graded = mix(c, tinted, k) + uNight * 0.012 * darks;
    outputColor = vec4(clamp(graded, 0.0, 1.0), inputColor.a);
  }
`

export class ColorGradeEffect extends Effect {
  constructor({ night, amount = 0.45 }: { night: Color; amount?: number }) {
    super('ColorGradeEffect', fragmentShader, {
      uniforms: new Map<string, Uniform>([
        ['uNight', new Uniform(night)],
        ['uAmount', new Uniform(amount)],
      ]),
    })
  }
}
