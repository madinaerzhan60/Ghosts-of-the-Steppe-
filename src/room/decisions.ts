/**
 * The decision room's logic: a pure function from the visitor's choices to the
 * look of the mountain slope. No React, no randomness, no clock.
 *
 * Choice "A" is the harmful option and "B" the protective one in all four decisions.
 * A decision that has not been made yet changes nothing.
 */

export type Choice = 'A' | 'B'

/** Each value is 0..1. */
export type RoomState = {
  /** How brightly the snow leopard glows. 0 = almost gone, 1 = fully lit. */
  leopard: number
  /** How far the city lights have crept up the slope. 0 = low in the valley, 1 = up to the leopard. */
  city: number
  /** How many ibex graze on the slope. 0 = none, 1 = the full herd. */
  ibex: number
}

export const DECISION_COUNT = 4

/**
 * Whole points per decision (road, ski resort, rangers, herder). Integers keep the
 * arithmetic exact, so the same choices always give bit-identical results.
 * Each column adds up to 50, so four protective choices reach exactly 1 and four
 * harmful ones exactly 0 (from a neutral start of 50).
 */
const POINTS = {
  leopard: [14, 12, 12, 12],
  city: [15, 15, 8, 12],
  ibex: [14, 14, 12, 10],
} as const

const START = 50
const SCALE = 100

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

function total(weights: readonly number[], choices: readonly Choice[], protectIsUp: boolean): number {
  let sum = START
  for (let i = 0; i < Math.min(choices.length, DECISION_COUNT); i++) {
    const protect = choices[i] === 'B'
    sum += protect === protectIsUp ? weights[i]! : -weights[i]!
  }
  return clamp01(sum / SCALE)
}

/** Choices made so far (0 to 4, in order) -> the state of the slope. */
export function decide(choices: readonly Choice[]): RoomState {
  return {
    leopard: total(POINTS.leopard, choices, true),
    city: total(POINTS.city, choices, false), // protective choices push the city back
    ibex: total(POINTS.ibex, choices, true),
  }
}

export type Level = 'low' | 'mid' | 'high'

/** A value as a word, for the summary (no numbers are shown to the visitor). */
export function level(value: number): Level {
  if (value < 0.35) return 'low'
  if (value > 0.65) return 'high'
  return 'mid'
}

/** Which epilogue the story ends with. */
export type Epilogue = 'bright' | 'middle' | 'faded'

/**
 * By how many harmful (A) choices were made: 0-1 = bright, 2 = middle, 3-4 = faded.
 * (Counting choices, not the leopard's brightness, keeps the ending easy to explain.)
 */
export function epilogue(choices: readonly Choice[]): Epilogue {
  const harmful = choices.slice(0, DECISION_COUNT).filter((c) => c === 'A').length
  if (harmful <= 1) return 'bright'
  if (harmful === 2) return 'middle'
  return 'faded'
}
