import { Canvas } from '@react-three/fiber'
import type { CSSProperties } from 'react'
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { animalColor } from '../content/animalColor'
import { LIGHT_MODE } from '../config/quality'
import { Effects } from '../scene/Effects'
import { DecisionCards } from './DecisionCards'
import { decide, epilogue, type Choice } from './decisions'
import { Ending } from './Ending'
import { LeopardLine, LINE_STEP_SECONDS } from './LeopardLine'
import { flowReducer, INITIAL_FLOW } from './roomFlow'
import { RoomScene } from './RoomScene'
import { ROOM_TEXT } from './roomText'
import { storyTargets } from './storyLive'
import './room.css'

/** The cub appears this long after the room opens (the scene fades in first). */
const CUB_DELAY_MS = 3500
/** After the last epilogue line has appeared: time to read it, then the lines fade. */
const LAST_LINE_HOLD_MS = 4200
/** Fade of the lines (see room.css), then the final image is held in silence. */
const LINES_FADE_MS = 1500
const SILENCE_MS = 3000
/** How long Üki's line stays before the summary fades in. */
const BRIDGE_MS = 7000

const lineBeatMs = (count: number) => (count - 1) * LINE_STEP_SECONDS * 1000

/** The snow leopard's story: a prologue, four seasons of decisions, an epilogue, and what people really did. */
export function DecisionRoom() {
  const [flow, dispatch] = useReducer(flowReducer, INITIAL_FLOW)
  /** True once the epilogue's lines have faded: the final image is held in silence. */
  const [silent, setSilent] = useState(false)
  const state = useMemo(() => decide(flow.choices), [flow.choices])
  const mood = epilogue(flow.choices)
  const index = flow.phase === 'choosing' ? flow.choices.length : flow.choices.length - 1

  // The lines on screen now. Silence and the ending have none.
  const lines = useMemo<readonly string[] | null>(() => {
    switch (flow.phase) {
      case 'prologue':
        return ROOM_TEXT.prologue
      case 'reacting':
        return ROOM_TEXT.decisions[index]!.reaction[flow.choices[flow.choices.length - 1] as Choice]
      case 'epilogue':
        return silent ? null : ROOM_TEXT.epilogue[mood]
      case 'bridge':
        return [ROOM_TEXT.bridge]
      default:
        return null
    }
  }, [flow, index, mood, silent])

  // The cub appears a few seconds into the prologue (and again after "Live her life again").
  useEffect(() => {
    if (flow.phase !== 'prologue') return
    storyTargets.cub = false
    const id = window.setTimeout(() => (storyTargets.cub = true), CUB_DELAY_MS)
    return () => window.clearTimeout(id)
  }, [flow.phase])

  // The epilogue's image plays from the epilogue on and stays through the ending.
  useEffect(() => {
    storyTargets.epilogue = flow.phase === 'epilogue' || flow.phase === 'bridge' || flow.phase === 'ending' ? mood : null
  }, [flow.phase, mood])

  // Epilogue: lines, then 3 seconds of silence with only the final image, then Üki.
  useEffect(() => {
    if (flow.phase !== 'epilogue') return
    const count = ROOM_TEXT.epilogue[mood].length
    const hide = window.setTimeout(() => setSilent(true), lineBeatMs(count) + LAST_LINE_HOLD_MS)
    const next = window.setTimeout(
      () => dispatch({ type: 'advance' }),
      lineBeatMs(count) + LAST_LINE_HOLD_MS + LINES_FADE_MS + SILENCE_MS,
    )
    return () => {
      window.clearTimeout(hide)
      window.clearTimeout(next)
    }
  }, [flow.phase, mood])

  // Üki's line, then the summary.
  useEffect(() => {
    if (flow.phase !== 'bridge') return
    const id = window.setTimeout(() => dispatch({ type: 'advance' }), BRIDGE_MS)
    return () => window.clearTimeout(id)
  }, [flow.phase])

  const choose = useCallback((choice: Choice) => dispatch({ type: 'choose', choice }), [])
  const waiting = flow.phase === 'prologue' || flow.phase === 'reacting'
  const beatLength = lines?.length ?? 1

  return (
    <>
      <Canvas
        flat
        shadows={false}
        dpr={LIGHT_MODE ? 1 : [1, 1.5]}
        camera={{ position: [0, 0, 15], fov: 55, near: 0.1, far: 60 }}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        className="room-canvas"
      >
        <RoomScene target={state} />
        <Effects />
      </Canvas>

      <div className="room-ui" style={{ '--animal': animalColor('snow-leopard') } as CSSProperties}>
        {flow.phase === 'choosing' && <DecisionCards key={index} index={index} onChoose={choose} />}

        {flow.phase !== 'ending' && (
          <LeopardLine
            lines={lines}
            speaker={flow.phase === 'bridge' ? ROOM_TEXT.guide : ROOM_TEXT.speaker}
            tone={flow.phase === 'bridge' ? 'guide' : 'leopard'}
          />
        )}

        {waiting && (
          <button
            key={flow.phase + flow.choices.length}
            type="button"
            className="room-button room-continue"
            // Appears once the last line has started; focus follows so keyboard visitors keep their place.
            style={{ animationDelay: `${(beatLength - 1) * LINE_STEP_SECONDS + 1.6}s` }}
            onAnimationStart={(e) => e.currentTarget.focus({ preventScroll: true })}
            onClick={() => dispatch({ type: 'continue' })}
          >
            {ROOM_TEXT.continue}
          </button>
        )}

        {(flow.phase === 'epilogue' || flow.phase === 'bridge') && (
          <button type="button" className="room-skip" onClick={() => dispatch({ type: 'advance' })}>
            {ROOM_TEXT.skip}
          </button>
        )}

        {flow.phase === 'ending' && <Ending
            onAgain={() => {
              setSilent(false)
              dispatch({ type: 'restart' })
            }}
          />}
      </div>
    </>
  )
}
