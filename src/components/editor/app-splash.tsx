import { useEffect, useState } from 'react'

/**
 * Branded launch splash. Shows once per page load, animates in, then fades out.
 */
export function AppSplash({ duration = 1700 }: { duration?: number }) {
  const [phase, setPhase] = useState<'in' | 'out' | 'done'>('in')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('out'), duration)
    const t2 = setTimeout(() => setPhase('done'), duration + 520)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [duration])

  if (phase === 'done') return null

  return (
    <div
      className={`fixed inset-0 z-[100] grid place-items-center bg-background transition-opacity duration-500 ${
        phase === 'out' ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      {/* soft aura */}
      <div className="pointer-events-none absolute inset-0 splash-aura" />

      <div className="relative flex flex-col items-center gap-5">
        <div className="relative">
          <span className="absolute inset-0 -z-10 rounded-[28px] splash-ring" />
          <div className="glass-tile grid size-24 place-items-center rounded-[28px] splash-pop">
            <span className="font-brand-mm text-4xl leading-none text-foreground">မြန်</span>
          </div>
        </div>

        <div className="splash-rise text-center">
          <h1 className="text-lg font-bold tracking-tight text-foreground">Myan</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">Add Text On Photo</p>
        </div>

        <div className="splash-rise mt-1 h-1 w-28 overflow-hidden rounded-full bg-muted">
          <span className="block h-full w-1/3 rounded-full bg-primary splash-bar" />
        </div>
      </div>
    </div>
  )
}
