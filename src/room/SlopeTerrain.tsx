import { useMemo } from 'react'
import { Color, PlaneGeometry } from 'three'
import { palette } from '../theme/palette'
import { surfaceY } from './slopeShape'

const WIDTH = 70
const DEPTH = 70
const CENTER_Z = -8

/** The mountain slope: dark grey stone, a little lighter where the moon touches it. */
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
  // Stone grey pulled toward the background: same hues, no new colour.
  const color = useMemo(() => new Color(palette.stone).lerp(new Color(palette.background), 0.62), [])
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color={color} roughness={1} metalness={0} flatShading />
    </mesh>
  )
}
