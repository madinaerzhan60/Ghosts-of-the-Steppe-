import { Color } from 'three'
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

// Fog is the background tinted a little toward the cold fog color,
// so the far end dissolves into a faint cold haze instead of a flat black.
const fogColor = new Color(palette.background).lerp(new Color(palette.fog), 0.1)

function logCase(id: string) {
  // Awakening effect comes later.
  console.log(id)
}

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
      <fogExp2 attach="fog" args={[fogColor, 0.034]} />
      <ambientLight color={palette.fog} intensity={0.1} />
      <Moonlight />
      <AtmosphereByPlace />

      <group>
        <CameraRig />
        <OpeningWorld />
        <Corridor />
        <DoorwayLight />
        {CASES.map((def) => (
          <DisplayCase key={def.id} def={def} onSelect={logCase} />
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
