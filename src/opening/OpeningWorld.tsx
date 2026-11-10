import { Suspense } from 'react'
import { Moon } from '../sky/Moon'
import { MoonClouds } from '../sky/MoonClouds'
import { Mountains } from '../sky/Mountains'
import { SkyDome } from '../sky/SkyDome'
import { Fireflies } from './Fireflies'
import { GroundFog } from './GroundFog'
import { Lanterns } from './Lanterns'
import { Grass } from './Grass'
import { MuseumExterior } from './MuseumExterior'
import { OpeningDirector } from './OpeningDirector'
import { OpeningTexts } from './OpeningTexts'
import { stageAtLeast, useStage } from './openingStore'
import { Stars } from './Stars'
import { SteppeGround } from './SteppeGround'

/** The night steppe outside the museum. Unmounted once the visitor is inside. */
export function OpeningWorld() {
  const stage = useStage()
  const inside = stageAtLeast(stage, 'hall')

  return (
    <>
      <OpeningDirector />
      <MuseumExterior />
      {!inside && (
        <>
          <Stars />
          <SkyDome>
            <Mountains />
            <Moon />
            <MoonClouds />
          </SkyDome>
          <SteppeGround />
          <Grass />
          <GroundFog />
          <Lanterns />
          <Fireflies />
          <Suspense fallback={null}>
            <OpeningTexts />
          </Suspense>
        </>
      )}
    </>
  )
}
