import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, Color, MathUtils, Vector3, type Group, type ShaderMaterial } from 'three'
import { UKI_POINTS } from '../config/quality'
import { palette } from '../theme/palette'
import { buildOwlPoints, OWL } from './owlShape'
import { owlFragmentShader, owlVertexShader } from './owlShaders'
import { readVoiceLevel } from './voiceLevel'

type Props = {
  /** True while Üki is talking: eyes and body pulse with the voice. */
  speaking: boolean
  /** Voice audio. When it isn't playing, the glow pulses on a gentle timer instead. */
  audio?: HTMLAudioElement | null
  /** Faster wing beats and a slight forward lean while flying. */
  flying?: boolean
  /** Called once, when the particles have gathered into the owl. */
  onAppeared?: () => void
  /** Wings slowly open wide (while Üki speaks to the visitor). */
  wingsOpen?: boolean
  /** Changes with every new line: the eyes swell with light once per line. */
  pulseKey?: string
}

// Appear timeline (seconds after mount): eyes fade in from the dark, then the owl gathers.
const EYES_IN = [0.5, 2.0] as const
const GATHER = [2.5, 4.5] as const // 2 s
const BLINK_LEN = 0.15

const smooth = (t: number, a: number, b: number) => MathUtils.smoothstep(t, a, b)

/** Üki, the museum guide: a procedural particle owl. Local origin = body centre. */
export function UkiOwl({ speaking, audio, flying = false, onAppeared, wingsOpen = false, pulseKey }: Props) {
  const inner = useRef<Group>(null)
  const material = useRef<ShaderMaterial>(null)
  const anim = useRef({
    start: -1,
    appeared: false,
    flapPhase: 0,
    flapSpeed: 0.6, // Hz
    flapAmp: 0.3, // rad
    nextBlink: 3.5,
    nextTilt: 3,
    tiltTarget: 0,
    tilt: 0,
    voice: 0,
    pitch: 0,
    open: 0,
    pulseKey: undefined as string | undefined,
    pulseAt: -10,
  })

  const points = useMemo(() => buildOwlPoints(UKI_POINTS), [])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uEyesIn: { value: 0 },
      uGather: { value: 0 },
      uFlap: { value: 0 },
      uHeadTilt: { value: 0 },
      uBlink: { value: 0 },
      uBodyGlow: { value: 1 },
      uEyeGlow: { value: 1 },
      uSize: { value: 0.014 },
      uScale: { value: 400 },
      uNeck: { value: new Vector3(...OWL.neck) },
      uShoulder: { value: new Vector3(...OWL.shoulder) },
      uEyeCenter: { value: new Vector3(...OWL.eye.center) },
      uIce: { value: new Color(palette.uki) },
      uAmber: { value: new Color(palette.ghost) },
    }),
    [],
  )

  useFrame((state, rawDelta) => {
    const u = material.current?.uniforms
    if (!u) return
    const a = anim.current
    const t = state.clock.elapsedTime
    const delta = Math.min(rawDelta, 0.1) // no jumps after a tab switch
    if (a.start < 0) a.start = t
    const life = t - a.start

    // Appear
    u.uEyesIn.value = smooth(life, EYES_IN[0], EYES_IN[1])
    const gather = MathUtils.clamp((life - GATHER[0]) / (GATHER[1] - GATHER[0]), 0, 1)
    u.uGather.value = gather
    if (gather >= 1 && !a.appeared) {
      a.appeared = true
      onAppeared?.()
    }

    // Blink: eyes closed for 0.15 s every 4–7 s (quick close, quick open).
    if (t >= a.nextBlink + BLINK_LEN) a.nextBlink = t + 4 + Math.random() * 3
    const bt = t - a.nextBlink
    u.uBlink.value = bt >= 0 && bt <= BLINK_LEN ? MathUtils.clamp(Math.min(bt, BLINK_LEN - bt) / 0.04, 0, 1) : 0

    // Head tilt now and then (not while flying).
    if (t >= a.nextTilt) {
      a.tiltTarget = a.tiltTarget === 0 && !flying ? (Math.random() < 0.5 ? -1 : 1) * (0.12 + Math.random() * 0.14) : 0
      a.nextTilt = t + (a.tiltTarget === 0 ? 3 + Math.random() * 3 : 1.2 + Math.random() * 1.2)
    }
    a.tilt = MathUtils.damp(a.tilt, flying ? 0 : a.tiltTarget, 3, delta)
    u.uHeadTilt.value = a.tilt

    // Wing flap: smooth sine; slow while hovering, faster and wider while flying.
    a.flapSpeed = MathUtils.damp(a.flapSpeed, flying ? 2.4 : 0.6, 2, delta)
    a.flapAmp = MathUtils.damp(a.flapAmp, flying ? 0.75 : 0.3, 2, delta)
    a.flapPhase = (a.flapPhase + delta * a.flapSpeed * Math.PI * 2) % (Math.PI * 2)
    // Wings open slowly (~3 s) and keep only a soft, small beat while open.
    a.open = MathUtils.damp(a.open, wingsOpen && !flying ? 1 : 0, 0.9, delta)
    u.uFlap.value = 0.1 + 0.85 * a.open + a.flapAmp * (1 - 0.6 * a.open) * Math.sin(a.flapPhase)

    // Glow: follows the voice volume, or a soft timer pulse without audio.
    let target = 0
    if (speaking) {
      const level = readVoiceLevel(audio)
      target = level ?? 0.35 + 0.3 * Math.sin(t * 5.1) * Math.sin(t * 1.7)
    }
    a.voice = MathUtils.damp(a.voice, MathUtils.clamp(target, 0, 1), 10, delta)
    const breathe = 0.05 * Math.sin(t * 1.3)
    // Each new line: the eyes swell with light and settle (soft rise, slow decay).
    if (pulseKey !== a.pulseKey) {
      a.pulseKey = pulseKey
      if (pulseKey) a.pulseAt = t
    }
    const pt = t - a.pulseAt
    const pulse = pt >= 0 ? (1 - Math.exp(-pt * 5)) * Math.exp(-pt * 0.9) : 0
    u.uBodyGlow.value = 1 + breathe + 0.5 * a.voice + 0.2 * pulse
    u.uEyeGlow.value = 1 + breathe + 0.65 * a.voice + 1.1 * pulse

    u.uTime.value = t
    u.uScale.value = state.size.height * state.viewport.dpr * 0.5

    // Hover bob and lean
    if (inner.current) {
      inner.current.position.y = (flying ? 0.025 : 0.05) * Math.sin(t * 1.2)
      a.pitch = MathUtils.damp(a.pitch, flying ? 0.3 : 0, 2, delta)
      inner.current.rotation.x = a.pitch
    }
  })

  return (
    <group ref={inner}>
      <points frustumCulled={false} renderOrder={3}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[points.position, 3]} />
          <bufferAttribute attach="attributes-aScatter" args={[points.scatter, 3]} />
          <bufferAttribute attach="attributes-aPart" args={[points.part, 1]} />
          <bufferAttribute attach="attributes-aSide" args={[points.side, 1]} />
          <bufferAttribute attach="attributes-aRand" args={[points.rand, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={material}
          uniforms={uniforms}
          vertexShader={owlVertexShader}
          fragmentShader={owlFragmentShader}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>
    </group>
  )
}
