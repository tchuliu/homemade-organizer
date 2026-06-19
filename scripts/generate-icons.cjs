const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const publicDir = path.join(__dirname, '..', 'public')
const svgPath = path.join(publicDir, 'icon.svg')
const svgBuffer = fs.readFileSync(svgPath)

const BG = { r: 79, g: 70, b: 229, alpha: 1 } // indigo-600

async function generateIcon(size) {
  const padding = Math.round(size * 0.22)
  const iconSize = size - padding * 2

  const background = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BG,
    },
  })
    .png()
    .toBuffer()

  const icon = await sharp(svgBuffer).resize(iconSize, iconSize).png().toBuffer()

  return sharp(background)
    .composite([{ input: icon, top: padding, left: padding }])
    .png()
    .toBuffer()
}

async function main() {
  const icon192 = await generateIcon(192)
  fs.writeFileSync(path.join(publicDir, 'icon-192.png'), icon192)

  const icon512 = await generateIcon(512)
  fs.writeFileSync(path.join(publicDir, 'icon-512.png'), icon512)

  console.log('Icons generated: icon-192.png, icon-512.png')
}

main().catch((err) => {
  console.error('Failed to generate icons:', err)
  process.exit(1)
})
