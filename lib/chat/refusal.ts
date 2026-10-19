import { OFF_TOPIC_REPLY } from './off-topic'

/**
 * Reads the start of the tutor's own SSE reply (server side only) and decides whether it is the standard
 * math-only refusal. Buffers only while the text so far is still a prefix of OFF_TOPIC_REPLY (about 100
 * characters), then replays everything and passes the rest straight through, so normal answers stream with
 * no real delay. Nothing the client sends takes part in this decision.
 */
export async function peekRefusal(body: ReadableStream<Uint8Array>): Promise<{ refusal: boolean; body: ReadableStream<Uint8Array> }> {
  const reader = body.getReader()
  const dec = new TextDecoder()
  const held: Uint8Array[] = []
  let buf = '', text = '', refusal = false, ended = false
  const norm = (s: string) => s.replace(/\s+/g, ' ').trimStart()
  loop: for (;;) {
    const { done, value } = await reader.read()
    if (done) { ended = true; break }
    held.push(value)
    buf += dec.decode(value, { stream: true })
    const lines = buf.split('\n'); buf = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.startsWith('data: ') || line.includes('[DONE]')) continue
      try { const d = JSON.parse(line.slice(6))?.choices?.[0]?.delta?.content; if (typeof d === 'string') text += d } catch {}
    }
    const t = norm(text)
    if (t.startsWith(OFF_TOPIC_REPLY)) { refusal = true; break loop }
    if (t.length > 0 && !OFF_TOPIC_REPLY.startsWith(t)) break loop
  }
  const out = new ReadableStream<Uint8Array>({
    start(ctl) { for (const c of held) ctl.enqueue(c); if (ended) ctl.close() },
    async pull(ctl) {
      if (ended) return
      const { done, value } = await reader.read()
      if (done) ctl.close(); else ctl.enqueue(value)
    },
    cancel(r) { return reader.cancel(r) },
  })
  return { refusal, body: out }
}
