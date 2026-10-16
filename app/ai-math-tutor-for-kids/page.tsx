// SHIP ONLY AFTER fixes #5 (under-13 parental consent), #6 (/privacy, /terms) and #7 (no public guest
// questions) are live: this page describes those behaviours.
import { pageMetadata } from "@/lib/seo";
import { SiteShell } from "@/components/SiteChrome";
import Link from "next/link";
import { WorkedExample, type Example } from "@/components/WorkedExample";
import { TopicCta } from "@/components/TopicCta";
import { Page, H1, H2, P, Lead, Ul } from "@/components/Prose";
import { GUEST_FREE_QUESTIONS, FREE_DAILY_QUESTIONS, PRO_PRICE_TEXT, PRO_OFFER_TEXT } from "@/lib/site-config";
import { MAILBOX_LIVE } from '@/lib/site-config'

export const metadata = pageMetadata({
  title: "AI Math Tutor for Kids – Step-by-Step Help for Parents & Students | Algegram",
  description: `An AI math tutor that explains each step, from fractions to algebra. Try ${GUEST_FREE_QUESTIONS} free questions with no sign-up. Parents of under-13s approve accounts first.`,
  path: "/ai-math-tutor-for-kids",
  // Held back: describes consent/privacy features not yet confirmed live. Not in sitemap or nav.
  noindex: true,
});

const examples: Example[] = [
  {
    id: "word-problem", title: "Example 1: A word problem", problem: "Maya buys 3 packs of pencils with 4 pencils in each pack. She already has 2 pencils. How many does she have now?",
    steps: [
      { math: "3 × 4 = 12", why: "3 packs with 4 in each: multiply to find how many pencils are in the packs." },
      { math: "12 + 2 = 14", why: "Add the 2 pencils she already had." },
    ],
    answer: "14 pencils",
    check: "Count by fours: 4, 8, 12, then 13, 14 ✓",
  },
  {
    id: "fraction-of", title: "Example 2: A fraction of a number", problem: "What is 3/4 of 20?",
    steps: [
      { math: "20 ÷ 4 = 5", why: "Split 20 into 4 equal parts. Each part is 5. That’s 1/4 of 20." },
      { math: "5 × 3 = 15", why: "We want 3 of those parts." },
    ],
    answer: "15",
    check: "15 ÷ 20 = 0.75 = 3/4 ✓",
  },
  {
    id: "equation", title: "Example 3: A first equation", problem: "Solve 2x + 5 = 17",
    steps: [
      { math: "2x = 17 − 5 = 12", why: "Take 5 away from both sides so the x part is alone." },
      { math: "x = 12 ÷ 2 = 6", why: "2x means 2 times x, so divide both sides by 2." },
    ],
    answer: "x = 6",
    check: "2 × 6 + 5 = 17 ✓",
  },
];

export default function KidsTutorPage() {
  return (
    <SiteShell>
    <Page>
      <H1>An AI math tutor for kids that shows its working</H1>
      <Lead>
        Algegram helps children and teens with math homework by explaining each step, not just giving the answer.
        This page is for parents: what it does, how a session looks, how accounts work for younger children, and
        what it costs.
      </Lead>

      <H2>What your child can ask</H2>
      <P>
        Anything from times tables and fractions to equations, geometry and, for older students, calculus. Your child
        types the problem the way it appears on the worksheet, including word problems, and Algegram replies with a
        numbered list of steps and a short reason for each one. If a step doesn’t make sense, they can ask a follow-up
        question like “why did you divide by 2?”
      </P>

      <H2>What a session looks like</H2>
      <P>Here are three examples of the kind of step-by-step answer your child gets, at different levels:</P>
      {examples.map((ex) => <WorkedExample key={ex.id} ex={ex} />)}

      <H2>Using it to learn, not just to copy</H2>
      <P>
        Any tool that gives answers can be used to skip the thinking. A few habits help it work as a tutor instead:
      </P>
      <Ul>
        <li>Ask your child to try the problem first, then use Algegram to check their working.</li>
        <li>Have them cover the answer and predict the next step before reading it.</li>
        <li>After a solved example, ask them to do a similar problem on their own and check it.</li>
        <li>Encourage “why” questions. Explaining the reason is what a good tutor does.</li>
      </Ul>
      <P>
        AI can make mistakes. Every worked answer should end with a check (putting the answer back into the problem),
        and it’s worth teaching your child to do that check themselves.{MAILBOX_LIVE && (<>{" "}If you spot a wrong answer, tell us at{" "}
        <a href="mailto:support@algegram.xyz" style={{ color: "var(--accent2)" }}>support@algegram.xyz</a>.</>)}
      </P>

      <H2>Which ages it suits</H2>
      <P>
        The explanations work best once a child can read short sentences on their own, so most younger users will be
        in later primary or elementary school. For children who are just starting, sitting with them and reading the
        steps aloud together works well. At the other end, high school and university students use the same tool for
        algebra, trigonometry and calculus, and can ask for more detail or a different method when they need it.
      </P>
      <P>
        You can also ask Algegram to explain more simply. Adding something like “explain it for a 10-year-old” to a
        question changes the wording of the steps, while keeping the math the same.
      </P>

      <H2>Accounts for children under 13</H2>
      <P>
        Anyone can try {GUEST_FREE_QUESTIONS} questions without signing up. To create an account, we ask for age. If
        your child is under 13, we ask for a parent’s email address and send you a consent email first.{" "}
        <strong>Your child’s account only starts after you approve it</strong>, and we don’t save their question
        history before then. From the link in that email you can also review or delete your child’s data later.
        We don’t send promotional emails to children. Questions typed into Algegram are never published on the site.
      </P>
      <P>
        Read the details in our <Link href="/privacy" style={{ color: "var(--accent2)" }}>privacy policy</Link> and{" "}
        <Link href="/terms" style={{ color: "var(--accent2)" }}>terms</Link>.
      </P>

      <H2>What it costs</H2>
      <Ul>
        <li><strong>Guest:</strong> {GUEST_FREE_QUESTIONS} free questions, no sign-up.</li>
        <li><strong>Free account:</strong> {FREE_DAILY_QUESTIONS} questions a day, with step-by-step explanations.</li>
        <li><strong>Pro:</strong> {PRO_PRICE_TEXT} for more questions every day and saved history. Cancel anytime.{PRO_OFFER_TEXT ? ` ${PRO_OFFER_TEXT}.` : ""}</li>
      </Ul>
      <P>
        Working on a specific topic? See the <Link href="/fraction-calculator" style={{ color: "var(--accent2)" }}>fraction
        calculator with steps</Link> or, for older students, the{" "}
        <Link href="/quadratic-equation-solver" style={{ color: "var(--accent2)" }}>quadratic equation solver</Link>.
      </P>
      <TopicCta prefill="What is 3/4 of 20? Explain each step." label={`Try it with your child: ${GUEST_FREE_QUESTIONS} free questions`} />
    </Page>
    </SiteShell>
  );
}
