/**
 * Liest eine Bilddatei, skaliert sie auf max 512px,
 * und gibt eine base64 Data-URL zurück.
 */
export async function processImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      const img = new Image()
      img.onload = () => {
        const MAX = 512
        let { width, height } = img

        // Skalieren wenn nötig
        if (width > MAX || height > MAX) {
          const ratio = Math.min(MAX / width, MAX / height)
          width  = Math.round(width  * ratio)
          height = Math.round(height * ratio)
        }

        const canvas = document.createElement('canvas')
        canvas.width  = width
        canvas.height = height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)

        // PNG ausgeben (verlustfrei, gut für Icons)
        resolve(canvas.toDataURL('image/png', 1.0))
      }
      img.onerror = () => reject(new Error('Bild konnte nicht geladen werden'))
      img.src = dataUrl
    }
    reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'))
    reader.readAsDataURL(file)
  })
}
