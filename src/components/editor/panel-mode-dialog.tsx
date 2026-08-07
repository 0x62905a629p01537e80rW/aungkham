import { Check, LayoutPanelTop, PanelBottom } from 'lucide-react'

import { cn } from '@/lib/utils'
import { usePanelMode, type PanelMode } from '@/lib/panel-mode'

const OPTIONS: {
  mode: PanelMode
  title: string
  subtitle: string
  Icon: typeof PanelBottom
}[] = [
  {
    mode: 'docked',
    title: 'Fixed bottom toolbar',
    subtitle: 'Contextual action bar — every menu opens docked to the bottom edge.',
    Icon: PanelBottom,
  },
  {
    mode: 'floating',
    title: 'Floating panel',
    subtitle: 'Pop-over menus you can drag anywhere over the canvas.',
    Icon: LayoutPanelTop,
  },
]

/** Sketch of each layout so the choice is obvious at a glance. */
function Preview({ mode }: { mode: PanelMode }) {
  return (
    <div className="relative h-24 w-full overflow-hidden rounded-xl border border-border bg-muted/60">
      <div className="absolute inset-x-3 top-2 h-3 rounded bg-foreground/10" />
      {mode === 'docked' ? (
        <div className="absolute inset-x-0 bottom-0 h-9 rounded-t-lg border-t border-primary/40 bg-primary/25" />
      ) : (
        <div className="absolute bottom-4 left-5 h-11 w-28 rotate-[-4deg] rounded-lg border border-primary/40 bg-primary/25 shadow-lg" />
      )}
    </div>
  )
}

/** First-run chooser: fixed bottom toolbar vs floating pop-over panels. */
export function PanelModeDialog() {
  const { mode, chosen, setMode } = usePanelMode()

  if (chosen) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-background/80 backdrop-blur-md">
      <div className="w-full max-w-md space-y-4 rounded-t-3xl border border-border/70 bg-card p-5 shadow-2xl [animation:mac-panel-in_0.28s_cubic-bezier(0.32,0.72,0,1)_both]">
        <div className="space-y-1">
          <h2 className="font-display text-lg font-bold tracking-tight">Choose your menu style</h2>
          <p className="text-sm text-muted-foreground">
            How should tool menus appear while you edit? You can change this any time from the
            canvas settings next to the grid button.
          </p>
        </div>

        <div className="grid gap-3">
          {OPTIONS.map(({ mode: m, title, subtitle, Icon }) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                'space-y-2 rounded-2xl border p-3 text-left transition active:scale-[0.99]',
                mode === m ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent',
              )}
            >
              <Preview mode={m} />
              <div className="flex items-start gap-2">
                <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-xs text-muted-foreground">{subtitle}</p>
                </div>
                {mode === m && <Check className="ml-auto mt-0.5 size-4 text-primary" />}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
