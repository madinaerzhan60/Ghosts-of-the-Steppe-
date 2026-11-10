import { useSyncExternalStore } from 'react'

/**
 * Üki's welcome, as a state machine (forward only):
 *  title  – 0–20% of the opening walk: the title glows, then fades; the whisper line
 *  walk   – 20–60%: walking toward the museum through the grass
 *  arrive – at 60% the walk stops; two amber eyes open above the doors and Üki gathers
 *  speak  – Üki speaks three lines (click / scroll / key / Next for the next line)
 *  fly    – after the last line Üki flies down to the doors
 *  open   – the doors creak open by themselves
 *  enter  – scrolling again carries the visitor into the hall (60–100%)
 *  hall   – the museum walk (cases) takes over
 */
export const STAGES = ['title', 'walk', 'arrive', 'speak', 'fly', 'open', 'enter', 'hall'] as const
export type Stage = (typeof STAGES)[number]

const state = {
  stage: 'title' as Stage,
  /** Text currently shown in 3D, mirrored for screen readers. */
  announce: '',
}

/** Per-frame values shared between scene components (not reactive). */
export const openingLive = {
  /** Smoothed camera position along the walk, pages (written by CameraRig). */
  cameraPages: 0,
  /** Same, as a fraction of the opening walk, 0..1. */
  opening: 0,
  /** Door opening, 0 closed .. 1 fully open (written by the doors). */
  doorOpen: 0,
  /** Üki is heading to / at the welcome spot in front of the doors (camera moves in). */
  ukiWelcome: false,
}

const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function getStage(): Stage {
  return state.stage
}

/** Stages only move forward. */
export function advanceStage(next: Stage) {
  if (STAGES.indexOf(next) <= STAGES.indexOf(state.stage)) return
  state.stage = next
  notify()
}

export function stageAtLeast(stage: Stage, min: Stage) {
  return STAGES.indexOf(stage) >= STAGES.indexOf(min)
}

export function setAnnouncement(text: string) {
  if (state.announce === text) return
  state.announce = text
  notify()
}

export function useStage(): Stage {
  return useSyncExternalStore(subscribe, () => state.stage)
}

export function useAnnouncement(): string {
  return useSyncExternalStore(subscribe, () => state.announce)
}
