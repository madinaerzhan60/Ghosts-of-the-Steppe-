/**
 * Particle shaders for an animal waking in its case.
 * Every particle sits on the statue's surface. When the statue breaks (`uShatter`),
 * the particles drift outward in grey stone color; when they gather (`uGather`),
 * they return and turn into the animal's own glowing color, then breathe slowly.
 * NaN-safe: no normalize or division by anything that can be zero.
 */
export const hallGhostVertex = /* glsl */ `
  attribute vec4 aSeed; // x phase, y size, z pace, w rank
  attribute vec3 aDir;  // outward direction, unit length (made on the CPU)
  uniform float uTime;
  uniform float uShatter;
  uniform float uGather;
  uniform float uSpread;
  uniform float uScale;
  uniform float uBreathe;
  uniform vec3 uStone;
  uniform vec3 uGlow;
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    // How far out this particle is: 0 on the statue, 1 at the farthest. Each at its own pace.
    float outward = smoothstep(0.0, 1.0, uShatter) * (1.0 - smoothstep(0.0, 1.0, uGather));
    float own = clamp(outward * (0.6 + 0.8 * aSeed.z), 0.0, 1.0);
    vec3 p = position + aDir * uSpread * (0.35 + 0.9 * aSeed.w) * own;
    float ph = aSeed.x * 6.2831;
    p += vec3(sin(uTime * 0.7 + ph), cos(uTime * 0.5 + ph * 1.3), sin(uTime * 0.6 + ph * 0.7)) * 0.05 * own;

    // Breathing once she is a ghost again: a slow swell, about one breath every six seconds.
    float ghostK = smoothstep(0.75, 1.0, uGather);
    float breath = 0.5 + 0.5 * sin(uTime * 1.0);
    p *= 1.0 + uBreathe * ghostK * 0.015 * (breath * 2.0 - 1.0);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float depth = max(-mv.z, 0.05);
    gl_PointSize = clamp(aSeed.y * uScale / depth * (1.0 + 0.3 * uBreathe * ghostK * breath), 1.2, 7.0);

    float g = smoothstep(0.0, 1.0, uGather);
    vColor = mix(uStone, uGlow * (1.0 + 0.45 * ghostK * (0.4 + 0.6 * breath * uBreathe)), g);
    vAlpha = clamp(mix(0.95, 0.7, g) * (1.0 - 0.35 * own), 0.0, 1.0);
  }
`

export const hallGhostFragment = /* glsl */ `
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    float r = length(gl_PointCoord - vec2(0.5));
    float a = (1.0 - smoothstep(0.0, 0.5, r)) * vAlpha;
    if (a < 0.003) discard;
    gl_FragColor = vec4(clamp(vColor, 0.0, 4.0), a);
  }
`
