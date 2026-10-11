import { pageMetadata } from "@/lib/seo";
import { SiteShell } from "@/components/SiteChrome";
import Link from "next/link";
import { WorkedExample, type Example } from "@/components/WorkedExample";
import { TopicCta } from "@/components/TopicCta";
import { Page, H1, H2, P, Lead, Ul, M } from "@/components/Prose";

export const metadata = pageMetadata({
  title: "Fraction Calculator with Steps – Add, Subtract, Multiply, Divide | Algegram",
  description: "A kid-friendly fraction calculator that shows every step. See worked examples for adding, subtracting and multiplying fractions, then try your own free.",
  path: "/fraction-calculator",
});

// All results verified: 5/6, 7/12, 1/2 (cross-checked with decimals in the "check" lines).
const examples: Example[] = [
  {
    id: "add", title: "Example 1: Adding fractions", problem: "1/2 + 1/3",
    steps: [
      { math: "Bottom numbers are 2 and 3. Smallest number both go into: 6", why: "We can only add fractions when the bottom numbers (denominators) match." },
      { math: "1/2 = 3/6   and   1/3 = 2/6", why: "Multiply top and bottom of 1/2 by 3, and of 1/3 by 2. The size of each fraction doesn’t change." },
      { math: "3/6 + 2/6 = 5/6", why: "Now add the top numbers. The bottom number stays 6." },
    ],
    answer: "5/6",
    check: "0.5 + 0.333… = 0.833…, and 5 ÷ 6 = 0.833… ✓",
  },
  {
    id: "subtract", title: "Example 2: Subtracting fractions", problem: "3/4 − 1/6",
    steps: [
      { math: "Bottom numbers are 4 and 6. Smallest number both go into: 12", why: "Count up the 4 times table: 4, 8, 12. 12 is also in the 6 times table." },
      { math: "3/4 = 9/12   and   1/6 = 2/12", why: "3/4: multiply top and bottom by 3. 1/6: multiply top and bottom by 2." },
      { math: "9/12 − 2/12 = 7/12", why: "Subtract the top numbers. 7/12 can’t be simplified, because 7 and 12 share no factor except 1." },
    ],
    answer: "7/12",
    check: "0.75 − 0.1666… = 0.5833…, and 7 ÷ 12 = 0.5833… ✓",
  },
  {
    id: "multiply", title: "Example 3: Multiplying fractions", problem: "2/3 × 3/4",
    steps: [
      { math: "2 × 3 = 6", why: "Multiply the top numbers. No common denominator needed for multiplying." },
      { math: "3 × 4 = 12", why: "Multiply the bottom numbers." },
      { math: "6/12 = 1/2", why: "Simplify: 6 and 12 can both be divided by 6." },
    ],
    answer: "1/2",
    check: "0.666… × 0.75 = 0.5 ✓",
  },
];

export default function FractionPage() {
  return (
    <SiteShell>
    <Page>
      <H1>Fraction calculator with steps</H1>
      <Lead>
        Type any fraction problem and Algegram works it out one step at a time, explaining each step in plain words.
        Below are the rules for adding, subtracting, multiplying and dividing fractions, with three worked examples.
      </Lead>
      <TopicCta prefill="What is 2/5 + 1/4? Show the steps." label="Got a fraction problem from homework?" />

      <H2>What the numbers in a fraction mean</H2>
      <P>
        In <M>3/4</M>, the bottom number (the <strong>denominator</strong>) tells you how many equal parts the whole is cut
        into: 4. The top number (the <strong>numerator</strong>) tells you how many of those parts you have: 3. So 3/4 of a
        pizza is 3 slices out of a pizza cut into 4 equal slices.
      </P>

      <H2>The four rules</H2>
      <Ul>
        <li><strong>Adding and subtracting:</strong> make the bottom numbers the same first, then add or subtract only the top numbers.</li>
        <li><strong>Multiplying:</strong> multiply top × top and bottom × bottom, then simplify.</li>
        <li><strong>Dividing:</strong> flip the second fraction upside down and multiply. For example, <M>1/2 ÷ 1/4 = 1/2 × 4/1 = 4/2 = 2</M>. That makes sense: two quarters fit into one half.</li>
        <li><strong>Simplifying:</strong> divide the top and bottom by the biggest number that goes into both.</li>
      </Ul>

      <H2 id="examples">Three worked examples</H2>
      {examples.map((ex) => <WorkedExample key={ex.id} ex={ex} />)}

      <H2>Equivalent fractions: why the rules work</H2>
      <P>
        Two fractions are <strong>equivalent</strong> when they describe the same amount, like <M>1/2</M>, <M>2/4</M> and
        <M> 3/6</M>. You make an equivalent fraction by multiplying (or dividing) the top and bottom by the same number.
        That is exactly what we do when we find a common denominator: we aren’t changing how much we have, only how
        many pieces it’s cut into. Picture a chocolate bar cut into 2 halves. Cut each half into 3 and you now have 6
        pieces, and one half is 3 of them. The amount of chocolate didn’t change.
      </P>
      <P>
        Multiplying is different because you are finding “a part of a part”. <M>2/3 × 3/4</M> means two thirds of three
        quarters, which is why the answer, 1/2, is smaller than both fractions you started with.
      </P>

      <H2>Mixed numbers</H2>
      <P>
        A mixed number like <M>1 1/2</M> means one whole and a half. To calculate with it, turn it into an improper
        fraction first: multiply the whole number by the bottom number and add the top. <M>1 1/2</M> becomes
        <M> (1 × 2 + 1)/2 = 3/2</M>. Then use the normal rules. For example, <M>1 1/2 + 2/3 = 9/6 + 4/6 = 13/6</M>, which is
        <M> 2 1/6</M> as a mixed number.
      </P>

      <H2>Common mistakes to watch for</H2>
      <Ul>
        <li>Adding the bottom numbers: <M>1/2 + 1/3</M> is not <M>2/5</M>. Check: 2/5 is smaller than 1/2, so it can’t be right.</li>
        <li>Changing only the bottom number when finding a common denominator. Whatever you do to the bottom, do to the top.</li>
        <li>Forgetting to simplify the final answer.</li>
        <li>Flipping the wrong fraction when dividing. Only the second one gets flipped.</li>
      </Ul>

      <H2>How to check a fraction answer</H2>
      <P>
        Turn each fraction into a decimal by dividing the top by the bottom, then do the sum with the decimals. If it
        matches your answer’s decimal, you’re right. Each example above shows this check. It’s also worth asking “does
        this size make sense?” before moving on.
      </P>

      <H2>Try your own fraction problem</H2>
      <P>
        You can type problems the way they look on a worksheet, like “3/8 + 1/4” or “2 1/3 × 3/5”, or as word
        problems, like “Sam ate 1/3 of a cake and Mia ate 1/4. How much is left?” Ready for harder algebra? See the{" "}
        <Link href="/quadratic-equation-solver" style={{ color: "var(--accent2)" }}>quadratic equation solver</Link>.
      </P>
      <TopicCta prefill="3/8 + 1/4" />
    </Page>
    </SiteShell>
  );
}
