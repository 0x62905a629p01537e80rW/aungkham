import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, Download, Gem, RefreshCw, WifiOff } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { defaultFilename, downloadDataUrl } from '@/lib/export-image'

type Phase = 'working' | 'done' | 'error'

interface Props {
  /** Source photo (data URL) the user picked from the home screen. */
  src: string
  onClose: () => void
  /** Optional: continue editing the enhanced result in the main editor. */
  onUseInEditor?: (dataUrl: string) => void
}

const STEPS = ['Analysing detail', 'Reconstructing pixels', 'Sharpening edges', 'Finishing Ultra HD']

/**
 * Full-screen Ultra HD page: enhances the picked photo with UpscalerJS while
 * showing an Apple-style colorful processing glow, then lets the user compare
 * before/after with a draggable separator and save the result.
 */
export function UltraHdPage({ src, onClose, onUseInEditor }: Props) {
  const [phase, setPhase] = useState<Phase>('working')
  const [pct, setPct] = useState(0)
  const [result, setResult] = useState<string | null>(null)
  const [offline, setOffline] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [split, setSplit] = useState(50)
  const [size, setSize] = useState<{ from: string; to: string } | null>(null)
  const frameRef = useRef<HTMLDivElement | null>(null)
  const runId = useRef(0)

  const run = useCallback(async () => {
    const id = ++runId.current
    setPhase('working')
    setPct(0)
    setOffline(false)
    setErrorMsg('')
    const { enhanceUltraHd, isOnline, NoConnectionError } = await import('@/lib/upscale')
    if (!isOnline()) {
      if (id === runId.current) {
        setOffline(true)
        setPhase('error')
        setErrorMsg('No connection')
      }
      return
    }
    try {
      const out = await enhanceUltraHd(src, (p) => {
        if (id === runId.current) setPct(p)
      })
      if (id !== runId.current) return
      const [a, b] = await Promise.all([measure(src), measure(out)])
      setSize({ from: a, to: b })
      setResult(out)
      setPct(100)
      setPhase('done')
    } catch (err) {
      if (id !== runId.current) return
      const noNet = err instanceof NoConnectionError
      setOffline(noNet)
      setErrorMsg(noNet ? 'No connection' : err instanceof Error ? err.message : 'Enhancement failed')
      setPhase('error')
    }
  }, [src])

  useEffect(() => {
    void run()
    return () => {
      runId.current++
    }
  }, [run])

  function onDrag(clientX: number) {
    const box = frameRef.current?.getBoundingClientRect()
    if (!box || !box.width) return
    setSplit(Math.max(0, Math.min(100, ((clientX - box.left) / box.width) * 100)))
  }

  function save() {
    if (!result) return
    downloadDataUrl(result, defaultFilename().replace(/(\.\w+)?$/, '-ultrahd.png'))
    toast.success('Saved Ultra HD photo')
  }

  const stepLabel = STEPS[Math.min(STEPS.length - 1, Math.floor((pct / 100) * STEPS.length))]

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-background">
      <header
        className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-3 py-3"
        style={{ paddingTop: 'calc(0.75rem + var(--safe-top))' }}
      >
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Back">
          <ArrowLeft className="size-5" />
        </Button>
        <div className="min-w-0 text-center">
          <p className="truncate text-sm font-semibold">Ultra HD</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {phase === 'working'
              ? `${stepLabel}…`
              : phase === 'done'
                ? size
                  ? `${size.from} → ${size.to}`
                  : 'Enhanced'
                : errorMsg}
          </p>
        </div>
        <Gem className="mx-2 size-5 text-primary" />
      </header>

      <main className="flex min-h-0 flex-1 items-center justify-center p-4">
        <div
          ref={frameRef}
          className="relative max-h-full w-full max-w-3xl overflow-hidden rounded-3xl bg-muted"
          onPointerDown={(e) => {
            if (phase !== 'done') return
            e.currentTarget.setPointerCapture(e.pointerId)
            onDrag(e.clientX)
          }}
          onPointerMove={(e) => {
            if (phase !== 'done' || e.buttons === 0) return
            onDrag(e.clientX)
          }}
        >
          <img
            src={phase === 'done' && result ? result : src}
            alt="Ultra HD preview"
            className="block max-h-[62dvh] w-full object-contain"
            draggable={false}
          />

          {phase === 'done' && result && (
            <>
              <div
                className="pointer-events-none absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
              >
                <img
                  src={src}
                  alt="Original"
                  className="block max-h-[62dvh] w-full object-contain"
                  draggable={false}
                />
              </div>
              <div
                className="pointer-events-none absolute inset-y-0 w-0.5 bg-background/90 shadow-[0_0_0_1px_rgba(0,0,0,0.25)]"
                style={{ left: `${split}%` }}
              >
                <div className="absolute top-1/2 left-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-border bg-background/95 text-[10px] font-semibold shadow-lg">
                  ↔
                </div>
              </div>
              <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-background/80 px-2 py-1 text-[10px] font-semibold tracking-wide uppercase">
                Before
              </span>
              <span className="pointer-events-none absolute top-3 right-3 rounded-full bg-primary/90 px-2 py-1 text-[10px] font-semibold tracking-wide text-primary-foreground uppercase">
                After
              </span>
            </>
          )}

          {phase === 'working' && (
            <>
              <div className="ultra-glow">
                <span className="ultra-blob ultra-blob-a" />
                <span className="ultra-blob ultra-blob-b" />
                <span className="ultra-blob ultra-blob-c" />
                <span className="ultra-blob ultra-blob-d" />
              </div>
              <span className="ultra-scan" />
              <span className="ultra-rim rounded-3xl" />
              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-background/85 to-transparent p-4">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/15">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-[width] duration-300"
                    style={{ width: `${Math.max(4, pct)}%` }}
                  />
                </div>
                <p className="text-center text-xs font-medium text-foreground/80">
                  {stepLabel} · {pct}%
                </p>
              </div>
            </>
          )}

          {phase === 'error' && (
            <div className="absolute inset-0 grid place-items-center bg-background/85 p-6 text-center">
              <div className="flex flex-col items-center gap-3">
                <WifiOff className="size-8 text-muted-foreground" />
                <p className="text-sm font-semibold">{errorMsg}</p>
                <p className="max-w-xs text-xs text-muted-foreground">
                  {offline
                    ? 'Ultra HD needs an internet connection the first time it loads its model.'
                    : 'Something went wrong while enhancing this photo.'}
                </p>
                <Button size="sm" onClick={() => void run()}>
                  <RefreshCw className="mr-2 size-4" /> Try again
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer
        className="flex flex-col gap-2 px-4 pt-2"
        style={{ paddingBottom: 'calc(1rem + var(--safe-bottom))' }}
      >
        {phase === 'done' && (
          <p className="text-center text-[11px] text-muted-foreground">
            Drag the line to compare before and after
          </p>
        )}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          {onUseInEditor && (
            <Button
              variant="secondary"
              className="flex-1"
              disabled={phase !== 'done' || !result}
              onClick={() => result && onUseInEditor(result)}
            >
              Edit
            </Button>
          )}
          <Button className="flex-1" disabled={phase !== 'done' || !result} onClick={save}>
            <Download className="mr-2 size-4" /> Save
          </Button>
        </div>
      </footer>
    </div>
  )
}

function measure(src: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(`${img.naturalWidth}×${img.naturalHeight}`)
    img.onerror = () => resolve('')
    img.src = src
  })
}
