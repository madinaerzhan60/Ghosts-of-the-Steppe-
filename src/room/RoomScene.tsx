import { Suspense } from 'react'
import { Color, Vector3 } from 'three'
import { Stars } from '../opening/Stars'
import { Moon } from '../sky/Moon'
import { SkyDome } from '../sky/SkyDome'
import { SkyGradient } from '../sky/SkyGradient'
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
import { CityHaze } from './CityHaze'
import { RoomCamera } from './RoomCamera'
import { RoomDirector } from './RoomDirector'
import { SlopeTerrain } from './SlopeTerrain'

// Teal-blue haze over the far slope.
const HAZE = new Color(palette.background).lerp(new Color(palette.fog), 0.22)

// The moon hangs above the far ridge (~28° up, a little to the right).
const MOON_EL = (28 * Math.PI) / 180
const MOON_AZ = (12 * Math.PI) / 180
const MOON_DIR = new Vector3(Math.sin(MOON_AZ) * Math.cos(MOON_EL), Math.sin(MOON_EL), -Math.cos(MOON_AZ) * Math.cos(MOON_EL))

/** The night slope above the city: terrain, rock, city lights, ibex and the leopard ghost. */
export function RoomScene({ target }: { target: RoomState }) {
  return (
    <>
      <color attach="background" args={[palette.background]} />
      <fog attach="fog" args={[HAZE, 18, 60]} />
      <hemisphereLight args={[palette.ridgeFar, palette.background, 0.45]} />
      <directionalLight color={palette.moon} intensity={0.9} position={[-12, 18, -10]} />
      <RoomDirector target={target} />
      <RoomCamera />
      <SkyDome>
        <SkyGradient />
        <Moon direction={MOON_DIR} scale={0.6} />
      </SkyDome>
      <Stars />
      <SlopeTerrain />
      <LeopardRock />
      <CityLights />
      <IbexHerd />
      <Footprints />
      <CityHaze />
      <ModelErrorBoundary url={MODELS['snow-leopard'].url}>
        <Suspense fallback={null}>
          <LeopardGhost />
          <CubGhost />
        </Suspense>
      </ModelErrorBoundary>
    </>
  )
}
