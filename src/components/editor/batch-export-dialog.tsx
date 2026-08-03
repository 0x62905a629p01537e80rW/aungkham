import { useState } from 'react'
import { Check, Loader2, Ratio } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SIZE_PRESETS } from '@/lib/smart-resize'
import { cn } from '@/lib/utils'

interface BatchExportDialogProps {
  open: boolean
  onClose: () => void
  onExport: (keys: string[]) => Promise<void>
}

/**
 * Smart resize + batch export: the design is re-flowed into every selected
 * canvas shape and each result is downloaded in one run.
 */
export function BatchExportDialog({ open, onClose, onExport }: BatchExportDialogProps) {
  const [picked, setPicked] = useState<string[]>(['square', 'story', 'landscape'])
  const [busy, setBusy] = useState(false)

  const toggle = (key: string) =>
    setPicked((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))

  async function run() {
    if (!picked.length || busy) return
    setBusy(true)
    try {
      await onExport(picked)
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !busy && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Ratio className="size-4" /> Smart resize &amp; batch export
          </DialogTitle>
          <DialogDescription className="text-xs">
            Your layout is re-flowed for each size, then all files download together.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2">
          {SIZE_PRESETS.map((p) => {
            const on = picked.includes(p.key)
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => toggle(p.key)}
                className={cn(
                  'relative rounded-xl border px-3 py-2 text-left transition active:scale-95',
                  on ? 'border-primary bg-primary/10' : 'border-border',
                )}
              >
                <span className="block text-xs font-semibold">{p.label}</span>
                <span className="block text-[10px] text-muted-foreground">
                  {p.hint} · {p.w}×{p.h}
                </span>
                {on && (
                  <Check className="absolute right-2 top-2 size-3.5 text-primary" />
                )}
              </button>
            )
          })}
        </div>

        <Button className="mt-1 h-11 w-full rounded-xl" onClick={run} disabled={!picked.length || busy}>
          {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
          {busy ? 'Rendering…' : `Export ${picked.length} size${picked.length === 1 ? '' : 's'}`}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
