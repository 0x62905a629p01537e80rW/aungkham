import { useEffect, useState } from 'react'
import { FileJson } from 'lucide-react'

import { cn } from '@/lib/utils'
import { exportDesignJson } from '@/lib/export-templates'
import type { TextLayer } from '@/lib/text-layer'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const GROUPS = ['New', 'Premium', 'Quote', 'Sale', 'Event', 'Social']
const LANGS = ['MM', 'EN']

export function ExportTemplateDialog({
  open,
  onClose,
  layers,
  bg,
  defaultName = '',
}: {
  open: boolean
  onClose: () => void
  layers: TextLayer[]
  bg?: string | null
  defaultName?: string
}) {
  const [name, setName] = useState(defaultName)
  const [lang, setLang] = useState('MM')
  const [group, setGroup] = useState('New')
  const [busy, setBusy] = useState(false)
  const [withBg, setWithBg] = useState(true)

  useEffect(() => {
    if (open) setName(defaultName)
  }, [open, defaultName])

  const handleExport = async () => {
    if (busy) return
    setBusy(true)
    try {
      await exportDesignJson({
        name: name || 'Untitled',
        lang,
        group,
        bg: withBg ? bg ?? undefined : undefined,
        layers,
      })
      onClose()
    } finally {
      setBusy(false)
    }
  }

  const chip = (active: boolean) =>
    cn(
      'rounded-full px-2.5 py-1 text-[11px] font-semibold transition',
      active ? 'glass-cta' : 'glass-tile text-foreground/70',
    )

  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent className="glass-panel max-w-[min(92vw,340px)] rounded-3xl border-0">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-base">
            <FileJson className="size-4" /> Export as template
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs">
            Save this design ({layers.length} layers) as a template JSON you can send back to be
            added to the app.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Template name"
            className="glass-tile h-10 w-full rounded-2xl px-3 text-sm outline-none"
          />

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[11px] text-muted-foreground">Language</span>
            {LANGS.map((l) => (
              <button key={l} type="button" onClick={() => setLang(l)} className={chip(lang === l)}>
                {l}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[11px] text-muted-foreground">Group</span>
            {GROUPS.map((g) => (
              <button key={g} type="button" onClick={() => setGroup(g)} className={chip(group === g)}>
                {g}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setWithBg((v) => !v)}
            className={cn('w-full rounded-2xl px-3 py-2 text-left text-xs font-semibold', chip(withBg))}
          >
            {withBg ? '✓ Include background image' : 'Styles only (no background)'}
          </button>
        </div>

        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <button
            type="button"
            onClick={handleExport}
            disabled={busy}
            className="glass-cta w-full rounded-full py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {busy ? 'Exporting…' : 'Export JSON'}
          </button>
          <AlertDialogCancel className="mt-0 w-full rounded-full border border-border/50 bg-transparent hover:bg-accent">
            Cancel
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
