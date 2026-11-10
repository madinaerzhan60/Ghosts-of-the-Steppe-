import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'

const cache = new Map<string, CanvasTexture>()

/**
 * Generated stone-panel texture (not an asset): light stone grain with faint
 * darker grooves along the top and left edge of each tile. Multiplied with the
 * very dark wall colour, so the lines only show where spotlight spill lands.
 * Colour map only (no bump map: bump mapping can produce NaN normals).
 */
export function getPanelTexture(repeatX: number, repeatY: number): CanvasTexture {
  const key = `${repeatX}x${repeatY}`
  const hit = cache.get(key)
  if (hit) return hit

  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(size, size)
  let s = 4242 // deterministic grain
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)
  for (let i = 0; i < size * size; i++) {
    const v = Math.round(215 + (rnd() - 0.5) * 30)
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v
    img.data[i * 4 + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  // Grooves: dark line with a slightly lighter lip
  ctx.fillStyle = 'rgb(90,90,90)'
  ctx.fillRect(0, 0, size, 3)
  ctx.fillRect(0, 0, 3, size)
  ctx.fillStyle = 'rgb(240,240,240)'
  ctx.fillRect(0, 3, size, 1)
  ctx.fillRect(3, 0, 1, size)

  const tex = new CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = RepeatWrapping
  tex.colorSpace = SRGBColorSpace
  tex.anisotropy = 4
  tex.repeat.set(repeatX, repeatY)
  cache.set(key, tex)
  return tex
}
