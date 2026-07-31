/** Export template definitions to the "my templates" JSON format. */
import type { TemplateDef } from '@/lib/templates'

export interface ExportedTemplateFile {
  version: 1
  templates: Array<{
    id: string
    name: string
    lang: string
    group: string
    bg?: string
    layers: unknown[]
  }>
}

const cache = new Map<string, string>()

/** Fetch an image URL and inline it as a base64 data URL so the JSON is self-contained. */
async function toDataUrl(src?: string): Promise<string | undefined> {
  if (!src) return undefined
  if (src.startsWith('data:')) return src
  const hit = cache.get(src)
  if (hit) return hit
  try {
    const res = await fetch(src)
    if (!res.ok) return src
    const blob = await res.blob()
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(blob)
    })
    cache.set(src, data)
    return data
  } catch {
    return src
  }
}

/** Inline every image referenced by a layer (graphic art, texture fill, erase mask). */
async function inlineLayer(layer: Record<string, unknown>) {
  const out = { ...layer }
  if (typeof out.textureImage === 'string') out.textureImage = await toDataUrl(out.textureImage)
  if (typeof out.eraseMask === 'string') out.eraseMask = await toDataUrl(out.eraseMask)
  const g = out.graphic as { src?: string } | undefined
  if (g && typeof g.src === 'string' && !g.src.startsWith('data:')) {
    out.graphic = { ...g, src: await toDataUrl(g.src) }
  }
  return out
}

export async function buildTemplatesJson(templates: TemplateDef[]): Promise<ExportedTemplateFile> {
  const list = await Promise.all(
    templates.map(async (t) => ({
      id: t.id,
      name: t.name,
      lang: t.lang,
      group: t.group,
      bg: await toDataUrl(t.bg),
      layers: await Promise.all(
        (t.build() as unknown as Record<string, unknown>[]).map(inlineLayer),
      ),
    })),
  )
  return { version: 1, templates: list }
}

export async function exportTemplatesJson(templates: TemplateDef[], filename?: string) {
  const data = await buildTemplatesJson(templates)
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  link.download =
    filename ?? `my-templates_${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.json`
  link.href = url
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
