import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface GlassTabItem {
  key: string
  label: ReactNode
}

interface GlassTabsProps {
  items: GlassTabItem[]
  value: string
  onChange: (key: string) => void
  /** Equal-width segments (default) vs. content-sized scrollable chips */
  variant?: 'segmented' | 'chips'
  className?: string
  itemClassName?: string
  size?: 'sm' | 'md'
}

/**
 * Liquid-glass tab strip with a sliding indicator that animates from the
 * previously active button to the newly selected one.
 */
export function GlassTabs({
  items,
  value,
  onChange,
  variant = 'segmented',
  className,
  itemClassName,
  size = 'md',
}: GlassTabsProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [rect, setRect] = useState<{ left: number; width: number } | null>(null)

  const measure = useCallback(() => {
    const el = btnRefs.current[value]
    const list = listRef.current
    if (!el || !list) return
    setRect({ left: el.offsetLeft, width: el.offsetWidth })
  }, [value])

  useLayoutEffect(measure, [measure, items.length])

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return
    const list = listRef.current
    if (!list) return
    const ro = new ResizeObserver(measure)
    ro.observe(list)
    return () => ro.disconnect()
  }, [measure])

  // keep the active chip in view when scrollable
  useEffect(() => {
    if (variant !== 'chips') return
    btnRefs.current[value]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
  }, [value, variant])

  const pad = size === 'sm' ? 'p-0.5' : 'p-1'

  return (
    <div
      className={cn(
        'glass-panel relative rounded-full',
        pad,
        variant === 'chips' && 'overflow-x-auto perf-scroll [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
    >
      <div
        ref={listRef}
        className={cn('relative flex items-center', variant === 'chips' ? 'w-max gap-1' : 'gap-1')}
      >
        {rect && (
          <span
            aria-hidden
            className="glass-indicator pointer-events-none absolute inset-y-0 rounded-full"
            style={{
              transform: `translateX(${rect.left}px)`,
              width: rect.width,
            }}
          />
        )}
        {items.map((it) => {
          const active = it.key === value
          return (
            <button
              key={it.key}
              ref={(n) => {
                btnRefs.current[it.key] = n
              }}
              type="button"
              onClick={() => onChange(it.key)}
              className={cn(
                'relative z-10 flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-semibold transition-colors duration-300',
                variant === 'segmented' && 'flex-1',
                size === 'sm' ? 'px-3 py-1.5 text-[11px] leading-5' : 'px-3 py-2 text-xs leading-5',
                active ? 'text-primary-foreground' : 'text-muted-foreground',
                itemClassName,
              )}
            >
              {it.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
