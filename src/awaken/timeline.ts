/**
 * The awakening, in seconds from the click. Pure: the same time always gives the
 * same picture, so every case plays it identically.
 *
 *  0 – 1.5   the camera glides close (other input is ignored)
 *  1.5 – 2.5 thin crack lines spread over the glass
 *  2.5 – 3.5 the glass fades away softly
 *  3.5 – 5.5 the stone statue breaks into particles, drifting outward
 *  5.5 – 8   the particles gather back into the animal as a glowing ghost
 *  8         the animal speaks
 */
export const GLIDE_END = 1.5
const CRACKS = { start: GLIDE_END, length: 1 }
const GLASS = { start: CRACKS.start + CRACKS.length, length: 1 }
const SHATTER = { start: GLASS.start + GLASS.length, length: 2 }
const GATHER = { start: SHATTER.start + SHATTER.length, length: 2.5 }
/** When the ghost is fully formed (the wake-up ends here). */
export const WAKE_END = GATHER.start + GATHER.length
/** A visit to an already awake case only needs the camera glide. */
export const VISIT_END = GLIDE_END

/** Each value is 0..1. */
export type Progress = {
  /** Crack lines have spread over the glass. */
  cracks: number
  /** The glass has faded away. */
  glass: number
  /** The statue has broken into particles and drifted out. */
  shatter: number
  /** The particles have gathered back into the ghost. */
  gather: number
}

export const NONE: Progress = { cracks: 0, glass: 0, shatter: 0, gather: 0 }
export const FULL: Progress = { cracks: 1, glass: 1, shatter: 1, gather: 1 }

const part = (t: number, s: { start: number; length: number }) =>
  Math.min(1, Math.max(0, (t - s.start) / s.length))

/** Progress of every step at time t (seconds since the click). NaN and negative times count as 0. */
export function wakeProgress(t: number): Progress {
  const time = Number.isFinite(t) ? t : 0
  return {
    cracks: part(time, CRACKS),
    glass: part(time, GLASS),
    shatter: part(time, SHATTER),
    gather: part(time, GATHER),
  }
}
