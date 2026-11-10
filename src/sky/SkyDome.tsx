import { useFrame } from '@react-three/fiber'
import { useRef, type ReactNode } from 'react'
import type { Group } from 'three'

/**
 * Holds everything "at infinity" (moon, clouds, mountains): it follows the
 * camera's position, so the sky never gets closer while walking — only the
 * museum grows in front of it.
 */
export function SkyDome({ children }: { children: ReactNode }) {
  const group = useRef<Group>(null)
  useFrame(({ camera }) => {
    group.current?.position.copy(camera.position)
  })
  return <group ref={group}>{children}</group>
}
