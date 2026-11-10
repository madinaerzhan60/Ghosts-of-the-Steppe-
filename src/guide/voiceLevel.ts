// Live loudness of Üki's voice via the Web Audio AnalyserNode.
//
// createMediaElementSource() may be called only once per <audio> element and
// reroutes its sound through the AudioContext, so the graph is created lazily
// (only once the element is actually playing, i.e. after a user gesture) and cached.

type VoiceGraph = { ctx: AudioContext; analyser: AnalyserNode; data: Uint8Array<ArrayBuffer> }

const graphs = new WeakMap<HTMLAudioElement, VoiceGraph>()

function getGraph(audio: HTMLAudioElement): VoiceGraph | null {
  const hit = graphs.get(audio)
  if (hit) return hit
  if (typeof AudioContext === 'undefined') return null
  try {
    const ctx = new AudioContext()
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 512
    analyser.smoothingTimeConstant = 0.6
    ctx.createMediaElementSource(audio).connect(analyser)
    analyser.connect(ctx.destination)
    const graph = { ctx, analyser, data: new Uint8Array(analyser.fftSize) }
    graphs.set(audio, graph)
    return graph
  } catch {
    return null
  }
}

/**
 * Returns the voice level 0..1, or null if there is no playing audio to measure
 * (callers then fall back to a gentle timer pulse).
 */
export function readVoiceLevel(audio: HTMLAudioElement | null | undefined): number | null {
  if (!audio || audio.paused || audio.ended || !audio.currentSrc) return null
  const graph = getGraph(audio)
  if (!graph) return null
  if (graph.ctx.state === 'suspended') void graph.ctx.resume()

  graph.analyser.getByteTimeDomainData(graph.data)
  let sum = 0
  for (let k = 0; k < graph.data.length; k++) {
    const v = (graph.data[k] - 128) / 128
    sum += v * v
  }
  const rms = Math.sqrt(sum / Math.max(1, graph.data.length))
  const level = Math.min(1, Math.max(0, rms * 4))
  return Number.isFinite(level) ? level : 0
}
