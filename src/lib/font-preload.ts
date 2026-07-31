import { FONTS } from '@/lib/text-layer'
import { ensureCustomFontsLoaded, listCustomFonts } from '@/lib/custom-fonts'
import {
  ensureGoogleFontsLoaded,
  listInstalledGoogleFonts,
  preloadGoogleFontPreview,
} from '@/lib/google-fonts'
import { ensureRemoteFontsLoaded, listInstalledRemoteFonts, remoteCssFamily } from '@/lib/remote-fonts'

/** Sample glyphs that cover Latin + Myanmar so every face actually downloads. */
const SAMPLE = 'Aaဣမြ၁'

let started = false

function familyFromCssVar(cssVar: string): string | null {
  if (typeof document === 'undefined') return null
  const raw = cssVar.trim()
  if (!raw.startsWith('var(')) return raw.replace(/^['"]|['"]$/g, '')
  const name = raw.slice(4, -1).trim()
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  if (!value) return null
  return value.split(',')[0].trim().replace(/^['"]|['"]$/g, '')
}

function loadFamily(family: string) {
  if (!family) return
  try {
    void (document as any).fonts?.load(`400 16px "${family}"`, SAMPLE)
  } catch {
    /* ignore */
  }
}

/**
 * Warm every font preview up-front (called when the editor opens) so the
 * typeface picker renders instantly instead of downloading faces on open.
 */
export function preloadAllFontPreviews() {
  if (started || typeof document === 'undefined') return
  started = true

  ensureCustomFontsLoaded()
  void ensureGoogleFontsLoaded()
  void ensureRemoteFontsLoaded()

  const run = () => {
    // Built-in Google + bundled Myanmar faces
    for (const f of FONTS) {
      const family = familyFromCssVar(f.cssVar)
      if (family) loadFamily(family)
    }
    // User-uploaded faces
    for (const c of listCustomFonts()) loadFamily(`CF_${c.id}`)
    // Downloaded Google fonts (stylesheet + face)
    const google = listInstalledGoogleFonts()
    if (google.length) {
      preloadGoogleFontPreview(google)
      google.forEach(loadFamily)
    }
    // Downloaded remote fonts
    for (const f of listInstalledRemoteFonts()) loadFamily(remoteCssFamily(f.name))
  }

  const idle = (window as any).requestIdleCallback as
    | ((cb: () => void, o?: { timeout: number }) => number)
    | undefined
  if (idle) idle(run, { timeout: 1500 })
  else setTimeout(run, 200)
}
