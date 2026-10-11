import { pageMetadata } from "@/lib/seo";
import { SiteShell } from "@/components/SiteChrome";
import Link from "next/link";
import { WorkedExample, type Example } from "@/components/WorkedExample";
import { TopicCta } from "@/components/TopicCta";
import { Page, H1, H2, P, Lead, Ul, M } from "@/components/Prose";

export const metadata = pageMetadata({
  title: "Quadratic Equation Solver – Solve Step by Step | Algegram",
  description: "Solve quadratic equations step by step by factoring, the quadratic formula, or completing the square. Three fully worked examples, then try your own free.",
  path: "/quadratic-equation-solver",
});

// Every example below was verified by substituting the answers back into the equation.
const examples: Example[] = [
  {
    id: "factoring", title: "Example 1: Solve by factoring", problem: "x² + 5x + 6 = 0",
    steps: [
      { math: "Find two numbers that multiply to 6 and add to 5: 2 and 3", why: "For x² + bx + c, we need numbers whose product is c and whose sum is b. 2 × 3 = 6 and 2 + 3 = 5." },
      { math: "(x + 2)(x + 3) = 0", why: "Write the quadratic as a product of two brackets." },
      { math: "x + 2 = 0  or  x + 3 = 0", why: "If two things multiply to 0, at least one of them must be 0." },
      { math: "x = −2  or  x = −3", why: "Solve each small equation." },
    ],
    answer: "x = −2 or x = −3",
    check: "(−2)² + 5(−2) + 6 = 4 − 10 + 6 = 0 ✓ and (−3)² + 5(−3) + 6 = 9 − 15 + 6 = 0 ✓",
  },
  {
    id: "formula", title: "Example 2: Solve with the quadratic formula", problem: "2x² + 5x − 3 = 0",
    steps: [
      { math: "a = 2, b = 5, c = −3", why: "Match the equation to ax² + bx + c = 0." },
      { math: "b² − 4ac = 5² − 4(2)(−3) = 25 + 24 = 49", why: "Work out the discriminant first. It is positive, so there are two real solutions." },
      { math: "x = (−5 ± √49) / (2 × 2) = (−5 ± 7) / 4", why: "Substitute into x = (−b ± √(b² − 4ac)) / 2a. √49 = 7." },
      { math: "x = (−5 + 7)/4 = 2/4 = 1/2", why: "Take the + sign." },
      { math: "x = (−5 − 7)/4 = −12/4 = −3", why: "Take the − sign." },
    ],
    answer: "x = 1/2 or x = −3",
    check: "2(1/2)² + 5(1/2) − 3 = 0.5 + 2.5 − 3 = 0 ✓ and 2(−3)² + 5(−3) − 3 = 18 − 15 − 3 = 0 ✓",
  },
  {
    id: "completing-the-square", title: "Example 3: Solve by completing the square", problem: "x² − 6x + 2 = 0",
    steps: [
      { math: "x² − 6x = −2", why: "Move the constant to the right side." },
      { math: "x² − 6x + 9 = −2 + 9", why: "Half of −6 is −3, and (−3)² = 9. Add 9 to both sides." },
      { math: "(x − 3)² = 7", why: "The left side is now a perfect square." },
      { math: "x − 3 = ±√7", why: "Take the square root of both sides, remembering ±." },
      { math: "x = 3 + √7  or  x = 3 − √7", why: "Add 3 to both sides. As decimals, about 5.646 and 0.354." },
    ],
    answer: "x = 3 ± √7",
    check: "(3 + √7)² − 6(3 + √7) + 2 = (16 + 6√7) − (18 + 6√7) + 2 = 0 ✓ (the − case works the same way)",
  },
];

export default function QuadraticPage() {
  return (
    <SiteShell>
    <Page>
      <H1>Quadratic equation solver, step by step</H1>
      <Lead>
        A quadratic equation has the form <M>ax² + bx + c = 0</M>, where a is not 0. Below you’ll find the three
        standard ways to solve one, each with a fully worked example, and a free box where Algegram solves your own
        equation and explains every step.
      </Lead>
      <TopicCta prefill="Solve x² + 7x + 10 = 0 step by step" label="Have a quadratic to solve right now?" />

      <H2>Which method should you use?</H2>
      <Ul>
        <li><strong>Factoring</strong> is fastest when the numbers are small and the equation splits into whole-number brackets.</li>
        <li><strong>The quadratic formula</strong> always works, including when the answers are fractions or square roots.</li>
        <li><strong>Completing the square</strong> shows where the formula comes from and is useful for finding the vertex of a parabola.</li>
      </Ul>
      <P>
        Before you start, always rearrange so one side is 0. For example, <M>x² = 3x + 4</M> becomes <M>x² − 3x − 4 = 0</M>.
        Then read off a, b and c, including their signs. Sign mistakes with b and c cause most wrong answers.
      </P>

      <H2 id="examples">Three worked examples</H2>
      {examples.map((ex) => <WorkedExample key={ex.id} ex={ex} />)}

      <H2>The quadratic formula</H2>
      <P>
        For any equation <M>ax² + bx + c = 0</M>, the solutions are <M>x = (−b ± √(b² − 4ac)) / 2a</M>. The part under the
        square root, <M>b² − 4ac</M>, is called the discriminant, and it tells you what kind of answers to expect:
      </P>
      <Ul>
        <li>Positive: two different real solutions (like Example 2, where it was 49).</li>
        <li>Zero: one repeated solution. For example, <M>x² − 4x + 4 = 0</M> gives <M>x = 2</M> twice.</li>
        <li>Negative: no real solutions. The graph never crosses the x-axis, and the solutions are complex numbers.</li>
      </Ul>

      <H2>How to check your answer</H2>
      <P>
        Substitute each solution back into the original equation. If the left side comes out to exactly 0, the
        solution is correct. This takes under a minute and catches almost every arithmetic slip. Each example above
        ends with this check. A second quick test: for <M>ax² + bx + c = 0</M>, the two solutions always add to
        <M> −b/a</M> and multiply to <M>c/a</M>. In Example 2, 1/2 + (−3) = −5/2 and (1/2)(−3) = −3/2, which match −5/2 and −3/2.
      </P>

      <H2>Common mistakes</H2>
      <Ul>
        <li>Forgetting the ± and giving only one solution.</li>
        <li>Dividing only −b by 2a instead of the whole top of the fraction.</li>
        <li>Squaring a negative b wrongly: (−6)² is 36, not −36.</li>
        <li>Dividing both sides by x, which throws away the solution x = 0 in equations like <M>x² = 5x</M>.</li>
      </Ul>

      <H2>Solve your own quadratic with steps</H2>
      <P>
        Type your equation exactly as it appears in your homework, for example “solve 3x² − 2x − 8 = 0”. Algegram
        shows each step and the reason for it, so you can follow the method rather than just copy an answer. You can
        also ask it to use a specific method, like “solve by completing the square”. Working on simpler equations first?
        See the <Link href="/fraction-calculator" style={{ color: "var(--accent2)" }}>fraction calculator with steps</Link>.
      </P>
      <TopicCta prefill="Solve 3x² − 2x − 8 = 0 step by step" />
    </Page>
    </SiteShell>
  );
}
