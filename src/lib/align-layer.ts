/**
 * Canvas alignment helpers.
 *
 * Layer positions are stored as the centre point in percent of the image box,
 * so aligning to an edge needs the rendered size of the layer. That is only
 * known in the DOM, hence the measurement here rather than pure math.
 */
export type AlignMode =
  | 'left'
  | 'hcenter'
  | 'right'
  | 'top'
  | 'vcenter'
  | 'bottom'

/** Percent margin kept between the layer and the canvas edge. */
const MARGIN = 3

export function alignPatch(layerId: string, mode: AlignMode): { x?: number; y?: number } | null {
  if (typeof document === 'undefined') return null
  const box = document.querySelector<HTMLElement>('[data-canvas-box]')
  const el = document.querySelector<HTMLElement>(`[data-layer-id="${layerId}"]`)
  if (!box || !el) return null

  const b = box.getBoundingClientRect()
  const r = el.getBoundingClientRect()
  if (!b.width || !b.height) return null

  const halfW = (r.width / b.width) * 50
  const halfH = (r.height / b.height) * 50

  switch (mode) {
    case 'left':
      return { x: MARGIN + halfW }
    case 'hcenter':
      return { x: 50 }
    case 'right':
      return { x: 100 - MARGIN - halfW }
    case 'top':
      return { y: MARGIN + halfH }
    case 'vcenter':
      return { y: 50 }
    case 'bottom':
      return { y: 100 - MARGIN - halfH }
    default:
      return null
  }
}
