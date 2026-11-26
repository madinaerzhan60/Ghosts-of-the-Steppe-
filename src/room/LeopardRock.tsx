import { useMemo } from 'react'
import { Color, IcosahedronGeometry } from 'three'
import { palette } from '../theme/palette'
import { seededRandom } from '../utils/random'
import { LAYOUT, surfaceY } from './slopeShape'

/** The boulder the leopard sits on: grey stone, lumpy, half sunk into the slope. */
export function LeopardRock() {
  const geometry = useMemo(() => {
    const g = new IcosahedronGeometry(1, 2)
    const rand = seededRandom(5)
    const pos = g.getAttribute('position')
    // Same lump for vertices that share a position, so the surface stays closed.
    const lumps = new Map<string, number>()
    for (let i = 0; i < pos.count; i++) {
      const key = `${pos.getX(i).toFixed(3)},${pos.getY(i).toFixed(3)},${pos.getZ(i).toFixed(3)}`
      if (!lumps.has(key)) lumps.set(key, 0.82 + rand() * 0.3)
      const k = lumps.get(key)!
      pos.setXYZ(i, pos.getX(i) * k, pos.getY(i) * k, pos.getZ(i) * k)
    }
    g.computeVertexNormals()
    return g
  }, [])
  const { x, z } = LAYOUT.rock
  return (
    <mesh geometry={geometry} position={[x, surfaceY(x, z) + 0.25, z]} scale={[2.4, 0.95, 1.7]} rotation={[0, 0.5, 0]}>
      <meshStandardMaterial color={new Color(palette.stone).lerp(new Color(palette.ridgeNear), 0.45)} roughness={1} flatShading />
    </mesh>
  )
}
