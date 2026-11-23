import { Canvas } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { LIGHT_MODE } from '../config/quality'
import { Effects } from '../scene/Effects'
import { DecisionCards } from './DecisionCards'
import { decide, type Choice } from './decisions'
import { Ending } from './Ending'
import { LeopardLine } from './LeopardLine'
import { flowReducer, INITIAL_FLOW } from './roomFlow'
import { RoomScene } from './RoomScene'
import { ROOM_TEXT } from './roomText'
import './room.css'

/** The snow leopard decision room: four choices, one night slope, one ending. */
export function DecisionRoom() {
  const [flow, dispatch] = useReducer(flowReducer, INITIAL_FLOW)
  const [summaryOpen, setSummaryOpen] = useState(true)
  const continueButton = useRef<HTMLButtonElement>(null)

  const state = useMemo(() => decide(flow.choices), [flow.choices])
  const index = flow.phase === 'choosing' ? flow.choices.length : flow.choices.length - 1

  // What the leopard says now: an intro, then one line per choice, then her last line.
  const line = useMemo(() => {
    if (flow.phase === 'ending') {
      return ROOM_TEXT.ending.finalLine[state.leopard >= 0.5 ? 'bright' : 'faded']
    }
    if (flow.phase === 'reacting') {
      const last = flow.choices[flow.choices.length - 1] as Choice
      return ROOM_TEXT.decisions[index]!.reaction[last]
    }
    return flow.choices.length === 0 ? ROOM_TEXT.intro : null
  }, [flow, index, state.leopard])

  const choose = useCallback((choice: Choice) => dispatch({ type: 'choose', choice }), [])

  // After a choice, focus moves to "Continue" so keyboard visitors never lose their place.
  useEffect(() => {
    if (flow.phase === 'reacting') continueButton.current?.focus({ preventScroll: true })
  }, [flow.phase])

  const tryAgain = () => {
    setSummaryOpen(true)
    dispatch({ type: 'restart' })
  }

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

      <div className="room-ui">
        {flow.phase === 'choosing' && <DecisionCards key={index} index={index} onChoose={choose} />}

        {flow.phase !== 'ending' || !summaryOpen ? <LeopardLine text={line} /> : null}

        {flow.phase === 'reacting' && (
          <button ref={continueButton} type="button" className="room-button room-continue" onClick={() => dispatch({ type: 'continue' })}>
            {ROOM_TEXT.continue}
          </button>
        )}

        {flow.phase === 'ending' &&
          (summaryOpen ? (
            <Ending state={state} onTryAgain={tryAgain} onKeepHere={() => setSummaryOpen(false)} />
          ) : (
            <div className="room-keep">
              <button type="button" className="room-button room-button--quiet" onClick={() => setSummaryOpen(true)}>
                {ROOM_TEXT.ending.showSummary}
              </button>
              <button type="button" className="room-button room-button--quiet" onClick={tryAgain}>
                {ROOM_TEXT.ending.tryAgain}
              </button>
            </div>
          ))}
      </div>
    </>
  )
}
