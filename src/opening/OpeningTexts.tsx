import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import { MathUtils } from 'three'
import { LANG } from '../content/lang'
import opening from '../content/opening.json' with { type: 'json' }
import { SCRIPT } from '../content/script'
import { OPENING } from '../scene/cameraPath'
import { palette } from '../theme/palette'
import { FONT } from './fonts'
import { OpeningLine } from './OpeningLine'
import { OPENING_TEXT } from './openingLayout'
import { openingLive, setAnnouncement } from './openingStore'
import { TitleParticles, type TitleTimeline } from './TitleParticles'

// The title gathers out of the fog on its own when the page opens (seconds)...
const TITLE_GATHER = [0.6, 4.6] as const
const WHISPER_AT = 4.2
// ...and fades as the visitor walks through 0–20% of the opening (fractions).
const TITLE_FADE = [0.04, OPENING.titleEnd] as const
const WHISPER_HIDE = 0.15
const LETTER_TIME = 0.085 // whispered, letter by letter

const T = {
  title: opening.title[LANG],
  whisper: SCRIPT.whisper.text,
}


/** Title and whispered line, floating in the 3D sky above the museum. (The hint is screen UI.) */
export function OpeningTexts() {
  const [timeShown, setTimeShown] = useState({ whisper: false })
  const [whisperGone, setWhisperGone] = useState(false)
  const start = useRef(-1)
  const title = useRef<TitleTimeline>({ gather: 0, dissolve: 0 })

  useFrame(({ clock }) => {
    if (start.current < 0) {
      start.current = clock.elapsedTime
      setAnnouncement(T.title)
    }
    const t = clock.elapsedTime - start.current
    const o = openingLive.opening
    title.current.gather = MathUtils.clamp((t - TITLE_GATHER[0]) / (TITLE_GATHER[1] - TITLE_GATHER[0]), 0, 1)
    title.current.dissolve = MathUtils.smoothstep(o, TITLE_FADE[0], TITLE_FADE[1])

    // Re-render only when something switches.
    if (!timeShown.whisper && t >= WHISPER_AT) {
      setTimeShown((s) => ({ ...s, whisper: true }))
      setAnnouncement(T.whisper)
    }
    if (!whisperGone && o >= WHISPER_HIDE) setWhisperGone(true)
  })

  return (
    <group>
      <TitleParticles
        text={T.title}
        position={OPENING_TEXT.title.pos}
        width={OPENING_TEXT.title.width}
        timeline={title}
      />
      <OpeningLine
        text={T.whisper}
        font={FONT.title}
        color={palette.uki}
        height={OPENING_TEXT.whisper.height}
        position={OPENING_TEXT.whisper.pos}
        show={timeShown.whisper && !whisperGone}
        letterTime={LETTER_TIME}
        opacity={0.9}
      />
    </group>
  )
}
