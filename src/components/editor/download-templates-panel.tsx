import { useEffect, useMemo, useState } from 'react'
import { Check, Crown, Download, Loader2, RefreshCw, Trash2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useAuth } from '@/components/auth-provider'
import { PaymentPage } from './payment-page'
import { TemplateThumb } from './template-picker'
import type { TextLayer } from '@/lib/text-layer'
import {
  ensureTemplatePacksLoaded,
  fetchRemoteTemplates,
  fetchTemplateTiers,
  getTemplatePackDefs,
  installTemplatePack,
  isTemplatePackInstalled,
  listInstalledTemplatePacks,
  previewTemplatePack,
  removeTemplatePack,
  subscribeRemoteTemplates,
  templateTier,
  type RemoteTemplatePack,
  type TemplateTier,
} from '@/lib/remote-templates'

export function DownloadTemplatesPanel({
  onApply,
}: {
  onApply?: (layers: TextLayer[], bg?: string) => void
}) {
  const [packs, setPacks] = useState<RemoteTemplatePack[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [tick, force] = useState(0)
  const [tiers, setTiers] = useState<Record<string, TemplateTier> | null>(null)
  const [pay, setPay] = useState(false)
  const { isPro } = useAuth()

  useEffect(() => subscribeRemoteTemplates(() => force((n) => n + 1)), [])

  async function load(refresh = false) {
    setLoading(true)
    setError(null)
    try {
      const list = await fetchRemoteTemplates(refresh)
      setPacks(list)
      void fetchTemplateTiers(refresh).then(setTiers).catch(() => {})
      void ensureTemplatePacksLoaded()
      // preview the first screenful so thumbnails render
      list.slice(0, 8).forEach((p) => void previewTemplatePack(p).catch(() => {}))
    } catch {
      setError("Couldn't load the template list. Check your connection and try again.")
    }
    setLoading(false)
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const installed = useMemo(
    // eslint-disable-next-line react-hooks/exhaustive-deps
    () => new Set(listInstalledTemplatePacks().map((p) => p.file)),
    [tick],
  )

  async function download(pack: RemoteTemplatePack) {
    if (templateTier(pack, tiers) === 'premium' && !isPro) {
      setPay(true)
      return
    }
    setBusy(pack.file)
    setError(null)
    try {
      await installTemplatePack(pack)
    } catch {
      setError(`Couldn't download ${pack.name}.`)
    }
    setBusy(null)
  }

  if (pay) return <PaymentPage open onClose={() => setPay(false)} />

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 pb-2">
        <h2 className="text-sm font-semibold text-foreground">Download Templates</h2>
        <button
          type="button"
          aria-label="Refresh list"
          onClick={() => void load(true)}
          className="ml-auto flex size-8 items-center justify-center rounded-full text-muted-foreground active:scale-90"
        >
          <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
        </button>
      </div>

      {error && <p className="pb-2 text-xs text-destructive">{error}</p>}
      {!packs.length && !loading && !error && (
        <p className="py-6 text-center text-xs text-muted-foreground">
          No templates published yet.
        </p>
      )}

      <div className="flex flex-col gap-3 pb-6">
        {packs.map((pack) => {
          const tier = templateTier(pack, tiers)
          const has = installed.has(pack.file) || isTemplatePackInstalled(pack.file)
          const defs = getTemplatePackDefs(pack.file)
          return (
            <div key={pack.file} className="glass-tile rounded-2xl p-2.5">
              <div className="flex items-center gap-2">
                <span className="truncate text-xs font-semibold text-foreground">{pack.name}</span>
                <span
                  className={cn(
                    'flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold',
                    tier === 'premium'
                      ? 'bg-amber-500/15 text-amber-500'
                      : 'bg-emerald-500/15 text-emerald-500',
                  )}
                >
                  {tier === 'premium' ? (
                    <>
                      <Crown className="size-3" /> Pro
                    </>
                  ) : (
                    'Free'
                  )}
                </span>
                <div className="ml-auto flex items-center gap-1">
                  {has ? (
                    <>
                      <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-bold text-emerald-500">
                        <Check className="size-3" /> Added
                      </span>
                      <button
                        type="button"
                        aria-label={`Delete ${pack.name}`}
                        onClick={() => void removeTemplatePack(pack.file)}
                        className="flex size-8 items-center justify-center rounded-full text-muted-foreground active:scale-90"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void download(pack)}
                      disabled={busy === pack.file}
                      className="glass-cta flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold disabled:opacity-50"
                    >
                      {busy === pack.file ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Download className="size-3.5" />
                      )}
                      Download
                    </button>
                  )}
                </div>
              </div>

              {defs.length > 0 && (
                <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar">
                  {defs.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      aria-label={t.name}
                      disabled={!has}
                      onClick={() => onApply?.(t.build(), t.bg)}
                      className="relative aspect-[16/9] w-32 shrink-0 overflow-hidden rounded-xl active:scale-[0.98] disabled:opacity-70"
                    >
                      <TemplateThumb template={t} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}