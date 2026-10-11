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
  landing_path?: string;
  first_seen?: string; // YYYY-MM-DD only
};

const KEYS = ["ref", "utm_source", "utm_medium", "utm_campaign"] as const;

// Only allow short, label-like values so nobody can smuggle an email/name into the cookie.
export function cleanValue(v: string | null): string | undefined {
  if (!v) return undefined;
  const s = v.trim().toLowerCase().slice(0, 64);
  if (!/^[a-z0-9._-]+$/.test(s)) return undefined;
  if (s.includes("@")) return undefined;
  return s;
}

export function attributionFromSearchParams(params: URLSearchParams, pathname: string): Attribution | null {
  const out: Attribution = {};
  for (const k of KEYS) {
    const v = cleanValue(params.get(k));
    if (v) out[k] = v;
  }
  if (!Object.keys(out).length) return null;
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
    if (typeof parsed.landing_path === "string" && parsed.landing_path.startsWith("/"))
      out.landing_path = parsed.landing_path.slice(0, 128);
    if (typeof parsed.first_seen === "string" && /^\d{4}-\d{2}-\d{2}$/.test(parsed.first_seen))
      out.first_seen = parsed.first_seen;
    return Object.keys(out).length ? out : null;
  } catch {
    return null;
  }
}
