import { useRef, useState, type ChangeEvent } from 'react'
import { Camera, ImageIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ColorPickerFullScreen } from './color-picker'
import { GradientGrid, SolidGrid } from './color-grids'
import {
  makeBackgroundDataUrl,
  makeGradientDataUrl,
  makeSolidDataUrl,
} from '@/lib/background'

interface ReplaceBackgroundProps {
  open: boolean
  onClose: () => void
  onPick: (dataUrl: string) => void
}


export function ReplaceBackground({ open, onClose, onPick }: ReplaceBackgroundProps) {
  const galleryRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [picker, setPicker] = useState<'solid' | 'gradient' | null>(null)

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

      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        <div className="mx-auto w-full max-w-sm space-y-3">
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            className="flex h-13 w-full items-center justify-center gap-2.5 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-lg transition active:scale-[0.98]"
          >
            <ImageIcon className="size-5" />
            Choose from Library
          </button>
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-border bg-card py-3.5 text-sm font-semibold transition active:scale-[0.98]"
          >
            <Camera className="size-5 text-primary" />
            Take a Photo
          </button>
        </div>

        <div className="mx-auto w-full max-w-sm">
          <span className="mb-2 block px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Solid colors
          </span>
          <div className="grid grid-cols-6 gap-2">
            {SOLID_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Use ${c}`}
                onClick={() => onPick(makeSolidDataUrl(c))}
                className="aspect-square rounded-xl border border-border shadow-sm transition active:scale-95"
                style={{ background: c }}
              />
            ))}
            <CustomTile label="Custom solid color" onClick={() => setPicker('solid')} />
          </div>
        </div>

        <div className="mx-auto w-full max-w-sm">
          <span className="mb-2 block px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Gradients
          </span>
          <div className="grid grid-cols-4 gap-2">
            {GRADIENTS.map((g) => (
              <button
                key={g.name}
                type="button"
                aria-label={g.name}
                onClick={() => onPick(makeGradientDataUrl(g.stops))}
                className="aspect-square rounded-xl border border-border shadow-sm transition active:scale-95"
                style={{ background: g.css }}
              />
            ))}
            <CustomTile label="Custom gradient" onClick={() => setPicker('gradient')} />
          </div>
        </div>
      </div>

      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={readFile} />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={readFile}
      />

      <ColorPickerFullScreen
        key={picker ?? 'closed'}
        open={picker !== null}
        allowGradient
        initialMode={picker ?? 'solid'}
        value={picker === 'gradient' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#8235DC'}
        onClose={() => setPicker(null)}
        onConfirm={(css) => {
          setPicker(null)
          onPick(makeBackgroundDataUrl(css))
        }}
      />
    </div>
  )
}
