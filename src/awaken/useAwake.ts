import { useSyncExternalStore } from 'react'
import { getAwakeSnapshot, getPhase, subscribeAwake } from './awakeStore'
import type { CasePhase } from './caseState'

/** The awakening as React state: who is active, whether the panel is open, the line to show. */
export function useAwakeSnapshot() {
  return useSyncExternalStore(subscribeAwake, getAwakeSnapshot)
}

/** The phase of one case (stone, waking or ghost). */
export function useCasePhase(caseId: string): CasePhase {
  return useSyncExternalStore(subscribeAwake, () => getPhase(caseId))
}
