import { useRef, useState, type ChangeEvent } from 'react'
import { ImageIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ColorPickerFullScreen } from './color-picker'
import { GradientGrid, SolidGrid } from './color-grids'
import { AspectPicker } from './aspect-picker'
import { DownloadedBackgrounds } from './downloaded-backgrounds'
import {
  makeBackgroundDataUrl,
  gradientCss,
} from '@/lib/background'

interface ReplaceBackgroundProps {
  open: boolean
  onClose: () => void
  onPick: (dataUrl: string) => void
}


export function ReplaceBackground({ open, onClose, onPick }: ReplaceBackgroundProps) {
  const galleryRef = useRef<HTMLInputElement>(null)
  const [picker, setPicker] = useState<'solid' | 'gradient' | null>(null)
  const [pendingCss, setPendingCss] = useState<string | null>(null)

  if (!open) return null

  function readFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => onPick(reader.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <header
        className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-2"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose} className="size-9 rounded-full">
          <X className="size-5" />
        </Button>
        <h2 className="flex-1 text-center text-base font-semibold">Replace background</h2>
        <div className="size-9" />
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto perf-scroll p-4">
        <div className="mx-auto w-full max-w-sm space-y-3">
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            className="glass-cta flex h-13 w-full items-center justify-center gap-2.5 rounded-2xl py-3.5 text-sm font-semibold active:scale-[0.98]"
          >
            <ImageIcon className="size-5" />
            Choose from Library
          </button>
        </div>

        <DownloadedBackgrounds className="mx-auto w-full max-w-sm" onPick={(src) => onPick(src)} />

        <div className="mx-auto w-full max-w-sm">
          <span className="mb-2 block px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Solid colors
          </span>
          <SolidGrid
            onPick={(c) => setPendingCss(c)}
            onCustom={() => setPicker('solid')}
          />
        </div>

        <div className="mx-auto w-full max-w-sm">
          <span className="mb-2 block px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Gradients
          </span>
          <GradientGrid
            onPick={(stops) => setPendingCss(gradientCss(stops))}
            onCustom={() => setPicker('gradient')}
          />

        </div>
      </div>

      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={readFile} />

      <ColorPickerFullScreen
        key={picker ?? 'closed'}
        open={picker !== null}
        allowGradient
        initialMode={picker ?? 'solid'}
        value={picker === 'gradient' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#8235DC'}
        onClose={() => setPicker(null)}
        onConfirm={(css) => {
          setPicker(null)
          setPendingCss(css)
        }}
      />

      <AspectPicker
        open={pendingCss !== null}
        preview={pendingCss ?? undefined}
        onClose={() => setPendingCss(null)}
        onPick={(ratio) => {
          const css = pendingCss!
          setPendingCss(null)
          onPick(makeBackgroundDataUrl(css, 1200, ratio))
        }}
      />
    </div>
  )
}
