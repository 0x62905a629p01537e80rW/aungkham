import { useEffect, useMemo, useState } from 'react'
import { Check, Crown, Download, Loader2, RefreshCw, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/auth-provider'
import { PaymentPage } from './payment-page'
import { GoogleFontsPanel } from './google-fonts-panel'
import {
  ensureRemoteFontsLoaded,
  fetchFontTiers,
  fetchRemoteFonts,
  fontTier,
  installRemoteFont,
  isRemoteFontInstalled,
  isRemoteFontReady,
  listInstalledRemoteFonts,
  previewRemoteFont,
  remoteCssFamily,
  removeRemoteFont,
  subscribeRemoteFonts,
  type FontTier,
  type RemoteFont,
} from '@/lib/remote-fonts'

export function DownloadFontsSheet({
  open,
  onClose,
  inline = false,
}: {
  open: boolean
  onClose?: () => void
  inline?: boolean
}) {
  const [fonts, setFonts] = useState<RemoteFont[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'mm' | 'en' | 'free' | 'premium' | 'downloaded'>('mm')
  const [busy, setBusy] = useState<string | null>(null)
  const [tick, force] = useState(0)
  const [tiers, setTiers] = useState<Record<string, FontTier> | null>(null)
  const [pay, setPay] = useState(false)
  const { isPro } = useAuth()

  useEffect(() => subscribeRemoteFonts(() => force((n) => n + 1)), [])

  async function load(refresh = false) {
    setLoading(true)
    setError(null)
    try {
      const list = await fetchRemoteFonts(refresh)
      setFonts(list)
      void fetchFontTiers(refresh).then(setTiers).catch(() => {})
      void ensureRemoteFontsLoaded()
      // preview the first screenful so samples render in their own typeface
      list.slice(0, 12).forEach((f) => void previewRemoteFont(f).catch(() => {}))
    } catch {
      setError("Couldn't load the font list. Check your connection and try again.")
    }
    setLoading(false)
  }

  useEffect(() => {
    if (open) void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const results = useMemo(() => {
    if (tab === 'downloaded') {
      const installed = listInstalledRemoteFonts()
      const names = new Set(installed.map((f) => f.name))
      const known = fonts.filter((f) => names.has(f.name))
      const extra = installed.filter((f) => !fonts.some((x) => x.name === f.name))
      return [...known, ...extra]
    }
    if (tab === 'free') return fonts.filter((f) => fontTier(f, tiers) === 'free')
    if (tab === 'premium') return fonts.filter((f) => fontTier(f, tiers) === 'premium')
    return fonts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fonts, tab, tiers, tick])

  async function download(font: RemoteFont) {
    if (fontTier(font, tiers) === 'premium' && !isPro) {
      setPay(true)
      return
    }
    setBusy(font.name)
    setError(null)
    try {
      await installRemoteFont(font)
    } catch {
      setError(`Couldn't download ${font.name}.`)
    }
    setBusy(null)
  }

  if (!open) return null

  return (
    <div
      className={cn(
        'flex flex-col',
        inline
          ? 'min-h-0 flex-1'
          : 'fixed inset-0 z-50 bg-background/95 backdrop-blur-xl',
      )}
    >
      <div
        className={cn(
          'flex items-center gap-2',
          inline ? 'pb-1' : 'border-b border-border/50 px-4 py-3',
        )}
      >
        <h2 className="text-sm font-semibold text-foreground">Download Fonts</h2>
        <button
          type="button"
          aria-label="Refresh list"
          onClick={() => void load(true)}
          className="ml-auto flex size-8 items-center justify-center rounded-full text-muted-foreground active:scale-90"
        >
          <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
        </button>
        {!inline && (
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full bg-foreground/10 text-foreground active:scale-90"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className={cn('flex min-h-0 flex-1 flex-col gap-2', inline ? 'py-1' : 'px-4 py-3')}>
        <div className="flex shrink-0 items-center gap-1 rounded-2xl border border-border/60 bg-foreground/5 p-1">
          {(
            [
              { id: 'mm', label: 'Myanmar' },
              { id: 'en', label: 'English' },
              { id: 'free', label: 'Free' },
              { id: 'premium', label: 'Premium' },
              { id: 'downloaded', label: 'Downloaded' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'flex-1 whitespace-nowrap rounded-xl px-1.5 py-1.5 text-[10px] font-semibold transition active:scale-95',
                tab === t.id
                  ? 'bg-foreground/10 text-foreground'
                  : 'text-muted-foreground',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <p className="shrink-0 text-[10px] leading-snug text-muted-foreground">
          Preview any font, then download it once — it is saved in the app, appears under
          “Downloaded” in the typeface list, and works offline.
        </p>

        {error && (
          <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-[11px] text-foreground">
            {error}
          </p>
        )}

        {tab === 'en' ? (
          <div className="min-h-0 flex-1">
            <GoogleFontsPanel activeKey="" onPick={() => {}} />
          </div>
        ) : (
        <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto overscroll-contain perf-scroll no-scrollbar pr-1">
          {loading && fonts.length === 0 && (
            <p className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading fonts…
            </p>
          )}

          {results.map((f) => {
            const has = isRemoteFontInstalled(f.name)
            const ready = isRemoteFontReady(f.name)
            const premium = fontTier(f, tiers) === 'premium'
            const locked = premium && !isPro
            return (
              <div
                key={f.file}
                className="flex items-center gap-2 rounded-2xl border border-border/60 bg-foreground/5 px-3 py-2"
              >
                <button
                  type="button"
                  onClick={() => void previewRemoteFont(f).catch(() => {})}
                  className="min-w-0 flex-1 text-left"
                >
                  <span
                    className="block truncate text-[19px] leading-[1.9]"
                    style={{ fontFamily: ready ? `'${remoteCssFamily(f.name)}', sans-serif` : undefined }}
                  >
                    မြန်မာ ဖောင့်စတိုင် Aa
                  </span>
                  <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-muted-foreground">
                    {premium ? (
                      <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-amber-500/15 px-1.5 py-[1px] text-[8px] font-bold text-amber-500">
                        <Crown className="size-2.5" /> Pro
                      </span>
                    ) : (
                      <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-emerald-500/15 px-1.5 py-[1px] text-[8px] font-bold text-emerald-500">
                        Free
                      </span>
                    )}
                    <span className="truncate">
                      {f.name}
                      {f.size ? ` • ${Math.round(f.size / 1024)} KB` : ''}
                    </span>
                  </span>
                </button>

                {busy === f.name ? (
                  <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
                ) : has ? (
                  <div className="flex shrink-0 items-center gap-1">
                    <Check className="size-4 text-primary" />
                    <button
                      type="button"
                      aria-label={`Remove ${f.name}`}
                      onClick={() => void removeRemoteFont(f.name)}
                      className="flex size-7 items-center justify-center rounded-full text-muted-foreground active:scale-90"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    aria-label={locked ? `Unlock ${f.name} with Pro` : `Download ${f.name}`}
                    onClick={() => void download(f)}
                    className={cn(
                      'flex size-7 shrink-0 items-center justify-center rounded-full active:scale-90',
                      locked
                        ? 'bg-amber-500/15 text-amber-500'
                        : 'bg-emerald-500/15 text-emerald-500',
                    )}
                  >
                    {locked ? <Crown className="size-3.5" /> : <Download className="size-3.5" />}
                  </button>
                )}
              </div>
            )
          })}

          {!loading && results.length === 0 && !error && (
            <p className="py-8 text-center text-xs text-muted-foreground">
              {tab === 'downloaded' ? 'No downloaded fonts yet.' : 'No fonts found.'}
            </p>
          )}
        </div>
        )}
      </div>

      <PaymentPage open={pay} onClose={() => setPay(false)} />
    </div>
  )
}
