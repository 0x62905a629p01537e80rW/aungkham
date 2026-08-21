import { toPng } from 'html-to-image'

/**
 * Fallback screen colour picker for browsers / native WebViews without the
 * EyeDropper API. Renders the live canvas to a bitmap, shows a full-screen
 * overlay with a magnifier loupe, and resolves with the picked hex colour.
 */
export async function pickColorFromCanvas(): Promise<string | null> {
  const box = document.querySelector<HTMLElement>('[data-canvas-box]')
  if (!box) return null

  let dataUrl: string
  try {
    dataUrl = await toPng(box, { cacheBust: true, pixelRatio: 1 })
  } catch {
    return null
  }

  const img = new Image()
  img.src = dataUrl
  await new Promise<void>((res) => {
    img.onload = () => res()
    img.onerror = () => res()
  })
  if (!img.naturalWidth) return null

  const buf = document.createElement('canvas')
  buf.width = img.naturalWidth
  buf.height = img.naturalHeight
  const bctx = buf.getContext('2d', { willReadFrequently: true })
  if (!bctx) return null
  bctx.drawImage(img, 0, 0)

  return new Promise<string | null>((resolve) => {
    const root = document.createElement('div')
    root.setAttribute('data-screen-pick', '')
    root.style.cssText =
      'position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.72);' +
      'backdrop-filter:blur(2px);display:flex;align-items:center;justify-content:center;' +
      'touch-action:none;animation:sp-in .18s ease-out'

    const stage = document.createElement('div')
    stage.style.cssText = 'position:relative;max-width:92vw;max-height:72dvh'
    const view = document.createElement('img')
    view.src = dataUrl
    view.draggable = false
    view.style.cssText =
      'display:block;max-width:92vw;max-height:72dvh;user-select:none;-webkit-user-drag:none'
    stage.appendChild(view)

    const loupe = document.createElement('div')
    loupe.style.cssText =
      'position:absolute;width:88px;height:88px;border-radius:999px;pointer-events:none;' +
      'border:3px solid #fff;box-shadow:0 6px 20px rgba(0,0,0,.45);opacity:0;' +
      'transform:translate(-50%,-120%);background-repeat:no-repeat;image-rendering:pixelated'
    stage.appendChild(loupe)

    const dot = document.createElement('div')
    dot.style.cssText =
      'position:absolute;width:14px;height:14px;border-radius:999px;border:2px solid #fff;' +
      'box-shadow:0 0 0 1px rgba(0,0,0,.5);transform:translate(-50%,-50%);pointer-events:none;opacity:0'
    stage.appendChild(dot)

    const hint = document.createElement('div')
    hint.textContent = 'Drag to sample, release to pick'
    hint.style.cssText =
      'position:absolute;left:50%;bottom:-40px;transform:translateX(-50%);color:#fff;' +
      'font-size:13px;font-weight:500;white-space:nowrap;opacity:.9'
    stage.appendChild(hint)

    const cancel = document.createElement('button')
    cancel.textContent = 'Cancel'
    cancel.style.cssText =
      'position:fixed;top:calc(env(safe-area-inset-top,0px) + 16px);right:16px;color:#fff;' +
      'background:rgba(255,255,255,.16);border:0;border-radius:999px;padding:8px 16px;' +
      'font-size:14px;font-weight:600'

    root.appendChild(stage)
    root.appendChild(cancel)
    document.body.appendChild(root)

    let current: string | null = null

    const sample = (clientX: number, clientY: number) => {
      const r = view.getBoundingClientRect()
      const x = Math.round(((clientX - r.left) / r.width) * buf.width)
      const y = Math.round(((clientY - r.top) / r.height) * buf.height)
      if (x < 0 || y < 0 || x >= buf.width || y >= buf.height) return
      const d = bctx.getImageData(x, y, 1, 1).data
      const hex =
        '#' +
        [d[0], d[1], d[2]].map((n) => n.toString(16).padStart(2, '0')).join('')
      current = hex
      const lx = clientX - r.left
      const ly = clientY - r.top
      loupe.style.opacity = '1'
      loupe.style.left = `${lx}px`
      loupe.style.top = `${ly}px`
      loupe.style.background = hex
      dot.style.opacity = '1'
      dot.style.left = `${lx}px`
      dot.style.top = `${ly}px`
      dot.style.background = hex
    }

    const close = (value: string | null) => {
      root.remove()
      resolve(value)
    }

    view.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      view.setPointerCapture(e.pointerId)
      sample(e.clientX, e.clientY)
    })
    view.addEventListener('pointermove', (e) => {
      if (e.pressure === 0 && e.buttons === 0) return
      sample(e.clientX, e.clientY)
    })
    view.addEventListener('pointerup', (e) => {
      sample(e.clientX, e.clientY)
      close(current)
    })
    cancel.addEventListener('click', () => close(null))
    root.addEventListener('pointerdown', (e) => {
      if (e.target === root) close(null)
    })
  })
}
