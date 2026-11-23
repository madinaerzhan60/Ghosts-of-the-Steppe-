import type { RoomState } from './decisions'

/**
 * The slope as it is drawn right now: the target values eased over a few seconds,
 * so nothing jumps. Written by RoomDirector, read every frame by the scene parts.
 */
export const roomLive: RoomState = { leopard: 0.5, city: 0.5, ibex: 0.5 }
