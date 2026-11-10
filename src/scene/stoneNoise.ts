import { CanvasTexture, RepeatWrapping } from 'three'

let cached: CanvasTexture | null = null

/** Small grayscale noise used as a roughness map (shared by all statues). Generated, not an asset. */
export function getStoneNoise(): CanvasTexture {
  if (cached) return cached
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(size, size)
  // Deterministic LCG so the stone looks the same on every load.
  let s = 1337
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)
  for (let i = 0; i < size * size; i++) {
    // Roughness multiplier in 0.65..1.0
    const v = Math.round(255 * (0.65 + 0.35 * rnd()))
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v
    img.data[i * 4 + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  cached = new CanvasTexture(canvas)
  cached.wrapS = cached.wrapT = RepeatWrapping
  cached.repeat.set(3, 3)
  return cached
}
