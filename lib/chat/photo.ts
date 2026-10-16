'use client'
// Re-encode in the browser (drops EXIF/GPS) and shrink to max 1600px before upload. Never stored.
export async function preparePhoto(file: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file)
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height))
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale)
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
    return await new Promise<Blob>((ok, no) => c.toBlob(b => (b ? ok(b) : no()), 'image/jpeg', 0.85))
  } catch { return file }
}

/** Posts a photo to /api/photo and streams the answer text. Returns an error object instead of throwing. */
export async function solvePhoto(file: File, onText: (t: string) => void): Promise<{ ok: true } | { ok: false; error: string; guest?: boolean; child?: boolean; upgrade?: boolean }> {
  const fd = new FormData(); fd.append('image', await preparePhoto(file), 'photo.jpg')
  try {
    const res = await fetch('/api/photo', { method: 'POST', body: fd })
    if (!res.ok || !res.body) { const e = await res.json().catch(() => ({})); return { ok: false, error: e.error || 'Something went wrong.', guest: e.guest, child: e.child, upgrade: e.upgrade } }
    const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = '', out = ''
    for (;;) {
      const { done, value } = await reader.read(); if (done) break
      buf += dec.decode(value, { stream: true }); const lines = buf.split('\n'); buf = lines.pop() || ''
      for (const l of lines) {
        if (!l.startsWith('data: ') || l.includes('[DONE]')) continue
        try { const d = JSON.parse(l.slice(6)).choices?.[0]?.delta?.content; if (d) { out += d; onText(out) } } catch {}
      }
    }
    return { ok: true }
  } catch { return { ok: false, error: 'Something went wrong. Please try again.' } }
}
