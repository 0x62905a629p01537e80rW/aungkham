import { useEffect, useState } from 'react'
import { ImageDown } from 'lucide-react'
import {
  getStoreAssetSrc,
  listInstalledStoreAssets,
  subscribeStoreAssets,
} from '@/lib/store-assets'

/** Grid of backgrounds the user downloaded from the Store. */
export function DownloadedBackgrounds({
  onPick,
  className,
}: {
  onPick: (src: string) => void
  className?: string
}) {
  const [, force] = useState(0)
  useEffect(() => subscribeStoreAssets(() => force((n) => n + 1)), [])

  const items = listInstalledStoreAssets('Background')
    .map((a) => ({ file: a.file, name: a.name, src: getStoreAssetSrc('Background', a.file) }))
    .filter((a): a is { file: string; name: string; src: string } => Boolean(a.src))

  if (!items.length) return null

  return (
    <div className={className}>
      <span className="mb-2 flex items-center gap-1.5 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <ImageDown className="size-3.5 text-primary" />
        Downloaded backgrounds
      </span>
      <div className="grid grid-cols-4 gap-2">
        {items.map((a) => (
          <button
            key={a.file}
            type="button"
            aria-label={a.name}
            onClick={() => onPick(a.src)}
            className="aspect-square overflow-hidden rounded-xl border border-border/40 transition active:scale-95"
          >
            <img src={a.src} alt={a.name} className="size-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}
