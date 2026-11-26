import { nextPhase, type CasePhase } from './caseState.ts'
import { VISIT_END, WAKE_END } from './timeline.ts'

/**
 * What is awake in the hall, and what the awakening is doing right now.
 * Plain module state (no React, no DOM), so it lives for the whole visit:
 * going to the decision room and back does not reset it.
 */
type Mode = 'wake' | 'visit'

export type AwakeLine = { text: string; color: string }

export const awake = {
  /** Phase of every case that has been touched; missing = stone. */
  phases: {} as Record<string, CasePhase>,
  /** The case being awakened or visited, if any. While set, walking and clicks are ignored. */
  active: null as string | null,
  mode: null as Mode | null,
  /** Seconds since the click on the active case. */
  t: 0,
  /** The panel (story button / facts) is open. */
  panel: false,
  /** The animal's line, shown as a subtitle in its color. */
  line: null as AwakeLine | null,
  /** The line to say when the ghost has formed. */
  pendingLine: null as AwakeLine | null,
  /** Seconds (on `t`) at which the line fades again. */
  lineUntil: 0,
}

/** A new object on every change, so React can compare snapshots. */
export type AwakeSnapshot = {
  active: string | null
  panel: boolean
  line: AwakeLine | null
}

let snapshot: AwakeSnapshot = { active: null, panel: false, line: null }
const listeners = new Set<() => void>()

function publish() {
  snapshot = { active: awake.active, panel: awake.panel, line: awake.line }
  listeners.forEach((l) => l())
}

export function subscribeAwake(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getAwakeSnapshot(): AwakeSnapshot {
  return snapshot
}

export function getPhase(caseId: string): CasePhase {
  return awake.phases[caseId] ?? 'stone'
}

/** How long a line stays on screen: typing plus reading time, seconds. */
export function lineSeconds(text: string): number {
  return (text.length * 45) / 1000 + Math.max(2.5, (text.length * 65) / 1000) + 1
}

/**
 * The visitor touched a case. A stone case starts waking; an awake case is only visited.
 * Ignored (returns false) while another awakening or visit is running.
 */
export function startAwake(caseId: string, line: AwakeLine | null): boolean {
  if (awake.active !== null) return false
  const phase = getPhase(caseId)
  if (phase === 'waking') return false
  awake.active = caseId
  awake.t = 0
  awake.panel = false
  awake.line = null
  awake.pendingLine = line
  if (phase === 'stone') {
    awake.phases[caseId] = nextPhase(phase, 'wake')
    awake.mode = 'wake'
  } else {
    awake.mode = 'visit'
  }
  publish()
  return true
}

/** Advances the running awakening by `dt` seconds. Called once per frame. */
export function tickAwake(dt: number): void {
  const id = awake.active
  if (id === null || !Number.isFinite(dt) || dt <= 0) return
  awake.t += dt
  const end = awake.mode === 'wake' ? WAKE_END : VISIT_END
  let changed = false

  if (!awake.panel && awake.t >= end) {
    if (awake.mode === 'wake') awake.phases[id] = nextPhase(getPhase(id), 'finish')
    awake.panel = true
    awake.line = awake.pendingLine
    awake.lineUntil = awake.line ? awake.t + lineSeconds(awake.line.text) : 0
    changed = true
  } else if (awake.line && awake.t >= awake.lineUntil) {
    awake.line = null
    changed = true
  }
  if (changed) publish()
}

/** The visitor is done with this case: the camera returns and walking works again. */
export function leaveAwake(): void {
  if (awake.active === null) return
  const id = awake.active
  // Leaving in the middle of the wake-up: the ghost is finished, never left half-built.
  if (getPhase(id) === 'waking') awake.phases[id] = nextPhase('waking', 'finish')
  awake.active = null
  awake.mode = null
  awake.panel = false
  awake.line = null
  awake.pendingLine = null
  awake.t = 0
  publish()
}

/** Back to a fresh visit (tests only). */
export function resetAwake(): void {
  awake.phases = {}
  awake.active = null
  awake.mode = null
  awake.t = 0
  awake.panel = false
  awake.line = null
  awake.pendingLine = null
  awake.lineUntil = 0
  publish()
}
