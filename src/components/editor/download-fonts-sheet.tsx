import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Crown, Download, Loader2, RefreshCw, Trash2, Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/auth-provider'
import { PaymentPage } from './payment-page'
import { GoogleFontsPanel } from './google-fonts-panel'
import {
  addCustomFont,
  customFontFamily,
  ensureCustomFontsLoaded,
  listCustomFonts,
  removeCustomFont,
  subscribeFonts,
} from '@/lib/custom-fonts'
import {
  googleCssFamily,
  listInstalledGoogleFonts,
  preloadGoogleFontPreview,
  removeGoogleFont,
  subscribeGoogleFonts,
} from '@/lib/google-fonts'
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
  const [limit, setLimit] = useState(20)
  const [revealed, setRevealed] = useState(0)
  const [previewing, setPreviewing] = useState(false)
  const { isPro } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => subscribeRemoteFonts(() => force((n) => n + 1)), [])
  useEffect(() => subscribeGoogleFonts(() => force((n) => n + 1)), [])
  useEffect(() => subscribeFonts(() => force((n) => n + 1)), [])

  const googleInstalled = useMemo(
    // eslint-disable-next-line react-hooks/exhaustive-deps
    () => (tab === 'downloaded' ? listInstalledGoogleFonts() : []),
    [tab, tick],
  )
  const uploaded = useMemo(
    // eslint-disable-next-line react-hooks/exhaustive-deps
    () => (tab === 'downloaded' ? listCustomFonts() : []),
    [tab, tick],
  )

  useEffect(() => {
    if (tab === 'downloaded' && googleInstalled.length) preloadGoogleFontPreview(googleInstalled)
  }, [tab, googleInstalled])

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (!files.length) return
    setError(null)
    // .woff / .woff2 uploads are Pro-only; .ttf / .otf stay free
    if (!isPro && files.some((f) => /\.woff2?$/i.test(f.name))) {
      setPay(true)
      return
    }
    try {
      for (const file of files) await addCustomFont(file)
      ensureCustomFontsLoaded()
      setTab('downloaded')
    } catch {
      setError("Couldn't add that font file.")
    }
  }

  async function load(refresh = false) {
    setLoading(true)
    setError(null)
    try {
      const list = await fetchRemoteFonts(refresh)
      setFonts(list)
      // Tier metadata can change independently from the font catalog, so
      // refresh it whenever this page opens.
      void fetchFontTiers(true).then(setTiers).catch(() => {})
      void ensureRemoteFontsLoaded()
    } catch {
      setError("Couldn't load the font list. Check your connection and try again.")
    }
    setLoading(false)
  }

  useEffect(() => {
    if (open) void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    setLimit(20)
    setRevealed(0)
  }, [tab])

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

  const targets = useMemo(() => results.slice(0, limit), [results, limit])

  // download previews one by one and reveal each font only once its preview is ready
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      for (let i = 0; i < targets.length; i++) {
        if (cancelled) return
        const f = targets[i]
        if (!isRemoteFontReady(f.name)) {
          setPreviewing(true)
          try {
            await previewRemoteFont(f)
          } catch {
            /* skip */
          }
        }
        if (cancelled) return
        setRevealed((n) => Math.max(n, i + 1))
      }
      if (!cancelled) setPreviewing(false)
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targets.map((f) => f.file).join('|')])

  const shown = useMemo(
    () => results.slice(0, Math.min(revealed, limit)),
    [results, revealed, limit],
  )

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
        <input
          ref={fileRef}
          type="file"
          accept=".ttf,.otf,.woff,.woff2,font/*"
          multiple
          hidden
          onChange={(e) => void onUpload(e)}
        />
        <button
          type="button"
          aria-label="Upload font"
          onClick={() => fileRef.current?.click()}
          className="ml-auto flex items-center gap-1 rounded-full bg-foreground/10 px-2.5 py-1.5 text-[11px] font-semibold text-foreground active:scale-95"
        >
          <Upload className="size-3.5" /> Upload
        </button>
        <button
          type="button"
          aria-label="Refresh list"
          onClick={() => void load(true)}
          className="flex size-8 items-center justify-center rounded-full text-muted-foreground active:scale-90"
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

          {tab === 'downloaded' &&
            uploaded.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-2 rounded-2xl border border-border/60 bg-foreground/5 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[19px] leading-[1.9]"
                    style={{ fontFamily: `'${customFontFamily(f.id)}', sans-serif` }}
                  >
                    မြန်မာ ဖောင့်စတိုင် Aa
                  </span>
                  <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-muted-foreground">
                    <span className="shrink-0 rounded-full bg-sky-500/15 px-1.5 py-[1px] text-[8px] font-bold text-sky-500">
                      Uploaded
                    </span>
                    <span className="truncate">{f.label}</span>
                  </span>
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${f.label}`}
                  onClick={() => removeCustomFont(f.id)}
                  className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground active:scale-90"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}

          {tab === 'downloaded' &&
            googleInstalled.map((family) => (
              <div
                key={family}
                className="flex items-center gap-2 rounded-2xl border border-border/60 bg-foreground/5 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[19px] leading-[1.9]"
                    style={{ fontFamily: `'${googleCssFamily(family)}', '${family}', sans-serif` }}
                  >
                    The quick brown fox Aa
                  </span>
                  <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-muted-foreground">
                    <span className="shrink-0 rounded-full bg-emerald-500/15 px-1.5 py-[1px] text-[8px] font-bold text-emerald-500">
                      Google
                    </span>
                    <span className="truncate">{family}</span>
                  </span>
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${family}`}
                  onClick={() => void removeGoogleFont(family)}
                  className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground active:scale-90"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}

          {previewing && (
            <p className="flex items-center justify-center gap-2 py-2 text-[11px] text-muted-foreground">
              <RefreshCw className="size-3.5 animate-spin" /> Loading fonts…
            </p>
          )}

          {shown.map((f) => {
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

          {results.length > 0 && !previewing && shown.length >= Math.min(limit, results.length) &&
            (limit < results.length ? (
              <button
                type="button"
                onClick={() => setLimit((n) => n + 20)}
                className="w-full rounded-2xl border border-border/60 bg-foreground/5 py-2 text-[11px] font-semibold text-foreground/80 active:scale-95"
              >
                See more ({results.length - limit} left)
              </button>
            ) : (
              <p className="py-3 text-center text-[10px] text-muted-foreground">
                No more fonts.
              </p>
            ))}

          {!loading &&
            results.length === 0 &&
            !error &&
            !(tab === 'downloaded' && (googleInstalled.length || uploaded.length)) && (
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
