import { Suspense, useCallback, useMemo, useState } from 'react'
import { LIGHT_MODE } from '../config/quality'
import { surfaces } from '../theme/surfaces'
import { AnimalStatue } from './AnimalStatue'
import { CaseGlass } from './CaseGlass'
import { CaseLamp } from './CaseLamp'
import { Dust } from './Dust'
import { STOP_DISTANCE, STOP_SHIFT, type CaseDef } from './layout'
import { ModelErrorBoundary } from './ModelErrorBoundary'
import { MODELS } from './models'

type Props = {
  def: CaseDef
  onSelect: (id: string) => void
}

const PEDESTAL_H = 1.0
const PEDESTAL_MARGIN = 0.08 // pedestal overhang around the glass, per side
const GLASS = { w: 0.84, maxH: 1.2, minH: 0.8 }
/**
 * The animal is the hero: as the visitor sees it from the stop in front of the
 * case, its silhouette fills ~78% (75–80%) of the glass's apparent width.
 */
const FILL = 0.78
const STATUE_MAX_H = GLASS.maxH - 0.25
/** Headroom above the statue: the glass is cut down to the animal, so it never looks empty. */
const HEADROOM = 0.38
/** Clearance between the statue and the glass, per side. The glass never grows:
 *  a deep animal (e.g. the round seal) is scaled down instead of crowding the case. */
const GLASS_CLEARANCE = 0.04
const MAX_FOOTPRINT = GLASS.w - 2 * GLASS_CLEARANCE
/** From a pure side profile (as seen from the stop), turn the head this far toward the visitor. */
const TURN_TO_VISITOR = 0.35 // ~20°: a readable three-quarter view
const DUST_PER_CASE = 60 // ~360 specks across 6 cases

/** Unit x/z axis across the line of sight from this case's camera stop. */
function viewAxis(def: CaseDef): { x: number; z: number } {
  const vx = -def.side * STOP_SHIFT - def.x
  const vz = STOP_DISTANCE
  const len = Math.hypot(vx, vz) || 1
  return { x: -vz / len, z: vx / len }
}

/**
 * Yaw for a head-along-+x statue so that, seen from the camera stop in front of
 * this case, it stands in side profile with its head toward the corridor centre,
 * turned slightly toward the visitor.
 */
function statueYaw(def: CaseDef): number {
  // Direction from the case to the visitor's stop point (x/z plane).
  const vx = -def.side * STOP_SHIFT - def.x
  const vz = STOP_DISTANCE
  const viewer = Math.atan2(vz, vx)
  // Profile: perpendicular to the view, on the corridor-centre side.
  const perpA = viewer - Math.PI / 2
  const perpB = viewer + Math.PI / 2
  const head = Math.cos(perpA) * -def.side > 0 ? perpA : perpB
  // Turn toward the viewer by TURN_TO_VISITOR (shortest way).
  const diff = Math.atan2(Math.sin(viewer - head), Math.cos(viewer - head))
  const angle = head + Math.sign(diff) * TURN_TO_VISITOR
  // A Y rotation by `a` maps +x to (cos a, -sin a) in (x, z), so a = -angle.
  return -angle
}

export function DisplayCase({ def, onSelect }: Props) {
  const [glass, setGlass] = useState<{ w: number; h: number }>({ w: GLASS.w, h: GLASS.maxH })

  const yaw = statueYaw(def)
  const axis = useMemo(() => viewAxis(def), [def])
  // Apparent width of the square glass from that view: W * (|ax| + |az|).
  const fill = FILL * GLASS.w * (Math.abs(axis.x) + Math.abs(axis.z))

  // Cut the glass down to the animal's height so the case never looks empty.
  const handleFit = useCallback((fit: { height: number }) => {
    const h = Math.min(GLASS.maxH, Math.max(GLASS.minH, Math.ceil((fit.height + HEADROOM) * 20) / 20))
    setGlass({ w: GLASS.w, h })
  }, [])

  const pedestalW = glass.w + 2 * PEDESTAL_MARGIN

  return (
    <group position={[def.x, 0, def.z]}>
      {/* Clickable area: pedestal + glass + statue */}
      <group
        onClick={(e) => {
          e.stopPropagation()
          onSelect(def.id)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          document.body.style.cursor = ''
        }}
      >
        {/* Pedestal */}
        <mesh position={[0, PEDESTAL_H / 2, 0]}>
          <boxGeometry args={[pedestalW, PEDESTAL_H, pedestalW]} />
          <meshStandardMaterial color={surfaces.pedestal} roughness={0.8} />
        </mesh>

        {/* Statue, standing on the case floor */}
        <group position={[0, PEDESTAL_H + 0.005, 0]}>
          <ModelErrorBoundary url={MODELS[def.model].url}>
            <Suspense fallback={null}>
              <AnimalStatue
                model={def.model}
                fill={fill}
                viewAxis={axis}
                maxHeight={STATUE_MAX_H}
                maxFootprint={MAX_FOOTPRINT}
                yaw={yaw}
                onFit={handleFit}
              />
            </Suspense>
          </ModelErrorBoundary>
        </group>

        <CaseGlass position={[0, PEDESTAL_H + glass.h / 2, 0]} width={glass.w} height={glass.h} />
      </group>

      {/* Ceiling spot directly above the case */}
      <CaseLamp caseId={def.id} seed={def.z} />
      {!LIGHT_MODE && <Dust count={DUST_PER_CASE} seed={def.z} />}
    </group>
  )
}
