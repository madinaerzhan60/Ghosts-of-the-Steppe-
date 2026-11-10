// Walking input: wheel / trackpad, touch drag, arrow keys and the "Next" button
// all move one target value, measured in "pages" (one viewport height of scrolling
// = one page). The camera follows that target with damping (CameraRig).
//
// Discrete "intents" (start of a wheel gesture, a swipe, a key, a click, Next) are
// broadcast separately, so the dialogue can use them to show the next line.

import { useSyncExternalStore } from 'react'

const state = {
  target: 0,
  min: 0,
  max: 0,
  /** True once the visitor has moved forward at all (hides the "scroll to walk" hint). */
  started: false,
}

let stops: readonly number[] = []
const intentListeners = new Set<() => void>()
const changeListeners = new Set<() => void>()

const ARROW_STEP = 0.3 // pages per arrow key press
const TOUCH_GAIN = 1.3 // a full-height swipe walks a bit more than a page
const WHEEL_GESTURE_GAP = 350 // ms of silence that separates two wheel gestures

function emitIntent() {
  intentListeners.forEach((l) => l())
}

function setTarget(value: number) {
  state.target = Math.min(state.max, Math.max(state.min, value))
  if (!state.started && state.target > 0.02) {
    state.started = true
    changeListeners.forEach((l) => l())
  }
}

/** Current target, pages. */
export function getWalkTarget() {
  return state.target
}

/** The walk is gated by the opening (e.g. stopped at the closed doors). */
export function setWalkLimits(min: number, max: number) {
  state.min = min
  state.max = Math.max(min, max)
  setTarget(state.target)
}

/** Resting points along the walk (pages), used by Next / Page Down / Space. */
export function setWalkStops(values: readonly number[]) {
  stops = [...values].sort((a, b) => a - b)
}

/** Move to the next resting point (and count as an intent). */
export function walkNext() {
  const next = stops.find((s) => s > state.target + 0.05)
  if (next !== undefined) setTarget(next)
  emitIntent()
}

function walkPrevious() {
  const prev = [...stops].reverse().find((s) => s < state.target - 0.05)
  if (prev !== undefined) setTarget(prev)
}

export function onWalkIntent(listener: () => void): () => void {
  intentListeners.add(listener)
  return () => {
    intentListeners.delete(listener)
  }
}

export function useWalkStarted(): boolean {
  return useSyncExternalStore(
    (l) => {
      changeListeners.add(l)
      return () => {
        changeListeners.delete(l)
      }
    },
    () => state.started,
  )
}

const isControl = (t: EventTarget | null) =>
  t instanceof HTMLElement && !!t.closest('button, a, input, select, textarea')

/** Attach the window listeners once; returns a cleanup function. */
export function attachWalkInput(): () => void {
  let lastWheel = 0
  let touchY: number | null = null
  let touchMoved = 0

  const onWheel = (e: WheelEvent) => {
    const px = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY
    setTarget(state.target + px / Math.max(1, window.innerHeight))
    const now = performance.now()
    if (now - lastWheel > WHEEL_GESTURE_GAP) emitIntent()
    lastWheel = now
  }

  const onTouchStart = (e: TouchEvent) => {
    touchY = e.touches[0]?.clientY ?? null
    touchMoved = 0
  }
  const onTouchMove = (e: TouchEvent) => {
    const y = e.touches[0]?.clientY
    if (touchY === null || y === undefined) return
    const dy = touchY - y // finger up = walk forward
    touchY = y
    touchMoved += Math.abs(dy)
    setTarget(state.target + (dy / Math.max(1, window.innerHeight)) * TOUCH_GAIN)
  }
  const onTouchEnd = () => {
    if (touchMoved > 40) emitIntent() // a swipe (taps arrive as pointerdown)
    touchY = null
  }

  const onKey = (e: KeyboardEvent) => {
    if (isControl(e.target)) return // let focused buttons handle Space / Enter
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        setTarget(state.target + ARROW_STEP)
        emitIntent()
        break
      case 'ArrowUp':
      case 'ArrowLeft':
        setTarget(state.target - ARROW_STEP)
        break
      case 'PageDown':
      case ' ':
      case 'Enter':
        e.preventDefault()
        walkNext()
        break
      case 'PageUp':
        e.preventDefault()
        walkPrevious()
        break
    }
  }

  const onPointer = (e: PointerEvent) => {
    if (!isControl(e.target)) emitIntent() // click / tap anywhere: next line
  }

  window.addEventListener('wheel', onWheel, { passive: true })
  window.addEventListener('touchstart', onTouchStart, { passive: true })
  window.addEventListener('touchmove', onTouchMove, { passive: true })
  window.addEventListener('touchend', onTouchEnd, { passive: true })
  window.addEventListener('keydown', onKey)
  window.addEventListener('pointerdown', onPointer)
  return () => {
    window.removeEventListener('wheel', onWheel)
    window.removeEventListener('touchstart', onTouchStart)
    window.removeEventListener('touchmove', onTouchMove)
    window.removeEventListener('touchend', onTouchEnd)
    window.removeEventListener('keydown', onKey)
    window.removeEventListener('pointerdown', onPointer)
  }
}
