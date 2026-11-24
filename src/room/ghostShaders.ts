/**
 * Shared particle-ghost shaders for the leopard and her cub.
 * Colour follows the three states: grey-stone grains when `uBright` is low,
 * amber glowing particles as it rises. `uDrift` (0..1) blows the particles away like snow.
 */
export const ghostVertexShader = /* glsl */ `
  attribute vec3 aSeed; // x phase, y rank (0..1), z size
  uniform float uTime;
  uniform float uBright;
  uniform float uScale;
  uniform float uBreathe;
  uniform float uDrift;
  uniform float uAppear;
  uniform float uSizeK;
  uniform vec3 uStone;
  uniform vec3 uAmber;
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    vec3 p = position;
    // Slow breathing: the chest rises a little.
    p.y += uBreathe * 0.03 * sin(uTime * 0.9 + aSeed.x * 6.2831) * smoothstep(0.2, 1.2, position.y);
    // Drifting away like snow: sideways with the wind, sinking and swaying; each grain at its own pace.
    float d = uDrift * (0.4 + 1.2 * aSeed.y);
    p.x += d * d * (2.5 + 3.0 * aSeed.x) * 2.0;
    p.y -= d * (0.6 + 0.8 * aSeed.x) * 0.6;
    p.z += sin(uTime * 0.6 + aSeed.x * 20.0) * d * 0.6;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float depth = max(-mv.z, 0.05);
    gl_PointSize = clamp(aSeed.z * uSizeK * (0.55 + 0.6 * uBright) * uScale / depth, 1.0, 9.0);

    // State 1 -> 2: faint grey-stone grains become amber, glowing particles as she brightens.
    // When she fades, the outermost grains go first, but a stone outline stays.
    float keep = mix(0.4, 1.0, smoothstep(0.0, 0.7, uBright));
    float present = 1.0 - smoothstep(keep - 0.15, keep, aSeed.y);
    float twinkle = 0.8 + 0.2 * sin(uTime * (0.7 + aSeed.x) + aSeed.x * 50.0) * uBreathe;
    float gone = 1.0 - smoothstep(0.55, 1.0, uDrift * 1.3 + aSeed.y * 0.3 - 0.15);
    vAlpha = present * mix(0.22, 0.85, uBright) * twinkle * gone * uAppear;
    vColor = mix(uStone, uAmber * (1.0 + 0.6 * uBright), smoothstep(0.05, 0.5, uBright));
  }
`

export const ghostFragmentShader = /* glsl */ `
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    float r = length(gl_PointCoord - vec2(0.5));
    float a = (1.0 - smoothstep(0.0, 0.5, r)) * vAlpha;
    if (a < 0.003) discard;
    gl_FragColor = vec4(vColor, a);
  }
`
