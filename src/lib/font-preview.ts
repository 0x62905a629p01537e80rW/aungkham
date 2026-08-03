/**
 * Preview strings for the font store.
 *
 * Zawgyi fonts map Myanmar glyphs onto different code points than Unicode, so
 * a Unicode sample renders as broken/overlapping shapes even though the font
 * is perfectly fine in the editor (where the user types Zawgyi text).
 * Latin-only fonts likewise show tofu boxes for a Myanmar sample.
 */

/** Short sample: avoids rare stacked clusters that many display faces lack. */
export const UNICODE_SAMPLE = 'မြန်မာ စာလုံး Aa'
/** Same words, Zawgyi-encoded. */
export const ZAWGYI_SAMPLE = 'ျမန္မာ စာလုံး Aa'
export const LATIN_SAMPLE = 'The quick brown fox Aa'

/** Faces that are Zawgyi/legacy-encoded without saying so in the file name. */
const ZAWGYI_NAMES = ['winuniinnwa', 'wininnwa', 'winburmese', 'acemyanmar']


export function isZawgyiFontName(name: string) {
  const id = name.toLowerCase()
  if (/zawgyi|zawgy|\bzg\b|[_\-\s]zg[0-9_\-\s]|^zg/i.test(id)) return true
  return ZAWGYI_NAMES.some((n) => id.replace(/[^a-z0-9]/g, '').includes(n))
}

/** Pick the sample text that renders correctly for a given font. */
export function fontSampleText(font: { name: string; file?: string; script?: 'mm' | 'latin' }) {
  if (font.script === 'latin') return LATIN_SAMPLE
  const id = `${font.name} ${font.file ?? ''}`
  if (isZawgyiFontName(id)) return ZAWGYI_SAMPLE
  return UNICODE_SAMPLE
}
