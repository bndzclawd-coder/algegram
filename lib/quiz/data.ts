// Seeded quiz questions we wrote ourselves (COPPA: no user-typed content is ever published).
export type QuizQ = { q: string; choices: string[]; answer: number; why: string }
export type Quiz = { title: string; description: string; questions: QuizQ[] }

export const QUIZZES: Record<string, Quiz> = {
  fractions: { title: 'Fractions', description: 'Add, subtract, multiply and divide fractions.', questions: [
    { q: '3/4 + 1/6 = ?', choices: ['4/10', '11/12', '1/2', '5/6'], answer: 1, why: '3/4 = 9/12 and 1/6 = 2/12, so 9/12 + 2/12 = 11/12.' },
    { q: '5/6 − 1/4 = ?', choices: ['7/12', '4/2', '1/3', '2/3'], answer: 0, why: '5/6 = 10/12 and 1/4 = 3/12, so 10/12 − 3/12 = 7/12.' },
    { q: '2/3 × 9/10 = ?', choices: ['11/13', '18/13', '3/5', '2/5'], answer: 2, why: '(2 × 9)/(3 × 10) = 18/30 = 3/5.' },
    { q: '3/5 ÷ 9/10 = ?', choices: ['27/50', '2/3', '3/2', '1/3'], answer: 1, why: '3/5 × 10/9 = 30/45 = 2/3.' },
    { q: 'Simplify 18/24', choices: ['3/4', '2/3', '9/12', '6/8'], answer: 0, why: 'Divide top and bottom by 6: 3/4.' },
  ] },
  'linear-equations': { title: 'Linear Equations', description: 'Solve one- and two-step equations.', questions: [
    { q: 'Solve 2x − 5 = 7', choices: ['x = 1', 'x = 6', 'x = 12', 'x = 3.5'], answer: 1, why: 'Add 5: 2x = 12. Divide by 2: x = 6.' },
    { q: 'Solve 3x + 7 = 22', choices: ['x = 5', 'x = 29/3', 'x = 15', 'x = 3'], answer: 0, why: 'Subtract 7: 3x = 15. Divide by 3: x = 5.' },
    { q: 'Solve x/4 + 1 = 6', choices: ['x = 5/4', 'x = 28', 'x = 20', 'x = 24'], answer: 2, why: 'Subtract 1: x/4 = 5. Multiply by 4: x = 20.' },
    { q: 'Solve 5x − 4 = 2x + 11', choices: ['x = 7/3', 'x = 5', 'x = 15', 'x = 3'], answer: 1, why: 'Subtract 2x: 3x − 4 = 11. Add 4: 3x = 15. x = 5.' },
    { q: 'Solve 2(x + 3) = 4x − 8', choices: ['x = 7', 'x = 1', 'x = −7', 'x = 2.5'], answer: 0, why: '2x + 6 = 4x − 8, so 14 = 2x and x = 7.' },
  ] },
  percentages: { title: 'Percentages', description: 'Percent of a number, change and discounts.', questions: [
    { q: 'What is 15% of 80?', choices: ['15', '8', '12', '65'], answer: 2, why: '0.15 × 80 = 12.' },
    { q: 'What percent of 50 is 18?', choices: ['18%', '36%', '32%', '9%'], answer: 1, why: '18 ÷ 50 = 0.36 = 36%.' },
    { q: 'A $60 jacket is 30% off. Sale price?', choices: ['$42', '$30', '$18', '$57'], answer: 0, why: '30% of 60 is 18; 60 − 18 = 42.' },
    { q: 'From 40 to 50 is a percent increase of…', choices: ['10%', '20%', '25%', '50%'], answer: 2, why: 'Change 10 ÷ original 40 = 0.25 = 25%.' },
    { q: '25% as a fraction is…', choices: ['1/25', '1/4', '2/5', '1/2'], answer: 1, why: '25/100 simplifies to 1/4.' },
  ] },
  'order-of-operations': { title: 'Order of Operations', description: 'PEMDAS / BODMAS practice.', questions: [
    { q: '3 + 4 × 2 = ?', choices: ['14', '11', '10', '9'], answer: 1, why: 'Multiply first: 4 × 2 = 8, then 3 + 8 = 11.' },
    { q: '(6 + 2) × 3² = ?', choices: ['72', '24', '576', '54'], answer: 0, why: '8 × 9 = 72.' },
    { q: '20 ÷ 4 × 5 = ?', choices: ['1', '25', '100', '4'], answer: 1, why: 'Left to right: 20 ÷ 4 = 5, then 5 × 5 = 25.' },
    { q: '18 − 6 ÷ 3 + 2³ = ?', choices: ['12', '24', '20', '12.67'], answer: 1, why: '2³ = 8, 6 ÷ 3 = 2, so 18 − 2 + 8 = 24.' },
    { q: '10 − 2 × (3 + 1) = ?', choices: ['32', '2', '6', '−2'], answer: 1, why: '3 + 1 = 4, 2 × 4 = 8, 10 − 8 = 2.' },
  ] },
  'word-problems': { title: 'Word Problems', description: 'Turn stories into equations.', questions: [
    { q: 'A train goes 180 miles in 3 hours. How far in 5 hours at the same speed?', choices: ['300 miles', '360 miles', '240 miles', '900 miles'], answer: 0, why: '180 ÷ 3 = 60 mph; 60 × 5 = 300.' },
    { q: 'Two consecutive numbers add to 37. The smaller is…', choices: ['17', '18', '19', '18.5'], answer: 1, why: 'n + (n + 1) = 37, so n = 18.' },
    { q: 'Maya has 3 times as many stickers as Leo. Together 48. Leo has…', choices: ['16', '12', '36', '24'], answer: 1, why: 's + 3s = 48, so s = 12.' },
    { q: 'Pens cost $2 each. You pay $14. How many pens?', choices: ['6', '7', '12', '28'], answer: 1, why: '14 ÷ 2 = 7.' },
    { q: 'A recipe needs 3 eggs per cake. Eggs for 4 cakes?', choices: ['7', '12', '9', '15'], answer: 1, why: '3 × 4 = 12.' },
  ] },
}
