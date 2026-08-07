import { useCallback, useEffect, useState } from 'react'

/**
 * How every menu / tool panel in the editor is presented.
 * - `docked`   → fixed bottom toolbar / contextual action bar (panels snap to the
 *                bottom edge, full width, no dragging).
 * - `floating` → the classic floating pop-over panels the user can drag around.
 */
export type PanelMode = 'docked' | 'floating'

const KEY = 'myan.panel-mode'

export function getPanelMode(): PanelMode | null {
  if (typeof window === 'undefined') return null
  const v = window.localStorage.getItem(KEY)
  return v === 'docked' || v === 'floating' ? v : null
}

export function applyPanelMode(mode: PanelMode) {
  if (typeof document === 'undefined') return
  document.documentElement.dataset['panelMode'] = mode
}

export function setPanelMode(mode: PanelMode) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KEY, mode)
  applyPanelMode(mode)
  window.dispatchEvent(new CustomEvent('panel-mode', { detail: mode }))
}

/** Reactive panel-mode preference. `null` until the user has picked one. */
export function usePanelMode() {
  const [mode, setMode] = useState<PanelMode | null>(null)

  useEffect(() => {
    const current = getPanelMode()
    setMode(current)
    applyPanelMode(current ?? 'floating')
    const onChange = (e: Event) => setMode((e as CustomEvent<PanelMode>).detail)
    window.addEventListener('panel-mode', onChange as EventListener)
    return () => window.removeEventListener('panel-mode', onChange as EventListener)
  }, [])

  const choose = useCallback((next: PanelMode) => setPanelMode(next), [])

  return { mode, chosen: mode !== null, setMode: choose }
}
