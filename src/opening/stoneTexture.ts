import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'

let cached: CanvasTexture | null = null

/**
 * Generated block-stone texture (not an asset): running-bond blocks with faint
 * dark joints, light per-block tone changes and fine noise. Multiplied with the
 * stone colour, so it stays near white and only adds structure.
 * One repeat covers 2 m x 2 m (4 courses of 0.5 m).
 */
export function getStoneTexture(): CanvasTexture {
  if (cached) return cached
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  let s = 9173 // deterministic
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)

  const rows = 4
  const rowH = size / rows
  for (let r = 0; r < rows; r++) {
    const blocks = 2
    const w = size / blocks
    const shift = r % 2 ? w / 2 : 0
    for (let b = -1; b <= blocks; b++) {
      const v = 226 + Math.round((rnd() - 0.5) * 22)
      ctx.fillStyle = `rgb(${v},${v},${v})`
      ctx.fillRect(b * w + shift, r * rowH, w, rowH)
      // joints: dark line, slightly lighter lip below/right
      ctx.fillStyle = 'rgb(150,150,150)'
      ctx.fillRect(b * w + shift, r * rowH, w, 3)
      ctx.fillRect(b * w + shift, r * rowH, 3, rowH)
      ctx.fillStyle = 'rgb(250,250,250)'
      ctx.fillRect(b * w + shift, r * rowH + 3, w, 1)
      ctx.fillRect(b * w + shift + 3, r * rowH, 1, rowH)
    }
  }
  // Fine noise on top
  const img = ctx.getImageData(0, 0, size, size)
  for (let i = 0; i < size * size; i++) {
    const n = Math.round((rnd() - 0.5) * 22)
    for (let c = 0; c < 3; c++) img.data[i * 4 + c] = Math.max(0, Math.min(255, img.data[i * 4 + c] + n))
  }
  ctx.putImageData(img, 0, 0)

  const tex = new CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = RepeatWrapping
  tex.colorSpace = SRGBColorSpace
  tex.anisotropy = 4
  cached = tex
  return tex
}
