import { Suspense } from 'react'
import { Color } from 'three'
import { Stars } from '../opening/Stars'
import { ModelErrorBoundary } from '../scene/ModelErrorBoundary'
import { MODELS } from '../scene/models'
import { palette } from '../theme/palette'
import type { RoomState } from './decisions'
import { CityLights } from './CityLights'
import { CubGhost } from './CubGhost'
import { Footprints } from './Footprints'
import { IbexHerd } from './IbexHerd'
import { LeopardGhost } from './LeopardGhost'
import { LeopardRock } from './LeopardRock'
import { RoomMoon } from './RoomMoon'
import { RoomCamera } from './RoomCamera'
import { RoomDirector } from './RoomDirector'
import { SlopeTerrain } from './SlopeTerrain'

// Fog colour: the palette's cold fog, kept very dim so it reads as night haze.
const HAZE = new Color(palette.background).lerp(new Color(palette.fog), 0.12)

/** The night slope above the city: terrain, rock, city lights, ibex and the leopard ghost. */
export function RoomScene({ target }: { target: RoomState }) {
  return (
    <>
      <color attach="background" args={[palette.background]} />
      <fog attach="fog" args={[HAZE, 18, 60]} />
      <hemisphereLight args={[palette.fog, palette.background, 0.35]} />
      <directionalLight color={palette.fog} intensity={0.9} position={[-12, 18, -10]} />
      <RoomDirector target={target} />
      <RoomCamera />
      <Stars />
      <SlopeTerrain />
      <LeopardRock />
      <CityLights />
      <IbexHerd />
      <Footprints />
      <RoomMoon />
      <ModelErrorBoundary url={MODELS['snow-leopard'].url}>
        <Suspense fallback={null}>
          <LeopardGhost />
          <CubGhost />
        </Suspense>
      </ModelErrorBoundary>
    </>
  )
}
