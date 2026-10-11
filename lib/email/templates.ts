// Content adapted from /workspace/algegram-cs/lifecycle-emails.md (Customer Success draft).
// Trial length removed on purpose: offer text comes only from PRO_OFFER_TEXT.
import { SITE_URL, PRO_PRICE_TEXT, PRO_OFFER_TEXT, PRO_CTA_TEXT, FREE_DAILY_QUESTIONS } from "@/lib/site-config";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
const hi = (n?: string | null) => `Hi ${n ? esc(n) : "there"},`;
const p = (s: string) => `<p style="margin:0 0 16px;line-height:1.6">${s}</p>`;
const a = (href: string, label: string) => `<a href="${href}" style="color:#6c63ff;font-weight:600">${esc(label)}</a>`;
const wrap = (inner: string) => `<div style="font-family:system-ui,sans-serif;max-width:560px;color:#111">${inner}</div>`;

export function welcomeEmail(o: { firstName?: string | null; accountOnly: boolean }) {
  const tryUrl = `${SITE_URL}/chat?q=${encodeURIComponent("2x+5=17")}`;
  const subject = o.accountOnly ? "Your child's Algegram account is ready" : "You're in. Here's your first problem to try";
  const intro = o.accountOnly
    ? "Thanks for giving consent. Your child's Algegram account is now active. They can type any math problem, from fractions to algebra, and get the answer explained step by step."
    : "Welcome to Algegram! Type any math problem, from fractions to calculus, and you'll get the answer explained step by step.";
  const plan = `The Free plan includes ${FREE_DAILY_QUESTIONS} questions a day. If you get stuck or spot a wrong answer, just reply to this email and a real person will look at it.`;
  const footer = `Help: support@algegram.xyz · Privacy: ${SITE_URL}/privacy · Delete account: ${SITE_URL}/settings`;
  const text = [hi(o.firstName), "", intro, "", "Try this one to see how it works: solve 2x + 5 = 17", tryUrl, "", plan, "", "Happy solving,", "The Algegram team", footer].join("\n");
  const html = wrap(
    p(esc(hi(o.firstName))) + p(esc(intro)) +
    p(`Try this one to see how it works: solve 2x + 5 = 17<br/>${a(tryUrl, "Try it now")}`) +
    p(esc(plan)) + p("Happy solving,<br/>The Algegram team") +
    `<p style="font-size:12px;color:#666">Help: support@algegram.xyz · ${a(`${SITE_URL}/privacy`, "Privacy")} · ${a(`${SITE_URL}/settings`, "Delete my account")}</p>`
  );
  return { subject, text, html };
}

export function dailyLimitEmail(o: { firstName?: string | null; resetTimeText: string; unsubscribeUrl: string }) {
  const proUrl = `${SITE_URL}/pricing?ref=limit_email`;
  const subject = `You hit today's ${FREE_DAILY_QUESTIONS} free questions`;
  const l1 = `You used all ${FREE_DAILY_QUESTIONS} of today's free questions, so you're clearly putting in the work. Your questions reset ${o.resetTimeText}.`;
  const offer = PRO_OFFER_TEXT ? ` ${PRO_OFFER_TEXT}.` : "";
  const l2 = `Don't want to wait? Pro gives you unlimited questions, stronger AI models, and saved history for ${PRO_PRICE_TEXT}.${offer} Cancel anytime.`;
  const text = [hi(o.firstName), "", l1, "", l2, "", `${PRO_CTA_TEXT}: ${proUrl}`, "", "The Algegram team", `Help: support@algegram.xyz · Unsubscribe from tips: ${o.unsubscribeUrl}`].join("\n");
  const html = wrap(
    p(esc(hi(o.firstName))) + p(esc(l1)) + p(esc(l2)) + p(a(proUrl, PRO_CTA_TEXT)) + p("The Algegram team") +
    `<p style="font-size:12px;color:#666">Help: support@algegram.xyz · ${a(o.unsubscribeUrl, "Unsubscribe from tips")}</p>`
  );
  return { subject, text, html };
}
