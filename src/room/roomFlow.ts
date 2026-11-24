import { DECISION_COUNT, type Choice } from './decisions.ts' // with extension: the tests run it in Node

/**
 * The visitor's path through the story:
 *  prologue  – the leopard introduces herself and her cub; waits for "Continue"
 *  choosing  – a season's decision is on screen, waiting for a choice
 *  reacting  – the slope changes and she speaks; waits for "Continue"
 *  epilogue  – her last lines and the final image, then silence (timed, no input)
 *  bridge    – Üki speaks (timed)
 *  ending    – "What people really did"
 * The number of choices made so far says which season comes next.
 */
export type Phase = 'prologue' | 'choosing' | 'reacting' | 'epilogue' | 'bridge' | 'ending'

export type Flow = {
  phase: Phase
  choices: readonly Choice[]
}

export type FlowAction =
  | { type: 'choose'; choice: Choice }
  | { type: 'continue' }
  /** A timed step is over: epilogue -> bridge -> ending. */
  | { type: 'advance' }
  | { type: 'restart' }

export const INITIAL_FLOW: Flow = { phase: 'prologue', choices: [] }

export function flowReducer(flow: Flow, action: FlowAction): Flow {
  switch (action.type) {
    case 'choose':
      // Ignore stray taps (double clicks, keys) while the slope is still reacting.
      if (flow.phase !== 'choosing') return flow
      return { phase: 'reacting', choices: [...flow.choices, action.choice] }
    case 'continue':
      if (flow.phase === 'prologue') return { ...flow, phase: 'choosing' }
      if (flow.phase !== 'reacting') return flow
      return { ...flow, phase: flow.choices.length >= DECISION_COUNT ? 'epilogue' : 'choosing' }
    case 'advance':
      if (flow.phase === 'epilogue') return { ...flow, phase: 'bridge' }
      if (flow.phase === 'bridge') return { ...flow, phase: 'ending' }
      return flow
    case 'restart':
      return INITIAL_FLOW
  }
}
