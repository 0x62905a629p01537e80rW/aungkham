export type TextAlign = 'left' | 'center' | 'right'

export type TextureType = 'none' | 'ocean' | 'neon' | 'mono'

export type FillType = 'solid' | 'gradient' | 'texture'



export interface TextLayer {
  id: string
  text: string
  fontKey: string
  fontSize: number
  fontWeight: number
  italic: boolean
  align: TextAlign
  letterSpacing: number
  lineHeight: number
  color: string
  opacity: number
  x: number
  y: number
  rotation: number
  strokeWidth: number
  strokeColor: string
  shadowColor: string
  shadowBlur: number
  shadowOffsetX: number
  shadowOffsetY: number
  texture: TextureType
  highlight: boolean
  highlightColor: string
  skewX: number
  skewY: number
  hidden?: boolean
  locked?: boolean
  /** layers sharing a groupId move / transform together */
  groupId?: string
  strokeOpacity?: number
  blendMode?: string

  /* Fill */
  fillType: FillType
  gradientFrom: string
  gradientTo: string
  gradientAngle: number

  /* Image texture transform */
  textureRotate?: number
  textureScaleX?: number
  textureScaleY?: number
  textureOffsetX?: number
  textureOffsetY?: number

  /* 3D extrusion */
  depthOn: boolean
  depth: number
  depthDarken: number
  depthColor: string

  /* 3D rotation / perspective */
  rotateX: number
  rotateY: number
  perspective: number

  /* Liquid glass */
  liquidOn?: boolean
  liquidTint?: number
  liquidBlur?: number
  liquidBorder?: number
  liquidGlow?: number
  liquidPlate?: boolean
  liquidDark?: boolean

  /* Bend (arc) */
  bend: number

  /* Flip */
  flipH: boolean
  flipV: boolean

  /* Format extras */
  underline?: boolean
  strike?: boolean
  widthScale?: number
  heightScale?: number

  /* Image texture + eraser mask (data URLs) */
  textureImage?: string
  textureSrc?: string
  eraseMask?: string

  /* Non-text graphic content (overlay image / shape / sticker) */
  graphic?: GraphicContent
}

export type GraphicKind = 'image' | 'shape' | 'sticker'

export interface GraphicContent {
  kind: GraphicKind
  src: string
  /** width / height of the source artwork */
  aspect: number
  /** shape only: original path so the shape can be re-rendered */
  path?: string
  /** shape only: outline-only (stroke) instead of filled */
  outline?: boolean
  /** shape only: stroke width in the 0-100 viewBox */
  strokeWidth?: number
  /** shape only: stroke color, independent from the layer fill */
  strokeColor?: string
}


export interface FontOption {
  key: string
  label: string
  cssVar: string
  category: 'Sans' | 'Serif' | 'Display' | 'Script' | 'Myanmar' | 'Myanmar Pro'
}

export const FONTS: FontOption[] = [
  { key: 'inter', label: 'Inter', cssVar: 'var(--font-inter)', category: 'Sans' },
  { key: 'poppins', label: 'Poppins', cssVar: 'var(--font-poppins)', category: 'Sans' },
  { key: 'montserrat', label: 'Montserrat', cssVar: 'var(--font-montserrat)', category: 'Sans' },
  { key: 'oswald', label: 'Oswald', cssVar: 'var(--font-oswald)', category: 'Sans' },
  { key: 'bebas', label: 'Bebas Neue', cssVar: 'var(--font-bebas)', category: 'Display' },
  { key: 'anton', label: 'Anton', cssVar: 'var(--font-anton)', category: 'Display' },
  { key: 'playfair', label: 'Playfair Display', cssVar: 'var(--font-playfair)', category: 'Serif' },
  { key: 'lobster', label: 'Lobster', cssVar: 'var(--font-lobster)', category: 'Script' },
  { key: 'pacifico', label: 'Pacifico', cssVar: 'var(--font-pacifico)', category: 'Script' },
  { key: 'caveat', label: 'Caveat', cssVar: 'var(--font-caveat)', category: 'Script' },
  { key: 'choco-cooky', label: 'Choco Cooky', cssVar: "'MM_choco_cooky'", category: 'Myanmar' },
  { key: 'keng-tawng03', label: 'Keng Tawng03', cssVar: "'MM_keng_tawng03'", category: 'Myanmar' },
  { key: 'myanmar-april', label: 'Myanmar April', cssVar: "'MM_myanmar_april'", category: 'Myanmar' },
  { key: 'myanmar-ayar-tyepwriter', label: 'Myanmar Ayar Tyepwriter', cssVar: "'MM_myanmar_ayar_tyepwriter'", category: 'Myanmar' },
  { key: 'myanmar-ayar-wazo', label: 'Myanmar Ayar Wazo', cssVar: "'MM_myanmar_ayar_wazo'", category: 'Myanmar' },
  { key: 'myanmar-handwriting', label: 'Myanmar Handwriting', cssVar: "'MM_myanmar_handwriting'", category: 'Myanmar' },
  { key: 'myanmar-jojar', label: 'Myanmar Jojar', cssVar: "'MM_myanmar_jojar'", category: 'Myanmar' },
  { key: 'myanmar-khittar', label: 'Myanmar Khittar', cssVar: "'MM_myanmar_khittar'", category: 'Myanmar' },
  { key: 'myanmar-taunggyi', label: 'Myanmar Taunggyi', cssVar: "'MM_myanmar_taunggyi'", category: 'Myanmar' },
  { key: 'myanmar-waitzar', label: 'Myanmar Waitzar', cssVar: "'MM_myanmar_waitzar'", category: 'Myanmar' },
  { key: 'pyidaungsu', label: 'Pyidaungsu', cssVar: "'MM_pyidaungsu'", category: 'Myanmar' },
  { key: 'tgi', label: 'TGI', cssVar: "'MM_tgi'", category: 'Myanmar' },
  { key: 'abrush', label: 'ABrush', cssVar: "'MM_abrush'", category: 'Myanmar Pro' },
  { key: 'layaungthit-k16', label: 'La Yaung Thit 16', cssVar: "'MM_layaungthit_k16'", category: 'Myanmar Pro' },
  { key: 'layaungthit-k19', label: 'La Yaung Thit 19', cssVar: "'MM_layaungthit_k19'", category: 'Myanmar Pro' },
  { key: 'layaungthit-k25', label: 'La Yaung Thit 25', cssVar: "'MM_layaungthit_k25'", category: 'Myanmar Pro' },
  { key: 'layaungthit-k26', label: 'La Yaung Thit 26', cssVar: "'MM_layaungthit_k26'", category: 'Myanmar Pro' },
  { key: 'layaungthit-k36', label: 'La Yaung Thit 36', cssVar: "'MM_layaungthit_k36'", category: 'Myanmar Pro' },
  { key: 'layaungthit-k39', label: 'La Yaung Thit 39', cssVar: "'MM_layaungthit_k39'", category: 'Myanmar Pro' },
  { key: 'layaungthit-k44', label: 'La Yaung Thit 44', cssVar: "'MM_layaungthit_k44'", category: 'Myanmar Pro' },
  { key: 'layaungthit-k48', label: 'La Yaung Thit 48', cssVar: "'MM_layaungthit_k48'", category: 'Myanmar Pro' },
  { key: 'layaungthit-k49', label: 'La Yaung Thit 49', cssVar: "'MM_layaungthit_k49'", category: 'Myanmar Pro' },
  { key: 'layaungthit-k54', label: 'La Yaung Thit 54', cssVar: "'MM_layaungthit_k54'", category: 'Myanmar Pro' },
  { key: 'layaungthit-k56', label: 'La Yaung Thit 56', cssVar: "'MM_layaungthit_k56'", category: 'Myanmar Pro' },
  { key: 'layaungthit-k57', label: 'La Yaung Thit 57', cssVar: "'MM_layaungthit_k57'", category: 'Myanmar Pro' },
  { key: 'layaungthit-k58', label: 'La Yaung Thit 58', cssVar: "'MM_layaungthit_k58'", category: 'Myanmar Pro' },
  { key: 'layaungthit-k60', label: 'La Yaung Thit 60', cssVar: "'MM_layaungthit_k60'", category: 'Myanmar Pro' },
  { key: 'layaungthit-k61', label: 'La Yaung Thit 61', cssVar: "'MM_layaungthit_k61'", category: 'Myanmar Pro' },
  { key: 'layaungthit-k65', label: 'La Yaung Thit 65', cssVar: "'MM_layaungthit_k65'", category: 'Myanmar Pro' },
  { key: 'layaungthit-k6', label: 'La Yaung Thit 6', cssVar: "'MM_layaungthit_k6'", category: 'Myanmar Pro' },
  { key: 'myanmargantgaw', label: 'Myanmar Gantgaw', cssVar: "'MM_myanmargantgaw'", category: 'Myanmar Pro' },
  { key: 'myanmarkuttar', label: 'Myanmar Kuttar', cssVar: "'MM_myanmarkuttar'", category: 'Myanmar Pro' },
  { key: 'myanmarsabae', label: 'Myanmar Sabae', cssVar: "'MM_myanmarsabae'", category: 'Myanmar Pro' },
  { key: 'myanmarsquare', label: 'Myanmar Square', cssVar: "'MM_myanmarsquare'", category: 'Myanmar Pro' },
  { key: 'myanmaryinmar', label: 'Myanmar Yinmar', cssVar: "'MM_myanmaryinmar'", category: 'Myanmar Pro' },
  { key: 'koz008', label: 'Koz 008', cssVar: "'MM_koz008'", category: 'Myanmar Pro' },
  { key: 'koz033', label: 'Koz 033', cssVar: "'MM_koz033'", category: 'Myanmar Pro' },
  { key: 'koz052', label: 'Koz 052', cssVar: "'MM_koz052'", category: 'Myanmar Pro' },
]

export const FONT_CATEGORIES: FontOption['category'][] = [
  'Myanmar',
  'Myanmar Pro',
  'Sans',
  'Serif',
  'Display',
  'Script',
]

export function fontFamily(key: string): string {
  if (key.startsWith('custom:')) return `'CF_${key.slice(7)}', sans-serif`
  const f = FONTS.find((f) => f.key === key)
  return f ? `${f.cssVar}, sans-serif` : 'sans-serif'
}

export const TEXTURES: Record<TextureType, { label: string; gradient: string | null }> = {
  none: { label: 'Solid', gradient: null },
  ocean: { label: 'Ocean', gradient: 'linear-gradient(90deg, #2193b0 0%, #6dd5ed 100%)' },
  neon: { label: 'Neon', gradient: 'linear-gradient(90deg, #00f260 0%, #0575e6 100%)' },
  mono: { label: 'Steel', gradient: 'linear-gradient(180deg, #e0e0e0 0%, #757f9a 100%)' },
}

let counter = 0
export function createTextLayer(text = 'Your text'): TextLayer {
  counter += 1
  return {
    id: `layer-${Date.now()}-${counter}`,
    text,
    fontKey: 'anton',
    fontSize: 12,
    fontWeight: 700,
    italic: false,
    align: 'center',
    letterSpacing: 0,
    lineHeight: 1.1,
    color: '#000000',
    opacity: 1,
    x: 50,
    y: 50,
    rotation: 0,
    strokeWidth: 0,
    strokeColor: '#000000',
    strokeOpacity: 1,
    shadowColor: '#000000',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    texture: 'none',
    highlight: false,
    highlightColor: '#2563eb',
    skewX: 0,
    skewY: 0,
    fillType: 'solid',
    gradientFrom: '#ff7a18',
    gradientTo: '#af002d',
    gradientAngle: 90,
    textureRotate: 0,
    textureScaleX: 100,
    textureScaleY: 100,
    textureOffsetX: 50,
    textureOffsetY: 50,
    depthOn: false,
    depth: 30,
    depthDarken: 48,
    depthColor: '#1d4ed8',
    rotateX: 0,
    rotateY: 0,
    perspective: 600,
    bend: 0,
    liquidOn: false,
    liquidTint: 22,
    liquidBlur: 8,
    liquidBorder: 45,
    liquidGlow: 35,
    liquidPlate: false,
    liquidDark: false,
    flipH: false,
    flipV: false,
    underline: false,
    strike: false,
    widthScale: 100,
    heightScale: 100,
    hidden: false,
    locked: false,
    blendMode: 'normal',
  }
}


export function createGraphicLayer(
  graphic: GraphicContent,
  name = 'Graphic',
): TextLayer {
  const layer = createTextLayer(name)
  return {
    ...layer,
    graphic,
    fontSize: 30,
    color: graphic.kind === 'shape' ? '#000000' : layer.color,
  }
}
