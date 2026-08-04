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
  packTier,
  previewStoreAsset,
  removeStoreAsset,
  storeTier,
  type StoreAsset,
  type StoreKind,
  type StoreTier,
  subscribeStoreAssets,
} from '@/lib/store-assets'

interface Group {
  /** pack folder name, or '' for loose files */
  pack: string
  items: StoreAsset[]
}

function TierBadge({ tier }: { tier: StoreTier }) {
  return (
    <span
      className={cn(
        'flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold',
        tier === 'premium' ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500',
      )}
    >
      {tier === 'premium' ? <Crown className="size-2.5" /> : null}
      {tier === 'premium' ? 'Pro' : 'Free'}
    </span>
  )
}

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
  const [progress, setProgress] = useState<{ pack: string; done: number; total: number } | null>(
    null,
  )
  const [pay, setPay] = useState(false)
  const [, force] = useState(0)
  const [visible, setVisible] = useState(24)
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
      for (const a of list.slice(0, 24)) void previewStoreAsset(a).catch(() => {})
    } catch {
      setError("Couldn't load this store section. Check your connection and try again.")
    }
    setLoading(false)
  }

  useEffect(() => {
    // Always re-fetch listings when the section opens so freshly purged
    // jsDelivr uploads appear without tapping Refresh.
    void load(true)
    setVisible(24)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind])

  const all = useMemo(() => {
    const remote = new Set(assets.map((a) => a.file))
    return [...assets, ...listInstalledStoreAssets(kind).filter((a) => !remote.has(a.file))]
  }, [assets, kind])

  const groups: Group[] = useMemo(() => {
    const map = new Map<string, StoreAsset[]>()
    for (const a of all) {
      const p = a.pack ?? ''
      const bucket = map.get(p)
      if (bucket) bucket.push(a)
      else map.set(p, [a])
    }
    // packs first, loose files last
    return [...map.entries()]
      .sort((a, b) => (a[0] === '' ? 1 : b[0] === '' ? -1 : a[0].localeCompare(b[0])))
      .map(([pack, items]) => ({ pack, items }))
  }, [all])

  async function gate(tier: StoreTier) {
    if (tier === 'premium' && !isPro) {
      setPay(true)
      return false
    }
    return true
  }

  async function download(asset: StoreAsset) {
    const map = tiers ?? (await fetchStoreTiers(kind).catch(() => ({}) as Record<string, StoreTier>))
    if (!tiers) setTiers(map)
    if (!(await gate(storeTier(asset, map)))) return
    setBusy(asset.file)
    setError(null)
    try {
      await installStoreAsset(asset)
    } catch {
      setError(`Couldn't download ${asset.name}.`)
    }
    setBusy(null)
  }

  /** Packs are all-or-nothing: one tap installs every sticker inside. */
  async function downloadPack(group: Group) {
    const map = tiers ?? (await fetchStoreTiers(kind).catch(() => ({}) as Record<string, StoreTier>))
    if (!tiers) setTiers(map)
    if (!(await gate(packTier(group.pack, group.items, map)))) return
    const pending = group.items.filter((a) => !isStoreAssetInstalled(kind, a.file))
    setError(null)
    setProgress({ pack: group.pack, done: 0, total: pending.length })
    let done = 0
    for (const asset of pending) {
      try {
        await installStoreAsset(asset)
      } catch {
        setError(`Couldn't download ${asset.name}.`)
      }
      done += 1
      setProgress({ pack: group.pack, done, total: pending.length })
    }
    setProgress(null)
  }

  async function removePack(group: Group) {
    for (const asset of group.items) await removeStoreAsset(kind, asset.file)
  }

  if (pay) return <PaymentPage open onClose={() => setPay(false)} />

  let budget = visible

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

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain perf-scroll no-scrollbar pb-6">
        {groups.map((group) => {
          if (budget <= 0) return null
          const items = group.items.slice(0, budget)
          budget -= items.length
          const tier = packTier(group.pack, group.items, tiers)
          const installed = group.items.every((a) => isStoreAssetInstalled(kind, a.file))
          const running = progress?.pack === group.pack

          return (
            <section key={group.pack || '_loose'}>
              <header className="flex items-center gap-2 pb-2">
                <h4 className="text-sm font-semibold text-foreground">
                  {group.pack || 'Singles'}
                </h4>
                <TierBadge tier={tier} />
                <span className="text-[10px] text-muted-foreground">{group.items.length}</span>
                {group.pack ? (
                  installed ? (
                    <button
                      type="button"
                      onClick={() => void removePack(group)}
                      className="ml-auto flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-muted-foreground active:scale-95"
                    >
                      <Trash2 className="size-3.5" />
                      Remove
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void downloadPack(group)}
                      disabled={running}
                      className="ml-auto flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground transition active:scale-95 disabled:opacity-60"
                    >
                      {running ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          {progress.done}/{progress.total}
                        </>
                      ) : (
                        <>
                          <Download className="size-3.5" />
                          Download
                        </>
                      )}
                    </button>
                  )
                ) : null}
              </header>

              <div className="grid auto-rows-min grid-cols-4 gap-2">
                {items.map((asset) => {
                  const has = isStoreAssetInstalled(kind, asset.file)
                  const src = getStoreAssetSrc(kind, asset.file)
                  return (
                    <div key={asset.file} className="relative aspect-square">
                      <button
                        type="button"
                        aria-label={asset.name}
                        disabled={!has || !src}
                        onClick={() => src && onUse?.(src, asset)}
                        className="block size-full p-1 transition active:scale-[0.96] disabled:opacity-90"
                      >
                        {src ? (
                          <img
                            src={src}
                            alt={asset.name}
                            loading="lazy"
                            className="size-full object-contain"
                          />
                        ) : (
                          <span className="grid size-full place-items-center text-[10px] text-muted-foreground">
                            …
                          </span>
                        )}
                      </button>
                      {!group.pack &&
                        (has ? (
                          <button
                            type="button"
                            aria-label={`Delete ${asset.name}`}
                            onClick={() => void removeStoreAsset(kind, asset.file)}
                            className="absolute bottom-0 right-0 flex size-7 items-center justify-center rounded-full text-muted-foreground active:scale-90"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            aria-label={`Download ${asset.name}`}
                            onClick={() => void download(asset)}
                            disabled={busy === asset.file}
                            className="absolute bottom-0 right-0 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
                          >
                            {busy === asset.file ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Download className="size-3" />
                            )}
                          </button>
                        ))}
                      {group.pack && has && (
                        <span className="pointer-events-none absolute right-0 top-0 text-emerald-500">
                          <Check className="size-3" />
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}

        {all.length > visible && (
          <button
            type="button"
            onClick={() => {
              const next = all.slice(visible, visible + 24)
              setVisible((v) => v + 24)
              for (const a of next) void previewStoreAsset(a).catch(() => {})
            }}
            className="w-full rounded-xl border border-border py-2 text-xs font-semibold text-primary transition active:scale-[0.98]"
          >
            See more ({all.length - visible})
          </button>
        )}
      </div>
    </div>
  )
}
