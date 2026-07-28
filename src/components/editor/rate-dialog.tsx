import { Star } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PLAY_STORE_URL, markRated, snoozeRating } from '@/lib/rate-us'

interface RateDialogProps {
  open: boolean
  onClose: () => void
}

export function RateDialog({ open, onClose }: RateDialogProps) {
  const [hovered, setHovered] = useState(0)
  if (!open) return null

  function rate() {
    markRated()
    window.open(PLAY_STORE_URL, '_blank', 'noopener,noreferrer')
    onClose()
  }

  function later() {
    snoozeRating()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/40 p-6 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-xs overflow-hidden rounded-3xl">
        <div className="h-20 bg-gradient-to-b from-amber-300 to-amber-200" />
        <div className="-mt-10 flex flex-col items-center px-5 pb-5 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-background text-3xl ring-4 ring-background">
            🤩
          </div>
          <h2 className="mt-3 text-lg font-semibold">Thanks!</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            We will work harder to make you more satisfied.
          </p>

          <div className="mt-3 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
                onClick={rate}
                onMouseEnter={() => setHovered(n)}
                onMouseLeave={() => setHovered(0)}
                className="p-0.5"
              >
                <Star
                  className={
                    n <= (hovered || 4)
                      ? 'size-7 fill-amber-400 text-amber-400'
                      : 'size-7 text-amber-400'
                  }
                />
              </button>
            ))}
          </div>

          <Button className="mt-4 w-full rounded-full" onClick={rate}>
            Rate on Google Play
          </Button>
          <button
            type="button"
            onClick={later}
            className="mt-3 text-sm font-semibold text-muted-foreground"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  )
}
