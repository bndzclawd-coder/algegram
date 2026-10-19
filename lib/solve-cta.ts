// Copy for the /solve -> guest chat button. Kids land on /solve pages from short videos, so this path stays
// plain: no trial, Pro, upgrade or price wording, and no personal-info fields before the normal signup flow.
export const TRY_OWN_LABEL = 'Try your own problem free'
export const TRY_OWN_LINE = 'Type any math problem and Layla shows every step.'
// No query string: the /solve page's question is never handed to the chat, and the first-touch ag_attr
// cookie (set by middleware on the first visit) is left alone.
export const TRY_OWN_HREF = '/ask'
