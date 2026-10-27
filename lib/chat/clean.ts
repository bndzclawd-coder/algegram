// Small, safe text fixes on outgoing tutor replies. Whole words only, so math is never touched.
const FIXES: [RegExp, string][] = [
  [/\banswert\b/gi, 'answer'],
]

function keepCase(found: string, fix: string): string {
  if (found === found.toUpperCase()) return fix.toUpperCase()
  if (found[0] === found[0].toUpperCase()) return fix[0].toUpperCase() + fix.slice(1)
  return fix
}

export function cleanReplyText(text: string): string {
  let out = text
  for (const [re, fix] of FIXES) out = out.replace(re, m => keepCase(m, fix))
  return out
}

/**
 * Applies cleanReplyText to the streamed SSE reply (OpenRouter chat-completions format). A word can be
 * split across chunks ("answ" + "ert"), so trailing letters of each chunk are held back and sent with the
 * next one; anything still held is flushed before [DONE] or at the end of the stream.
 */
export type StreamUsage = { prompt_tokens?: number; completion_tokens?: number; reasoning_tokens?: number; cost?: number }
/** onUsage gets the provider's token counts (numbers only) from the final chunk; usage is not forwarded to the browser. */
export function cleanReplyStream(body: ReadableStream<Uint8Array>, onUsage?: (u: StreamUsage) => void): ReadableStream<Uint8Array> {
  const dec = new TextDecoder()
  const enc = new TextEncoder()
  let buf = ''
  let held = ''
  const event = (content: string) => `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content } }] })}\n\n`
  const flushHeld = (ctl: TransformStreamDefaultController<Uint8Array>) => {
    if (held) { ctl.enqueue(enc.encode(event(cleanReplyText(held)))); held = '' }
  }
  const handleLine = (line: string, ctl: TransformStreamDefaultController<Uint8Array>) => {
    if (!line.startsWith('data: ')) { ctl.enqueue(enc.encode(line + '\n')); return }
    const data = line.slice(6)
    if (data.trim() === '[DONE]') { flushHeld(ctl); ctl.enqueue(enc.encode(line + '\n')); return }
    let json: any
    try { json = JSON.parse(data) } catch { ctl.enqueue(enc.encode(line + '\n')); return }
    if (json && typeof json === 'object' && json.usage) {
      const u = json.usage
      try { onUsage?.({ prompt_tokens: u.prompt_tokens, completion_tokens: u.completion_tokens, reasoning_tokens: u.completion_tokens_details?.reasoning_tokens, cost: u.cost }) } catch {}
      delete json.usage
    }
    const delta = json?.choices?.[0]?.delta
    if (delta && typeof delta.content === 'string') {
      const text = held + delta.content
      const m = /[A-Za-z]+$/.exec(text)
      held = m ? m[0] : ''
      delta.content = cleanReplyText(m ? text.slice(0, m.index) : text)
    }
    if (json?.choices?.[0]?.finish_reason && held) {
      delta && typeof delta.content === 'string' ? (delta.content += cleanReplyText(held)) : flushHeld(ctl)
      held = ''
    }
    ctl.enqueue(enc.encode('data: ' + JSON.stringify(json) + '\n'))
  }
  return body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, ctl) {
      buf += dec.decode(chunk, { stream: true })
      const lines = buf.split('\n')
      buf = lines.pop() ?? ''
      for (const line of lines) handleLine(line, ctl)
    },
    flush(ctl) {
      buf += dec.decode()
      if (buf) handleLine(buf, ctl)
      flushHeld(ctl)
    },
  }))
}
