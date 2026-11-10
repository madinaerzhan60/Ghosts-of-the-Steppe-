export type TextCanvas = {
  canvas: HTMLCanvasElement
  /** Right edge of every letter, 0..1 across the canvas width (for letter-by-letter reveal). */
  letterEnds: number[]
  /** Canvas aspect ratio (width / height). */
  aspect: number
}

/** Draws one line of white text on a transparent canvas, tightly padded. */
export function drawTextCanvas(text: string, font: string, px: number): TextCanvas {
  const pad = Math.ceil(px * 0.35)
  const measure = document.createElement('canvas').getContext('2d')!
  measure.font = `${px}px ${font}`
  const width = Math.ceil(measure.measureText(text).width) + pad * 2
  const height = Math.ceil(px * 1.45) + pad

  const canvas = document.createElement('canvas')
  canvas.width = Math.max(2, width)
  canvas.height = Math.max(2, height)
  const ctx = canvas.getContext('2d')!
  ctx.font = `${px}px ${font}`
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#ffffff'
  ctx.fillText(text, pad, canvas.height / 2)

  const letterEnds: number[] = []
  const chars = Array.from(text)
  for (let i = 1; i <= chars.length; i++) {
    const w = ctx.measureText(chars.slice(0, i).join('')).width
    letterEnds.push((pad + w) / canvas.width)
  }
  return { canvas, letterEnds, aspect: canvas.width / canvas.height }
}
