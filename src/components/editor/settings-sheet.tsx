import { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowLeft,
  Check,
  Crown,
  Headphones,
  LogOut,
  Settings as SettingsIcon,
  Star,
} from 'lucide-react'
import { PLAY_STORE_URL, markRated } from '@/lib/rate-us'
import { useAuth } from '@/components/auth-provider'
import { useI18n } from '@/components/i18n'
import { PaymentPage } from './payment-page'

const PRO_BENEFITS = [
  'No ads, no watermark',
  'All premium fonts, styles & effects',
  'All templates, shapes & stickers',
  'Priority support & future updates',
]

function fmtDate(d: Date | null) {
  if (!d) return null
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

const SUPPORT_EMAIL = 'mm.nextlevelcreators@gmail.com'

function mailto(subject: string) {
  window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`
}

function TelegramIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="#229ED9" />
      <path
        d="M5.5 11.9 17 7.4c.6-.2 1.1.1.9.9l-2 9.2c-.1.6-.5.8-1 .5l-2.8-2-1.4 1.3c-.2.2-.3.3-.6.3l.2-3 5.3-4.8c.2-.2 0-.3-.3-.1L8.6 13l-2.8-.9c-.6-.2-.6-.6.1-.9Z"
        fill="#fff"
      />
    </svg>
  )
}

function Row({
  title,
  desc,
  icon,
  onClick,
}: {
  title: string
  desc: string
  icon?: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 border-b border-border/50 px-1 py-4 text-left transition active:opacity-70"
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold">{title}</span>
        <span className="mt-0.5 block text-sm text-muted-foreground">{desc}</span>
      </span>
    </button>
  )
}

export function SettingsSheet({ onBuyPro }: { onBuyPro?: () => void }) {
  const [open, setOpen] = useState(false)
  const [about, setAbout] = useState(false)
  const [pay, setPay] = useState(false)
  const [restore, setRestore] = useState(false)
  const { t, lang, setLang } = useI18n()
  const { user, isPro, proPending, proExpiresAt, proSince, signIn, signOutUser } = useAuth()

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

      {open && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[65] overflow-y-auto perf-scroll bg-background text-foreground animate-fade-in">
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
            <h2 className="text-2xl font-semibold">{about ? t('settings.about') : t('settings.title')}</h2>
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
              {isPro ? (
                <div className="relative mt-2 overflow-hidden rounded-3xl border border-border/50 bg-muted/40 p-5">
                  <p className="flex items-center gap-2 text-xl font-semibold">
                    Myan
                    <span className="rounded-md bg-gradient-to-r from-[#ec4899] to-[#8b5cf6] px-2 py-0.5 text-[11px] font-bold text-white">
                      Pro
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {user?.email ?? 'Pro active'}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-2xl border border-border/50 bg-background/50 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Status
                      </p>
                      <p className="mt-0.5 text-sm font-semibold">Active</p>
                    </div>
                    <div className="rounded-2xl border border-border/50 bg-background/50 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Expires
                      </p>
                      <p className="mt-0.5 text-sm font-semibold">
                        {fmtDate(proExpiresAt) ?? 'Lifetime'}
                      </p>
                    </div>
                  </div>
                  {proSince && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Activated on {fmtDate(proSince)}
                    </p>
                  )}
                  <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                    {PRO_BENEFITS.map((b) => (
                      <li key={b} className="flex items-start gap-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-[#8b5cf6]" />
                        {b}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => {
                      void signOutUser()
                    }}
                    className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-border/60 text-sm font-semibold transition active:scale-[0.98]"
                  >
                    <LogOut className="size-4" />
                    {t('settings.logout')}
                  </button>
                </div>
              ) : proPending ? (
                <div className="relative mt-2 overflow-hidden rounded-3xl border border-border/50 bg-muted/40 p-5">
                  <p className="flex items-center gap-2 text-xl font-semibold">
                    Myan
                    <span className="rounded-md bg-amber-500 px-2 py-0.5 text-[11px] font-bold text-white">
                      Pending
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
                  <div className="mt-3 rounded-2xl border border-border/50 bg-background/50 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Status
                    </p>
                    <p className="mt-0.5 text-sm font-semibold">Pending verification</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      We're checking your payment. Pro unlocks automatically once approved.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      void signOutUser()
                    }}
                    className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-border/60 text-sm font-semibold transition active:scale-[0.98]"
                  >
                    <LogOut className="size-4" />
                    {t('settings.logout')}
                  </button>
                </div>
              ) : (
                <div className="relative mt-2 overflow-hidden rounded-3xl border border-border/50 bg-muted/40 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="flex items-center gap-2 text-xl font-semibold">
                      Myan
                      <span className="premium-glass rounded-md px-2 py-0.5 text-[11px] font-bold">
                        Pro
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setRestore(true)}
                      className="rounded-full border border-border/60 px-3 py-1.5 text-xs font-semibold transition active:scale-95"
                    >
                      Restore
                    </button>
                  </div>
                  <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                    <li>• Remove ads</li>
                    <li>• Unlock all features</li>
                  </ul>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false)
                      if (onBuyPro) onBuyPro()
                      else setPay(true)
                    }}
                    className="premium-glass mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-base font-bold transition active:scale-[0.98]"
                  >
                    <Crown className="size-5" />
                    Get Pro Features
                  </button>
                  {user && (
                    <button
                      type="button"
                      onClick={() => {
                        void signOutUser()
                      }}
                      className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-2xl border border-border/60 text-sm font-semibold transition active:scale-[0.98]"
                    >
                      <LogOut className="size-4" />
                      {t('settings.logout')}
                    </button>
                  )}
                </div>
              )}

              {restore &&
                createPortal(
                  <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
                    <button
                      type="button"
                      aria-label="Close"
                      onClick={() => setRestore(false)}
                      className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    />
                    <div className="glass-panel relative w-full max-w-sm rounded-3xl p-6 text-center">
                      <p className="text-lg font-bold">Restore Pro</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {user
                          ? 'This is a free account. We found no purchase history for ' +
                            (user.email ?? 'this account') +
                            '. If you paid with another account, sign out and log in with it.'
                          : 'To restore your Pro purchase, you need to log in with the account you used to buy it.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (user) {
                            setRestore(false)
                            setOpen(false)
                            if (onBuyPro) onBuyPro()
                            else setPay(true)
                            return
                          }
                          void signIn()
                            .then(() => setRestore(false))
                            .catch(() => {})
                        }}
                        className="premium-glass mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-base font-bold transition active:scale-[0.98]"
                      >
                        {user ? 'Buy now' : 'Login'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRestore(false)}
                        className="mt-2 w-full py-2 text-sm font-medium text-muted-foreground transition active:opacity-70"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>,
                  document.body,
                )}


              <p className="mt-7 mb-1 text-base font-semibold">General</p>

              <div className="flex items-center justify-between gap-3 border-b border-border/50 px-1 py-4">
                <div>
                  <p className="text-base font-semibold">{t('settings.language')}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {lang === 'my' ? t('lang.myanmar') : t('lang.english')}
                  </p>
                </div>
                <div className="glass-tile flex items-center gap-1 rounded-full p-1">
                  {(['en', 'my'] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLang(l)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                        lang === l ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {l === 'en' ? t('lang.english') : t('lang.myanmar')}
                    </button>
                  ))}
                </div>
              </div>

              <Row
                title={t('settings.support')}
                desc={t('settings.supportDesc')}
                icon={<TelegramIcon className="size-5" />}
                onClick={() => {
                  window.open('https://t.me/myanpro', '_blank', 'noopener,noreferrer')
                }}
              />
              <Row
                title={t('settings.feedback')}
                desc={t('settings.feedbackDesc')}
                onClick={() => mailto('Myan app — Feedback')}
              />
              <Row
                title={t('settings.request')}
                desc={t('settings.requestDesc')}
                onClick={() => mailto('Myan app — Feature request')}
              />
              <Row
                title={t('settings.rate')}
                desc={t('settings.rateDesc')}
                onClick={() => {
                  markRated()
                  window.open(PLAY_STORE_URL, '_blank', 'noopener,noreferrer')
                }}
              />
              <Row title={t('settings.about')} desc={t('settings.aboutDesc')} onClick={() => setAbout(true)} />

              <p className="mt-6 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Star className="size-3.5" />
                Made by Next Level Creators
              </p>
            </div>
          )}
        </div>,
        document.body,
      )}
      <PaymentPage open={pay} onClose={() => setPay(false)} />
    </>
  )
}
