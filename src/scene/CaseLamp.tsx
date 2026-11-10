import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'
import { MathUtils, type MeshBasicMaterial, type Object3D, type SpotLight } from 'three'
import { palette } from '../theme/palette'
import { LAMP } from './layout'
import { LightCone } from './LightCone'
import { nearestCase } from './nearestCase'

type Props = {
  caseId: string
  /** Different seed per lamp so they don't flicker in sync. */
  seed: number
}

const BASE_INTENSITY = 55

/**
 * Narrow ceiling spot pointing straight down onto the statue, plus its light cone.
 * The lamp of the case nearest to the visitor flickers gently to invite a click.
 */
export function CaseLamp({ caseId, seed }: Props) {
  const light = useRef<SpotLight>(null)
  const target = useRef<Object3D>(null)
  const fixture = useRef<MeshBasicMaterial>(null)
  const level = useRef(1)
  const attention = useRef(0) // eased 0..1: how much this lamp flickers

  // The spot aims at an object directly below it.
  useLayoutEffect(() => {
    if (light.current && target.current) light.current.target = target.current
  }, [])

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime
    const isNearest = nearestCase.id === caseId
    // Ease in/out so the flicker fades in and out slowly (no abrupt change).
    attention.current = MathUtils.damp(attention.current, isNearest ? 1 : 0, 1.5, delta)
    const a = attention.current

    // Slow waves (all under ~3 Hz), never strobing, never dropping below ~0.8.
    const wobble =
      0.55 * Math.sin(t * 2.1 + seed) +
      0.3 * Math.sin(t * 3.7 + seed * 2.1) +
      0.15 * Math.sin(t * 1.1 + seed * 3.3)
    const k = 1 + a * 0.12 * wobble + (1 - a) * 0.015 * wobble
    level.current = k

    if (light.current) light.current.intensity = BASE_INTENSITY * k
  })

  return (
    <group>
      {/* Simple fixture disc (baseline) */}
      <mesh position={[0, LAMP.y + 0.2, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.06, 20]} />
        <meshBasicMaterial ref={fixture} color={palette.lamp} fog={false} />
      </mesh>
      <spotLight
        ref={light}
        position={[0, LAMP.y, 0]}
        color={palette.lamp}
        intensity={BASE_INTENSITY}
        angle={LAMP.angle}
        penumbra={LAMP.penumbra}
        distance={0}
        decay={2}
      />
      <object3D ref={target} position={[0, LAMP.targetY, 0]} />
      <LightCone level={level} />
    </group>
  )
}
