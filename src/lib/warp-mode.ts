/**
 * Tiny global flag telling the canvas whether the Perspective panel is open.
 * Corner handles are only interactive while that panel is on screen, and the
 * normal selection handles step aside so the corners are easy to grab.
 */
import { useSyncExternalStore } from 'react'

let active = false
const listeners = new Set<() => void>()

export function setWarpMode(next: boolean) {
  if (active === next) return
  active = next
  listeners.forEach((l) => l())
}

export function getWarpMode() {
  return active
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function useWarpMode(): boolean {
  return useSyncExternalStore(subscribe, getWarpMode, () => false)
}
