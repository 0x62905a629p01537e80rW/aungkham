import type { ReactNode } from 'react'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'

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
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  suffix?: string
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
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
        onValueChange={(v) => onChange(v[0])}
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
        <label className="relative h-9 w-9 cursor-pointer overflow-hidden rounded-xl border border-border shadow-sm">
          <span className="absolute inset-0" style={{ backgroundColor: value }} />
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label={label}
          />
        </label>
      </div>
    </div>
  )
}
