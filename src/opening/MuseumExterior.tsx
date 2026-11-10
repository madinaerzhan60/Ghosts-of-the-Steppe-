import { useMemo } from 'react'
import { Shape } from 'three'
import { CORRIDOR } from '../scene/layout'
import { getPanelTexture } from '../scene/panelTexture'
import { palette } from '../theme/palette'
import { surfaces } from '../theme/surfaces'
import { archBand, archPath } from './archShapes'
import { MuseumDoors } from './MuseumDoors'
import { MuseumLights } from './MuseumLights'
import {
  COLUMNS,
  DOOR,
  DOOR_SPRING,
  FACADE,
  GROUND_Y,
  PORCH,
  STEPS,
  WINDOW,
} from './openingLayout'

const HALF = FACADE.width / 2
const SIDE_X = HALF - 0.15
const WALL_H = FACADE.top - GROUND_Y
const LENGTH = CORRIDOR.length + FACADE.depth
const D = FACADE.depth

/** Facade outline with a pediment, the arched door opening and the arched window. */
function facadeShape(): Shape {
  const s = new Shape()
  s.moveTo(-HALF, GROUND_Y)
  s.lineTo(HALF, GROUND_Y)
  s.lineTo(HALF, FACADE.top)
  s.lineTo(0, FACADE.top + FACADE.pedimentRise)
  s.lineTo(-HALF, FACADE.top)
  s.lineTo(-HALF, GROUND_Y)
  s.holes.push(archPath(DOOR.width / 2, 0, DOOR_SPRING))
  const r = WINDOW.width / 2
  s.holes.push(archPath(r, WINDOW.bottom, WINDOW.bottom + WINDOW.height - r))
  return s
}

/** Raised triangle inside the pediment (tympanum frame), low-poly. */
function pedimentFrame(): Shape {
  const inset = 0.35
  const s = new Shape()
  s.moveTo(-HALF + inset * 2, FACADE.top + 0.12)
  s.lineTo(HALF - inset * 2, FACADE.top + 0.12)
  s.lineTo(0, FACADE.top + FACADE.pedimentRise - inset)
  s.lineTo(-HALF + inset * 2, FACADE.top + 0.12)
  return s
}

/** A grand, old, low-poly stone museum seen from the steppe. Dark, weathered. */
export function MuseumExterior() {
  const shapes = useMemo(
    () => ({
      facade: facadeShape(),
      doorBand: archBand(DOOR.width / 2, 0.22, 0, DOOR_SPRING),
      pediment: pedimentFrame(),
    }),
    [],
  )
  // Facade UVs are in metres: one 2 m panel per repeat, offset so no seam runs down the middle.
  const facadeMap = useMemo(() => {
    const t = getPanelTexture(0.5, 0.5).clone()
    t.offset.set(0.5, 0)
    t.needsUpdate = true
    return t
  }, [])
  const sideMap = getPanelTexture(Math.round(LENGTH / 2), Math.round(WALL_H / 2))
  const stone = { color: surfaces.exterior, roughness: 0.95, flatShading: true } as const
  const darkStone = { color: surfaces.pedestal, roughness: 0.95, flatShading: true } as const
  const rise = -GROUND_Y / STEPS.count

  return (
    <group>
      {/* Facade (z 0 .. depth), extruded so the door and window have deep reveals */}
      <mesh>
        <extrudeGeometry args={[shapes.facade, { depth: D, bevelEnabled: false, curveSegments: 18 }]} />
        <meshStandardMaterial {...stone} map={facadeMap} />
      </mesh>

      {/* Plinth along the base, corner pilasters, cornice, tympanum frame */}
      <mesh position={[0, GROUND_Y + 0.35, D + 0.06]}>
        <boxGeometry args={[FACADE.width + 0.2, 0.7, 0.14]} />
        <meshStandardMaterial {...darkStone} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (HALF - 0.3), (GROUND_Y + FACADE.top) / 2, D + 0.08]}>
          <boxGeometry args={[0.6, FACADE.top - GROUND_Y, 0.16]} />
          <meshStandardMaterial {...stone} />
        </mesh>
      ))}
      <mesh position={[0, FACADE.top + 0.06, D + 0.2]}>
        <boxGeometry args={[FACADE.width + 0.5, 0.22, 0.6]} />
        <meshStandardMaterial {...stone} />
      </mesh>
      <mesh position={[0, 0, D]}>
        <extrudeGeometry args={[shapes.pediment, { depth: 0.06, bevelEnabled: false }]} />
        <meshStandardMaterial {...darkStone} />
      </mesh>

      {/* Arched stone surround around the doors */}
      <mesh position={[0, 0, D]}>
        <extrudeGeometry args={[shapes.doorBand, { depth: 0.1, bevelEnabled: false, curveSegments: 18 }]} />
        <meshStandardMaterial {...darkStone} />
      </mesh>
      {/* Keystone */}
      <mesh position={[0, DOOR.height + 0.12, D + 0.1]}>
        <boxGeometry args={[0.3, 0.42, 0.16]} />
        <meshStandardMaterial {...stone} />
      </mesh>

      {/* Side walls and roof */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * SIDE_X, GROUND_Y + WALL_H / 2, -LENGTH / 2 + D]}>
          <boxGeometry args={[0.3, WALL_H, LENGTH]} />
          <meshStandardMaterial {...stone} map={sideMap} />
        </mesh>
      ))}
      <mesh position={[0, FACADE.top + 0.15, -LENGTH / 2 + D]}>
        <boxGeometry args={[FACADE.width, 0.3, LENGTH]} />
        <meshStandardMaterial {...stone} />
      </mesh>

      {/* Porch, level with the hall floor, and the threshold inside the door reveal */}
      <mesh position={[0, GROUND_Y / 2, D + PORCH.depth / 2]}>
        <boxGeometry args={[PORCH.width, -GROUND_Y, PORCH.depth]} />
        <meshStandardMaterial {...stone} />
      </mesh>
      <mesh position={[0, GROUND_Y / 2, D / 2]}>
        <boxGeometry args={[DOOR.width + 0.02, -GROUND_Y, D]} />
        <meshStandardMaterial {...darkStone} />
      </mesh>

      {/* Four columns on the porch, carrying an architrave */}
      {COLUMNS.xs.map((x) => (
        <group key={x} position={[x, 0, COLUMNS.z]}>
          <mesh position={[0, COLUMNS.height / 2, 0]}>
            {/* 8 sides: low-poly, reads as old fluted stone under a grazing light */}
            <cylinderGeometry args={[COLUMNS.radius * 0.88, COLUMNS.radius, COLUMNS.height, 8]} />
            <meshStandardMaterial {...stone} />
          </mesh>
          <mesh position={[0, 0.1, 0]}>
            <boxGeometry args={[COLUMNS.radius * 2.7, 0.2, COLUMNS.radius * 2.7]} />
            <meshStandardMaterial {...darkStone} />
          </mesh>
          <mesh position={[0, COLUMNS.height - 0.1, 0]}>
            <boxGeometry args={[COLUMNS.radius * 2.6, 0.2, COLUMNS.radius * 2.6]} />
            <meshStandardMaterial {...darkStone} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, COLUMNS.height + 0.2, COLUMNS.z]}>
        <boxGeometry args={[COLUMNS.xs[3] * 2 + 0.9, 0.4, 0.7]} />
        <meshStandardMaterial {...stone} />
      </mesh>

      {/* A few wide steps down to the steppe */}
      {Array.from({ length: STEPS.count }, (_, i) => {
        const topY = -(i + 1) * rise
        const z0 = D + PORCH.depth + i * STEPS.depth
        return (
          <mesh key={i} position={[0, (GROUND_Y + topY) / 2, z0 + STEPS.depth / 2]}>
            <boxGeometry args={[STEPS.width + (i + 1) * 0.3, topY - GROUND_Y, STEPS.depth]} />
            <meshStandardMaterial {...stone} />
          </mesh>
        )
      })}

      {/* The one warm window: emissive amber, so bloom makes it glow */}
      <mesh position={[0, WINDOW.bottom + WINDOW.height / 2, 0.08]}>
        <planeGeometry args={[WINDOW.width, WINDOW.height]} />
        <meshStandardMaterial color={palette.background} emissive={palette.ghost} emissiveIntensity={1.3} />
      </mesh>
      {/* Window bars */}
      <mesh position={[0, WINDOW.bottom + WINDOW.height / 2, 0.12]}>
        <boxGeometry args={[0.035, WINDOW.height, 0.03]} />
        <meshStandardMaterial color={surfaces.pedestal} />
      </mesh>
      <mesh position={[0, WINDOW.bottom + WINDOW.height * 0.42, 0.12]}>
        <boxGeometry args={[WINDOW.width, 0.035, 0.03]} />
        <meshStandardMaterial color={surfaces.pedestal} />
      </mesh>

      <MuseumLights />
      <MuseumDoors />
    </group>
  )
}
