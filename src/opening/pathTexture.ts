import { CanvasTexture, Color, RepeatWrapping, SRGBColorSpace } from 'three'
import { palette } from '../theme/palette'
import { surfaces } from '../theme/surfaces'

export const PATH_TILE = { width: 1.4, length: 5.6 } as const

let cached: CanvasTexture | null = null

/**
 * Worn stone slabs with dark gaps, drawn once (not an asset). Two slabs across,
 * six rows along one tile, each a little different in size, tone and wear. Slab
 * tops carry a faint cool moonlit sheen; lantern pools add the warm light on top.
 */
export function getPathTexture(): CanvasTexture {
  if (cached) return cached
  const w = 256
  const h = 1024
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  let s = 515
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)

  const base = new Color(surfaces.path)
  const gap = new Color(palette.background).lerp(new Color(palette.ridgeNear), 0.35)
  const sheen = new Color(palette.moon)
  const css = (c: Color) => `#${c.getHexString()}`

  ctx.fillStyle = css(gap)
  ctx.fillRect(0, 0, w, h)

  const rows = 6
  const rowH = h / rows
  const GAP = 7
  for (let r = 0; r < rows; r++) {
    // Staggered split between the two slabs of the row
    const split = w * (0.4 + rnd() * 0.2)
    const slabs = [
      { x: GAP / 2, w: split - GAP },
      { x: split + GAP / 2, w: w - split - GAP },
    ]
    for (const slab of slabs) {
      const y = r * rowH + GAP / 2 + rnd() * 4
      const sh = rowH - GAP - rnd() * 6
      const tone = base.clone().multiplyScalar(0.85 + rnd() * 0.3)
      ctx.fillStyle = css(tone)
      ctx.beginPath()
      ctx.roundRect(slab.x, y, slab.w, sh, 7 + rnd() * 5)
      ctx.fill()
      // Cool moonlit sheen along the top edge of the slab
      const g = ctx.createLinearGradient(0, y, 0, y + sh)
      g.addColorStop(0, `rgba(${Math.round(sheen.r * 255)},${Math.round(sheen.g * 255)},${Math.round(sheen.b * 255)},0.22)`)
      g.addColorStop(0.35, 'rgba(255,255,255,0)')
      ctx.fillStyle = g
      ctx.fill()
      // Wear: a few darker patches and pale scuffs
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = rnd() < 0.5 ? 'rgba(10,12,40,0.16)' : 'rgba(220,233,255,0.07)'
        ctx.beginPath()
        ctx.ellipse(slab.x + rnd() * slab.w, y + rnd() * sh, 10 + rnd() * 26, 5 + rnd() * 12, rnd() * 3, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }
  const tex = new CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = RepeatWrapping
  tex.colorSpace = SRGBColorSpace
  tex.anisotropy = 8
  cached = tex
  return tex
}
