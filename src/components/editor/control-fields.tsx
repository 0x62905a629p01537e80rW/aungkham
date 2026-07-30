import { memo, useCallback, useRef, useState, type ReactNode } from 'react'
import { LiveSlider } from './live-slider'
import { Label } from '@/components/ui/label'
import { ColorPickerPopover } from './color-picker'
import { cn } from '@/lib/utils'



export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3 border-b border-border px-4 py-3.5 last:border-b-0">
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  )
}

export const SliderField = memo(function SliderField({
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
  // The read-out is local state so the number can update every frame without
  // re-rendering the surrounding tool panel.
  const [live, setLive] = useState<number | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const handleLive = useCallback((v: number) => {
    setLive(v)
    onChangeRef.current(v)
  }, [])

  const handleCommit = useCallback((v: number) => {
    setLive(null)
    onChangeRef.current(v)
  }, [])

  const shown = live ?? value

  return (
    <div className="space-y-1">
      <div
        className={cn(
          'flex items-center justify-between transition-opacity duration-200',
          hideLabel && 'pointer-events-none opacity-0',
        )}
      >
        <Label className="text-[11px] font-medium text-foreground">{label}</Label>
        <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
          {shown}
          {suffix}
        </span>
      </div>

      <LiveSlider
        value={value}
        min={min}
        max={max}
        step={step}
        onLive={handleLive}
        onCommit={handleCommit}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      />
    </div>
  )
})



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

