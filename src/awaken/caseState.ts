/**
 * The state of one display case for the whole visit:
 * stone (forgotten) -> waking (the awakening is playing) -> ghost (remembered).
 * It only moves forward: a case never goes back to stone, and never jumps from
 * stone to ghost without waking first.
 */
export type CasePhase = 'stone' | 'waking' | 'ghost'

export type CaseEvent = 'wake' | 'finish'

export const PHASE_ORDER: readonly CasePhase[] = ['stone', 'waking', 'ghost']

export function phaseRank(phase: CasePhase): number {
  return PHASE_ORDER.indexOf(phase)
}

/** The next phase for an event. Events that don't fit the current phase change nothing. */
export function nextPhase(phase: CasePhase, event: CaseEvent): CasePhase {
  if (phase === 'stone' && event === 'wake') return 'waking'
  if (phase === 'waking' && event === 'finish') return 'ghost'
  return phase
}
