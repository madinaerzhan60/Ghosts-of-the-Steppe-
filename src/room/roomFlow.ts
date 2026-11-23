import { DECISION_COUNT, type Choice } from './decisions'

/**
 * The visitor's path through the room:
 *  choosing – a decision is on screen, waiting for a choice
 *  reacting – the slope changes and the leopard speaks; waits for "Continue"
 *  ending   – the "Your mountains" summary
 * The number of choices made so far says which decision comes next.
 */
export type Phase = 'choosing' | 'reacting' | 'ending'

export type Flow = {
  phase: Phase
  choices: readonly Choice[]
}

export type FlowAction = { type: 'choose'; choice: Choice } | { type: 'continue' } | { type: 'restart' }

export const INITIAL_FLOW: Flow = { phase: 'choosing', choices: [] }

export function flowReducer(flow: Flow, action: FlowAction): Flow {
  switch (action.type) {
    case 'choose':
      // Ignore stray taps (double clicks, keys) while the slope is still reacting.
      if (flow.phase !== 'choosing') return flow
      return { phase: 'reacting', choices: [...flow.choices, action.choice] }
    case 'continue':
      if (flow.phase !== 'reacting') return flow
      return flow.choices.length >= DECISION_COUNT ? { ...flow, phase: 'ending' } : { ...flow, phase: 'choosing' }
    case 'restart':
      return INITIAL_FLOW
  }
}
