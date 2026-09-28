const RESEND_API_KEY = process.env.RESEND_API_KEY!
const FROM = 'Algegram <noreply@algegram.xyz>'

export function welcomeEmailHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Algegram</title>
  <style>
    body { margin:0; padding:0; background:#0d0d1a; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; }
    .wrapper { max-width:600px; margin:0 auto; padding:40px 20px; }
    .card { background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%); border:1px solid rgba(108,99,255,.3); border-radius:20px; overflow:hidden; }
    .header { background:linear-gradient(135deg,#6c63ff 0%,#8b5cf6 50%,#a78bfa 100%); padding:40px 40px 30px; text-align:center; }
    .logo { font-size:28px; font-weight:800; color:#fff; letter-spacing:-.5px; margin-bottom:8px; }
    .header-tagline { color:rgba(255,255,255,.85); font-size:15px; }
    .body { padding:40px; }
    .greeting { font-size:22px; font-weight:700; color:#fff; margin-bottom:16px; }
    .text { color:#a0a0b8; font-size:15px; line-height:1.7; margin-bottom:24px; }
    .feature { background:rgba(108,99,255,.08); border:1px solid rgba(108,99,255,.2); border-radius:12px; padding:18px 20px; margin-bottom:12px; }
    .feature-icon { font-size:22px; margin-bottom:6px; }
    .feature-title { color:#fff; font-weight:600; font-size:14px; margin-bottom:4px; }
    .feature-desc { color:#7878a0; font-size:13px; line-height:1.5; }
    .cta-btn { display:block; background:linear-gradient(135deg,#6c63ff,#8b5cf6); color:#fff !important; text-decoration:none; padding:16px 32px; border-radius:12px; font-weight:700; font-size:16px; text-align:center; margin-bottom:28px; }
    .plan-box { background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.08); border-radius:12px; padding:20px; margin-bottom:28px; }
    .plan-label { color:#7878a0; font-size:13px; }
    .plan-value { color:#fff; font-size:13px; font-weight:600; float:right; }
    .plan-row { overflow:hidden; margin-bottom:10px; }
    .plan-title { color:#a78bfa; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:1px; margin-bottom:14px; }
    .upgrade-link { color:#a78bfa !important; text-decoration:none; font-size:13px; float:right; }
    .footer { padding:24px 40px; border-top:1px solid rgba(255,255,255,.06); text-align:center; }
    .footer-text { color:#4a4a6a; font-size:12px; line-height:1.6; }
    .footer-link { color:#6c63ff; text-decoration:none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <div class="logo">&#8721; Algegram</div>
        <div class="header-tagline">Your AI math tutor, available 24/7</div>
      </div>
      <div class="body">
        <div class="greeting">Welcome aboard! &#127881;</div>
        <p class="text">
          You're all set. Algegram gives you instant, step-by-step explanations
          for any math problem &mdash; from algebra and calculus to statistics and beyond.
        </p>
        <div class="feature">
          <div class="feature-icon">&#129518;</div>
          <div class="feature-title">Solve any math problem</div>
          <div class="feature-desc">Type or paste a problem and get a detailed, step-by-step solution instantly.</div>
        </div>
        <div class="feature">
          <div class="feature-icon">&#129504;</div>
          <div class="feature-title">Understand, not just copy</div>
          <div class="feature-desc">Every step is explained in plain English so you actually learn the method.</div>
        </div>
        <div class="feature" style="margin-bottom:28px;">
          <div class="feature-icon">&#128208;</div>
          <div class="feature-title">All math levels</div>
          <div class="feature-desc">Middle school, high school, college &mdash; algebra, calculus, linear algebra, and more.</div>
        </div>
        <a href="https://algegram.xyz/chat" class="cta-btn">Start solving now &rarr;</a>
        <div class="plan-box">
          <div class="plan-title">Your current plan</div>
          <div class="plan-row"><span class="plan-label">Plan</span><span class="plan-value">Free</span></div>
          <div class="plan-row"><span class="plan-label">Daily messages</span><span class="plan-value">20 / day</span></div>
          <div class="plan-row"><span class="plan-label">Want unlimited?</span><a href="https://algegram.xyz/pricing" class="upgrade-link">Upgrade to Pro &rarr;</a></div>
        </div>
        <p class="text" style="margin-bottom:0;">Questions? Just reply to this email &mdash; we're happy to help.</p>
      </div>
      <div class="footer">
        <p class="footer-text">
          You're receiving this because you created an account at
          <a href="https://algegram.xyz" class="footer-link">algegram.xyz</a>.<br />
          &copy; 2025 Algegram. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`
}

export async function sendWelcomeEmail(email: string): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to: email,
      subject: 'Welcome to Algegram 🧮',
      html: welcomeEmailHtml(),
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Resend error ${res.status}: ${err}`)
  }
}
