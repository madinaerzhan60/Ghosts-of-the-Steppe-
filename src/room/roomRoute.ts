/** The decision room opens at `/?room=snow-leopard` until the museum links to it. */
export function isRoomRoute(): boolean {
  return new URLSearchParams(window.location.search).get('room') === 'snow-leopard'
}
