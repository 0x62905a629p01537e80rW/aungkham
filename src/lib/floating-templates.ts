/**
 * Remote "floating" ad templates.
 *
 * A single JSON file on the CDN holds the templates shown on the Pro splash
 * screen and on the home (selector) screen. It is downloaded in the
 * background; the UI keeps using the bundled offline templates until the
 * remote file is *fully* downloaded and parsed, then swaps in one go.
 */
import { useEffect, useState } from 'react'
import type { TextLayer } from '@/lib/text-layer'
import type { TemplateDef, TemplateLang } from '@/lib/templates'

const URL_ =
  'https://cdn.jsdelivr.net/gh/0x62905a629p01537e80rW/0x62905a629p01537e80rW.github.io@main/floating.json'

const CACHE_KEY = 'floating-templates-v1'

interface RawFloating {
  id: string
  name: string
  lang?: string
  group?: string
  bg?: string
  layers: TextLayer[]
}

function toDefs(raw: RawFloating[]): TemplateDef[] {
  return raw
    .filter((t) => Array.isArray(t.layers))
    .map((t) => ({
      id: t.id,
      name: t.name ?? 'Template',
      lang: (t.lang === 'MM' ? 'MM' : 'EN') as TemplateLang,
      group: t.group ?? 'New',
      bg: t.bg,
      build: () => t.layers.map((l, idx) => ({ ...l, id: `${t.id}-${idx}-${Date.now()}` })),
    }))
}

let cache: TemplateDef[] | null = null
let inflight: Promise<TemplateDef[] | null> | null = null
const listeners = new Set<(v: TemplateDef[]) => void>()

function readCache(): TemplateDef[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const json = JSON.parse(raw) as { templates?: RawFloating[] }
    const defs = toDefs(json.templates ?? [])
    return defs.length ? defs : null
  } catch {
    return null
  }
}

async function load(): Promise<TemplateDef[] | null> {
  if (cache) return cache
  if (inflight) return inflight
  inflight = (async () => {
    // offline → keep the bundled templates
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      const cached = readCache()
      if (cached) cache = cached
      return cache
    }
    try {
      const res = await fetch(URL_, { cache: 'no-cache' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      // await the *whole* body before swapping anything in
      const text = await res.text()
      const json = JSON.parse(text) as { templates?: RawFloating[] }
      const defs = toDefs(json.templates ?? [])
      if (!defs.length) throw new Error('empty')
      try {
        localStorage.setItem(CACHE_KEY, text)
      } catch {
        /* quota — fine, memory cache still works */
      }
      cache = defs
    } catch {
      const cached = readCache()
      if (cached) cache = cached
    }
    if (cache) for (const fn of listeners) fn(cache)
    return cache
  })()
  return inflight
}

/**
 * Returns the remote templates once fully downloaded, otherwise `fallback`
 * (the offline set we ship with the app).
 */
export function useFloatingTemplates(fallback: TemplateDef[]): TemplateDef[] {
  const [list, setList] = useState<TemplateDef[] | null>(cache)

  useEffect(() => {
    let alive = true
    const fn = (v: TemplateDef[]) => {
      if (alive) setList(v)
    }
    listeners.add(fn)
    void load().then((v) => {
      if (alive && v) setList(v)
    })
    return () => {
      alive = false
      listeners.delete(fn)
    }
  }, [])

  return list && list.length ? list : fallback
}

/** Kick off the download early (e.g. on app boot). */
export function prefetchFloatingTemplates() {
  void load()
}
