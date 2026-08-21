import { useEffect, useState } from 'react'
import { X, ExternalLink } from 'lucide-react'
import promoBanner from '@/assets/promo-fontmaker.webp.asset.json'

const PROMO_URL = 'https://play.google.com/store/apps/details?id=com.cstmpj.two'
const KEY = 'promo-ad-last-shown'

function today() {
  return new Date().toISOString().slice(0, 10)
}

/** Closeable promo shown on first install and once per day after that. */
export function PromoAd() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let last: string | null = null
    try {
      last = localStorage.getItem(KEY)
    } catch {
      /* ignore */
    }
    if (last === today()) return
    const id = setTimeout(() => setOpen(true), 900)
    return () => clearTimeout(id)
  }, [])

  function close() {
    setOpen(false)
    try {
      localStorage.setItem(KEY, today())
    } catch {
      /* ignore */
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/80 p-5 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm">
        <a
          href={PROMO_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={close}
          className="block overflow-hidden rounded-2xl shadow-2xl active:scale-[0.99] transition"
        >
          <img
            src={promoBanner.url}
            alt="Font Maker on Google Play"
            className="w-full"
            loading="eager"
          />
          <span className="flex items-center justify-center gap-1.5 bg-foreground py-2.5 text-xs font-bold text-background">
            <ExternalLink className="size-3.5" />
            Get it on Google Play
          </span>
        </a>
        <button
          type="button"
          onClick={close}
          aria-label="Close ad"
          className="absolute -top-3 -right-3 grid size-8 place-items-center rounded-full bg-background text-foreground shadow-lg active:scale-95"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
