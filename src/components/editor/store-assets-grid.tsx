import { useEffect, useMemo, useState } from 'react'
import { Check, Crown, Download, Loader2, RefreshCw, Trash2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useAuth } from '@/components/auth-provider'
import { PaymentPage } from './payment-page'
import {
  ensureStoreAssetsLoaded,
  fetchStoreAssets,
  fetchStoreTiers,
  getStoreAssetSrc,
  installStoreAsset,
  isStoreAssetInstalled,
  listInstalledStoreAssets,
  previewStoreAsset,
  removeStoreAsset,
  storeTier,
  type StoreAsset,
  type StoreKind,
  type StoreTier,
  subscribeStoreAssets,
} from '@/lib/store-assets'

export function StoreAssetsGrid({
  kind,
  emptyHint,
  onUse,
}: {
  kind: StoreKind
  emptyHint?: string
  onUse?: (src: string, asset: StoreAsset) => void
}) {
  const [assets, setAssets] = useState<StoreAsset[]>([])
  const [tiers, setTiers] = useState<Record<string, StoreTier> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [pay, setPay] = useState(false)
  const [, force] = useState(0)
  const [visible, setVisible] = useState(12)
  const { isPro } = useAuth()

  useEffect(() => subscribeStoreAssets(() => force((n) => n + 1)), [])

  async function load(refresh = false) {
    setLoading(true)
    setError(null)
    try {
      void ensureStoreAssetsLoaded()
      const list = await fetchStoreAssets(kind, refresh)
      setAssets(list)
      setTiers(await fetchStoreTiers(kind, true).catch(() => ({})))
      // warm the first screenful of previews
      for (const a of list.slice(0, 12)) void previewStoreAsset(a).catch(() => {})
    } catch {
      setError("Couldn't load this store section. Check your connection and try again.")
    }
    setLoading(false)
  }

  useEffect(() => {
    // Always re-fetch listings when the section opens so freshly purged
    // jsDelivr uploads appear without tapping Refresh.
    void load(true)
    setVisible(12)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind])

  const all = useMemo(() => {
    const remote = new Set(assets.map((a) => a.file))
    return [...assets, ...listInstalledStoreAssets(kind).filter((a) => !remote.has(a.file))]
  }, [assets, kind])

  const shown = all.slice(0, visible)

  async function download(asset: StoreAsset) {
    const map = tiers ?? (await fetchStoreTiers(kind).catch(() => ({}) as Record<string, StoreTier>))
    if (!tiers) setTiers(map)
    if (storeTier(asset, map) === 'premium' && !isPro) {
      setPay(true)
      return
    }
    setBusy(asset.file)
    setError(null)
    try {
      await installStoreAsset(asset)
    } catch {
      setError(`Couldn't download ${asset.name}.`)
    }
    setBusy(null)
  }

  if (pay) return <PaymentPage open onClose={() => setPay(false)} />

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-2 pb-2">
        <h3 className="text-sm font-semibold text-foreground">{kind}</h3>
        <button
          type="button"
          aria-label="Refresh list"
          onClick={() => void load(true)}
          className="ml-auto flex size-8 items-center justify-center rounded-full text-muted-foreground active:scale-90"
        >
          <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
        </button>
      </div>

      {error && <p className="shrink-0 pb-2 text-xs text-destructive">{error}</p>}
      {loading && !all.length && (
        <p className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" /> Loading…
        </p>
      )}
      {!all.length && !loading && !error && (
        <p className="py-6 text-center text-xs text-muted-foreground">
          {emptyHint ?? 'Nothing published here yet.'}
        </p>
      )}

      <div className="grid min-h-0 flex-1 auto-rows-min grid-cols-3 gap-2 overflow-y-auto overscroll-contain perf-scroll no-scrollbar pb-6">
        {shown.map((asset) => {
          const tier = storeTier(asset, tiers)
          const has = isStoreAssetInstalled(kind, asset.file)
          const src = getStoreAssetSrc(kind, asset.file)
          return (
            <div key={asset.file} className="glass-tile relative aspect-square overflow-hidden rounded-2xl">
              <button
                type="button"
                aria-label={asset.name}
                disabled={!has || !src}
                onClick={() => src && onUse?.(src, asset)}
                className="relative block size-full overflow-hidden rounded-2xl bg-secondary/40 active:scale-[0.98] disabled:opacity-80"
              >
                {src ? (
                  <img src={src} alt={asset.name} className="size-full object-cover" />
                ) : (
                  <span className="grid size-full place-items-center text-[10px] text-muted-foreground">
                    …
                  </span>
                )}
                <span
                  className={cn(
                    'absolute left-1 top-1 flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold',
                    tier === 'premium'
                      ? 'bg-amber-500/20 text-amber-500'
                      : 'bg-emerald-500/20 text-emerald-500',
                  )}
                >
                  {tier === 'premium' ? <Crown className="size-2.5" /> : null}
                  {tier === 'premium' ? 'Pro' : 'Free'}
                </span>
              </button>
              {has ? (
                <>
                  <span className="pointer-events-none absolute right-1 top-1 flex items-center gap-0.5 rounded-full bg-emerald-500/25 px-1.5 py-0.5 text-[9px] font-bold text-emerald-500">
                    <Check className="size-2.5" />
                  </span>
                  <button
                    type="button"
                    aria-label={`Delete ${asset.name}`}
                    onClick={() => void removeStoreAsset(kind, asset.file)}
                    className="absolute bottom-1 right-1 flex size-7 items-center justify-center rounded-full bg-background/70 text-muted-foreground backdrop-blur active:scale-90"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  aria-label={`Download ${asset.name}`}
                  onClick={() => void download(asset)}
                  disabled={busy === asset.file}
                  className="glass-cta absolute bottom-1 right-1 flex size-7 items-center justify-center rounded-full disabled:opacity-50"
                >
                  {busy === asset.file ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Download className="size-3.5" />
                  )}
                </button>
              )}
            </div>
          )
        })}
        {all.length > 0 && (
          <div className="col-span-3 pt-1">
            {visible < all.length ? (
              <button
                type="button"
                onClick={() => {
                  const next = all.slice(visible, visible + 12)
                  setVisible((v) => v + 12)
                  for (const a of next) void previewStoreAsset(a).catch(() => {})
                }}
                className="glass-tile w-full rounded-xl py-2 text-xs font-semibold text-primary transition active:scale-[0.98]"
              >
                See more ({all.length - visible})
              </button>
            ) : (
              <p className="py-2 text-center text-[11px] text-muted-foreground">Nothing more.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
