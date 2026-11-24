import type { Epilogue } from './decisions'

/** What the story wants on screen. Written by DecisionRoom when the phase changes. */
export const storyTargets = {
  /** The cub is next to her. */
  cub: false,
  /** Which epilogue is playing, or null before it starts. */
  epilogue: null as Epilogue | null,
}

/** How long the epilogue's final image takes to form, seconds. */
export const EPILOGUE_SECONDS = 12

/**
 * What is drawn right now (eased by RoomDirector, read every frame by the scene parts).
 */
export const storyLive = {
  /** 0 = no cub, 1 = cub fully there. */
  cub: 0,
  epilogue: null as Epilogue | null,
  /** Seconds since the epilogue began. */
  t: 0,
  /** 0..1, how much of the epilogue is on screen (eases in and out). */
  amount: 0,
}

/**
 * 0..1: how far the epilogue image has formed. Eased at both ends, and scaled by
 * `amount` so it also eases back when the visitor starts over.
 */
export function epilogueProgress(): number {
  const x = Math.min(1, Math.max(0, storyLive.t / EPILOGUE_SECONDS))
  return x * x * (3 - 2 * x) * storyLive.amount
}
