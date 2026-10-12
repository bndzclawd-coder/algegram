// Turns an existing step-by-step chat answer into whiteboard steps. Pure function, no AI call.
export type WbStep = { caption: string; math: string[] }

const MAX_STEPS = 8
const DISPLAY = /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]/g

function starts(text: string, re: RegExp): number[] {
  const out: number[] = []
  let m: RegExpExecArray | null
  re.lastIndex = 0
  while ((m = re.exec(text)) !== null) { out.push(m.index); if (m[0] === '') re.lastIndex++ }
  return out
}

function clean(s: string) {
  return s.replace(/\*\*|__|^#+\s*/gm, '').replace(/^\s*[-*•]\s+/gm, '').replace(/[ \t]+/g, ' ').trim()
}

function toStep(block: string): WbStep | null {
  const math: string[] = []
  const caption = clean(block.replace(DISPLAY, (_m, a, b) => { math.push(String(a ?? b).trim()); return ' ' }))
    .replace(/\n{2,}/g, '\n').replace(/\s*:\s*$/, '').trim()
  if (!caption && math.length === 0) return null
  return { caption: caption.slice(0, 400), math: math.slice(0, 4) }
}

export function parseSteps(answer: string): WbStep[] {
  const text = String(answer ?? '').replace(/\r/g, '').trim()
  if (!text) return []
  // 1) explicit "Step 1", "**Step 2:**", "### Step 3" markers
  const stepRe = /^(?:#{1,4}\s*)?(?:\*\*)?\s*step\s*\d+\b/gim
  let parts: string[] = []
  const idx = starts(text, stepRe)
  if (idx.length >= 2) {
    parts = idx.map((s, i) => text.slice(s, idx[i + 1] ?? text.length))
  } else {
    // 2) numbered list "1." / "1)"
    const numIdx = starts(text, /^\s*\d+[.)]\s+/gm)
    if (numIdx.length >= 2) parts = numIdx.map((s, i) => text.slice(s, numIdx[i + 1] ?? text.length))
    else parts = text.split(/\n\s*\n/) // 3) paragraphs
  }
  // A trailing "final answer" after the last step becomes its own step.
  const steps = parts.map(p => p.replace(/^\s*\d+[.)]\s+/, '')).map(toStep).filter((s): s is WbStep => !!s)
  // Fold short text-only steps (e.g. "Set each factor to zero.") into the following step's caption.
  const merged: WbStep[] = []
  for (let k = 0; k < steps.length; k++) {
    const s = steps[k]
    if (s.math.length === 0 && s.caption.length < 60 && k < steps.length - 1) {
      steps[k + 1] = { ...steps[k + 1], caption: (s.caption + ' ' + steps[k + 1].caption).trim() }
      continue
    }
    merged.push(s)
  }
  return merged.slice(0, MAX_STEPS)
}

/** LaTeX -> words for speech (captions keep the KaTeX). Rough but readable. */
export function speakable(s: string): string {
  return s
    .replace(/\$\$?([^$]+)\$\$?/g, ' $1 ')
    .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, ' $1 over $2 ')
    .replace(/\\sqrt\{([^{}]*)\}/g, ' the square root of $1 ')
    .replace(/\^2\b|\^\{2\}/g, ' squared ').replace(/\^3\b|\^\{3\}/g, ' cubed ')
    .replace(/\^\{?([^}\s]+)\}?/g, ' to the power $1 ')
    .replace(/\\(cdot|times)/g, ' times ').replace(/\\div/g, ' divided by ').replace(/\\pm/g, ' plus or minus ')
    .replace(/\\int/g, ' the integral of ').replace(/\\pi/g, ' pi ').replace(/\\(le|leq)/g, ' less than or equal to ').replace(/\\(ge|geq)/g, ' greater than or equal to ')
    .replace(/\\(text|mathrm|boxed)\{([^{}]*)\}/g, ' $2 ').replace(/\\[a-zA-Z]+/g, ' ')
    .replace(/=/g, ' equals ').replace(/(\d)\s*-\s*(\d)/g, '$1 minus $2').replace(/\s-\s/g, ' minus ').replace(/\+/g, ' plus ')
    .replace(/[{}\\*_#]/g, ' ').replace(/\s+/g, ' ').trim()
}

/** True when the answer has any math to put on the board (skips greetings and errors). */
export function hasLessonContent(answer: string): boolean {
  return /\$[^$]+\$|\\\[|\\\(/.test(answer) && parseSteps(answer).length > 0
}
