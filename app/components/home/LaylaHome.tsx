import Link from 'next/link'
import { WHAT_IS_ALGEGRAM_INTRO, WHAT_IS_ALGEGRAM_OUTRO } from '@/lib/about'
import AboutProLine from '@/app/components/AboutProLine'
import { LEARN_PAGES, LEARN_SLUGS } from '@/lib/learn/data'
import OfferText from '@/app/components/OfferText'
import CenterFullNotice from '@/app/components/CenterFullNotice'
import HeaderAuth from './HeaderAuth'
import HomepageChat from '@/app/components/HomepageChat'
import { GUEST_FREE_QUESTIONS, FREE_DAILY_QUESTIONS, PRO_CTA_TEXT } from '@/lib/site-config'
import { PLANS } from '@/lib/plans'
import HomeFx from './HomeFx'
import { WorkedExample, type Example } from '@/components/WorkedExample'
import './home.css'


const EXAMPLES = ['2x + 5 = 17', '3/4 + 1/6', 'x² − 5x + 6 = 0', 'derivative of x³', '∫ x² dx']
const CLIPS = [
  ['layla-15s-1', 'clip-1', '2x + 5 = 17'],
  ['layla-15s-2', 'clip-2', '3x − 4 = 11'],
  ['layla-15s-3', 'clip-3', 'The ×11 trick (when the two digits add up to 9 or less)'],
  ['layla-15s-4', 'clip-4', 'Can you beat me? x/4 + 3 = 7'],
] as const

export default function LaylaHome({ example, topics }: { example: Example; topics: { href: string; title: string }[] }) {
  return (
    <div className='pv'>
      <HomeFx />
      <div className='w'>
        <nav aria-label='Main'>
          <Link className='logo' href='/'>alge<b>gram</b></Link>
          <HeaderAuth className='signin' />
        </nav>

        <main>
          <CenterFullNotice />
          <header className='hero solo'>
            <h1 className='h1s'>Solve any math problem, step by step</h1>
            <div className='askwrap'>
              <div className='askin'>
                <div className='ask-live'>
                  <HomepageChat intro="Hi, I'm Layla, an AI tutor." placeholders={EXAMPLES} />
                </div>
              </div>
            </div>
            <p className='quizlink'><Link href='/quiz/fractions'>Take a free quiz →</Link></p>
            <p className='ai-line' role='note'>Layla is an AI tutor, not a real person. Snap just the problem, not your name.</p>
          </header>

          <section id='watch' aria-labelledby='watch-h'>
            <h2 id='watch-h' data-reveal>Watch Layla solve one</h2>
            <div className='phone-wrap' data-reveal>
              <div className='phone'>
                <video src='/preview/layla-2x5-voice.mp4' poster='/preview/hero-poster.jpg' controls playsInline preload='none' aria-label='Layla, an AI tutor, solves 2x + 5 = 17' />
                <span className='vbadge'>AI tutor · voiced by AI</span>
              </div>
            </div>
          </section>

          <section id='why' aria-labelledby='why-h'>
            <h2 id='why-h' data-reveal>Help first, then practice.</h2>
            <p className='lead' data-reveal>Full worked steps right away, short and clear. Then try the next one yourself.</p>
            <div className='bento'>
              <article className='card c1' data-reveal>
                <div className='ic' aria-hidden>🧠</div>
                <h3>Steps first, no quizzing</h3>
                <p>Layla shows every step of the solution straight away, then invites you to try the next step yourself.</p>
                <div className='steps3'><span>1 · Solve</span><span>2 · Explain</span><span>3 · Your turn</span></div>
              </article>
              <article className='card c2' data-reveal>
                <div className='ic' aria-hidden>✍️</div>
                <h3>Step-by-step</h3>
                <p>Every line of working, written out in clean math notation.</p>
              </article>
              <article className='card c3' data-reveal>
                <div className='ic' aria-hidden>∑</div>
                <h3>Every topic</h3>
                <p>One tutor from first fractions to university calculus.</p>
                <div className='topics'>{topics.map(t => <Link key={t.href} href={t.href}>{t.title}</Link>)}</div>
              </article>
              <article className='card c4' data-reveal>
                <div className='ic' aria-hidden>🛡️</div>
                <h3>Parent-safe</h3>
                <p>Clearly labeled as AI. No ads. Kids under 13 need a parent’s OK to sign up, and you can delete your account and data anytime.</p>
              </article>
            </div>
          </section>

          <section aria-label='Worked example' data-reveal>
            <WorkedExample ex={example} headingLevel={2} />
          </section>

          <section id='clips' aria-labelledby='clips-h'>
            <h2 id='clips-h' data-reveal>15 seconds with Layla</h2>
            <p className='lead' data-reveal>Short whiteboard lessons. Swipe through.</p>
            <div className='car' role='region' aria-label='Lesson clips' tabIndex={0}>
              {CLIPS.map(([v, p, label]) => (
                <figure className='clip' key={v} style={{ margin: 0 }}>
                  <video src={`/preview/${v}.mp4`} poster={`/preview/${p}.jpg`} controls playsInline preload='none' aria-label={label} />
                  <span className='vbadge'>AI tutor · voiced by AI</span>
                  <figcaption><p>{label}</p></figcaption>
                </figure>
              ))}
            </div>
          </section>

          <section id='pricing' aria-labelledby='pricing-h'>
            <h2 id='pricing-h' data-reveal>Simple pricing</h2>
            <p className='lead' data-reveal><OfferText normal='Sign up free, get 7 days of Pro. No card needed.' center='Sign up free with your center for 14 days of Pro.' /></p>
            <div className='prices'>
              <div className='price' data-reveal>
                <h3>{PLANS.free.name}</h3>
                <div className='amt'>$0</div>
                <ul>
                  <li>{GUEST_FREE_QUESTIONS} free questions, no sign-up</li>
                  <li>{FREE_DAILY_QUESTIONS} questions a day with a free account</li>
                  <li>Algebra &amp; calculus help</li>
                  <li>Step-by-step answers</li>
                </ul>
                <a className='btn ghost' href='/auth/signup'><OfferText normal='Sign up free, get 7 days of Pro' center='Sign up free' /></a>
              </div>
              <div className='price pro' data-reveal>
                <h3>{PLANS.pro.name}</h3>
                <div className='amt'>${(PLANS.pro.price / 100).toFixed(2)}<small>/mo</small></div>
                <ul>
                  {PLANS.pro.features.map(f => <li key={f}>{f}</li>)}
                </ul>
                <a className='btn' href='/upgrade' rel='nofollow'>{PRO_CTA_TEXT}</a>
                <p className='foot'>Fair-use limits apply.</p>
              </div>
            </div>
          </section>

          <section id='about' aria-labelledby='about-h'>
            <h2 id='about-h'>What is Algegram?</h2>
            <p className='lead' data-testid='what-is-algegram' style={{ maxWidth: 760 }}>{WHAT_IS_ALGEGRAM_INTRO}<AboutProLine />{WHAT_IS_ALGEGRAM_OUTRO}</p>
            <h3 style={{ marginTop: '1.5rem' }}>Free math practice</h3>
            <div className='topics'>{LEARN_SLUGS.map(s => <Link key={s} href={`/learn/${s}`}>{LEARN_PAGES[s].title}</Link>)}</div>
          </section>
        </main>
      </div>

      <footer>
        <div className='w'>
          <div><a href='/learn'>Free practice</a><a href='/pricing'>Pricing</a><a href='/help'>Help</a><a href='/how-algegram-works-for-kids'>For kids under 13</a><a href='/terms'>Terms</a><a href='/privacy'>Privacy</a><a href='/contact'>Contact</a></div>
          <span>© 2026 Algegram</span>
        </div>
      </footer>
    </div>
  )
}
