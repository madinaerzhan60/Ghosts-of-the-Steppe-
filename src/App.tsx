import { PerformanceMonitor } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useCallback, useEffect, useRef, useState } from 'react'
import { enableSound } from './audio/ambience'
import { LIGHT_MODE } from './config/quality'
import { DevPerf } from './dev/DevPerf'
import { SPOT, type GuideSpot } from './guide/guideSpots'
import { useGuideVoice } from './guide/useGuideVoice'
import { useWelcomeDialogue } from './guide/useWelcomeDialogue'
import { advanceStage } from './opening/openingStore'
import { WALK_STOPS } from './scene/cameraPath'
import { Effects } from './scene/Effects'
import { CASES } from './scene/layout'
import { MuseumScene } from './scene/MuseumScene'
import { NextButton } from './ui/NextButton'
import { WalkHint } from './ui/WalkHint'
import { OpeningAnnouncer } from './ui/OpeningAnnouncer'
import { SoundButton } from './ui/SoundButton'
import { Subtitles } from './ui/Subtitles'
import { attachWalkInput, setWalkStops } from './walk/walkInput'

/** Device pixel ratio is capped here (Retina screens would otherwise render 4x the pixels). */
const MAX_DPR = 1.5
const MIN_DPR = 1

setWalkStops(WALK_STOPS)

export default function App() {
  // Adaptive resolution: start at 1.5x, drop toward 1x if the frame rate sags.
  const [dpr, setDpr] = useState(LIGHT_MODE ? 1 : MAX_DPR)
  const voice = useGuideVoice()
  const welcome = useWelcomeDialogue()
  const { speak } = voice
  const greeted = useRef(new Set<GuideSpot>())

  // Wheel / trackpad, touch, arrow keys -> walking (and "next line" during the welcome).
  useEffect(() => attachWalkInput(), [])

  // "Tap to begin": the first tap / click / key press enables sound (browsers require a gesture).
  useEffect(() => {
    const onFirst = () => enableSound()
    window.addEventListener('pointerdown', onFirst, { once: true })
    window.addEventListener('keydown', onFirst, { once: true })
    return () => {
      window.removeEventListener('pointerdown', onFirst)
      window.removeEventListener('keydown', onFirst)
    }
  }, [])

  // Üki's arrivals drive the welcome; in the hall it speaks once per case.
  const handleArrive = useCallback(
    (spot: GuideSpot) => {
      if (greeted.current.has(spot)) return
      greeted.current.add(spot)
      if (spot === SPOT.welcome) advanceStage('speak') // gathered in front of the visitor
      else if (spot === SPOT.door) advanceStage('open')
      else if (spot === SPOT.inside) return
      else speak(spot >= CASES.length ? 'end' : 'case')
    },
    [speak],
  )

  return (
    <>
      <Canvas
        flat
        shadows={false}
        dpr={dpr}
        camera={{ position: [0, 1.2, 22], fov: 60, near: 0.1, far: 60 }}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
      >
        {!LIGHT_MODE && (
          <PerformanceMonitor
            onChange={({ factor }) => setDpr(Math.round((MIN_DPR + (MAX_DPR - MIN_DPR) * factor) * 4) / 4)}
          />
        )}
        <MuseumScene
          ukiSpeaking={welcome.active || voice.speaking}
          ukiAudio={voice.audio}
          onUkiArrive={handleArrive}
          ukiWingsOpen={welcome.active}
          ukiPulseKey={welcome.active ? welcome.lineKey : undefined}
        />
        <Effects />
        <DevPerf />
      </Canvas>
      <Subtitles
        text={welcome.text ?? voice.subtitle}
        revealAll={welcome.revealAll}
        awaitInput={welcome.active}
      />
      <OpeningAnnouncer />
      <WalkHint />
      <NextButton />
      <SoundButton />
    </>
  )
}
