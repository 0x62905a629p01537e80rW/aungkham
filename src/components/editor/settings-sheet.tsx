import { useState } from 'react'
import { ArrowLeft, Crown, Settings as SettingsIcon, Star } from 'lucide-react'
import { PLAY_STORE_URL, markRated } from '@/lib/rate-us'

const SUPPORT_EMAIL = 'mm.nextlevelcreators@gmail.com'

function mailto(subject: string) {
  window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`
}

function Row({
  title,
  desc,
  onClick,
}: {
  title: string
  desc: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full border-b border-border/50 px-1 py-4 text-left transition active:opacity-70"
    >
      <p className="text-base font-semibold">{title}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p>
    </button>
  )
}

export function SettingsSheet({ onBuyPro }: { onBuyPro?: () => void }) {
  const [open, setOpen] = useState(false)
  const [about, setAbout] = useState(false)

  return (
    <>
      <button
        type="button"
        aria-label="Settings"
        onClick={() => setOpen(true)}
        className="glass-tile grid size-9 place-items-center rounded-full text-foreground transition active:scale-95"
      >
        <SettingsIcon className="size-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[65] overflow-y-auto bg-background text-foreground animate-fade-in">
          <div
            className="flex items-center gap-4 px-4 pb-2 pt-4"
            style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
          >
            <button
              type="button"
              aria-label="Back"
              onClick={() => (about ? setAbout(false) : setOpen(false))}
              className="grid size-9 place-items-center rounded-full transition active:scale-95"
            >
              <ArrowLeft className="size-6" />
            </button>
            <h2 className="text-2xl font-semibold">{about ? 'About us' : 'Settings'}</h2>
          </div>

          {about ? (
            <div className="space-y-3 px-5 pb-10 pt-4 text-sm leading-relaxed text-muted-foreground">
              <p className="text-base font-semibold text-foreground">Myan · Add Text On Photo</p>
              <p>
                Myan is a Myanmar-first photo text editor built by Next Level Creators. Add
                beautiful Myanmar and English typography, stickers, shapes and templates to your
                photos — right on your phone.
              </p>
              <p>
                Contact us at{' '}
                <span className="font-medium text-foreground">{SUPPORT_EMAIL}</span>
              </p>
            </div>
          ) : (
            <div className="px-4 pb-12">
              <div className="relative mt-2 overflow-hidden rounded-3xl border border-border/50 bg-muted/40 p-5">
                <p className="flex items-center gap-2 text-xl font-semibold">
                  Myan
                  <span className="rounded-md bg-gradient-to-r from-[#ec4899] to-[#8b5cf6] px-2 py-0.5 text-[11px] font-bold text-white">
                    Pro
                  </span>
                </p>
                <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                  <li>• Remove ads</li>
                  <li>• Unlock all features</li>
                </ul>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    onBuyPro?.()
                  }}
                  className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#ec4899] via-[#8b5cf6] to-[#3b82f6] text-base font-bold text-white transition active:scale-[0.98]"
                >
                  <Crown className="size-5" />
                  Get Premium
                </button>
              </div>

              <p className="mt-7 mb-1 text-base font-semibold">General</p>

              <Row
                title="Feedback"
                desc="Report bugs and tell us what to improve"
                onClick={() => mailto('Myan app — Feedback')}
              />
              <Row
                title="Request a new feature"
                desc="Share your ideas to fuel app updates!"
                onClick={() => mailto('Myan app — Feature request')}
              />
              <Row
                title="Rate us on Google Play"
                desc="Enjoying Myan? Leave us a rating"
                onClick={() => {
                  markRated()
                  window.open(PLAY_STORE_URL, '_blank', 'noopener,noreferrer')
                }}
              />
              <Row title="About us" desc="Learn more about Myan" onClick={() => setAbout(true)} />

              <p className="mt-6 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Star className="size-3.5" />
                Made by Next Level Creators
              </p>
            </div>
          )}
        </div>
      )}
    </>
  )
}
