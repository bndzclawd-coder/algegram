// First-party attribution cookie. Stores ONLY campaign labels we put in our own links
// PRIVACY RULE: attribution is for internal signup/upgrade source reporting only. Never send it to ad platforms (Meta pixel, Google Ads, TikTok, etc.) and never use it for retargeting. (COPPA)
// (ref + utm_*), the landing path, and a date. No IPs, no user agent, no personal data.
export const ATTR_COOKIE = "ag_attr";
export const ATTR_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type Attribution = {
  ref?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  referrer_domain?: string; // bare hostname only (no path/query), recorded when there's no UTM
  landing_path?: string;
  first_seen?: string; // YYYY-MM-DD only
};

const KEYS = ["ref", "utm_source", "utm_medium", "utm_campaign", "utm_content"] as const;

// Only allow short, label-like values so nobody can smuggle an email/name into the cookie.
export function cleanValue(v: string | null): string | undefined {
  if (!v) return undefined;
  const s = v.trim().toLowerCase().slice(0, 64);
  if (!/^[a-z0-9._-]+$/.test(s)) return undefined;
  if (s.includes("@")) return undefined;
  return s;
}

const SEARCH_ENGINES = /(^|\.)(google\.[a-z.]+|bing\.com|duckduckgo\.com|yahoo\.[a-z.]+|ecosia\.org|search\.brave\.com|yandex\.[a-z.]+|baidu\.com|startpage\.com)$/;
const OWN_HOST = /(^|\.)algegram\.xyz$/;

/** Hostname of an external referrer, or undefined (own site, invalid, or not http). */
export function referrerDomain(referer: string | null | undefined): string | undefined {
  if (!referer) return undefined;
  try {
    const u = new URL(referer);
    if (u.protocol !== "https:" && u.protocol !== "http:") return undefined;
    const h = u.hostname.toLowerCase().replace(/^www\./, "");
    if (!h || OWN_HOST.test(h) || h === "localhost" || h.endsWith(".vercel.app")) return undefined;
    return cleanValue(h);
  } catch {
    return undefined;
  }
}

// Short `?src=` aliases for links where full UTM tags are awkward (e.g. a paid social post).
// Maps to the same first-party labels as UTM tags; unknown src values are ignored.
export const SRC_ALIASES: Record<string, Pick<Attribution, "utm_source" | "utm_medium" | "utm_campaign">> = {
  "ig-boost": { utm_source: "social", utm_medium: "paid", utm_campaign: "boost_timer" },
};

export function attributionFromSearchParams(params: URLSearchParams, pathname: string, referer?: string | null): Attribution | null {
  const out: Attribution = {};
  for (const k of KEYS) {
    const v = cleanValue(params.get(k));
    if (v) out[k] = v;
  }
  const src = cleanValue(params.get("src"));
  if (src && SRC_ALIASES[src] && !out.utm_source) Object.assign(out, SRC_ALIASES[src], out);
  if (!Object.keys(out).length) {
    // No campaign tags: record organic search / referral by the referrer's domain only.
    const d = referrerDomain(referer);
    if (!d) return null;
    const isSearch = SEARCH_ENGINES.test(d);
    out.utm_source = isSearch ? "seo" : "referrer"; // "referral" is reserved for our own referral links (utm_source=referral)
    out.utm_medium = isSearch ? "organic" : "website";
    out.referrer_domain = d;
  }
  out.landing_path = pathname.slice(0, 128);
  out.first_seen = new Date().toISOString().slice(0, 10);
  return out;
}

// Next's cookie API URL-encodes the value itself, so store plain JSON here.
export function encodeAttribution(a: Attribution): string {
  return JSON.stringify(a);
}

export function decodeAttribution(raw: string | undefined): Attribution | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw.startsWith("%") ? decodeURIComponent(raw) : raw);
    const out: Attribution = {};
    for (const k of KEYS) {
      const v = cleanValue(typeof parsed[k] === "string" ? parsed[k] : null);
      if (v) out[k] = v;
    }
    const rd = cleanValue(typeof parsed.referrer_domain === "string" ? parsed.referrer_domain : null);
    if (rd) out.referrer_domain = rd;
    if (typeof parsed.landing_path === "string" && parsed.landing_path.startsWith("/"))
      out.landing_path = parsed.landing_path.slice(0, 128);
    if (typeof parsed.first_seen === "string" && /^\d{4}-\d{2}-\d{2}$/.test(parsed.first_seen))
      out.first_seen = parsed.first_seen;
    return Object.keys(out).length ? out : null;
  } catch {
    return null;
  }
}
