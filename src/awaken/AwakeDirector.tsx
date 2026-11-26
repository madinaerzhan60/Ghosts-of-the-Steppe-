import { useFrame } from '@react-three/fiber'
import { tickAwake } from './awakeStore'

/** Runs the awakening's clock, once per frame. Never jumps after a tab switch. */
export function AwakeDirector() {
  useFrame((_, delta) => {
    tickAwake(Math.min(delta, 0.1))
  })
  return null
}
