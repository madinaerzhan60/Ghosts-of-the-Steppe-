// Procedural night sound (no audio files): wind over the steppe and a door creak.
// Everything fades in and out slowly — no sudden or loud sounds (look.md).
// The AudioContext can only start after a user gesture, see enableSound().

import { useSyncExternalStore } from 'react'

type Graph = {
  ctx: AudioContext
  master: GainNode
  windLevel: GainNode
}

let graph: Graph | null = null
const state = { enabled: false, muted: false }
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

const MASTER = 0.9
const FADE = 1.2 // seconds (time constant)

function build(): Graph | null {
  if (typeof AudioContext === 'undefined') return null
  const ctx = new AudioContext()
  const master = ctx.createGain()
  master.gain.value = 0
  master.connect(ctx.destination)

  // Soft brown noise, looped.
  const len = ctx.sampleRate * 4
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  let last = 0
  for (let i = 0; i < len; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02
    data[i] = last * 3.5
  }
  const noise = ctx.createBufferSource()
  noise.buffer = buffer
  noise.loop = true

  // Wind: band-passed noise whose colour and loudness drift very slowly.
  const band = ctx.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.value = 480
  band.Q.value = 0.8
  const sweep = ctx.createOscillator()
  sweep.frequency.value = 0.07
  const sweepDepth = ctx.createGain()
  sweepDepth.gain.value = 200
  sweep.connect(sweepDepth).connect(band.frequency)

  const gust = ctx.createGain()
  gust.gain.value = 0.16
  const gustLfo = ctx.createOscillator()
  gustLfo.frequency.value = 0.045
  const gustDepth = ctx.createGain()
  gustDepth.gain.value = 0.07
  gustLfo.connect(gustDepth).connect(gust.gain)

  const windLevel = ctx.createGain()
  windLevel.gain.value = 1
  noise.connect(band).connect(gust).connect(windLevel).connect(master)
  noise.start()
  sweep.start()
  gustLfo.start()
  return { ctx, master, windLevel }
}

function applyVolume() {
  if (!graph) return
  const target = state.enabled && !state.muted ? MASTER : 0
  graph.master.gain.setTargetAtTime(target, graph.ctx.currentTime, FADE)
}

/** Call from a user gesture (first tap / click / key). Safe to call many times. */
export function enableSound() {
  if (!graph) graph = build()
  if (!graph) return
  if (graph.ctx.state === 'suspended') void graph.ctx.resume()
  if (!state.enabled) {
    state.enabled = true
    notify()
  }
  applyVolume()
}

export function setMuted(muted: boolean) {
  if (!muted) enableSound()
  if (state.muted === muted) return
  state.muted = muted
  applyVolume()
  notify()
}

/** 0..1: full wind outside, a faint draught inside the hall. */
export function setWindLevel(level: number) {
  if (!graph) return
  graph.windLevel.gain.setTargetAtTime(Math.min(1, Math.max(0, level)), graph.ctx.currentTime, 1.5)
}

/** Slow, quiet creak of old doors (~3.5 s). Purely decorative: never carries information. */
export function playCreak() {
  if (!graph || !state.enabled || state.muted) return
  const { ctx, master } = graph
  const t = ctx.currentTime

  const osc = ctx.createOscillator()
  osc.type = 'sawtooth'
  // Wandering pitch: wood rubbing on an old hinge.
  const steps = 64
  const curve = new Float32Array(steps)
  let f = 95
  for (let i = 0; i < steps; i++) {
    f = Math.min(150, Math.max(70, f + (Math.random() - 0.45) * 9))
    curve[i] = f
  }
  osc.frequency.setValueCurveAtTime(curve, t, 3.4)

  const band = ctx.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.value = 1000
  band.Q.value = 5

  // Stick-slip flutter
  const flutter = ctx.createGain()
  flutter.gain.value = 0.55
  const flutterLfo = ctx.createOscillator()
  flutterLfo.frequency.value = 13
  const flutterDepth = ctx.createGain()
  flutterDepth.gain.value = 0.45
  flutterLfo.connect(flutterDepth).connect(flutter.gain)

  const env = ctx.createGain()
  env.gain.setValueAtTime(0, t)
  env.gain.setTargetAtTime(0.05, t, 0.35) // soft attack
  env.gain.setTargetAtTime(0, t + 2.6, 0.45) // soft release

  osc.connect(band).connect(flutter).connect(env).connect(master)
  osc.start(t)
  flutterLfo.start(t)
  osc.stop(t + 4.5)
  flutterLfo.stop(t + 4.5)
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

/** True when sound is audible (enabled by a gesture and not muted). */
export function useSoundOn(): boolean {
  return useSyncExternalStore(subscribe, () => state.enabled && !state.muted)
}

export function useSoundEnabled(): boolean {
  return useSyncExternalStore(subscribe, () => state.enabled)
}
