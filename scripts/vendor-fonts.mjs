/**
 * Downloads the Google Fonts used by the app into public/fonts/google/ and
 * writes a local fonts.css, so the native build never touches the network.
 *
 * Usage:
 *   node scripts/vendor-fonts.mjs          # download once, skip if present
 *   node scripts/vendor-fonts.mjs --force  # re-download even if present
 */
import { mkdir, writeFile, readFile, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const FORCE = process.argv.includes('--force')

const CSS_URL =
  'https://fonts.googleapis.com/css2?family=Anton&family=Bebas+Neue&family=Caveat:wght@400;700&family=Inter:wght@400;500;600;700;800&family=Lobster&family=Manrope:wght@400;500;600;700;800&family=Montserrat:wght@400;500;600;700;800&family=Oswald:wght@400;500;600;700&family=Pacifico&family=Roboto:wght@400;500;700;900&family=Playfair+Display:wght@400;600;700;800&family=Poppins:wght@400;500;600;700;800&family=Sora:wght@400;500;600;700;800&display=swap'

const OUT = join(process.cwd(), 'public', 'fonts', 'google')
const CSS_OUT = join(OUT, 'fonts.css')

await mkdir(OUT, { recursive: true })

if (!FORCE && existsSync(CSS_OUT)) {
  const s = await stat(CSS_OUT)
  if (s.size > 0) {
    console.log('Fonts already vendored. Use --force to re-download.')
    process.exit(0)
  }
}

const res = await fetch(CSS_URL, {
  headers: {
    // woff2-capable UA so Google serves the modern format
    'user-agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
  },
})
if (!res.ok) throw new Error(`Font CSS failed: HTTP ${res.status}`)
let css = await res.text()

const urls = [...new Set([...css.matchAll(/url\((https:\/\/[^)]+)\)/g)].map((m) => m[1]))]
console.log(`Downloading ${urls.length} font files ...`)

let n = 0
for (const url of urls) {
  const name = url.split('/').slice(-3).join('-').replace(/[^\w.-]/g, '_')
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer())
  await writeFile(join(OUT, name), buf)
  css = css.split(url).join(`./${name}`)
  process.stdout.write(`\r  ${++n}/${urls.length}`)
}

await writeFile(CSS_OUT, css)
console.log(`\nWrote public/fonts/google/fonts.css`)
