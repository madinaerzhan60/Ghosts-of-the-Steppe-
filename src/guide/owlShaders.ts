// GLSL for Üki. NaN-safe by construction:
// - no normalize(), no inversesqrt, no pow() with negative bases
// - every division has a max(..., eps) guard
// - colour and alpha are clamped to [0, 1]

export const owlVertexShader = /* glsl */ `
  attribute vec3 aScatter;
  attribute float aPart;   // 0 body, 1 head, 2 eye, 3 wing, 4 tail
  attribute float aSide;   // -1 left, +1 right
  attribute float aRand;   // 0..1

  uniform float uTime;
  uniform float uEyesIn;   // 0..1 eyes fade in from the dark
  uniform float uGather;   // 0..1 particles gather into the owl
  uniform float uFlap;     // wing angle, radians
  uniform float uHeadTilt; // head roll, radians
  uniform float uBlink;    // 0 open .. 1 closed
  uniform float uBodyGlow; // 0..2
  uniform float uEyeGlow;  // 0..2
  uniform float uSize;     // world size of a point, metres
  uniform float uScale;    // drawing-buffer height * 0.5
  uniform vec3 uNeck;
  uniform vec3 uShoulder;  // right shoulder; left is mirrored
  uniform vec3 uEyeCenter; // right eye; left is mirrored
  uniform vec3 uIce;
  uniform vec3 uAmber;

  varying vec3 vColor;
  varying float vAlpha;

  vec2 rot(vec2 v, float a) {
    float c = cos(a);
    float s = sin(a);
    return vec2(c * v.x - s * v.y, s * v.x + c * v.y);
  }

  bool isPart(float id) { return abs(aPart - id) < 0.5; }

  void main() {
    vec3 p = position;
    bool eye = isPart(2.0);

    // Blink: squash each eye vertically around its centre.
    if (eye) {
      float cy = uEyeCenter.y;
      p.y = cy + (p.y - cy) * (1.0 - 0.92 * clamp(uBlink, 0.0, 1.0));
    }

    // Head tilt (roll around the neck): head, ear tufts and eyes.
    if (isPart(1.0) || eye) {
      p.xy = uNeck.xy + rot(p.xy - uNeck.xy, uHeadTilt);
    }

    // Wing flap: rotate around the shoulder (z axis); tips lag a little.
    if (isPart(3.0)) {
      vec2 sh = vec2(uShoulder.x * aSide, uShoulder.y);
      vec2 d = p.xy - sh;
      float reach = clamp(length(d) / 0.26, 0.0, 1.0);
      float a = uFlap * aSide * (0.75 + 0.25 * reach);
      p.xy = sh + rot(d, a);
    }

    // Gentle shimmer so the shape feels alive.
    float ph = aRand * 40.0;
    p += 0.0025 * vec3(sin(uTime * 1.9 + ph), sin(uTime * 2.3 + ph * 1.3), sin(uTime * 1.7 + ph * 0.7));

    // Gather: each point flies in from its scatter position with its own delay.
    float g = 1.0;
    if (!eye) {
      float delay = aRand * 0.45;
      g = smoothstep(delay, delay + 0.55, clamp(uGather, 0.0, 1.0));
      vec3 drift = aScatter + 0.08 * vec3(sin(uTime * 0.4 + ph), cos(uTime * 0.3 + ph), sin(uTime * 0.35 + ph * 0.5));
      p = mix(drift, p, g);
    }

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float depth = max(-mv.z, 0.05);
    float size = uSize * (0.6 + 0.8 * aRand) * (eye ? 1.25 : 1.0);
    gl_PointSize = clamp(size * uScale / depth, 0.0, 48.0);

    float twinkle = 0.85 + 0.15 * sin(uTime * 3.0 + ph);
    if (eye) {
      vColor = uAmber;
      vAlpha = 0.6 * uEyeGlow * clamp(uEyesIn, 0.0, 1.0) * (1.0 - 0.85 * clamp(uBlink, 0.0, 1.0));
    } else {
      vColor = uIce;
      // Invisible in the dark until the particles start to gather.
      vAlpha = 0.32 * uBodyGlow * twinkle * smoothstep(0.0, 0.7, g);
    }
    vAlpha = clamp(vAlpha, 0.0, 1.0);
  }
`

export const owlFragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    float soft = 1.0 - smoothstep(0.15, 0.5, d);
    float a = clamp(soft * vAlpha, 0.0, 1.0);
    if (a < 0.003) discard;
    gl_FragColor = vec4(clamp(vColor, 0.0, 1.0), a);
  }
`

export const trailVertexShader = /* glsl */ `
  attribute float aBirth;  // spawn time, seconds (very negative = unused slot)
  attribute float aRand;
  uniform float uTime;
  uniform float uLife;     // seconds, > 0
  uniform float uSize;
  uniform float uScale;
  varying float vAlpha;
  void main() {
    float age = max(uTime - aBirth, 0.0);
    float k = clamp(age / max(uLife, 0.001), 0.0, 1.0);
    vec3 p = position + vec3(0.0, -0.12 * k, 0.0); // sinks slowly as it fades
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(uSize * (0.6 + 0.8 * aRand) * (1.0 - 0.5 * k) * uScale / max(-mv.z, 0.05), 0.0, 32.0);
    vAlpha = clamp(0.3 * (1.0 - k) * (1.0 - k), 0.0, 1.0);
  }
`

export const trailFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    float a = clamp((1.0 - smoothstep(0.1, 0.5, d)) * vAlpha, 0.0, 1.0);
    if (a < 0.003) discard;
    gl_FragColor = vec4(clamp(uColor, 0.0, 1.0), a);
  }
`
