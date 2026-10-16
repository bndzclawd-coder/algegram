// Remove metadata (EXIF/GPS, comments, text chunks) from JPEG/PNG bytes, in memory.
// The client already re-encodes through a canvas (which drops EXIF); this is the server-side guarantee.
export type ImgType = 'jpeg' | 'png'

export function sniff(b: Buffer): ImgType | null {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpeg'
  if (b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png'
  return null
}

function stripJpeg(b: Buffer): Buffer {
  const out: Buffer[] = [b.subarray(0, 2)]
  let i = 2
  while (i + 4 <= b.length) {
    if (b[i] !== 0xff) throw new Error('bad jpeg')
    const marker = b[i + 1]
    if (marker === 0xda) { out.push(b.subarray(i)); return Buffer.concat(out) } // start of scan: rest is image data
    const len = b.readUInt16BE(i + 2)
    const seg = b.subarray(i, i + 2 + len)
    const isApp = marker >= 0xe1 && marker <= 0xef // APP1..APP15 (EXIF, XMP, ICC, ...); keep APP0 (JFIF)
    if (!isApp && marker !== 0xfe) out.push(seg) // drop APPn and COM
    i += 2 + len
  }
  throw new Error('bad jpeg')
}

const PNG_KEEP = new Set(['IHDR', 'PLTE', 'IDAT', 'IEND', 'tRNS', 'gAMA', 'sRGB', 'cHRM'])
function stripPng(b: Buffer): Buffer {
  const out: Buffer[] = [b.subarray(0, 8)]
  let i = 8
  while (i + 12 <= b.length) {
    const len = b.readUInt32BE(i)
    const type = b.toString('ascii', i + 4, i + 8)
    const end = i + 12 + len
    if (PNG_KEEP.has(type)) out.push(b.subarray(i, end))
    i = end
    if (type === 'IEND') break
  }
  return Buffer.concat(out)
}

export function stripMetadata(b: Buffer, t: ImgType): Buffer {
  return t === 'jpeg' ? stripJpeg(b) : stripPng(b)
}
