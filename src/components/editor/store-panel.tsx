import { useState } from 'react'

import { GlassTabs } from '@/components/ui/glass-tabs'
import type { TextLayer } from '@/lib/text-layer'
import { DownloadTemplatesPanel } from './download-templates-panel'
import { DownloadFontsSheet } from './download-fonts-sheet'
import { StoreAssetsGrid } from './store-assets-grid'

type StoreTab = 'templates' | 'background' | 'shapes' | 'stickers' | 'fonts'

const TABS: { key: StoreTab; label: string }[] = [
  { key: 'templates', label: 'Templates' },
  { key: 'background', label: 'Background' },
  { key: 'shapes', label: 'Shapes' },
  { key: 'stickers', label: 'Stickers' },
  { key: 'fonts', label: 'Fonts' },
]

export function StorePanel({
  onApplyTemplate,
  onUseBackground,
}: {
  onApplyTemplate?: (layers: TextLayer[], bg?: string) => void
  onUseBackground?: (src: string) => void
}) {
  const [tab, setTab] = useState<StoreTab>('templates')

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 pb-3">
        <GlassTabs
          variant="chips"
          size="sm"
          value={tab}
          onChange={(k) => setTab(k as StoreTab)}
          items={TABS}
        />
      </div>

      {tab === 'templates' && <DownloadTemplatesPanel onApply={onApplyTemplate} />}
      {tab === 'fonts' && <DownloadFontsSheet open inline />}
      {tab === 'background' && (
        <StoreAssetsGrid
          kind="Background"
          emptyHint="No backgrounds published yet."
          onUse={(src) => onUseBackground?.(src)}
        />
      )}
      {tab === 'shapes' && (
        <StoreAssetsGrid
          kind="Shapes"
          emptyHint="No shapes published yet. Downloaded shapes appear in Add element › Shapes."
        />
      )}
      {tab === 'stickers' && (
        <StoreAssetsGrid
          kind="Stickers"
          emptyHint="No stickers published yet. Downloaded stickers appear in Add element › Stickers."
        />
      )}
    </div>
  )
}
