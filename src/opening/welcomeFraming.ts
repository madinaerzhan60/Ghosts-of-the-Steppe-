import { MathUtils, Vector3, type PerspectiveCamera } from 'three'
import { screenLayout } from '../ui/screenLayout'
import { UKI_OUTSIDE_SCALE, UKI_WELCOME } from './openingLayout'

// Üki's size in its own units (see guide/owlShape): tail tip to ear tips, plus the
// hover bob; wingspan with the wings open.
const OWL_HEIGHT = 0.62
const OWL_CENTER_Y = 0.07
const OWL_SPAN = 0.85

/** Üki fills this share of the screen height (35–40%). */
export const WELCOME_SCREEN_SHARE = 0.4
/** Never wider than this share of the screen width (portrait phones). */
const MAX_WIDTH_SHARE = 0.86
/** Gap between Üki's lowest point and the top of the subtitles (screen share). */
const SUBTITLE_GAP = 0.05
/** Where Üki's centre sits at most (share from the top): a little above the middle. */
const CENTER_FROM_TOP = 0.44
/** The camera is a little lower than Üki: she is seen slightly from below. */
const LOOK_UP = 0.12

const center = new Vector3()

/**
 * Close-up for Üki's welcome: the camera stands in front of her so she fills
 * ~38% of the screen height, centred slightly above the subtitles, never under them.
 */
export function getWelcomePose(camera: PerspectiveCamera, outPos: Vector3, outTarget: Vector3) {
  const tanHalf = Math.tan(MathUtils.degToRad(camera.fov / 2))
  const aspect = Math.max(camera.aspect, 0.2)
  const h = OWL_HEIGHT * UKI_OUTSIDE_SCALE
  const w = OWL_SPAN * UKI_OUTSIDE_SCALE

  // Distance so the height share is right, but never so close that the wings are cut off.
  const byHeight = h / (WELCOME_SCREEN_SHARE * 2 * tanHalf)
  const byWidth = w / (MAX_WIDTH_SHARE * 2 * tanHalf * aspect)
  const distance = Math.max(byHeight, byWidth)
  const share = h / (2 * tanHalf * distance) // actual height share

  // Centre her above the subtitles (with a gap), and never lower than CENTER_FROM_TOP.
  const fromTop = Math.min(CENTER_FROM_TOP, screenLayout.subtitleTop - SUBTITLE_GAP - share / 2)
  const ndc = MathUtils.clamp(1 - 2 * fromTop, -0.9, 0.9)

  center.copy(UKI_WELCOME)
  center.y += OWL_CENTER_Y * UKI_OUTSIDE_SCALE
  outPos.set(center.x, center.y - LOOK_UP, center.z + distance)

  // Pitch so that her centre lands at the wanted height on screen.
  const elevation = Math.atan2(LOOK_UP, distance)
  const pitch = elevation - Math.atan(ndc * tanHalf)
  outTarget.set(outPos.x, outPos.y + Math.sin(pitch), outPos.z - Math.cos(pitch))
}
