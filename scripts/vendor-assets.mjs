/**
 * Downloads every Lovable-hosted asset (`/__l5e/assets-v1/...`) into public/
 * so the Capacitor build is 100% offline.
 *
 * Usage:
 *   node scripts/vendor-assets.mjs [https://your-published-url]        # once
 *   node scripts/vendor-assets.mjs --force [https://your-published-url] # re-download
 */
import { readdir, readFile, writeFile, mkdir, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'

const FORCE = process.argv.includes('--force')
const ORIGIN_ARG = process.argv.find((a, i) => i > 1 && !a.startsWith('--'))
const ORIGIN = (ORIGIN_ARG || 'https://aungkham.lovable.app').replace(/\/$/, '')
const ROOT = process.cwd()
const OUT = join(ROOT, 'public')

const urls = new Set()

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', '.git', 'android', 'ios'].includes(entry.name)) continue
      await walk(p)
      continue
    }
    if (entry.name.endsWith('.asset.json')) {
      const json = JSON.parse(await readFile(p, 'utf8'))
      if (json.url) urls.add(json.url)
      continue
    }
    if (!/\.(tsx?|jsx?|css|json|html)$/.test(entry.name)) continue
    const text = await readFile(p, 'utf8')
    for (const m of text.matchAll(/\/__l5e\/assets-v1\/[A-Za-z0-9._~%\-/]+/g)) urls.add(m[0])
  }
}

await walk(join(ROOT, 'src'))
if (existsSync(join(ROOT, 'public'))) await walk(join(ROOT, 'public'))

console.log(`Found ${urls.size} assets. Downloading from ${ORIGIN} ...`)

let ok = 0
let skipped = 0
let fail = 0
const list = [...urls]
const CONCURRENCY = 12

async function fetchOne(url) {
  const dest = join(OUT, url.replace(/^\//, ''))
  if (!FORCE) {
    try {
      const s = await stat(dest)
      if (s.size > 0) {
        skipped++
        return { skipped: true }
      }
    } catch {
      /* not cached */
    }
  }
  const res = await fetch(ORIGIN + url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  await mkdir(dirname(dest), { recursive: true })
  await writeFile(dest, buf)
  return { bytes: buf.length }
}

for (let i = 0; i < list.length; i += CONCURRENCY) {
  const batch = list.slice(i, i + CONCURRENCY)
  await Promise.all(
    batch.map(async (url) => {
      try {
        const r = await fetchOne(url)
        if (!r.skipped) ok++
      } catch (err) {
        fail++
        console.warn(`  ! ${url} — ${err.message}`)
      }
    }),
  )
  process.stdout.write(`\r  ${Math.min(i + CONCURRENCY, list.length)}/${list.length}`)
}

console.log(`\nDone. ${ok} downloaded, ${skipped} cached, ${fail} failed.`)
if (fail) process.exitCode = 1
