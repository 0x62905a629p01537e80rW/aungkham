/** Rotate an image data URL by `deg` degrees, returning a new data URL. */
export function rotateImage(src: string, deg: number): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!deg) {
      resolve(src)
      return
    }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const rad = (deg * Math.PI) / 180
      const sin = Math.abs(Math.sin(rad))
      const cos = Math.abs(Math.cos(rad))
      const w = Math.round(img.width * cos + img.height * sin)
      const h = Math.round(img.width * sin + img.height * cos)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(src)
        return
      }
      ctx.translate(w / 2, h / 2)
      ctx.rotate(rad)
      ctx.drawImage(img, -img.width / 2, -img.height / 2)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => reject(new Error('Could not load texture image'))
    img.src = src
  })
}
