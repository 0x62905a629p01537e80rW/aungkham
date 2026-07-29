import { useState } from 'react'
import { Pipette } from 'lucide-react'
import { GRADIENTS, MORE_GRADIENTS, SOLID_COLORS } from '@/lib/background'

function CustomTile({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="glass-tile grid aspect-square place-items-center rounded-xl text-primary transition active:scale-95"
    >
      <Pipette className="size-4" />
    </button>
  )
}

export function SolidGrid({
  onPick,
  onCustom,
}: {
  onPick: (color: string) => void
  onCustom: () => void
}) {
  return (
    <div className="grid grid-cols-6 gap-2">
      <CustomTile label="Custom solid color" onClick={onCustom} />
      <button
        type="button"
        aria-label="Transparent background"
        title="Transparent"
        onClick={() => onPick('transparent')}
        className="checker-grid checker-swatch aspect-square rounded-xl border border-border shadow-sm transition active:scale-95"
      />

      {SOLID_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          aria-label={`Use ${c}`}
          onClick={() => onPick(c)}
          className="aspect-square rounded-xl border border-border shadow-sm transition active:scale-95"
          style={{ background: c }}
        />
      ))}
    </div>
  )
}

export function GradientGrid({
  onPick,
  onCustom,
}: {
  onPick: (stops: [string, string, string?]) => void
  onCustom: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const list = expanded ? [...GRADIENTS, ...MORE_GRADIENTS] : GRADIENTS

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-2">
        <CustomTile label="Custom gradient" onClick={onCustom} />
        {list.map((g) => (
          <button
            key={g.name}
            type="button"
            aria-label={g.name}
            onClick={() => onPick(g.stops)}
            className="aspect-square rounded-xl border border-border shadow-sm transition active:scale-95"
            style={{ background: g.css }}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="glass-tile w-full rounded-xl py-2 text-xs font-semibold text-primary transition active:scale-[0.98]"
      >
        {expanded ? 'Show less' : `View more (${MORE_GRADIENTS.length})`}
      </button>
    </div>
  )
}
