import { ASPECT_RATIOS } from '@/lib/background'

export function AspectPicker({
  open,
  preview,
  onClose,
  onPick,
}: {
  open: boolean
  /** css background used for the tile previews */
  preview?: string
  onClose: () => void
  onPick: (ratio: number) => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-background/80 p-5 backdrop-blur-md">
      <button type="button" aria-label="Close" className="absolute inset-0" onClick={onClose} />
      <div className="glass-panel relative w-[min(22rem,100%)] rounded-3xl border border-border/60 p-5 shadow-2xl">
        <h3 className="text-center text-lg font-semibold tracking-tight text-foreground">
          Choose a size
        </h3>
        <p className="mb-4 mt-1 text-center text-xs text-muted-foreground">
          Pick the aspect ratio you want to edit in.
        </p>
        <div className="grid grid-cols-4 gap-2.5">
          {ASPECT_RATIOS.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={() => onPick(a.ratio)}
              className="group flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-secondary/40 p-2.5 transition hover:border-primary/50 hover:bg-primary/10 active:scale-95"
            >
              <span className="grid h-11 w-full place-items-center">
                <span
                  className="rounded-[5px] ring-1 ring-border/70 transition group-hover:ring-primary/60"
                  style={{
                    background: preview ?? 'var(--primary)',
                    height: a.ratio >= 1 ? `${Math.round(38 / a.ratio)}px` : '38px',
                    width: a.ratio >= 1 ? '38px' : `${Math.round(38 * a.ratio)}px`,
                  }}
                />
              </span>
              <span className="text-[10px] font-semibold tabular-nums text-foreground">
                {a.label}
              </span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-full border border-border/60 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-accent active:scale-[0.98]"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
