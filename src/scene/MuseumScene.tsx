import { Color } from 'three'
import { AwakeDirector } from '../awaken/AwakeDirector'
import { wakeCase } from '../awaken/wake'
import type { GuideSpot } from '../guide/guideSpots'
import { UkiGuide } from '../guide/UkiGuide'
import { AtmosphereByPlace } from '../opening/AtmosphereByPlace'
import { OpeningWorld } from '../opening/OpeningWorld'
import { stageAtLeast, useStage } from '../opening/openingStore'
import { palette } from '../theme/palette'
import { CameraRig } from './CameraRig'
import { Corridor } from './Corridor'
import { DisplayCase } from './DisplayCase'
import { DoorwayLight } from './DoorwayLight'
import { Moonlight } from './Moonlight'
import { CASES } from './layout'
import './models' // starts preloading the GLB files

// Fog is the shadow blue tinted toward the teal fog, so the far end dissolves
// into a soft blue-teal haze instead of black.
const fogColor = new Color(palette.background).lerp(new Color(palette.fog), 0.16)

type Props = {
  ukiSpeaking: boolean
  ukiAudio: HTMLAudioElement | null
  onUkiArrive: (spot: GuideSpot) => void
  ukiWingsOpen: boolean
  ukiPulseKey?: string
}

export function MuseumScene({ ukiSpeaking, ukiAudio, onUkiArrive, ukiWingsOpen, ukiPulseKey }: Props) {
  const stage = useStage()

  return (
    <>
      <color attach="background" args={[palette.background]} />
      <fogExp2 attach="fog" args={[fogColor, 0.03]} />
      <ambientLight color={palette.ridgeFar} intensity={0.2} />
      <Moonlight />
      <AtmosphereByPlace />

      <group>
        <CameraRig />
        <AwakeDirector />
        <OpeningWorld />
        <Corridor />
        <DoorwayLight />
        {CASES.map((def) => (
          <DisplayCase key={def.id} def={def} onSelect={wakeCase} />
        ))}
        {/* Üki first appears above the museum doors, once the visitor reaches them. */}
        {stageAtLeast(stage, 'arrive') && (
          <UkiGuide
            speaking={ukiSpeaking}
            audio={ukiAudio}
            onArrive={onUkiArrive}
            wingsOpen={ukiWingsOpen}
            pulseKey={ukiPulseKey}
          />
        )}
      </group>
    </>
  )
}
