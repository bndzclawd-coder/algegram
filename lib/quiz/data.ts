// Seeded quiz questions we wrote ourselves (COPPA: no user-typed content is ever published).
export type QuizQ = { q: string; choices: string[]; answer: number; why: string }
export type Quiz = { title: string; description: string; questions: QuizQ[] }

export const QUIZZES: Record<string, Quiz> = {
  fractions: { title: 'Fractions', description: 'Add, subtract, multiply and divide fractions.', questions: [
    { q: '3/4 + 1/6 = ?', choices: ['4/10', '11/12', '1/2', '5/6'], answer: 1, why: 'To add fractions, make the bottoms match. 12 works for both: $\\frac{3}{4} = \\frac{9}{12}$ and $\\frac{1}{6} = \\frac{2}{12}$. Now add the tops: $\\frac{9}{12} + \\frac{2}{12} = \\frac{11}{12}$. (Adding tops and bottoms, like 4/10, is a common slip.)' },
    { q: '5/6 − 1/4 = ?', choices: ['7/12', '4/2', '1/3', '2/3'], answer: 0, why: 'Make the bottoms match first. $\\frac{5}{6} = \\frac{10}{12}$ and $\\frac{1}{4} = \\frac{3}{12}$. Then subtract the tops: $\\frac{10}{12} - \\frac{3}{12} = \\frac{7}{12}$.' },
    { q: '2/3 × 9/10 = ?', choices: ['11/13', '18/13', '3/5', '2/5'], answer: 2, why: 'To multiply fractions, multiply top × top and bottom × bottom: $\\frac{2 \\times 9}{3 \\times 10} = \\frac{18}{30}$. Divide top and bottom by 6 to simplify: $\\frac{3}{5}$.' },
    { q: '3/5 ÷ 9/10 = ?', choices: ['27/50', '2/3', '3/2', '1/3'], answer: 1, why: 'Dividing by a fraction is the same as multiplying by it upside down: $\\frac{3}{5} \\times \\frac{10}{9} = \\frac{30}{45}$. Divide top and bottom by 15: $\\frac{2}{3}$.' },
    { q: 'Simplify 18/24', choices: ['3/4', '2/3', '9/12', '6/8'], answer: 0, why: 'Find the biggest number that goes into both 18 and 24. That is 6. $18 \\div 6 = 3$ and $24 \\div 6 = 4$, so the answer is $\\frac{3}{4}$. (9/12 and 6/8 are equal, but not fully simplified.)' },
  ] },
  'linear-equations': { title: 'Linear Equations', description: 'Solve one- and two-step equations.', questions: [
    { q: 'Solve 2x − 5 = 7', choices: ['x = 1', 'x = 6', 'x = 12', 'x = 3.5'], answer: 1, why: 'Undo the −5 by adding 5 to both sides: $2x = 12$. Then undo the ×2 by dividing both sides by 2: $x = 6$. Check: $2(6) - 5 = 7$. ✓' },
    { q: 'Solve 3x + 7 = 22', choices: ['x = 5', 'x = 29/3', 'x = 15', 'x = 3'], answer: 0, why: 'Take 7 away from both sides: $3x = 15$. Divide both sides by 3: $x = 5$. Check: $3(5) + 7 = 22$. ✓' },
    { q: 'Solve x/4 + 1 = 6', choices: ['x = 5/4', 'x = 28', 'x = 20', 'x = 24'], answer: 2, why: 'Take 1 away from both sides: $\\frac{x}{4} = 5$. Undo the ÷4 by multiplying both sides by 4: $x = 20$. Check: $20 \\div 4 + 1 = 6$. ✓' },
    { q: 'Solve 5x − 4 = 2x + 11', choices: ['x = 7/3', 'x = 5', 'x = 15', 'x = 3'], answer: 1, why: 'Get the x terms on one side: take $2x$ from both sides to get $3x - 4 = 11$. Add 4: $3x = 15$. Divide by 3: $x = 5$.' },
    { q: 'Solve 2(x + 3) = 4x − 8', choices: ['x = 7', 'x = 1', 'x = −7', 'x = 2.5'], answer: 0, why: 'First open the bracket: $2(x + 3) = 2x + 6$. So $2x + 6 = 4x - 8$. Take $2x$ from both sides and add 8: $14 = 2x$. So $x = 7$.' },
  ] },
  percentages: { title: 'Percentages', description: 'Percent of a number, change and discounts.', questions: [
    { q: 'What is 15% of 80?', choices: ['15', '8', '12', '65'], answer: 2, why: '15% means 15 out of 100, or $0.15$. Multiply: $0.15 \\times 80 = 12$. Quick check: 10% of 80 is 8, and 5% is 4, so 15% is $8 + 4 = 12$.' },
    { q: 'What percent of 50 is 18?', choices: ['18%', '36%', '32%', '9%'], answer: 1, why: 'Divide the part by the whole: $18 \\div 50 = 0.36$. Multiply by 100 to get a percent: 36%.' },
    { q: 'A $60 jacket is 30% off. Sale price?', choices: ['$42', '$30', '$18', '$57'], answer: 0, why: 'Find the discount: 30% of 60 is $0.3 \\times 60 = 18$. Take it off the price: $60 - 18 = 42$. So the jacket costs **42 dollars**. (18 dollars is the discount, not the price.)' },
    { q: 'From 40 to 50 is a percent increase of…', choices: ['10%', '20%', '25%', '50%'], answer: 2, why: 'The change is $50 - 40 = 10$. Divide by the **starting** amount: $10 \\div 40 = 0.25$, which is 25%.' },
    { q: '25% as a fraction is…', choices: ['1/25', '1/4', '2/5', '1/2'], answer: 1, why: '25% means $\\frac{25}{100}$. Divide top and bottom by 25: $\\frac{1}{4}$.' },
  ] },
  'order-of-operations': { title: 'Order of Operations', description: 'PEMDAS / BODMAS practice.', questions: [
    { q: '3 + 4 × 2 = ?', choices: ['14', '11', '10', '9'], answer: 1, why: 'Multiplication comes before addition. First $4 \\times 2 = 8$, then $3 + 8 = 11$. (Going left to right gives 14, which is the common slip.)' },
    { q: '(6 + 2) × 3² = ?', choices: ['72', '24', '576', '54'], answer: 0, why: 'Brackets first: $6 + 2 = 8$. Then the power: $3^2 = 9$. Then multiply: $8 \\times 9 = 72$.' },
    { q: '20 ÷ 4 × 5 = ?', choices: ['1', '25', '100', '4'], answer: 1, why: '× and ÷ have the same rank, so go left to right: $20 \\div 4 = 5$, then $5 \\times 5 = 25$.' },
    { q: '18 − 6 ÷ 3 + 2³ = ?', choices: ['12', '24', '20', '12.67'], answer: 1, why: 'Powers first: $2^3 = 8$. Then division: $6 \\div 3 = 2$. Then left to right: $18 - 2 + 8 = 24$.' },
    { q: '10 − 2 × (3 + 1) = ?', choices: ['32', '2', '6', '−2'], answer: 1, why: 'Brackets first: $3 + 1 = 4$. Then multiply: $2 \\times 4 = 8$. Then subtract: $10 - 8 = 2$.' },
  ] },
  'word-problems': { title: 'Word Problems', description: 'Turn stories into equations.', questions: [
    { q: 'A train goes 180 miles in 3 hours. How far in 5 hours at the same speed?', choices: ['300 miles', '360 miles', '240 miles', '900 miles'], answer: 0, why: 'First find the distance in 1 hour: $180 \\div 3 = 60$ miles. Then 5 hours: $60 \\times 5 = 300$ miles.' },
    { q: 'Two consecutive numbers add to 37. The smaller is…', choices: ['17', '18', '19', '18.5'], answer: 1, why: 'Consecutive numbers sit next to each other, like 18 and 19. Call the smaller one $n$: $n + (n + 1) = 37$, so $2n = 36$ and $n = 18$. Check: $18 + 19 = 37$. ✓' },
    { q: 'Maya has 3 times as many stickers as Leo. Together 48. Leo has…', choices: ['16', '12', '36', '24'], answer: 1, why: 'Call Leo\'s stickers $s$. Maya has $3s$. Together: $s + 3s = 4s = 48$, so $s = 12$. (36 is Maya\'s amount.)' },
    { q: 'Pens cost $2 each. You pay $14. How many pens?', choices: ['6', '7', '12', '28'], answer: 1, why: 'Each pen costs 2 dollars, so count how many 2s fit in 14: $14 \\div 2 = 7$ pens.' },
    { q: 'A recipe needs 3 eggs per cake. Eggs for 4 cakes?', choices: ['7', '12', '9', '15'], answer: 1, why: 'Each cake needs 3 eggs, and there are 4 cakes: $3 \\times 4 = 12$ eggs.' },
  ] },
}
