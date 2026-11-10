import { LANTERNS } from './openingLayout'

/** Current flicker level of every lantern (0..~1.2), written by Lanterns, read by Grass. */
export const lanternLive = { level: LANTERNS.map(() => 1) }
