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
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-background/70 backdrop-blur-sm">
      <button type="button" aria-label="Close" className="absolute inset-0" onClick={onClose} />
      <div
        className="glass-panel relative mb-4 w-[min(24rem,calc(100%-1.5rem))] rounded-[1.75rem] p-4"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      >
        <h3 className="mb-1 text-center text-base font-semibold text-foreground">Choose a size</h3>
        <p className="mb-3 text-center text-xs text-muted-foreground">
          Pick the aspect ratio you want to edit in.
        </p>
        <div className="grid grid-cols-4 gap-2">
          {ASPECT_RATIOS.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={() => onPick(a.ratio)}
              className="glass-tile flex flex-col items-center gap-1.5 rounded-2xl p-2 transition active:scale-95"
            >
              <span className="grid h-10 w-full place-items-center">
                <span
                  className="rounded-[4px] border border-border"
                  style={{
                    background: preview ?? 'var(--secondary)',
                    height: a.ratio >= 1 ? `${Math.round(36 / a.ratio)}px` : '36px',
                    width: a.ratio >= 1 ? '36px' : `${Math.round(36 * a.ratio)}px`,
                  }}
                />
              </span>
              <span className="text-[10px] font-semibold text-foreground">{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
