import { useEffect, useRef, useState } from 'react'

const BASE = 'https://myandev.github.io'
export const AD_EVENT = 'app:show-ad'

/** In-memory (per app run). Resets when the app is closed or fully reloaded. */
let adShown = false

type AdConfig = { showAd?: boolean; skip?: boolean; second?: string | number }
type Ad = { url: string; skip: boolean; seconds: number }

let adPromise: Promise<Ad | null> | null = null

/** Fetch ad.json and fully download + decode ad.png before it can ever be shown. */
export function prefetchAd(): Promise<Ad | null> {
  if (adPromise) return adPromise
  adPromise = (async () => {
    if (typeof window === 'undefined' || navigator.onLine === false) return null
    try {
      const bust = `?t=${Date.now()}`
      const res = await fetch(`${BASE}/ad.json${bust}`, { cache: 'no-store' })
      if (!res.ok) return null
      const cfg = (await res.json()) as AdConfig
      if (cfg.showAd !== true) return null

      // Download the full image bytes, then decode it, before declaring it ready.
      const imgRes = await fetch(`${BASE}/ad.png${bust}`, { cache: 'no-store' })
      if (!imgRes.ok) return null
      const blob = await imgRes.blob()
      const url = URL.createObjectURL(blob)
      const img = new Image()
      img.src = url
      await (img.decode ? img.decode() : new Promise((r) => { img.onload = r; img.onerror = r }))

      const seconds = Math.max(0, Number(String(cfg.second ?? 0).trim()) || 0)
      return { url, skip: cfg.skip === true, seconds }
    } catch {
      return null
    }
  })()
  return adPromise
}

/** Ask the ad to show (no-op if already shown this session or nothing to show). */
export function requestAd() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(AD_EVENT))
}

export function LaunchAd() {
  const [ad, setAd] = useState<Ad | null>(null)
  const [open, setOpen] = useState(false)
  const [canSkip, setCanSkip] = useState(false)
  const [left, setLeft] = useState(0)
  const adRef = useRef<Ad | null>(null)

  // Preload at launch so the image is fully ready before it's ever displayed.
  useEffect(() => {
    let cancelled = false
    prefetchAd().then((a) => {
      if (cancelled) return
      adRef.current = a
      setAd(a)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    function onShow() {
      const a = adRef.current
      if (!a) return
      if (adShown) return
      adShown = true
      setLeft(Math.ceil(a.seconds))
      setCanSkip(a.skip || a.seconds <= 0)
      setOpen(true)
    }
    window.addEventListener(AD_EVENT, onShow)
    return () => window.removeEventListener(AD_EVENT, onShow)
  }, [])

  useEffect(() => {
    if (!open || left <= 0) return
    const id = setTimeout(() => setLeft((n) => n - 1), 1000)
    return () => clearTimeout(id)
  }, [open, left])

  useEffect(() => {
    if (open && left <= 0) setCanSkip(true)
  }, [open, left])

  if (!open || !ad) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md">
        <img src={ad.url} alt="Announcement" className="w-full rounded-2xl shadow-2xl" />
        <button
          type="button"
          disabled={!canSkip}
          onClick={() => setOpen(false)}
          className="absolute -top-3 -right-3 rounded-full bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-lg disabled:opacity-70"
        >
          {canSkip ? 'Skip' : `${left}s`}
        </button>
      </div>
    </div>
  )
}
