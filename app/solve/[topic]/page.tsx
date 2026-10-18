import Link from 'next/link'
import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'
import { GUEST_FREE_QUESTIONS, SITE_URL } from '@/lib/site-config'
import OfferText from '@/app/components/OfferText'

// Static list of supported topics and example Q&A pairs
// Never render user input on these pages — SEO-safe static content only
const TOPIC_DATA: Record<string, {
  title: string
  description: string
  examples: { question: string; answer: string; steps?: string[] }[]
  /** Optional richer SEO fields (seeded, hand-written content only). */
  seoTitle?: string
  intro?: string
  faq?: { q: string; a: string }[]
  /** Single worked-problem pages (seeded, hand-written): custom heading, signup CTA, related links. */
  h1?: string
  ctaLabel?: string
  related?: { href: string; label: string }[]
}> = {
  algebra: {
    title: 'Algebra',
    description: 'Solve linear and quadratic equations, simplify expressions, and factor polynomials.',
    examples: [
      {
        question: 'Solve 2x + 4 = 10',
        answer: 'Subtract 4 from both sides: 2x = 6. Divide by 2: x = 3.',
      },
      {
        question: 'Factor x² + 5x + 6',
        answer: 'Find two numbers that multiply to 6 and add to 5: (x + 2)(x + 3).',
      },
      {
        question: 'Simplify 3(x + 4) − 2x',
        answer: 'Distribute: 3x + 12 − 2x = x + 12.',
      },
    ],
  },
  calculus: {
    title: 'Calculus',
    description: 'Derivatives, integrals, limits, and series — with step-by-step workings.',
    examples: [
      {
        question: 'Find the derivative of x²',
        answer: 'Using the power rule: d/dx(x²) = 2x.',
      },
      {
        question: 'Evaluate ∫ 2x dx',
        answer: 'Integrate term by term: x² + C, where C is the constant of integration.',
      },
      {
        question: 'Find lim(x→0) sin(x)/x',
        answer: 'This is a standard limit equal to 1. By the squeeze theorem: for small x ≠ 0, cos(x) ≤ sin(x)/x ≤ 1, and both sides approach 1 as x→0, so lim = 1.',
      },
    ],
  },
  fractions: {
    title: 'Fractions',
    seoTitle: 'How to Add, Subtract, Multiply and Divide Fractions (Step by Step)',
    description: 'Add, subtract, multiply, divide and simplify fractions step by step, with worked examples.',
    intro: 'Fractions follow a few simple rules. To add or subtract, make the bottoms (denominators) the same. To multiply, multiply straight across. To divide, flip the second fraction and multiply. Always simplify at the end.',
    examples: [
      { question: 'Add 3/4 + 1/6', answer: '3/4 + 1/6 = 11/12',
        steps: ['Find a common denominator: the least common multiple of 4 and 6 is 12.', 'Rewrite each fraction: 3/4 = 9/12 and 1/6 = 2/12.', 'Add the numerators: 9/12 + 2/12 = 11/12.', '11 and 12 share no common factor, so 11/12 is already simplified.'] },
      { question: 'Subtract 5/6 − 1/4', answer: '5/6 − 1/4 = 7/12',
        steps: ['The least common multiple of 6 and 4 is 12.', 'Rewrite: 5/6 = 10/12 and 1/4 = 3/12.', 'Subtract the numerators: 10/12 − 3/12 = 7/12.'] },
      { question: 'Multiply 2/3 × 9/10', answer: '2/3 × 9/10 = 3/5',
        steps: ['Multiply the numerators: 2 × 9 = 18.', 'Multiply the denominators: 3 × 10 = 30.', 'Simplify 18/30 by dividing top and bottom by 6: 3/5.'] },
      { question: 'Divide 3/5 ÷ 9/10', answer: '3/5 ÷ 9/10 = 2/3',
        steps: ['Keep the first fraction, change ÷ to ×, and flip the second: 3/5 × 10/9.', 'Multiply: (3 × 10)/(5 × 9) = 30/45.', 'Simplify by dividing top and bottom by 15: 2/3.'] },
    ],
    faq: [
      { q: 'How do you add fractions with different denominators?', a: 'Find the least common multiple of the denominators, rewrite each fraction with that denominator, then add the numerators and keep the denominator. Simplify if you can.' },
      { q: 'How do you divide fractions?', a: 'Keep the first fraction, change division to multiplication, and flip the second fraction (use its reciprocal). Then multiply across and simplify.' },
      { q: 'How do you simplify a fraction?', a: 'Divide the numerator and denominator by their greatest common factor. For example, 18/30 has a greatest common factor of 6, so it simplifies to 3/5.' },
    ],
  },
  'linear-equations': {
    title: 'Linear Equations',
    seoTitle: 'How to Solve Linear Equations Step by Step (with Examples)',
    description: 'Solve one-step, two-step and multi-step linear equations, including variables on both sides.',
    intro: 'A linear equation is solved by getting the variable alone on one side. Whatever you do to one side, do to the other: undo addition and subtraction first, then multiplication and division.',
    examples: [
      { question: 'Solve 3x + 7 = 22', answer: 'x = 5',
        steps: ['Subtract 7 from both sides: 3x = 15.', 'Divide both sides by 3: x = 5.', 'Check: 3(5) + 7 = 15 + 7 = 22. ✓'] },
      { question: 'Solve 5x − 4 = 2x + 11', answer: 'x = 5',
        steps: ['Subtract 2x from both sides: 3x − 4 = 11.', 'Add 4 to both sides: 3x = 15.', 'Divide by 3: x = 5.', 'Check: 5(5) − 4 = 21 and 2(5) + 11 = 21. ✓'] },
      { question: 'Solve 2(x + 3) = 4x − 8', answer: 'x = 7',
        steps: ['Distribute the 2: 2x + 6 = 4x − 8.', 'Subtract 2x from both sides: 6 = 2x − 8.', 'Add 8 to both sides: 14 = 2x.', 'Divide by 2: x = 7.', 'Check: 2(7 + 3) = 20 and 4(7) − 8 = 20. ✓'] },
      { question: 'Solve x/4 + 1 = 6', answer: 'x = 20',
        steps: ['Subtract 1 from both sides: x/4 = 5.', 'Multiply both sides by 4: x = 20.', 'Check: 20/4 + 1 = 5 + 1 = 6. ✓'] },
    ],
    related: [
      { href: '/solve/5x-minus-8-equals-27', label: 'Solve 5x − 8 = 27 step by step' },
      { href: '/solve/x-plus-6-over-2-equals-9', label: 'Solve (x + 6)/2 = 9 step by step' },
      { href: '/solve/x-over-3-plus-4-equals-10', label: 'Solve x/3 + 4 = 10 step by step' },
      { href: '/solve/2x-plus-5-equals-17', label: 'Solve 2x + 5 = 17 step by step' },
      { href: '/solve/3-x-minus-2-equals-15', label: 'Solve 3(x − 2) = 15 step by step' },
      { href: '/solve/x-over-4-minus-3-equals-2', label: 'Solve x/4 − 3 = 2 step by step' },
      { href: '/learn/two-step-equations', label: 'Two-step equations' },
    ],
    faq: [
      { q: 'What is a linear equation?', a: 'An equation where the variable is only to the first power, like 3x + 7 = 22. Its graph is a straight line, which is where the name comes from.' },
      { q: 'What do you do when there are variables on both sides?', a: 'Move all the variable terms to one side by adding or subtracting, move the numbers to the other side, then divide by the coefficient.' },
      { q: 'How can I check my answer?', a: 'Substitute your value back into the original equation. If both sides come out equal, the answer is correct.' },
    ],
  },
  '5x-minus-8-equals-27': {
    title: 'Solve 5x − 8 = 27',
    h1: 'Solve 5x − 8 = 27 (Step by Step)',
    ctaLabel: 'equation',
    seoTitle: 'Solve 5x − 8 = 27 Step by Step (x = 7)',
    description: 'How to solve the two-step equation 5x − 8 = 27, where x is multiplied by 5, with every step explained and a quick check of the answer.',
    intro: 'Here x is multiplied by 5 and then 8 is taken away. Undo them in reverse order: add the 8 back first, then undo the times 5 by dividing by 5.',
    examples: [
      { question: 'Solve 5x − 8 = 27', answer: 'x = 7',
        steps: [
          'Start with the equation: 5x − 8 = 27.',
          'Add 8 to both sides to undo the − 8: 5x − 8 + 8 = 27 + 8, so 5x = 35.',
          'Divide both sides by 5 to undo the × 5: 5x ÷ 5 = 35 ÷ 5, so x = 7.',
          'Check your answer: put x = 7 back in. 5 × 7 − 8 = 35 − 8 = 27. Both sides match, so x = 7 is correct. ✓',
        ] },
    ],
    faq: [
      { q: 'Why add 8 instead of subtracting it?', a: 'The equation takes 8 away from 5x. Adding 8 undoes that, so the − 8 and + 8 cancel and leave 5x by itself.' },
      { q: 'What does 5x mean?', a: '5x means 5 times x. To undo multiplying by 5, divide by 5.' },
    ],
    related: [
      { href: '/solve/2x-plus-5-equals-17', label: 'Solve 2x + 5 = 17' },
      { href: '/solve/x-plus-6-over-2-equals-9', label: 'Solve (x + 6)/2 = 9' },
      { href: '/learn/two-step-equations', label: 'Two-step equations explained' },
      { href: '/solve/linear-equations', label: 'More linear equations with examples' },
      { href: '/quiz/linear-equations', label: 'Free linear equations quiz' },
    ],
  },
  'x-plus-6-over-2-equals-9': {
    title: 'Solve (x + 6)/2 = 9',
    h1: 'Solve (x + 6)/2 = 9 (Step by Step)',
    ctaLabel: 'equation',
    seoTitle: 'Solve (x + 6)/2 = 9 Step by Step (x = 12)',
    description: 'How to solve the two-step equation (x + 6)/2 = 9, where x + 6 is divided by 2, with every step explained and a quick check of the answer.',
    intro: 'Here 6 is added to x first, and then the whole thing is divided by 2. Undo them in reverse order: undo the divide by 2 by multiplying by 2, then take away the 6.',
    examples: [
      { question: 'Solve (x + 6)/2 = 9', answer: 'x = 12',
        steps: [
          'Start with the equation: (x + 6)/2 = 9.',
          'Multiply both sides by 2 to undo the ÷ 2: ((x + 6)/2) × 2 = 9 × 2, so x + 6 = 18.',
          'Subtract 6 from both sides to undo the + 6: x + 6 − 6 = 18 − 6, so x = 12.',
          'Check your answer: put x = 12 back in. (12 + 6)/2 = 18/2 = 9. Both sides match, so x = 12 is correct. ✓',
        ] },
    ],
    faq: [
      { q: 'Why multiply by 2 first this time?', a: 'The brackets mean the whole x + 6 is divided by 2. Dividing happened last, so it is undone first: multiply both sides by 2 to get x + 6 = 18.' },
      { q: 'Can I subtract 6 first?', a: 'Not straight away. The 6 is inside the brackets and is being divided by 2 along with x, so you would have to take away 6/2 = 3 instead: x/2 = 6, which still gives x = 12.' },
    ],
    related: [
      { href: '/solve/x-over-3-plus-4-equals-10', label: 'Solve x/3 + 4 = 10' },
      { href: '/solve/5x-minus-8-equals-27', label: 'Solve 5x − 8 = 27' },
      { href: '/learn/two-step-equations', label: 'Two-step equations explained' },
      { href: '/solve/linear-equations', label: 'More linear equations with examples' },
      { href: '/quiz/linear-equations', label: 'Free linear equations quiz' },
    ],
  },
  'x-over-3-plus-4-equals-10': {
    title: 'Solve x/3 + 4 = 10',
    h1: 'Solve x/3 + 4 = 10 (Step by Step)',
    ctaLabel: 'equation',
    seoTitle: 'Solve x/3 + 4 = 10 Step by Step (x = 18)',
    description: 'How to solve the two-step equation x/3 + 4 = 10, where x is divided by 3, with every step explained and a quick check of the answer.',
    intro: 'Here x is divided by 3 and then has 4 added. Undo them in reverse order: take away the 4 first, then undo the divide by 3 by multiplying by 3.',
    examples: [
      { question: 'Solve x/3 + 4 = 10', answer: 'x = 18',
        steps: [
          'Start with the equation: x/3 + 4 = 10.',
          'Subtract 4 from both sides to undo the + 4: x/3 + 4 − 4 = 10 − 4, so x/3 = 6.',
          'Multiply both sides by 3 to undo the ÷ 3: (x/3) × 3 = 6 × 3, so x = 18.',
          'Check your answer: put x = 18 back in. 18/3 + 4 = 6 + 4 = 10. Both sides match, so x = 18 is correct. ✓',
        ] },
    ],
    faq: [
      { q: 'How do you undo dividing by 3?', a: 'Multiply by 3. Multiplying and dividing undo each other, so (x/3) × 3 is just x.' },
      { q: 'Why subtract 4 first instead of multiplying by 3 first?', a: 'The 4 was added last, so it is undone first. If you multiply by 3 first, you must multiply every term: x + 12 = 30, which still gives x = 18.' },
    ],
    related: [
      { href: '/solve/2x-plus-5-equals-17', label: 'Solve 2x + 5 = 17' },
      { href: '/solve/x-over-4-minus-3-equals-2', label: 'Solve x/4 − 3 = 2' },
      { href: '/learn/two-step-equations', label: 'Two-step equations explained' },
      { href: '/solve/linear-equations', label: 'More linear equations with examples' },
      { href: '/quiz/linear-equations', label: 'Free linear equations quiz' },
    ],
  },
  '2x-plus-5-equals-17': {
    title: 'Solve 2x + 5 = 17',
    h1: 'Solve 2x + 5 = 17 (Step by Step)',
    ctaLabel: 'equation',
    seoTitle: 'Solve 2x + 5 = 17 Step by Step (x = 6)',
    description: 'How to solve the two-step equation 2x + 5 = 17, with every step explained and a quick check of the answer.',
    intro: 'This is a two-step equation. The x is being multiplied by 2 and then has 5 added. To get x alone, undo those in reverse order: take away the 5 first, then undo the multiply by 2.',
    examples: [
      { question: 'Solve 2x + 5 = 17', answer: 'x = 6',
        steps: [
          'Start with the equation: 2x + 5 = 17.',
          'Subtract 5 from both sides to undo the + 5: 2x + 5 − 5 = 17 − 5, so 2x = 12.',
          'Divide both sides by 2 to undo the × 2: 2x ÷ 2 = 12 ÷ 2, so x = 6.',
          'Check your answer: put x = 6 back in. 2(6) + 5 = 12 + 5 = 17. Both sides match, so x = 6 is correct. ✓',
        ] },
    ],
    faq: [
      { q: 'Why do you subtract 5 before dividing by 2?', a: 'You undo the operations in the reverse order they were done to x. The 2 multiplied x first and the 5 was added last, so the 5 comes off first. If you divide first, you have to divide every term: x + 2.5 = 8.5, which still gives x = 6 but with more work.' },
      { q: 'How do I check my answer?', a: 'Replace x with your answer in the original equation. 2(6) + 5 = 17, so both sides are equal and the answer is right.' },
    ],
    related: [
      { href: '/solve/3-x-minus-2-equals-15', label: 'Solve 3(x − 2) = 15' },
      { href: '/solve/x-over-4-minus-3-equals-2', label: 'Solve x/4 − 3 = 2' },
      { href: '/learn/two-step-equations', label: 'Two-step equations explained' },
      { href: '/solve/linear-equations', label: 'More linear equations with examples' },
      { href: '/quiz/linear-equations', label: 'Free linear equations quiz' },
    ],
  },
  '3-x-minus-2-equals-15': {
    title: 'Solve 3(x − 2) = 15',
    h1: 'Solve 3(x − 2) = 15 (Step by Step)',
    ctaLabel: 'equation',
    seoTitle: 'Solve 3(x − 2) = 15 Step by Step (x = 7)',
    description: 'How to solve the equation 3(x − 2) = 15 with brackets, step by step, two ways, with a quick check of the answer.',
    intro: 'Here x has 2 taken away, and then the whole bracket is multiplied by 3. You can undo the × 3 first by dividing both sides by 3, or you can multiply out the bracket first. Both ways give the same answer.',
    examples: [
      { question: 'Solve 3(x − 2) = 15', answer: 'x = 7',
        steps: [
          'Start with the equation: 3(x − 2) = 15.',
          'Divide both sides by 3 to undo the × 3: (x − 2) = 15 ÷ 3, so x − 2 = 5.',
          'Add 2 to both sides to undo the − 2: x − 2 + 2 = 5 + 2, so x = 7.',
          'Check your answer: put x = 7 back in. 3(7 − 2) = 3(5) = 15. Both sides match, so x = 7 is correct. ✓',
        ] },
      { question: 'Another way: multiply out the bracket first', answer: 'x = 7',
        steps: [
          'Multiply the 3 by each term inside the bracket: 3 × x − 3 × 2 = 15, so 3x − 6 = 15.',
          'Add 6 to both sides: 3x = 21.',
          'Divide both sides by 3: x = 7.',
          'Same answer as before. Check: 3(7) − 6 = 21 − 6 = 15. ✓',
        ] },
    ],
    faq: [
      { q: 'Should I divide first or multiply out the bracket first?', a: 'Either works. Dividing by 3 first is quicker here because 15 divides evenly by 3. Multiplying out the bracket always works, even when the numbers do not divide evenly.' },
      { q: 'What is a common mistake with 3(x − 2)?', a: 'Only multiplying the x by 3 and forgetting the 2. The 3 multiplies everything in the bracket, so 3(x − 2) is 3x − 6, not 3x − 2.' },
    ],
    related: [
      { href: '/solve/2x-plus-5-equals-17', label: 'Solve 2x + 5 = 17' },
      { href: '/solve/x-over-4-minus-3-equals-2', label: 'Solve x/4 − 3 = 2' },
      { href: '/learn/two-step-equations', label: 'Two-step equations explained' },
      { href: '/solve/linear-equations', label: 'More linear equations with examples' },
      { href: '/quiz/linear-equations', label: 'Free linear equations quiz' },
    ],
  },
  'x-over-4-minus-3-equals-2': {
    title: 'Solve x/4 − 3 = 2',
    h1: 'Solve x/4 − 3 = 2 (Step by Step)',
    ctaLabel: 'equation',
    seoTitle: 'Solve x/4 − 3 = 2 Step by Step (x = 20)',
    description: 'How to solve the two-step equation x/4 − 3 = 2, where x is divided by 4, with every step explained and a quick check of the answer.',
    intro: 'Here x is divided by 4 and then has 3 taken away. Undo them in reverse order: add the 3 back first, then undo the divide by 4 by multiplying by 4.',
    examples: [
      { question: 'Solve x/4 − 3 = 2', answer: 'x = 20',
        steps: [
          'Start with the equation: x/4 − 3 = 2.',
          'Add 3 to both sides to undo the − 3: x/4 − 3 + 3 = 2 + 3, so x/4 = 5.',
          'Multiply both sides by 4 to undo the ÷ 4: (x/4) × 4 = 5 × 4, so x = 20.',
          'Check your answer: put x = 20 back in. 20/4 − 3 = 5 − 3 = 2. Both sides match, so x = 20 is correct. ✓',
        ] },
    ],
    faq: [
      { q: 'How do you undo dividing by 4?', a: 'Multiply by 4. Multiplying and dividing undo each other, so (x/4) × 4 is just x.' },
      { q: 'Why add 3 first instead of multiplying by 4 first?', a: 'The 3 was taken away last, so it is undone first. If you multiply by 4 first, you must multiply every term: x − 12 = 8, which still gives x = 20.' },
    ],
    related: [
      { href: '/solve/2x-plus-5-equals-17', label: 'Solve 2x + 5 = 17' },
      { href: '/solve/3-x-minus-2-equals-15', label: 'Solve 3(x − 2) = 15' },
      { href: '/learn/two-step-equations', label: 'Two-step equations explained' },
      { href: '/solve/linear-equations', label: 'More linear equations with examples' },
      { href: '/quiz/linear-equations', label: 'Free linear equations quiz' },
    ],
  },
  percentages: {
    title: 'Percentages',
    seoTitle: 'How to Calculate Percentages Step by Step (Percent of, Change, Discount)',
    description: 'Find a percent of a number, percent increase and decrease, discounts, and what percent one number is of another.',
    intro: 'Percent means “out of 100”. To use a percent in a calculation, turn it into a decimal by dividing by 100 (for example 15% = 0.15), then multiply.',
    examples: [
      { question: 'What is 15% of 80?', answer: '12',
        steps: ['Change 15% to a decimal: 15 ÷ 100 = 0.15.', 'Multiply: 0.15 × 80 = 12.'] },
      { question: 'What percent of 50 is 18?', answer: '36%',
        steps: ['Divide the part by the whole: 18 ÷ 50 = 0.36.', 'Multiply by 100 to get a percent: 0.36 × 100 = 36%.'] },
      { question: 'A price goes from $40 to $50. What is the percent increase?', answer: '25% increase',
        steps: ['Find the change: 50 − 40 = 10.', 'Divide by the original amount: 10 ÷ 40 = 0.25.', 'Convert to a percent: 0.25 × 100 = 25%.'] },
      { question: 'A $60 jacket is 30% off. What is the sale price?', answer: '$42',
        steps: ['Find the discount: 30% of 60 = 0.30 × 60 = 18.', 'Subtract it from the original price: 60 − 18 = 42.', 'Shortcut: paying 70% of the price gives 0.70 × 60 = 42 too.'] },
    ],
    faq: [
      { q: 'How do you find a percentage of a number?', a: 'Divide the percent by 100 to make a decimal, then multiply by the number. For example, 15% of 80 is 0.15 × 80 = 12.' },
      { q: 'How do you calculate percent change?', a: 'Subtract the old value from the new value, divide by the old value, and multiply by 100. A positive result is an increase and a negative one is a decrease.' },
    ],
  },
  'order-of-operations': {
    title: 'Order of Operations',
    seoTitle: 'Order of Operations (PEMDAS) Explained with Step-by-Step Examples',
    description: 'Use PEMDAS / BODMAS to evaluate expressions with parentheses, exponents, multiplication, division, addition and subtraction.',
    intro: 'Work in this order: Parentheses, Exponents, Multiplication and Division (left to right), then Addition and Subtraction (left to right). Multiplication does not always come before division; whichever comes first from the left goes first.',
    examples: [
      { question: 'Evaluate 3 + 4 × 2', answer: '11',
        steps: ['Multiplication comes before addition: 4 × 2 = 8.', 'Then add: 3 + 8 = 11.'] },
      { question: 'Evaluate (6 + 2) × 3²', answer: '72',
        steps: ['Parentheses first: 6 + 2 = 8.', 'Exponents next: 3² = 9.', 'Multiply: 8 × 9 = 72.'] },
      { question: 'Evaluate 20 ÷ 4 × 5', answer: '25',
        steps: ['Division and multiplication have equal priority, so go left to right.', '20 ÷ 4 = 5.', '5 × 5 = 25.'] },
      { question: 'Evaluate 18 − 6 ÷ 3 + 2³', answer: '24',
        steps: ['Exponents: 2³ = 8, giving 18 − 6 ÷ 3 + 8.', 'Division: 6 ÷ 3 = 2, giving 18 − 2 + 8.', 'Left to right: 18 − 2 = 16, then 16 + 8 = 24.'] },
    ],
    faq: [
      { q: 'What does PEMDAS stand for?', a: 'Parentheses, Exponents, Multiplication and Division, Addition and Subtraction. In the UK and elsewhere the same rule is called BODMAS or BIDMAS.' },
      { q: 'Does multiplication come before division?', a: 'No. Multiplication and division have the same priority and are done from left to right. The same goes for addition and subtraction.' },
    ],
  },
  'word-problems': {
    title: 'Math Word Problems',
    seoTitle: 'How to Solve Math Word Problems Step by Step (Worked Examples)',
    description: 'Turn word problems into equations and solve them: ages, money, speed and distance, and more.',
    intro: 'Read the problem, decide what you are looking for and give it a letter, write an equation from the facts, solve it, then check the answer makes sense in the story.',
    examples: [
      { question: 'Maya has 3 times as many stickers as Leo. Together they have 48. How many does each have?', answer: 'Leo has 12 and Maya has 36.',
        steps: ['Let Leo’s stickers be s. Then Maya has 3s.', 'Together: s + 3s = 48, so 4s = 48.', 'Divide by 4: s = 12. Maya has 3 × 12 = 36.', 'Check: 12 + 36 = 48. ✓'] },
      { question: 'A train travels 180 miles in 3 hours. At the same speed, how far does it go in 5 hours?', answer: '300 miles',
        steps: ['Speed = distance ÷ time = 180 ÷ 3 = 60 miles per hour.', 'Distance in 5 hours = 60 × 5 = 300 miles.'] },
      { question: 'Tickets cost $8 for kids and $12 for adults. A group of 10 people paid $96. How many kids were there?', answer: '6 kids (and 4 adults)',
        steps: ['Let k be the number of kids, so there are 10 − k adults.', 'Cost: 8k + 12(10 − k) = 96.', 'Simplify: 8k + 120 − 12k = 96, so −4k = −24.', 'Divide by −4: k = 6. Adults: 10 − 6 = 4.', 'Check: 6 × 8 + 4 × 12 = 48 + 48 = 96. ✓'] },
      { question: 'The sum of two consecutive numbers is 37. What are they?', answer: '18 and 19',
        steps: ['Let the smaller number be n, so the next one is n + 1.', 'n + (n + 1) = 37, so 2n + 1 = 37.', 'Subtract 1: 2n = 36. Divide by 2: n = 18.', 'The numbers are 18 and 19. Check: 18 + 19 = 37. ✓'] },
    ],
    faq: [
      { q: 'What is the best way to start a word problem?', a: 'Work out exactly what the question asks for and call it a letter, such as x. Then list the facts the problem gives you and turn each one into math.' },
      { q: 'How do I know if my answer is right?', a: 'Put it back into the story. If every fact in the problem still holds, for example the totals add up, the answer is right.' },
    ],
  },
  statistics: {
    title: 'Statistics',
    description: 'Mean, median, standard deviation, probability, and hypothesis testing.',
    examples: [
      {
        question: 'Find the mean of 4, 7, 9, 2, 8',
        answer: 'Sum = 30, count = 5. Mean = 30 ÷ 5 = 6.',
      },
      {
        question: 'What is the probability of rolling a 6 on a fair die?',
        answer: 'There is 1 favorable outcome out of 6 possible outcomes: P = 1/6 ≈ 16.7%.',
      },
    ],
  },
  'linear-algebra': {
    title: 'Linear Algebra',
    description: 'Matrix operations, eigenvalues, vector spaces, and linear transformations.',
    examples: [
      {
        question: 'What is the determinant of [[1,2],[3,4]]?',
        answer: 'det = (1)(4) − (2)(3) = 4 − 6 = −2.',
      },
    ],
  },
  'number-theory': {
    title: 'Number Theory',
    description: 'Prime numbers, modular arithmetic, GCD, and combinatorics.',
    examples: [
      {
        question: 'Find GCD(48, 18)',
        answer: 'Using Euclidean algorithm: 48 = 2×18 + 12; 18 = 1×12 + 6; 12 = 2×6 + 0. GCD = 6.',
      },
    ],
  },
}

export async function generateStaticParams() {
  return Object.keys(TOPIC_DATA).map(topic => ({ topic }))
}

// Unknown topics are real 404s (not soft-404 pages with a 200 status).
export const dynamicParams = false

export async function generateMetadata({ params }: { params: { topic: string } }): Promise<Metadata> {
  const data = TOPIC_DATA[params.topic]
  if (!data) return { title: 'Math Help', robots: { index: false } }
  return pageMetadata({
    title: data.seoTitle ? `${data.seoTitle} | Algegram` : `${data.title} Help – Step-by-Step Examples | Algegram`,
    description: `${data.description} See example problems and solutions. Ask your own question free.`,
    path: `/solve/${params.topic}`,
  })
}

export default function SolveTopic({ params }: { params: { topic: string } }) {
  const data = TOPIC_DATA[params.topic]

  if (!data) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontWeight: 700, marginBottom: '1rem' }}>Topic not found</h1>
          <Link href="/" style={{ color: 'var(--accent2)' }}>Back to Algegram →</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>
      <nav style={{ borderBottom: '1px solid var(--border)', padding: '0 1rem' }}
        className="flex items-center justify-between h-14 max-w-6xl mx-auto">
        <Link href="/" style={{ fontWeight: 800, fontSize: '1.2rem', background: 'linear-gradient(135deg,#6c63ff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textDecoration: 'none' }}>
          Algegram
        </Link>
        <Link href="/auth/signup" style={{ background: 'var(--accent)', color: '#fff', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600 }}>
          Get started free
        </Link>
      </nav>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '3rem 1.5rem' }}>
        <div style={{ marginBottom: '0.75rem' }}>
          <Link href="/" style={{ color: 'var(--text-dim)', fontSize: '0.875rem', textDecoration: 'none' }}>← All topics</Link>
        </div>
        <h1 style={{ fontWeight: 800, fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: '0.75rem' }}>{data.h1 ?? `${data.title} Help`}</h1>
        <p style={{ color: 'var(--text-dim)', marginBottom: data.intro ? '1rem' : '2rem', lineHeight: 1.7 }}>{data.description}</p>
        {data.intro && <p style={{ lineHeight: 1.7, marginBottom: '2rem' }}>{data.intro}</p>}
        {data.faq && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            url: `${SITE_URL}/solve/${params.topic}`,
            mainEntity: data.faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
          }).replace(/</g, '\\u003c') }} />
        )}

        {/* CTA banner */}
        <div style={{ background: 'rgba(108,99,255,.1)', border: '1px solid rgba(108,99,255,.3)', borderRadius: '12px', padding: '1.25rem', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{data.ctaLabel ? `Try a similar ${data.ctaLabel}` : `Ask your own ${data.title.toLowerCase()} question`}</div>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>Type your own problem on the homepage and see every step. {GUEST_FREE_QUESTIONS} free questions, no sign-up.</div>
          </div>
          <Link href={`/?utm_source=seo&utm_medium=organic&utm_campaign=${params.topic.replace(/-/g, '_')}`} style={{ background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', padding: '0.65rem 1.25rem', borderRadius: '10px', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Try {GUEST_FREE_QUESTIONS} free questions →
          </Link>
        </div>

        <h2 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--text-dim)' }}>{data.h1 ? 'Step-by-step solution' : <>Example problems &amp; solutions</>}</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {data.examples.map((ex, i) => (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(108,99,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 }}>Q</div>
                <p style={{ fontWeight: 600, lineHeight: 1.6, margin: 0 }}>{ex.question}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(52,211,153,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'var(--green)', flexShrink: 0 }}>A</div>
                <div style={{ margin: 0 }}>
                  {ex.steps && (
                    <ol style={{ color: 'var(--text-dim)', lineHeight: 1.7, margin: '0 0 0.5rem', paddingLeft: '1.2rem', listStyle: 'decimal' }}>
                      {ex.steps.map((st, j) => <li key={j}>{st}</li>)}
                    </ol>
                  )}
                  <p style={{ color: ex.steps ? 'var(--text)' : 'var(--text-dim)', fontWeight: ex.steps ? 600 : 400, lineHeight: 1.7, margin: 0 }}>{ex.steps ? `Answer: ${ex.answer}` : ex.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {data.faq && (
          <section style={{ marginTop: '3rem' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '1rem' }}>Frequently asked questions</h2>
            {data.faq.map((f, i) => (
              <div key={i} style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.35rem' }}>{f.q}</h3>
                <p style={{ color: 'var(--text-dim)', lineHeight: 1.7, margin: 0 }}>{f.a}</p>
              </div>
            ))}
          </section>
        )}

        {data.related && (
          <section style={{ marginTop: '3rem' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.75rem' }}>Keep practicing</h2>
            <ul style={{ lineHeight: 1.9, paddingLeft: '1.2rem', listStyle: 'disc' }}>
              {data.related.map(r => <li key={r.href}><Link href={r.href} style={{ color: 'var(--accent2)' }}>{r.label}</Link></li>)}
            </ul>
          </section>
        )}

        {data.h1 && (
          <div style={{ marginTop: '3rem', textAlign: 'center', padding: '2rem', background: 'rgba(108,99,255,.1)', border: '1px solid rgba(108,99,255,.3)', borderRadius: '16px' }}>
            <p style={{ color: 'var(--text-dim)', marginBottom: '1rem' }}>
              <OfferText normal='Sign up free, get 7 days of Pro. No card needed.' center='Sign up free with your center for 14 days of Pro.' />
            </p>
            <Link href={`/auth/signup?utm_source=seo&utm_medium=organic&utm_campaign=${params.topic.replace(/-/g, '_')}`} style={{ background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', padding: '0.8rem 2rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none', display: 'inline-block' }}>
              <OfferText normal='Sign up free, get 7 days of Pro' center='Sign up free' /> →
            </Link>
          </div>
        )}

        <div style={{ marginTop: '3rem', textAlign: 'center', padding: '2rem', background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-dim)', marginBottom: '1rem' }}>
            Stuck on a different problem? Ask Algegram and get every step explained. Your first {GUEST_FREE_QUESTIONS} questions are free, no sign-up needed.
          </p>
          <Link href={`/?utm_source=seo&utm_medium=organic&utm_campaign=${params.topic.replace(/-/g, '_')}`} style={{ background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', padding: '0.8rem 2rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none' }}>
            Ask my math question →
          </Link>
        </div>
      </div>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
        <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          <Link href="/terms" style={{ color: 'var(--text-dim)' }}>Terms</Link>
          <Link href="/privacy" style={{ color: 'var(--text-dim)' }}>Privacy</Link>
          <Link href="/help" style={{ color: 'var(--text-dim)' }}>Help</Link>
          <Link href="/contact" style={{ color: 'var(--text-dim)' }}>Contact</Link>
        </div>
        © {new Date().getFullYear()} Algegram
      </footer>
    </div>
  )
}
