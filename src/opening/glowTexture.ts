import { CanvasTexture } from 'three'

let cached: CanvasTexture | null = null

/** Soft radial glow (white, alpha falloff), generated once and shared. */
export function getGlowTexture(): CanvasTexture {
  if (cached) return cached
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.35, 'rgba(255,255,255,0.4)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  cached = new CanvasTexture(canvas)
  return cached
}
