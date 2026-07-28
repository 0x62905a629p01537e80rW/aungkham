export const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.nextlevelcreator.burmesetalk'

const KEY = 'rate-us-state'

type RateState = {
  rated?: boolean
  neverAsk?: boolean
  dismissals?: number
  nextAskAt?: number
}

function read(): RateState {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') as RateState
  } catch {
    return {}
  }
}

function write(state: RateState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
}

/** Decide whether to show the rate prompt — randomly, never every time. */
export function shouldAskForRating(): boolean {
  const s = read()
  if (s.rated || s.neverAsk) return false
  if (s.nextAskAt && Date.now() < s.nextAskAt) return false
  // Random chance so it never appears on every save.
  const chance = s.dismissals ? 0.25 : 0.4
  return Math.random() < chance
}

/** User tapped "Not now" — back off for a while, longer each time. */
export function snoozeRating() {
  const s = read()
  const dismissals = (s.dismissals ?? 0) + 1
  const days = Math.min(14, dismissals * 3)
  write({
    ...s,
    dismissals,
    nextAskAt: Date.now() + days * 24 * 60 * 60 * 1000,
    neverAsk: dismissals >= 5,
  })
}

/** User went to the store — stop asking. */
export function markRated() {
  write({ ...read(), rated: true })
}
