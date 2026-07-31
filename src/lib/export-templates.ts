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

export function buildTemplatesJson(templates: TemplateDef[]): ExportedTemplateFile {
  return {
    version: 1,
    templates: templates.map((t) => ({
      id: t.id,
      name: t.name,
      lang: t.lang,
      group: t.group,
      bg: t.bg,
      layers: t.build(),
    })),
  }
}

export function exportTemplatesJson(templates: TemplateDef[], filename?: string) {
  const data = buildTemplatesJson(templates)
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
