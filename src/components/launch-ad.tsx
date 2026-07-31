import { useEffect, useState } from 'react'

const BASE = 'https://myandev.github.io'
const SESSION_KEY = 'launch-ad-shown'

type AdConfig = { showAd?: boolean; skip?: boolean; second?: string | number }

/** Fetches ad.json on launch and shows ad.png once per app session. */
export function LaunchAd() {
  const [open, setOpen] = useState(false)
  const [src, setSrc] = useState('')
  const [canSkip, setCanSkip] = useState(false)
  const [left, setLeft] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem(SESSION_KEY)) return
    if (navigator.onLine === false) return

    let cancelled = false
    const bust = `?t=${Date.now()}`
    ;(async () => {
      try {
        const res = await fetch(`${BASE}/ad.json${bust}`, { cache: 'no-store' })
        if (!res.ok) return
        const cfg = (await res.json()) as AdConfig
        if (cancelled || cfg.showAd !== true) return

        const url = `${BASE}/ad.png${bust}`
        await new Promise<void>((resolve, reject) => {
          const img = new Image()
          img.onload = () => resolve()
          img.onerror = () => reject(new Error('ad image failed'))
          img.src = url
        })
        if (cancelled) return

        const secs = Math.max(0, Number(String(cfg.second ?? 0).trim()) || 0)
        sessionStorage.setItem(SESSION_KEY, '1')
        setSrc(url)
        setLeft(Math.ceil(secs))
        setCanSkip(cfg.skip === true || secs <= 0)
        setOpen(true)
      } catch {
        /* offline or missing ad — ignore silently */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!open || left <= 0) return
    const id = setTimeout(() => setLeft((n) => n - 1), 1000)
    return () => clearTimeout(id)
  }, [open, left])

  useEffect(() => {
    if (open && left <= 0) setCanSkip(true)
  }, [open, left])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md">
        <img src={src} alt="Announcement" className="w-full rounded-2xl shadow-2xl" />
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