/**
 * Where Üki can be:
 * -4 = in front of the doors, close to the visitor (the welcome),
 * -3 = above the museum doors (where its eyes open), -2 = at the doors,
 * -1 = just inside the hall, 0..CASES.length-1 = beside that case,
 * CASES.length = by the far doorway.
 */
export type GuideSpot = number

export const SPOT = { welcome: -4, perch: -3, door: -2, inside: -1 } as const
