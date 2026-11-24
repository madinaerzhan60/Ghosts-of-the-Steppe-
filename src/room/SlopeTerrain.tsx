import { useMemo } from 'react'
import { Color, PlaneGeometry } from 'three'
import { palette } from '../theme/palette'
import { surfaceY } from './slopeShape'

const WIDTH = 70
const DEPTH = 70
const CENTER_Z = -8

/** The mountain slope: deep blue rock, a little lighter where the moon touches it. */
export function SlopeTerrain() {
  const geometry = useMemo(() => {
    const g = new PlaneGeometry(WIDTH, DEPTH, 90, 90)
    g.rotateX(-Math.PI / 2)
    const pos = g.getAttribute('position')
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i) + CENTER_Z
      pos.setXYZ(i, x, surfaceY(x, z), z)
    }
    g.computeVertexNormals()
    return g
  }, [])
  // Blue slope: near-ridge blue lightened toward the far-ridge blue.
  const color = useMemo(() => new Color(palette.ridgeNear).lerp(new Color(palette.ridgeFar), 0.35), [])
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color={color} roughness={1} metalness={0} flatShading />
    </mesh>
  )
}
