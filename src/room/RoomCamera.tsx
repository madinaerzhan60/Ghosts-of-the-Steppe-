import { useFrame } from '@react-three/fiber'
import { REDUCED_MOTION } from '../config/quality'
import { LAYOUT } from './slopeShape'

/** A slow, tiny drift (breathing) around a fixed view. No cuts, no sudden moves. */
export function RoomCamera() {
  useFrame(({ camera, clock }) => {
    const c = LAYOUT.camera
    const t = REDUCED_MOTION ? 0 : clock.elapsedTime
    camera.position.set(c.x + Math.sin(t * 0.07) * 0.35, c.y + Math.sin(t * 0.05) * 0.12, c.z)
    camera.lookAt(c.targetX, c.targetY, c.targetZ)
  })
  return null
}
