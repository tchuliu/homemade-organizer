const zlib = require('zlib')
const fs = require('fs')
const path = require('path')

function createPNG(width, height, pixelFn) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(width, 0)
  ihdrData.writeUInt32BE(height, 4)
  ihdrData[8] = 8
  ihdrData[9] = 2
  ihdrData[10] = 0
  ihdrData[11] = 0
  ihdrData[12] = 0
  const ihdr = createChunk('IHDR', ihdrData)

  const rawData = Buffer.alloc(height * (1 + width * 3))
  for (let y = 0; y < height; y++) {
    const offset = y * (1 + width * 3)
    rawData[offset] = 0
    for (let x = 0; x < width; x++) {
      const px = offset + 1 + x * 3
      const [r, g, b] = pixelFn(x, y, width, height)
      rawData[px] = r
      rawData[px + 1] = g
      rawData[px + 2] = b
    }
  }

  const compressed = zlib.deflateSync(rawData)
  const idat = createChunk('IDAT', compressed)
  const iend = createChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([signature, ihdr, idat, iend])
}

function createChunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)

  const typeBuffer = Buffer.from(type, 'ascii')
  const crcData = Buffer.concat([typeBuffer, data])
  const crc = crc32(crcData)
  const crcBuffer = Buffer.alloc(4)
  crcBuffer.writeUInt32BE(crc, 0)

  return Buffer.concat([length, typeBuffer, data, crcBuffer])
}

const crcTable = new Uint32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
  }
  crcTable[n] = c
}

function crc32(buf) {
  let c = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8)
  }
  return (c ^ 0xFFFFFFFF) >>> 0
}

// ------- icon drawing -------
const BG = [79, 70, 229]   // indigo-600
const FG = [255, 255, 255] // white

// Check if a point is inside a polygon (ray casting)
function pointInPolygon(px, py, polygon) {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1]
    const xj = polygon[j][0], yj = polygon[j][1]
    if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

function drawIcon(x, y, w, h) {
  const margin = w * 0.18
  const left = margin
  const right = w - margin
  const top = margin
  const bottom = h - margin
  const midY = top + (bottom - top) * 0.42

  // Roof triangle (peak at top center, base at midY)
  const roof = [
    [left, midY],
    [w / 2, top],
    [right, midY],
  ]

  // Body rectangle from midY to bottom
  if (pointInPolygon(x, y, roof)) return FG

  if (x >= left && x <= right && y >= midY && y <= bottom) {
    // Door cutout
    const doorW = (right - left) * 0.2
    const doorH = (bottom - midY) * 0.42
    const doorLeft = w / 2 - doorW / 2
    const doorTop = bottom - doorH
    if (x >= doorLeft && x <= doorLeft + doorW && y >= doorTop && y <= bottom) return BG
    return FG
  }

  return BG
}

const publicDir = path.join(__dirname, '..', 'public')

fs.writeFileSync(path.join(publicDir, 'icon-192.png'), createPNG(192, 192, drawIcon))
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), createPNG(512, 512, drawIcon))
console.log('Icons generated: icon-192.png, icon-512.png')
