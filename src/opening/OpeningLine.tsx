import { useFrame } from '@react-three/fiber'
import { use, useEffect, useMemo, useRef } from 'react'
import { CanvasTexture, Color, MathUtils, type ShaderMaterial, type Vector3 } from 'three'
import { loadOpeningFonts } from './fonts'
import { drawTextCanvas } from './textCanvas'

type Props = {
  text: string
  font: string
  color: string
  /** World height of the line, metres. */
  height: number
  position: Vector3
  /** Fade the line in (true) or out (false). */
  show: boolean
  /** Seconds per letter when written letter by letter; 0 = the whole line fades in. */
  letterTime?: number
  /** Max opacity. */
  opacity?: number
  /** How quickly the line fades out once hidden (higher = faster). */
  fadeOutSpeed?: number
}

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Letters appear left to right, each fading in over `uSoft` of the width.
const fragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uReveal;
  uniform float uSoft;
  varying vec2 vUv;
  void main() {
    float ink = texture2D(uMap, vUv).a;
    float soft = max(uSoft, 1e-4);
    float shown = 1.0 - smoothstep(uReveal - soft, uReveal, vUv.x);
    float a = clamp(ink * shown * uOpacity, 0.0, 1.0);
    if (a < 0.002) discard;
    gl_FragColor = vec4(clamp(uColor, 0.0, 1.0), a);
  }
`

/** A line of glowing text floating in the steppe; optionally written letter by letter. */
export function OpeningLine({
  text,
  font,
  color,
  height,
  position,
  show,
  letterTime = 0,
  opacity = 1,
  fadeOutSpeed = 0.9,
}: Props) {
  use(loadOpeningFonts())
  const material = useRef<ShaderMaterial>(null)
  const anim = useRef({ shownAt: -1, opacity: 0, reveal: 0 })

  const drawn = useMemo(() => drawTextCanvas(text, font, 96), [text, font])
  const texture = useMemo(() => new CanvasTexture(drawn.canvas), [drawn])
  useEffect(() => () => texture.dispose(), [texture])

  const avgLetter = drawn.letterEnds.length
    ? (drawn.letterEnds[drawn.letterEnds.length - 1] - drawn.letterEnds[0]) / drawn.letterEnds.length
    : 0.05
  const uniforms = useMemo(
    () => ({
      uMap: { value: texture },
      uColor: { value: new Color(color) },
      uOpacity: { value: 0 },
      uReveal: { value: letterTime > 0 ? 0 : 2 },
      uSoft: { value: Math.max(0.01, avgLetter * 1.2) },
    }),
    [texture, color, letterTime, avgLetter],
  )

  useFrame(({ clock }, rawDelta) => {
    const u = material.current?.uniforms
    if (!u) return
    const delta = Math.min(rawDelta, 0.1)
    const a = anim.current
    const t = clock.elapsedTime
    if (show && a.shownAt < 0) a.shownAt = t

    // Whole-line opacity: slow fades only.
    a.opacity = MathUtils.damp(a.opacity, show ? opacity : 0, show ? 1.2 : fadeOutSpeed, delta)
    u.uOpacity.value = a.opacity

    if (letterTime > 0 && a.shownAt >= 0) {
      const n = Math.floor((t - a.shownAt) / letterTime)
      const ends = drawn.letterEnds
      const target = n >= ends.length ? 1 + u.uSoft.value : ends[Math.max(0, n)] + u.uSoft.value * 0.6
      a.reveal = MathUtils.damp(a.reveal, target, 6, delta)
      u.uReveal.value = a.reveal
    }
  })

  return (
    <mesh position={position} renderOrder={4}>
      <planeGeometry args={[height * drawn.aspect, height]} />
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
