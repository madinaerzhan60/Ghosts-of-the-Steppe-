import { Path, Shape } from 'three'

/** Outline of an arched opening (rectangle + semicircle), as a hole path. */
export function archPath(halfWidth: number, bottom: number, spring: number): Path {
  const p = new Path()
  p.moveTo(-halfWidth, bottom)
  p.lineTo(halfWidth, bottom)
  p.lineTo(halfWidth, spring)
  p.absarc(0, spring, halfWidth, 0, Math.PI, false)
  p.lineTo(-halfWidth, bottom)
  return p
}

/** Solid arch band around an opening (door surround). */
export function archBand(innerHalf: number, band: number, bottom: number, spring: number): Shape {
  const outer = innerHalf + band
  const s = new Shape()
  s.moveTo(-outer, bottom)
  s.lineTo(outer, bottom)
  s.lineTo(outer, spring)
  s.absarc(0, spring, outer, 0, Math.PI, false)
  s.lineTo(-outer, bottom)
  s.holes.push(archPath(innerHalf, bottom, spring))
  return s
}

/**
 * One leaf of a pair of arched doors, in hinge-local coordinates: the hinge is
 * at x = 0, the leaf extends toward the door centre at x = dir * width.
 */
export function doorLeaf(width: number, height: number, dir: 1 | -1): Shape {
  const spring = height - width // the arch radius equals one leaf's width
  const s = new Shape()
  s.moveTo(0, 0)
  s.lineTo(dir * width, 0)
  s.lineTo(dir * width, height)
  // Quarter of the shared arch, from the top centre back down to the hinge side.
  if (dir > 0) s.absarc(width, spring, width, Math.PI / 2, Math.PI, false)
  else s.absarc(-width, spring, width, Math.PI / 2, 0, true)
  s.lineTo(0, 0)
  return s
}
