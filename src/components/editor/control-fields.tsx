import { useEffect, useRef, type ReactNode } from 'react'
import { beginInteraction, endInteraction, rafThrottle } from '@/lib/perf'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { ColorPickerPopover } from './color-picker'
import { cn } from '@/lib/utils'



export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-4 border-b border-border px-5 py-5 last:border-b-0">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  )
}

export function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = '',
  onChange,
  onDragStart,
  onDragEnd,
  hideLabel = false,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  suffix?: string
  onChange: (v: number) => void
  onDragStart?: () => void
  onDragEnd?: () => void
  hideLabel?: boolean
}) {
  // Slider scrubbing fires far faster than the display refresh; coalescing to
  // one update per frame keeps heavy re-renders (canvas filters, text layout)
  // inside the 8.3ms budget of a 120Hz screen.
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const emit = useRef(rafThrottle((v: number) => onChangeRef.current(v))).current
  const activeRef = useRef(false)

  useEffect(() => () => {
    emit.cancel()
    if (activeRef.current) endInteraction()
  }, [emit])

  const start = () => {
    if (!activeRef.current) {
      activeRef.current = true
      beginInteraction()
    }
    onDragStart?.()
  }

  const end = () => {
    emit.flush()
    if (activeRef.current) {
      activeRef.current = false
      endInteraction()
    }
    onDragEnd?.()
  }

  return (
    <div className="space-y-2">
      <div
        className={cn(
          'flex items-center justify-between transition-opacity duration-200',
          hideLabel && 'pointer-events-none opacity-0',
        )}
      >
        <Label className="text-sm font-medium text-foreground">{label}</Label>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {value}
          {suffix}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onPointerDown={start}
        onPointerUp={end}
        onValueCommit={end}
        onValueChange={(v) => emit(v[0])}
      />
    </div>
  )
}


export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs uppercase text-muted-foreground">{value}</span>
        <ColorPickerPopover value={value} onChange={onChange}>
          <button
            type="button"
            aria-label={label}
            className="relative h-9 w-9 overflow-hidden rounded-xl border border-border shadow-sm"
          >
            <span className="absolute inset-0" style={{ backgroundColor: value }} />
          </button>
        </ColorPickerPopover>
      </div>
    </div>
  )
}

