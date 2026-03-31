/**
 * WhatsApp MultiBox — Icon Generator
 * Output: resources/icon.png  (512x512, Windows + Mac Quelle)
 *         resources/icon.icns (Mac DMG, aus PNG generiert)
 *
 * Methoden (automatischer Fallback):
 *   A) sharp      — schnell, qualitativ hochwertig
 *   B) jimp       — reines JavaScript, kein native Code
 *   C) Minimal    — 1x1 Placeholder (Build funktioniert trotzdem)
 */

const fs   = require('fs')
const path = require('path')

const RESOURCES = path.join(__dirname, 'resources')
const PNG_OUT   = path.join(RESOURCES, 'icon.png')
const ICNS_OUT  = path.join(RESOURCES, 'icon.icns')

if (!fs.existsSync(RESOURCES)) fs.mkdirSync(RESOURCES, { recursive: true })

// SVG-Vorlage: gruenes abgerundetes Icon mit "W"
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <rect width="512" height="512" rx="80" ry="80" fill="#25d366"/>
  <text x="256" y="360" font-size="300" font-family="Arial,Helvetica,sans-serif"
        font-weight="bold" text-anchor="middle" fill="white">W</text>
</svg>`

async function generatePng() {
  // Versuch A: sharp (beste Qualitaet)
  try {
    const sharp = require('sharp')
    await sharp(Buffer.from(SVG)).resize(512, 512).png().toFile(PNG_OUT)
    console.log('icon.png erstellt (sharp)')
    return true
  } catch {}

  // Versuch B: jimp
  try {
    const Jimp = require('jimp')
    const img  = new Jimp(512, 512, 0x25d366ff)
    const font = await Jimp.loadFont(Jimp.FONT_SANS_128_WHITE)
    img.print(font, 140, 190, 'W')
    await img.writeAsync(PNG_OUT)
    console.log('icon.png erstellt (jimp)')
    return true
  } catch {}

  // Versuch C: minimales PNG (1x1, gruen)
  // electron-builder skaliert automatisch fuer Windows
  const greenPng = Buffer.from([
    0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a, // PNG header
    0x00,0x00,0x00,0x0d,0x49,0x48,0x44,0x52, // IHDR chunk
    0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x01, // 1x1
    0x08,0x02,0x00,0x00,0x00,0x90,0x77,0x53, // 8bit RGB
    0xde,0x00,0x00,0x00,0x0c,0x49,0x44,0x41, // IDAT
    0x54,0x08,0xd7,0x63,0xa8,0xf4,0x6c,0x00, // compressed green pixel
    0x00,0x01,0x08,0x00,0x03,0xc8,0x48,0x4b, // CRC
    0x00,0x00,0x00,0x00,0x49,0x45,0x4e,0x44, // IEND
    0xae,0x42,0x60,0x82
  ])
  fs.writeFileSync(PNG_OUT, greenPng)
  console.log('Minimales Placeholder-PNG erstellt (1x1 gruen)')
  console.log('   Empfehlung: eigenes 512x512 icon.png in resources/ ablegen')
  return false
}

async function generateIcns() {
  if (!fs.existsSync(PNG_OUT)) {
    console.log('icon.png fehlt — ICNS uebersprungen')
    return
  }

  // Versuch: png2icons
  try {
    const png2icons = require('png2icons')
    const input     = fs.readFileSync(PNG_OUT)
    const icns      = png2icons.createICNS(input, png2icons.BILINEAR, 0)
    if (icns) {
      fs.writeFileSync(ICNS_OUT, icns)
      console.log('icon.icns erstellt (png2icons)')
      return
    }
  } catch {}

  // Fallback: electron-builder kann PNG fuer Mac verwenden
  console.log('ICNS konnte nicht generiert werden.')
  console.log('   Mac-Build laeuft trotzdem — electron-builder nutzt icon.png als Fallback.')
  console.log('   Fuer professionelles Mac-Icon: icon.icns manuell erstellen.')
}

async function main() {
  console.log('\nIcon Generator — WhatsApp MultiBox\n')
  const pngOk = await generatePng()
  if (pngOk) await generateIcns()
  console.log('\nresources/')
  console.log('   icon.png: ', fs.existsSync(PNG_OUT)  ? 'OK' : 'FEHLT')
  console.log('   icon.icns:', fs.existsSync(ICNS_OUT) ? 'OK' : '(PNG Fallback)')
  console.log('')
}

main().catch((e) => { console.error(e); process.exit(1) })
