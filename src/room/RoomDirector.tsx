import { useFrame } from '@react-three/fiber'
import { MathUtils } from 'three'
import { REDUCED_MOTION } from '../config/quality'
import type { RoomState } from './decisions'
import { roomLive } from './roomLive'

/** Higher = faster. 0.7 settles in about 4 s: slow enough to watch, never abrupt. */
const SPEED = REDUCED_MOTION ? 2.5 : 0.7

/** Eases the drawn state toward the target set by the visitor's choices. */
export function RoomDirector({ target }: { target: RoomState }) {
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1)
    roomLive.leopard = MathUtils.damp(roomLive.leopard, target.leopard, SPEED, dt)
    roomLive.city = MathUtils.damp(roomLive.city, target.city, SPEED * 0.8, dt)
    roomLive.ibex = MathUtils.damp(roomLive.ibex, target.ibex, SPEED * 0.9, dt)
  })
  return null
}
