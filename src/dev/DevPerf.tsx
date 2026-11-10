import { lazy, Suspense } from 'react'

// r3f-perf overlay (FPS, GPU/CPU time, draw calls): development builds only, and
// only with ?debug in the URL. The dynamic import keeps it out of production.
const DEBUG =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug')
const Perf = import.meta.env.DEV && DEBUG
  ? lazy(() => import('r3f-perf').then((m) => ({ default: m.Perf })))
  : null

export function DevPerf() {
  if (!Perf) return null
  return (
    <Suspense fallback={null}>
      <Perf position="top-left" minimal />
    </Suspense>
  )
}
