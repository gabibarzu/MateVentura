import { AnswerPosition, MathQuestion, Operator, QuestionEquation } from './game.models';

export type AdventureLevelId = 'rocket' | 'forest' | 'bridge';
export interface AdventureProgress { completed: number; step: number; }
export interface AdventureStep {
  question: MathQuestion;
  equation: QuestionEquation;
  answerPosition: AnswerPosition;
  hint: string;
  explanation: string;
}
export interface AdventureLevel {
  id: AdventureLevelId;
  number: number;
  title: string;
  mission: string;
  description: string;
  intro: string;
  unit: string;
  start: string;
  replay: string;
  tasks: readonly (readonly AdventureStep[])[];
}

function exercise(a: number, b: number, operator: Operator, answerPosition: AnswerPosition = 'result', hint = ''): AdventureStep {
  const result = operator === '+' ? a + b : a - b;
  return {
    question: { id: 1, operandA: a, operandB: b, operator,
      correctAnswer: answerPosition === 'operandA' ? a : answerPosition === 'operandB' ? b : result },
    equation: { operandA: a, operandB: b, operator, result },
    answerPosition,
    hint: hint || (operator === '+' ? `Pornește de la ${a} și adaugă ${b}.` : `Pornește de la ${a} și ia ${b}.`),
    explanation: `${a} ${operator} ${b} = ${result}`,
  };
}

/** Each bridge board needs a make-ten step and then the remaining calculation. */
function bridgeAddition(a: number, b: number): readonly AdventureStep[] {
  const needed = 10 - a;
  const rest = b - needed;
  const split = `Desfacem ${b} în ${needed} și ${rest}.`;
  return [
    exercise(a, needed, '+', 'operandB', `Pentru ${a} + ${b}, întâi completăm zecea: cât lipsește de la ${a} până la 10?`),
    { ...exercise(10, rest, '+', 'result', `${split} Avem deja 10; adaugă restul, ${rest}.`),
      explanation: `${split} ${a} + ${b} = 10 + ${rest} = ${a + b}` },
  ];
}

export const ROCKET_PARTS = ['Motorul', 'Aripa stângă', 'Aripa dreaptă', 'Hubloul', 'Vârful rachetei'];
export const ADVENTURE_LEVELS: readonly AdventureLevel[] = [
  {
    id: 'rocket', number: 1, title: 'Atelierul de rachete', mission: 'Repară racheta lui Cifrel',
    description: 'Cinci piese de reparat. Fără grabă, fără penalizări.',
    intro: 'Am desfăcut racheta în loc de gustare! Mă ajuți cu cinci calcule? Dacă ne încurcăm, reparăm împreună.',
    unit: 'piese', start: 'Hai să reparăm!', replay: 'Mai reparăm o dată',
    tasks: [[exercise(2, 3, '+')], [exercise(4, 2, '+')], [exercise(7, 3, '-')], [exercise(5, 4, '+')], [exercise(10, 2, '-')]],
  },
  {
    id: 'forest', number: 2, title: 'Pădurea Adunărilor', mission: 'Aprinde felinarele pădurii',
    description: 'Cinci felinare. Găsește numărul lipsă în adunări până la 10.',
    intro: 'Poteca este întunecată! Completează adunările și aprindem cinci felinare. La final ne întâmpină licuricii.',
    unit: 'felinare', start: 'Să luminăm poteca!', replay: 'Mai luminăm o dată',
    tasks: [
      [exercise(2, 3, '+', 'operandB', 'Cât adaugi la 2 ca să ajungi la 5?')],
      [exercise(4, 2, '+', 'operandA', 'Ce număr, împreună cu 2, face 6? Poți lua 2 din 6.')],
      [exercise(5, 3, '+', 'operandB', 'Numără de la 5 până la 8. Câți pași sunt?')],
      [exercise(3, 6, '+', 'operandA', 'Ce număr, împreună cu 6, face 9? Poți lua 6 din 9.')],
      [exercise(6, 4, '+', 'operandB', 'Cât lipsește de la 6 până la 10?')],
    ],
  },
  {
    id: 'bridge', number: 3, title: 'Podul Numerelor', mission: 'Construiește podul peste râu',
    description: 'Cinci scânduri. Facem mai întâi 10, apoi calculăm restul.',
    intro: 'Cifrel vrea să treacă râul! Fiecare scândură are doi pași: ajungem la 10, apoi folosim ce a rămas. Nicio grabă!',
    unit: 'scânduri', start: 'Să construim podul!', replay: 'Mai construim o dată',
    tasks: [bridgeAddition(8, 5), bridgeAddition(9, 4), bridgeAddition(7, 6), bridgeAddition(6, 7), [
      exercise(13, 3, '-', 'operandB', 'Pentru 13 − 5, întâi ajungem la 10. Cât luăm din 13?'),
      { ...exercise(10, 2, '-', 'result', 'Desfacem 5 în 3 și 2. Am luat deja 3; mai luăm 2 din 10.'),
        explanation: '13 − 5 = 13 − 3 − 2 = 10 − 2 = 8' },
    ]],
  },
];

export function adventureLevel(id: AdventureLevelId): AdventureLevel {
  return ADVENTURE_LEVELS.find(level => level.id === id)!;
}