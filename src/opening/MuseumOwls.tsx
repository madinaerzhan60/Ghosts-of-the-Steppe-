import { useMemo } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'
import { palette } from '../theme/palette'
import { FACADE } from './openingLayout'

const BANNER = { w: 0.8, h: 1.7 }

/** A carved owl, drawn as a line relief on a transparent canvas (generated, not an asset). */
function owlTexture(): CanvasTexture {
  const w = 128
  const h = 272
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.strokeStyle = palette.lanternGlass
  ctx.fillStyle = palette.lanternGlass
  ctx.lineWidth = 3
  ctx.lineJoin = 'round'
  // Banner outline, ending in a swallow-tail
  ctx.beginPath()
  ctx.moveTo(10, 8)
  ctx.lineTo(w - 10, 8)
  ctx.lineTo(w - 10, h - 8)
  ctx.lineTo(w / 2, h - 32)
  ctx.lineTo(10, h - 8)
  ctx.closePath()
  ctx.stroke()
  // Body
  ctx.beginPath()
  ctx.ellipse(w / 2, 128, 30, 52, 0, 0, Math.PI * 2)
  ctx.stroke()
  // Head with ear tufts
  ctx.beginPath()
  ctx.moveTo(w / 2 - 32, 84)
  ctx.lineTo(w / 2 - 26, 52)
  ctx.lineTo(w / 2 - 10, 68)
  ctx.lineTo(w / 2 + 10, 68)
  ctx.lineTo(w / 2 + 26, 52)
  ctx.lineTo(w / 2 + 32, 84)
  ctx.stroke()
  // Eyes and beak
  for (const dx of [-14, 14]) {
    ctx.beginPath()
    ctx.arc(w / 2 + dx, 88, 9, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(w / 2 + dx, 88, 3, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.beginPath()
  ctx.moveTo(w / 2 - 5, 100)
  ctx.lineTo(w / 2 + 5, 100)
  ctx.lineTo(w / 2, 111)
  ctx.closePath()
  ctx.fill()
  // Feather rows on the chest
  for (let i = 0; i < 4; i++) {
    for (const dx of [-12, 12]) {
      ctx.beginPath()
      ctx.arc(w / 2 + dx, 128 + i * 15, 10, 0.15 * Math.PI, 0.85 * Math.PI)
      ctx.stroke()
    }
  }
  const tex = new CanvasTexture(canvas)
  tex.colorSpace = SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

/**
 * Two carved owl banners on the facade, in faint gold: a nod to Üki.
 * Unlit and quiet, they sit between the columns and the door.
 */
export function MuseumOwls() {
  const map = useMemo(owlTexture, [])
  const x = 2.55 // between the second and third column on each side
  return (
    <group>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * x, 2.5, FACADE.depth + 0.075]}>
          <planeGeometry args={[BANNER.w, BANNER.h]} />
          <meshBasicMaterial map={map} transparent opacity={0.4} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}
