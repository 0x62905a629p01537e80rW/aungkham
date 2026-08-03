import type { RemoteFont } from './remote-fonts'

/**
 * Fonts shipped with the app under /public/fonts.
 *
 * They are listed in the Store next to the cloud catalog so the page always
 * has content instantly — even on a slow connection where the remote listing
 * would otherwise show an empty "loading" state.
 */
export const BUNDLED_FONTS: RemoteFont[] = [
  // free
  { name: 'Padauk', file: 'padauk.woff2', size: 38080, tier: 'free', script: 'mm' },
  { name: 'Noto Sans Myanmar', file: 'noto-sans-myanmar.woff2', size: 47148, tier: 'free', script: 'mm' },
  { name: 'Anton', file: 'anton.woff2', size: 31356, tier: 'free', script: 'latin' },
  { name: 'Bebas Neue', file: 'bebas-neue.woff2', size: 13768, tier: 'free', script: 'latin' },
  { name: 'Oswald', file: 'oswald.woff2', size: 12248, tier: 'free', script: 'latin' },
  { name: 'Lobster', file: 'lobster.woff2', size: 39904, tier: 'free', script: 'latin' },
  { name: 'Pacifico', file: 'pacifico.woff2', size: 32280, tier: 'free', script: 'latin' },
  { name: 'Righteous', file: 'righteous.woff2', size: 12756, tier: 'free', script: 'latin' },
  { name: 'Archivo Black', file: 'archivo-black.woff2', size: 18604, tier: 'free', script: 'latin' },
  { name: 'Rubik', file: 'rubik.woff2', size: 18936, tier: 'free', script: 'latin' },
  // premium
  { name: 'Playfair Display', file: 'playfair-display.woff2', size: 21856, tier: 'premium', script: 'latin' },
  { name: 'Cinzel', file: 'cinzel.woff2', size: 14128, tier: 'premium', script: 'latin' },
  { name: 'Bungee', file: 'bungee.woff2', size: 14344, tier: 'premium', script: 'latin' },
  { name: 'Monoton', file: 'monoton.woff2', size: 16492, tier: 'premium', script: 'latin' },
  { name: 'Alfa Slab One', file: 'alfa-slab-one.woff2', size: 19492, tier: 'premium', script: 'latin' },
  { name: 'Abril Fatface', file: 'abril-fatface.woff2', size: 13156, tier: 'premium', script: 'latin' },
  { name: 'Chonburi', file: 'chonburi.woff2', size: 20876, tier: 'premium', script: 'latin' },
  { name: 'Bowlby One', file: 'bowlby-one.woff2', size: 21536, tier: 'premium', script: 'latin' },
  { name: 'Titan One', file: 'titan-one.woff2', size: 10752, tier: 'premium', script: 'latin' },
  { name: 'Rowdies', file: 'rowdies.woff2', size: 17700, tier: 'premium', script: 'latin' },
].map((f) => ({ ...f, url: `/fonts/${f.file}` })) as RemoteFont[]

export const BUNDLED_FREE_FONTS = BUNDLED_FONTS.filter((f) => f.tier === 'free')

/** Merge bundled fonts in front of a remote list, without duplicating names. */
export function withBundled(list: RemoteFont[], bundled: RemoteFont[] = BUNDLED_FONTS) {
  const names = new Set(bundled.map((f) => f.name.toLowerCase()))
  return [...bundled, ...list.filter((f) => !names.has(f.name.toLowerCase()))]
}
