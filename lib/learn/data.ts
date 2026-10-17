// Topic landing pages (/learn/<slug>). Original, hand-written content and seeded examples only.
// COPPA / site rule: never render user-typed questions here. Keywords from Google autocomplete (Oct 2026).
export type LearnPage = {
  title: string          // H1
  seoTitle: string
  description: string    // meta description
  audience: string
  intro: string
  rules: string[]
  examples: { q: string; steps: string[]; answer: string }[]
  practice: { q: string; a: string }[]
  faq: { q: string; a: string }[]
  quiz: { href: string; label: string }[]
  related: { href: string; label: string }[]
  campaign: string
}

export const LEARN_PAGES: Record<string, LearnPage> = {
  'fractions-practice-5th-grade': {
    title: 'Fractions Practice for 5th Grade',
    seoTitle: 'Fractions Practice for 5th Grade: Problems with Step-by-Step Answers',
    description: '5th grade fractions practice: add and subtract unlike fractions, multiply fractions, and solve fraction word problems, with worked answers and a free quiz.',
    audience: 'Grade 5 students (ages 10 to 11) and the parents and tutors helping them.',
    intro: 'In 5th grade, fractions get a level harder: you add and subtract fractions with different denominators, multiply a fraction by a whole number or another fraction, and use fractions in word problems. Work through the examples, then try the practice set and the free quiz.',
    rules: [
      'Adding or subtracting: first rewrite both fractions with the same denominator (a common multiple of the two bottoms).',
      'Multiplying: multiply the tops, multiply the bottoms, then simplify.',
      'Mixed numbers: turn them into improper fractions before multiplying.',
      'Always simplify the final answer by dividing top and bottom by their greatest common factor.',
    ],
    examples: [
      { q: 'Add 2/3 + 1/4', steps: ['The denominators are 3 and 4. The smallest common multiple is 12.', 'Rewrite: 2/3 = 8/12 and 1/4 = 3/12.', 'Add the tops: 8/12 + 3/12 = 11/12.'], answer: '11/12' },
      { q: 'Subtract 5/6 − 1/2', steps: ['A common denominator is 6.', 'Rewrite 1/2 as 3/6.', '5/6 − 3/6 = 2/6.', 'Simplify 2/6 by dividing top and bottom by 2.'], answer: '1/3' },
      { q: 'Multiply 3/5 × 10', steps: ['Write 10 as 10/1.', 'Multiply across: (3 × 10)/(5 × 1) = 30/5.', '30 ÷ 5 = 6.'], answer: '6' },
      { q: 'Maya ate 1/3 of a pizza and her brother ate 1/4. How much of the pizza did they eat in total?', steps: ['Add 1/3 + 1/4.', 'Common denominator 12: 4/12 + 3/12.', '4/12 + 3/12 = 7/12.'], answer: '7/12 of the pizza' },
    ],
    practice: [
      { q: '1/2 + 1/3', a: '5/6' }, { q: '3/4 − 1/8', a: '5/8' }, { q: '2/3 × 3/4', a: '1/2' }, { q: '4 × 2/5', a: '8/5 = 1 3/5' }, { q: '7/10 − 1/5', a: '1/2' },
    ],
    faq: [
      { q: 'What fraction skills are taught in 5th grade?', a: 'Adding and subtracting fractions with unlike denominators, multiplying fractions (including by whole numbers), dividing unit fractions by whole numbers and whole numbers by unit fractions, and solving word problems with fractions.' },
      { q: 'How do you add fractions with different denominators?', a: 'Find a common denominator, rewrite each fraction with it, add the numerators, and simplify.' },
    ],
    quiz: [{ href: '/quiz/fractions', label: 'Free fractions quiz (5 questions)' }],
    related: [{ href: '/solve/fractions', label: 'All fraction rules with examples' }, { href: '/learn/simplifying-fractions', label: 'Simplifying fractions' }, { href: '/learn/equivalent-fractions-practice', label: 'Equivalent fractions practice' }],
    campaign: 'fractions_5th_grade',
  },
  'equivalent-fractions-practice': {
    title: 'Equivalent Fractions Practice',
    seoTitle: 'Equivalent Fractions Practice Questions (with Answers)',
    description: 'Practice equivalent fractions: how to find them, check them and fill in the missing number, with worked examples and answers. Great for 3rd and 4th grade.',
    audience: 'Grade 3 and 4 students, plus anyone reviewing fractions.',
    intro: 'Equivalent fractions name the same amount in different ways, like 1/2, 2/4 and 4/8. You make one by multiplying (or dividing) the top and bottom by the same number.',
    rules: [
      'Multiply the numerator and denominator by the same number to get an equivalent fraction.',
      'Divide the numerator and denominator by a common factor to get a simpler equivalent fraction.',
      'To check if two fractions are equivalent, cross-multiply: a/b = c/d when a × d = b × c.',
    ],
    examples: [
      { q: 'Find two fractions equivalent to 2/3', steps: ['Multiply top and bottom by 2: 4/6.', 'Multiply top and bottom by 3: 6/9.'], answer: '4/6 and 6/9 (many others work too)' },
      { q: 'Fill in the blank: 3/4 = ?/20', steps: ['4 × 5 = 20, so the bottom was multiplied by 5.', 'Multiply the top by 5 too: 3 × 5 = 15.'], answer: '15/20' },
      { q: 'Are 4/6 and 6/9 equivalent?', steps: ['Cross-multiply: 4 × 9 = 36 and 6 × 6 = 36.', 'The products are equal.'], answer: 'Yes, both equal 2/3' },
    ],
    practice: [
      { q: '1/2 = ?/10', a: '5' }, { q: '2/5 = 6/?', a: '15' }, { q: 'Is 3/8 equivalent to 6/16?', a: 'Yes' }, { q: '12/18 in simplest form', a: '2/3' }, { q: '5/6 = ?/24', a: '20' },
    ],
    faq: [
      { q: 'What is an equivalent fraction?', a: 'A fraction that shows the same amount as another fraction, even though the numbers are different, like 1/2 and 3/6.' },
      { q: 'How do you find equivalent fractions?', a: 'Multiply or divide both the numerator and the denominator by the same non-zero number.' },
    ],
    quiz: [{ href: '/quiz/fractions', label: 'Free fractions quiz (5 questions)' }],
    related: [{ href: '/learn/simplifying-fractions', label: 'Simplifying fractions' }, { href: '/learn/fractions-practice-5th-grade', label: 'Fractions practice for 5th grade' }],
    campaign: 'equivalent_fractions',
  },
  'simplifying-fractions': {
    title: 'Simplifying Fractions',
    seoTitle: 'Simplifying Fractions Step by Step (Examples and Practice)',
    description: 'Learn how to simplify fractions to lowest terms using the greatest common factor, including improper fractions, with worked examples and practice answers.',
    audience: 'Grade 4 to 6 students and anyone who needs a refresher.',
    intro: 'A fraction is in simplest form when the top and bottom have no common factor except 1. To simplify, divide both by their greatest common factor (GCF).',
    rules: [
      'Find the greatest common factor of the numerator and denominator.',
      'Divide both by the GCF.',
      'If you are not sure of the GCF, divide by any common factor and repeat until none is left.',
      'An improper fraction can be simplified, then written as a mixed number if you like.',
    ],
    examples: [
      { q: 'Simplify 18/24', steps: ['Factors of 18: 1, 2, 3, 6, 9, 18. Factors of 24: 1, 2, 3, 4, 6, 8, 12, 24.', 'The greatest common factor is 6.', '18 ÷ 6 = 3 and 24 ÷ 6 = 4.'], answer: '3/4' },
      { q: 'Simplify 45/60', steps: ['Both end in 0 or 5, so divide by 5: 9/12.', '9 and 12 share 3: divide by 3 to get 3/4.'], answer: '3/4' },
      { q: 'Simplify 28/8 and write it as a mixed number', steps: ['The GCF of 28 and 8 is 4: 28/8 = 7/2.', '7 ÷ 2 = 3 remainder 1.'], answer: '7/2 = 3 1/2' },
    ],
    practice: [
      { q: '10/15', a: '2/3' }, { q: '16/40', a: '2/5' }, { q: '21/28', a: '3/4' }, { q: '36/48', a: '3/4' }, { q: '27/6', a: '9/2 = 4 1/2' },
    ],
    faq: [
      { q: 'How do you know a fraction is fully simplified?', a: 'When the only whole number that divides both the top and the bottom is 1.' },
      { q: 'Does simplifying change the value of a fraction?', a: 'No. A simplified fraction is equivalent to the original; it just uses smaller numbers.' },
    ],
    quiz: [{ href: '/quiz/fractions', label: 'Free fractions quiz (5 questions)' }],
    related: [{ href: '/learn/equivalent-fractions-practice', label: 'Equivalent fractions practice' }, { href: '/fraction-calculator', label: 'Fraction calculator' }],
    campaign: 'simplifying_fractions',
  },
  'order-of-operations-practice-problems': {
    title: 'Order of Operations Practice Problems',
    seoTitle: 'Order of Operations Practice Problems with Answers (PEMDAS)',
    description: 'Order of operations practice problems with step-by-step answers. Learn PEMDAS (parentheses, exponents, multiply/divide, add/subtract) and avoid the common mistakes.',
    audience: 'Grade 5 to 7 students and pre-algebra learners.',
    intro: 'When a problem has more than one operation, the order matters. PEMDAS is a way to remember it: Parentheses, Exponents, Multiplication and Division (left to right), then Addition and Subtraction (left to right).',
    rules: [
      'Do anything inside parentheses or brackets first.',
      'Then exponents (powers and square roots).',
      'Then multiplication and division, working left to right. Neither one always comes first.',
      'Then addition and subtraction, also left to right.',
    ],
    examples: [
      { q: '3 + 4 × 2', steps: ['Multiply first: 4 × 2 = 8.', 'Then add: 3 + 8 = 11.'], answer: '11' },
      { q: '(6 + 2) × 3²', steps: ['Parentheses: 6 + 2 = 8.', 'Exponent: 3² = 9.', 'Multiply: 8 × 9 = 72.'], answer: '72' },
      { q: '20 ÷ 4 × 5', steps: ['Division and multiplication have the same rank, so go left to right.', '20 ÷ 4 = 5.', '5 × 5 = 25.'], answer: '25' },
      { q: '18 − 6 ÷ 3 + 2', steps: ['Divide first: 6 ÷ 3 = 2.', 'Now 18 − 2 + 2. Go left to right: 18 − 2 = 16.', '16 + 2 = 18.'], answer: '18' },
    ],
    practice: [
      { q: '5 + 3 × 4', a: '17' }, { q: '(5 + 3) × 4', a: '32' }, { q: '2³ + 6 ÷ 2', a: '11' }, { q: '12 − 4 + 3', a: '11' }, { q: '36 ÷ (2 + 4) × 3', a: '18' },
    ],
    faq: [
      { q: 'Does multiplication always come before division?', a: 'No. Multiplication and division have equal priority, so you do whichever comes first from left to right. The same is true for addition and subtraction.' },
      { q: 'What does PEMDAS stand for?', a: 'Parentheses, Exponents, Multiplication and Division, Addition and Subtraction. Some countries say BODMAS or BIDMAS, which mean the same order.' },
    ],
    quiz: [{ href: '/quiz/order-of-operations', label: 'Free order of operations quiz' }],
    related: [{ href: '/solve/order-of-operations', label: 'Order of operations explained' }],
    campaign: 'order_of_operations_practice',
  },
  'percent-word-problems': {
    title: 'Percent Word Problems',
    seoTitle: 'Percent Word Problems with Step-by-Step Solutions (6th and 7th Grade)',
    description: 'Solve percent word problems: percent of a number, discounts, tax, tips and percent increase or decrease, with worked solutions and practice answers.',
    audience: 'Grade 6 and 7 students and anyone working with discounts, tax or tips.',
    intro: 'Most percent word problems are one of three types: find a percent of a number, find what percent one number is of another, or find the whole when you know a part. Turning the percent into a decimal makes each one quick.',
    rules: [
      'Percent means "out of 100": 35% = 35/100 = 0.35.',
      'Part = percent × whole.',
      'Percent = part ÷ whole × 100.',
      'Percent change = (new − old) ÷ old × 100.',
    ],
    examples: [
      { q: 'A $40 shirt is 25% off. What is the sale price?', steps: ['25% of 40 = 0.25 × 40 = 10.', 'Subtract the discount: 40 − 10 = 30.'], answer: '$30' },
      { q: '18 of the 24 students in a class walk to school. What percent is that?', steps: ['Part ÷ whole = 18 ÷ 24 = 0.75.', '0.75 × 100 = 75.'], answer: '75%' },
      { q: 'A meal costs $50. You leave an 18% tip. How much is the tip?', steps: ['18% = 0.18.', '0.18 × 50 = 9.'], answer: '$9' },
      { q: 'A town grew from 2,000 to 2,300 people. What is the percent increase?', steps: ['Change: 2,300 − 2,000 = 300.', '300 ÷ 2,000 = 0.15.', '0.15 × 100 = 15.'], answer: '15% increase' },
    ],
    practice: [
      { q: 'What is 20% of 85?', a: '17' }, { q: '12 is what percent of 48?', a: '25%' }, { q: '30% of a number is 21. What is the number?', a: '70' }, { q: 'A $60 game is 15% off. Sale price?', a: '$51' }, { q: 'A price goes from $80 to $60. Percent change?', a: '25% decrease' },
    ],
    faq: [
      { q: 'How do you find the original price after a discount?', a: 'Divide the sale price by (1 − discount). For example, a $36 price after 10% off came from 36 ÷ 0.9 = $40.' },
      { q: 'How do you turn a percent into a decimal?', a: 'Divide by 100, which moves the decimal point two places left: 7% = 0.07, 125% = 1.25.' },
    ],
    quiz: [{ href: '/quiz/percentages', label: 'Free percentages quiz' }, { href: '/quiz/word-problems', label: 'Free word problems quiz' }],
    related: [{ href: '/solve/percentages', label: 'Percentages explained' }, { href: '/learn/ratio-word-problems', label: 'Ratio word problems' }],
    campaign: 'percent_word_problems',
  },
  'one-step-equations': {
    title: 'One-Step Equations',
    seoTitle: 'One-Step Equations: How to Solve Them (Examples and Practice)',
    description: 'Solve one-step equations by adding, subtracting, multiplying or dividing, including negative numbers, with worked examples, practice answers and a free quiz.',
    audience: 'Grade 6 and 7 students starting algebra.',
    intro: 'A one-step equation needs just one move to get the variable by itself. Do the opposite (inverse) operation to both sides, and always check your answer by putting it back in.',
    rules: [
      'If a number is added to x, subtract it from both sides.',
      'If a number is subtracted from x, add it to both sides.',
      'If x is multiplied by a number, divide both sides by it.',
      'If x is divided by a number, multiply both sides by it.',
    ],
    examples: [
      { q: 'x + 7 = 12', steps: ['Subtract 7 from both sides.', 'x = 12 − 7.', 'Check: 5 + 7 = 12 ✓'], answer: 'x = 5' },
      { q: 'y − 4 = −9', steps: ['Add 4 to both sides.', 'y = −9 + 4.', 'Check: −5 − 4 = −9 ✓'], answer: 'y = −5' },
      { q: '6n = 42', steps: ['Divide both sides by 6.', 'n = 42 ÷ 6.', 'Check: 6 × 7 = 42 ✓'], answer: 'n = 7' },
      { q: 'm/3 = 8', steps: ['Multiply both sides by 3.', 'm = 8 × 3.', 'Check: 24 ÷ 3 = 8 ✓'], answer: 'm = 24' },
    ],
    practice: [
      { q: 'x + 15 = 32', a: 'x = 17' }, { q: 'a − 6 = 2', a: 'a = 8' }, { q: '−4k = 28', a: 'k = −7' }, { q: 'p/5 = −3', a: 'p = −15' }, { q: '9 = t + 11', a: 't = −2' },
    ],
    faq: [
      { q: 'What is an inverse operation?', a: 'The operation that undoes another one: subtraction undoes addition, and division undoes multiplication.' },
      { q: 'Why do you do the same thing to both sides?', a: 'An equation is like a balanced scale. Doing the same thing to both sides keeps it balanced, so the answer stays correct.' },
    ],
    quiz: [{ href: '/quiz/linear-equations', label: 'Free linear equations quiz' }],
    related: [{ href: '/learn/two-step-equations', label: 'Two-step equations' }, { href: '/solve/linear-equations', label: 'Linear equations explained' }],
    campaign: 'one_step_equations',
  },
  'two-step-equations': {
    title: 'Two-Step Equations',
    seoTitle: 'Two-Step Equations Step by Step (with Fractions and Negatives)',
    description: 'How to solve two-step equations: undo addition or subtraction first, then multiplication or division. Worked examples with negatives and fractions, plus practice answers.',
    audience: 'Grade 7 and 8 students and pre-algebra learners.',
    intro: 'A two-step equation like 3x + 5 = 20 takes two moves. Undo the adding or subtracting first, then undo the multiplying or dividing. It is the order of operations in reverse.',
    rules: [
      'Step 1: add or subtract to move the constant term to the other side.',
      'Step 2: multiply or divide to get the variable alone.',
      'Check by substituting your answer into the original equation.',
    ],
    examples: [
      { q: '3x + 5 = 20', steps: ['Subtract 5 from both sides: 3x = 15.', 'Divide both sides by 3: x = 5.', 'Check: 3(5) + 5 = 20 ✓'], answer: 'x = 5' },
      { q: '−2y − 7 = 9', steps: ['Add 7 to both sides: −2y = 16.', 'Divide both sides by −2: y = −8.', 'Check: −2(−8) − 7 = 16 − 7 = 9 ✓'], answer: 'y = −8' },
      { q: 'x/4 + 3 = 7', steps: ['Subtract 3 from both sides: x/4 = 4.', 'Multiply both sides by 4: x = 16.', 'Check: 16/4 + 3 = 7 ✓'], answer: 'x = 16' },
      { q: '(2/3)n − 1 = 5', steps: ['Add 1 to both sides: (2/3)n = 6.', 'Multiply both sides by 3/2: n = 9.', 'Check: (2/3)(9) − 1 = 6 − 1 = 5 ✓'], answer: 'n = 9' },
    ],
    practice: [
      { q: '4x − 3 = 21', a: 'x = 6' }, { q: '5 + 2a = −11', a: 'a = −8' }, { q: 'k/3 − 2 = 4', a: 'k = 18' }, { q: '−6m + 4 = 34', a: 'm = −5' }, { q: '(3/4)p + 2 = 11', a: 'p = 12' },
    ],
    faq: [
      { q: 'Which step comes first in a two-step equation?', a: 'Usually undo the addition or subtraction first, then the multiplication or division.' },
      { q: 'What if the variable is on the right side?', a: 'Solve it the same way. For example, 17 = 2x + 3 gives 14 = 2x, so x = 7.' },
    ],
    quiz: [{ href: '/quiz/linear-equations', label: 'Free linear equations quiz' }],
    related: [{ href: '/solve/2x-plus-5-equals-17', label: 'Solve 2x + 5 = 17 step by step' }, { href: '/solve/3-x-minus-2-equals-15', label: 'Solve 3(x − 2) = 15 step by step' }, { href: '/solve/x-over-4-minus-3-equals-2', label: 'Solve x/4 − 3 = 2 step by step' }, { href: '/learn/one-step-equations', label: 'One-step equations' }, { href: '/learn/solve-quadratic-equation-step-by-step', label: 'Solve quadratic equations step by step' }],
    campaign: 'two_step_equations',
  },
  'ratio-word-problems': {
    title: 'Ratio Word Problems',
    seoTitle: 'Ratio Word Problems for 6th Grade (with Answers)',
    description: 'Ratio word problems with step-by-step answers: sharing in a ratio, scaling recipes, finding a missing amount and unit rates. Practice answers included.',
    audience: 'Grade 6 and 7 students.',
    intro: 'A ratio compares two amounts, like 3 red marbles for every 2 blue marbles (3:2). Most ratio problems can be solved by finding the value of one "part" and scaling up.',
    rules: [
      'Add the parts of the ratio to find the total number of parts.',
      'Divide the total amount by the number of parts to find one part.',
      'Multiply one part by each number in the ratio.',
      'For a missing amount, scale both sides of the ratio by the same number.',
    ],
    examples: [
      { q: 'Share 35 stickers between Ana and Ben in the ratio 3:4.', steps: ['Total parts: 3 + 4 = 7.', 'One part: 35 ÷ 7 = 5.', 'Ana: 3 × 5 = 15. Ben: 4 × 5 = 20.'], answer: 'Ana 15, Ben 20' },
      { q: 'A recipe uses 2 cups of flour for every 3 eggs. How many eggs for 8 cups of flour?', steps: ['8 cups is 4 times 2 cups.', 'Multiply the eggs by 4 too: 3 × 4 = 12.'], answer: '12 eggs' },
      { q: 'The ratio of boys to girls is 5:6 and there are 30 boys. How many girls?', steps: ['30 ÷ 5 = 6, so one part is 6.', 'Girls: 6 × 6 = 36.'], answer: '36 girls' },
      { q: '3 notebooks cost $4.50. What is the cost of one notebook?', steps: ['Unit rate: 4.50 ÷ 3 = 1.50.'], answer: '$1.50 each' },
    ],
    practice: [
      { q: 'Share 24 in the ratio 1:3', a: '6 and 18' }, { q: '4:7 = 12:?', a: '21' }, { q: '5 pens cost $3. Cost of 15 pens?', a: '$9' }, { q: 'Cats to dogs is 2:5 with 15 dogs. Cats?', a: '6' }, { q: 'Simplify the ratio 18:24', a: '3:4' },
    ],
    faq: [
      { q: 'What is the difference between a ratio and a fraction?', a: 'A ratio compares part to part (3 red : 2 blue), while a fraction usually compares part to whole (3 of 5 marbles are red, so 3/5).' },
      { q: 'What is a unit rate?', a: 'A rate for one unit of something, such as dollars per item or miles per hour.' },
    ],
    quiz: [{ href: '/quiz/word-problems', label: 'Free word problems quiz' }],
    related: [{ href: '/learn/percent-word-problems', label: 'Percent word problems' }, { href: '/solve/word-problems', label: 'Word problems explained' }],
    campaign: 'ratio_word_problems',
  },
  'solve-quadratic-equation-step-by-step': {
    title: 'Solve a Quadratic Equation Step by Step',
    seoTitle: 'How to Solve a Quadratic Equation Step by Step (3 Methods)',
    description: 'Solve quadratic equations step by step by factoring, the quadratic formula and completing the square, with worked examples and practice answers.',
    audience: 'Algebra 1 and Algebra 2 students (grades 8 to 11).',
    intro: 'A quadratic equation can be written as ax² + bx + c = 0. First move every term to one side so the other side is 0, then pick a method: factoring is fastest when it works, and the quadratic formula always works.',
    rules: [
      'Write the equation in standard form: ax² + bx + c = 0.',
      'Factoring: find two numbers that multiply to a·c and add to b, then set each factor equal to 0.',
      'Quadratic formula: x = (−b ± √(b² − 4ac)) / (2a).',
      'The discriminant b² − 4ac tells you how many real solutions: positive = 2, zero = 1, negative = none.',
    ],
    examples: [
      { q: 'Solve x² + 5x + 6 = 0 by factoring', steps: ['Find two numbers that multiply to 6 and add to 5: 2 and 3.', 'Factor: (x + 2)(x + 3) = 0.', 'Set each factor to 0: x + 2 = 0 or x + 3 = 0.'], answer: 'x = −2 or x = −3' },
      { q: 'Solve 2x² − 3x − 2 = 0 with the quadratic formula', steps: ['a = 2, b = −3, c = −2.', 'Discriminant: (−3)² − 4(2)(−2) = 9 + 16 = 25.', 'x = (3 ± √25) / 4 = (3 ± 5) / 4.', '(3 + 5)/4 = 2 and (3 − 5)/4 = −1/2.'], answer: 'x = 2 or x = −1/2' },
      { q: 'Solve x² − 6x + 4 = 0 by completing the square', steps: ['Move the constant: x² − 6x = −4.', 'Half of −6 is −3, and (−3)² = 9. Add 9 to both sides: x² − 6x + 9 = 5.', 'Write as a square: (x − 3)² = 5.', 'Take square roots: x − 3 = ±√5.'], answer: 'x = 3 ± √5' },
      { q: 'Solve x² = 3x + 10', steps: ['Standard form: x² − 3x − 10 = 0.', 'Two numbers that multiply to −10 and add to −3: −5 and 2.', '(x − 5)(x + 2) = 0.'], answer: 'x = 5 or x = −2' },
    ],
    practice: [
      { q: 'x² − 7x + 12 = 0', a: 'x = 3 or x = 4' }, { q: 'x² − 16 = 0', a: 'x = 4 or x = −4' }, { q: '3x² + 2x − 1 = 0', a: 'x = 1/3 or x = −1' }, { q: 'x² + 4x + 1 = 0', a: 'x = −2 ± √3' }, { q: 'x² + 2x + 5 = 0', a: 'No real solutions (discriminant −16)' },
    ],
    faq: [
      { q: 'Which method should I use to solve a quadratic?', a: 'Try factoring first if the numbers are small. If it does not factor nicely, use the quadratic formula, which works for every quadratic.' },
      { q: 'Can a quadratic have no solution?', a: 'It can have no real solution. That happens when the discriminant b² − 4ac is negative.' },
    ],
    quiz: [{ href: '/quiz/linear-equations', label: 'Warm up: free linear equations quiz' }],
    related: [{ href: '/quadratic-equation-solver', label: 'Quadratic equation solver' }, { href: '/solve/algebra', label: 'Algebra help' }],
    campaign: 'solve_quadratic',
  },
}

export const LEARN_SLUGS = Object.keys(LEARN_PAGES)
