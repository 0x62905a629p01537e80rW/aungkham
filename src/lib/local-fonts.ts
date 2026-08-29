import type { RemoteFont } from './remote-fonts'

/**
 * Myanmar fonts shipped with the app under /public/fonts/mm.
 *
 * They mirror files that also live on the CDN, so the store always has content
 * instantly — even on a slow connection where the remote listing would show an
 * empty "loading" state. Names match the CDN's derived names, so `withBundled`
 * de-duplicates them against the cloud catalog.
 */

const premium: Omit<RemoteFont, 'url'>[] = [
  { name: 'Aka03 Regular', file: 'Aka03-Regular.ttf', size: 146544, tier: 'free', script: 'mm' },
  { name: 'Aka05 Regular', file: 'Aka05-Regular.ttf', size: 76780, tier: 'free', script: 'mm' },
  { name: 'MasterpieceCTL', file: 'MasterpieceCTL.ttf', size: 45216, tier: 'free', script: 'mm' },
  { name: 'MasterpieceDaung', file: 'MasterpieceDaung.ttf', size: 38184, tier: 'free', script: 'mm' },
  { name: 'MasterpieceDaungRound', file: 'MasterpieceDaungRound.ttf', size: 44416, tier: 'free', script: 'mm' },
  { name: 'MasterpieceLakwel', file: 'MasterpieceLakwel.ttf', size: 77636, tier: 'free', script: 'mm' },
  { name: 'MasterpieceStadium', file: 'MasterpieceStadium.ttf', size: 45776, tier: 'free', script: 'mm' },
  { name: 'MasterpieceUniHand', file: 'MasterpieceUniHand.ttf', size: 51736, tier: 'free', script: 'mm' },
  { name: 'OneTypeChiangMai', file: 'OneTypeChiangMai.ttf', size: 103980, tier: 'free', script: 'mm' },
  { name: 'SM02 KanBaung Regular', file: 'SM02_KanBaung-Regular.ttf', size: 49016, tier: 'free', script: 'mm' },
]

const free: Omit<RemoteFont, 'url'>[] = [
  { name: 'Padauk', file: 'Padauk.ttf', size: 472488, tier: 'free', script: 'mm' },
  { name: 'pyidaungsu', file: 'pyidaungsu.ttf', size: 295092, tier: 'free', script: 'mm' },
  { name: 'NotoSansMyanmar Regular', file: 'NotoSansMyanmar-Regular.ttf', size: 107640, tier: 'free', script: 'mm' },
  { name: 'MyanmarSagar', file: 'MyanmarSagar.ttf', size: 40960, tier: 'free', script: 'mm' },
  { name: 'MyanmarSabae', file: 'MyanmarSabae.ttf', size: 42148, tier: 'free', script: 'mm' },
  { name: 'MyanmarSquare', file: 'MyanmarSquare.ttf', size: 41476, tier: 'free', script: 'mm' },
  { name: 'TharLon', file: 'TharLon.ttf', size: 353228, tier: 'free', script: 'mm' },
  { name: 'Yunghkio', file: 'Yunghkio.ttf', size: 429740, tier: 'free', script: 'mm' },
  { name: 'MyanmarAngoun', file: 'MyanmarAngoun.ttf', size: 69344, tier: 'free', script: 'mm' },
  { name: 'MasterpieceUniRound', file: 'MasterpieceUniRound.ttf', size: 59604, tier: 'free', script: 'mm' },
]

const withUrl = (list: Omit<RemoteFont, 'url'>[]): RemoteFont[] =>
  list.map((f) => ({ ...f, url: `/fonts/mm/${encodeURIComponent(f.file)}` }))

/** Premium Myanmar fonts — merged into the main (Myanmar) catalog. */
export const BUNDLED_FONTS: RemoteFont[] = withUrl(premium)

/** Free Myanmar fonts — only listed under the "Free" tab. */
export const BUNDLED_FREE_FONTS: RemoteFont[] = withUrl(free)

/** Merge bundled fonts in front of a remote list, without duplicating names. */
export function withBundled(list: RemoteFont[], bundled: RemoteFont[] = BUNDLED_FONTS) {
  const names = new Set(bundled.map((f) => f.name.toLowerCase()))
  const files = new Set(bundled.map((f) => f.file.toLowerCase()))
  return [
    ...bundled,
    ...list.filter((f) => !names.has(f.name.toLowerCase()) && !files.has(f.file.toLowerCase())),
  ]
}
