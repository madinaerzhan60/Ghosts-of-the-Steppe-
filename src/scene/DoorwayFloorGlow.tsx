import { useMemo } from 'react'
import { AdditiveBlending, CanvasTexture } from 'three'
import { palette } from '../theme/palette'
import { CORRIDOR } from './layout'

/** Faint warm pool of light on the floor in front of the doorway. */
export function DoorwayFloorGlow() {
  const map = useMemo(() => {
    const size = 128
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const ctx = canvas.getContext('2d')!
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.5, 'rgba(255,255,255,0.35)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
    return new CanvasTexture(canvas)
  }, [])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -CORRIDOR.length + 2]} renderOrder={1}>
      <planeGeometry args={[4.5, 5]} />
      <meshBasicMaterial
        map={map}
        color={palette.ghost}
        transparent
        opacity={0.28}
        blending={AdditiveBlending}
        depthWrite={false}
        fog={false}
      />
    </mesh>
  )
}
