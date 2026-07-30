import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Download, Loader2, Search, Trash2, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  GOOGLE_FONTS,
  googleCssFamily,
  googleFontKey,
  installGoogleFont,
  isGoogleFontInstalled,
  listInstalledGoogleFonts,
  removeGoogleFont,
  subscribeGoogleFonts,
} from '@/lib/google-fonts'

const CATEGORIES = ['all', 'sans-serif', 'serif', 'display', 'handwriting', 'monospace'] as const
type Cat = (typeof CATEGORIES)[number]

const CAT_LABEL: Record<Cat, string> = {
  all: 'All',
  'sans-serif': 'Sans',
  serif: 'Serif',
  display: 'Display',
  handwriting: 'Script',
  monospace: 'Mono',
}

export function GoogleFontsPanel({
  activeKey,
  onPick,
}: {
  activeKey: string
  onPick: (fontKey: string) => void
}) {
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState<Cat>('all')
  const [onlyInstalled, setOnlyInstalled] = useState(false)
  const [limit, setLimit] = useState(60)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [, force] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => subscribeGoogleFonts(() => force((n) => n + 1)), [])
  useEffect(() => setLimit(60), [query, cat, onlyInstalled])

  const installed = listInstalledGoogleFonts()

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return GOOGLE_FONTS.filter((f) => {
      if (cat !== 'all' && f.c !== cat) return false
      if (onlyInstalled && !installed.includes(f.f)) return false
      if (q && !f.f.toLowerCase().includes(q)) return false
      return true
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, cat, onlyInstalled, installed.join('|')])

  const shown = results.slice(0, limit)

  async function use(family: string) {
    setError(null)
    if (!isGoogleFontInstalled(family)) {
      setBusy(family)
      try {
        await installGoogleFont(family)
      } catch {
        setBusy(null)
        setError(`Couldn't download ${family}. Check your connection and try again.`)
        return
      }
      setBusy(null)
    } else {
      try {
        await installGoogleFont(family)
      } catch {
        /* already cached */
      }
    }
    onPick(googleFontKey(family))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-foreground/5 px-3 py-2">
        <Search className="size-3.5 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${GOOGLE_FONTS.length}+ Google fonts`}
          className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="-mx-1 flex gap-1.5 overflow-x-auto perf-scroll px-1 pb-1 [scrollbar-width:none]">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCat(c)}
            className={cn(
              'shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold transition active:scale-95',
              cat === c
                ? 'bg-primary text-primary-foreground'
                : 'border border-border/60 bg-foreground/5 text-foreground/70',
            )}
          >
            {CAT_LABEL[c]}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setOnlyInstalled((v) => !v)}
          className={cn(
            'shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold transition active:scale-95',
            onlyInstalled
              ? 'bg-primary text-primary-foreground'
              : 'border border-border/60 bg-foreground/5 text-foreground/70',
          )}
        >
          Downloaded ({installed.length})
        </button>
      </div>

      <p className="flex items-center gap-1.5 text-[10px] leading-snug text-muted-foreground">
        <WifiOff className="size-3 shrink-0" />
        Tap a font to download it once — it is saved in the app and works offline after that.
      </p>

      {error && (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-[11px] text-foreground">
          {error}
        </p>
      )}

      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget
          if (el.scrollTop + el.clientHeight > el.scrollHeight - 160 && limit < results.length) {
            setLimit((n) => n + 60)
          }
        }}
        className="max-h-[42dvh] space-y-1.5 overflow-y-auto perf-scroll pr-1"
      >
        {shown.map((f) => {
          const key = googleFontKey(f.f)
          const has = installed.includes(f.f)
          const active = activeKey === key
          return (
            <div
              key={f.f}
              className={cn(
                'flex items-center gap-2 rounded-2xl border px-3 py-2 transition',
                active ? 'border-primary bg-primary/10' : 'border-border/60 bg-foreground/5',
              )}
            >
              <button
                type="button"
                onClick={() => use(f.f)}
                className="min-w-0 flex-1 text-left"
              >
                <span
                  className="block truncate text-[15px] leading-tight text-foreground"
                  style={has ? { fontFamily: `'${googleCssFamily(f.f)}', sans-serif` } : undefined}
                >
                  {f.f}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                  {CAT_LABEL[(f.c as Cat) in CAT_LABEL ? (f.c as Cat) : 'all']}
                  {f.s.includes('myanmar') ? ' • မြန်မာ' : ''}
                </span>
              </button>

              {busy === f.f ? (
                <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
              ) : has ? (
                <div className="flex shrink-0 items-center gap-1">
                  <Check className="size-4 text-primary" />
                  <button
                    type="button"
                    aria-label={`Remove ${f.f}`}
                    onClick={() => removeGoogleFont(f.f)}
                    className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition active:scale-90"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  aria-label={`Download ${f.f}`}
                  onClick={() => use(f.f)}
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary transition active:scale-90"
                >
                  <Download className="size-3.5" />
                </button>
              )}
            </div>
          )
        })}

        {results.length === 0 && (
          <p className="py-6 text-center text-xs text-muted-foreground">
            {onlyInstalled ? 'No downloaded fonts yet.' : 'No fonts match that search.'}
          </p>
        )}
        {limit < results.length && (
          <button
            type="button"
            onClick={() => setLimit((n) => n + 120)}
            className="w-full rounded-2xl border border-border/60 bg-foreground/5 py-2 text-[11px] font-semibold text-foreground/80"
          >
            Show more ({results.length - limit} left)
          </button>
        )}
      </div>
    </div>
  )
}
