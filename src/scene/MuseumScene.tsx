import { ScrollControls } from '@react-three/drei'
import { Color } from 'three'
import { palette } from '../theme/palette'
import { CameraRig } from './CameraRig'
import { Corridor } from './Corridor'
import { DisplayCase } from './DisplayCase'
import { DoorwayLight } from './DoorwayLight'
import { CASES } from './layout'
import { SCROLL_PAGES } from './cameraPath'

// Fog is the background tinted a little toward the cold fog color,
// so the far end dissolves into a faint cold haze instead of a flat black.
const fogColor = new Color(palette.background).lerp(new Color(palette.fog), 0.1)

function logCase(id: string) {
  // Awakening effect comes later.
  console.log(id)
}

export function MuseumScene() {
  return (
    <>
      <color attach="background" args={[palette.background]} />
      <fogExp2 attach="fog" args={[fogColor, 0.06]} />
      <ambientLight color={palette.fog} intensity={0.12} />

      <ScrollControls pages={SCROLL_PAGES} damping={0.3}>
        <CameraRig />
        <Corridor />
        <DoorwayLight />
        {CASES.map((def) => (
          <DisplayCase key={def.id} def={def} onSelect={logCase} />
        ))}
      </ScrollControls>
    </>
  )
}
