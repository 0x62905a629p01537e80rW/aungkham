/**
 * Quick actions launched from the home selector ("More" / "Ultra HD").
 *
 * Each action picks a photo first, opens the editor, and then jumps straight
 * to the requested tool. Text actions also drop a fresh text layer so the
 * text-only tools are available immediately.
 */
export type QuickActionKind = 'canvas' | 'ultrahd' | 'text'

export interface QuickAction {
  id: string
  label: string
  kind: QuickActionKind
  /** ToolBar tool key (text actions) or canvas panel id (canvas actions). */
  target: string
}

export const CANVAS_ACTIONS: QuickAction[] = [
  { id: 'removebg', label: 'Background remover', kind: 'canvas', target: 'removebg' },
  { id: 'draw', label: 'Draw', kind: 'canvas', target: 'draw' },
  { id: 'freeform', label: 'Free form shapes', kind: 'canvas', target: 'freeform' },
  { id: 'filter', label: 'Filter', kind: 'canvas', target: 'filter' },
  { id: 'adjust', label: 'Adjust', kind: 'canvas', target: 'adjust' },
]

export const ULTRA_ACTIONS: QuickAction[] = [
  { id: 'upscale', label: 'Ultra HD resize', kind: 'ultrahd', target: 'resize' },
  { id: 'sharpen', label: 'Ultra HD enhance', kind: 'ultrahd', target: 'adjust' },
  { id: 'hdexport', label: 'Ultra HD export', kind: 'ultrahd', target: 'export' },
]

export const TEXT_ACTIONS: QuickAction[] = [
  { id: 'liquid', label: 'Liquid', kind: 'text', target: 'liquid' },
  { id: 'depth3d', label: '3D', kind: 'text', target: 'depth3d' },
  { id: 'texture', label: 'Texture', kind: 'text', target: 'texture' },
  { id: 'blend', label: 'Blend', kind: 'text', target: 'blend' },
  { id: 'skew', label: 'Skew', kind: 'text', target: 'skew' },
  { id: 'highlight', label: 'Highlights', kind: 'text', target: 'highlight' },
  { id: 'erase', label: 'Erase', kind: 'text', target: 'erase' },
  { id: 'fx', label: 'Effects', kind: 'text', target: 'fx' },
]
