// Daily aggregate of guest chats started on /ask. Stores only the PT date and a count (public.guest_ask_daily):
// no IP, cookie, session id, question text or user agent, and nothing links to any other table.
export function ptDay(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}
/** A session start is the first question: the history the server received holds exactly one message. */
export function isAskSessionStart(surface: string | undefined, messageCount: number): boolean {
  return surface === 'ask' && messageCount === 1
}
