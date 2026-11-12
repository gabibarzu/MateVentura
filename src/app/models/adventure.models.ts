import { AnswerPosition, MathQuestion, Operator, QuestionEquation } from './game.models';

export type AdventureLevelId = 'rocket' | 'forest' | 'bridge' | 'train' | 'balloons' | 'crystals' | 'village' | 'lighthouse';
export interface AdventureProgress { completed: number; step: number; }
export interface AdventureStep {
  question: MathQuestion;
  equation: QuestionEquation;
  answerPosition: AnswerPosition;
  hint: string;
  explanation: string;
  prompt?: string;
  sequence?: readonly (number | null)[];
  comparison?: readonly [number, number];
  illustration?: string;
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

function comparison(a: number, b: number): AdventureStep {
  const answer = a < b ? 0 : a === b ? 1 : 2;
  return { ...exercise(answer, 0, '+'), comparison: [a, b],
    hint: 'Alege semnul: gura deschisă privește numărul mai mare.',
    explanation: `${a} ${['<', '=', '>'][answer]} ${b}` };
}

function sequence(numbers: readonly (number | null)[], answer: number, difference: number): AdventureStep {
  return { ...exercise(answer, 0, '+'), sequence: numbers,
    hint: `La fiecare pas ${difference > 0 ? 'adăugăm' : 'scădem'} ${Math.abs(difference)}.`,
    explanation: numbers.map(n => n === null ? answer : n).join(', ') };
}

function story(a: number, b: number, operator: Operator, prompt: string, illustration: string): AdventureStep {
  return { ...exercise(a, b, operator), prompt, illustration };
}
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
  {
    id: 'train', number: 4, title: 'Gara Vagoanelor', mission: 'Pregătește trenul lui Cifrel',
    description: 'Cinci vagoane. Descoperim zecea și unitățile până la 20.',
    intro: 'Trenul așteaptă în gară! Găsește unitățile ca să aduci vagonul, apoi formează numărul ca să îl cuplezi.',
    unit: 'vagoane', start: 'Pregătim trenul!', replay: 'Mai pregătim un tren',
    tasks: [14, 16, 12, 19, 18].map(n => [
      { ...exercise(10, n - 10, '+', 'operandB'), prompt: `Numărul ${n} are o zece și câte unități?`,
        hint: `Din ${n} luăm o zece. Câte unități rămân?` },
      { ...exercise(10, n - 10, '+'), prompt: `O zece și ${n - 10} unități formează ce număr?`,
        hint: `Pornește de la 10 și adaugă ${n - 10} unități.` },
    ]),
  },
  {
    id: 'balloons', number: 5, title: 'Poiana Baloanelor', mission: 'Ridică baloanele prietenilor',
    description: 'Cinci baloane. Comparăm numerele cu <, = și >.',
    intro: 'Prietenii vor să vadă poiana de sus! Alege semnul potrivit între numere și fiecare balon se ridică.',
    unit: 'baloane', start: 'Ridicăm baloanele!', replay: 'Mai ridicăm o paradă',
    tasks: [[comparison(8, 12)], [comparison(15, 9)], [comparison(10, 10)], [comparison(14, 17)], [comparison(20, 16)]],
  },
  {
    id: 'crystals', number: 6, title: 'Peștera Cristalelor', mission: 'Descoperă pictura ascunsă',
    description: 'Cinci cristale. Găsește numerele lipsă din șiruri.',
    intro: 'Pictura Număriliei se ascunde în întuneric! Urmărește regula fiecărui șir și aprinde cristalele.',
    unit: 'cristale', start: 'Explorăm peștera!', replay: 'Mai explorăm o dată',
    tasks: [[sequence([2, 4, null, 8], 6, 2)], [sequence([5, null, 9, 11], 7, 2)],
      [sequence([15, null, 11, 9], 13, -2)], [sequence([0, 5, null, 15], 10, 5)],
      [sequence([20, 15, null, 5], 10, -5)]],
  },
  {
    id: 'village', number: 7, title: 'Satul Prietenilor', mission: 'Pregătește sărbătoarea din sat',
    description: 'Cinci prieteni. Rezolvăm mici povești cu numere.',
    intro: 'Fiecare prieten pregătește ceva pentru sărbătoare. Citește povestea și ajută-i să numere!',
    unit: 'prieteni ajutați', start: 'Ajutăm prietenii!', replay: 'Mai ajutăm o dată',
    tasks: [
      [story(7, 5, '+', 'Ariciul are 7 mere și primește încă 5. Câte mere are acum?', '🦔 🍎')],
      [story(14, 4, '-', 'Iepurașul are 14 morcovi și oferă 4 prietenilor. Câți morcovi îi rămân?', '🐰 🥕')],
      [story(6, 6, '+', 'Veverița aduce 6 nuci dimineața și încă 6 seara. Câte nuci aduce în total?', '🐿️ 🌰')],
      [story(15, 7, '-', 'Ursulețul are 15 prăjituri. Prietenii mănâncă 7. Câte prăjituri rămân?', '🐻 🧁')],
      [story(9, 8, '+', 'Vulpea pune 9 flori într-o vază și 8 în alta. Câte flori sunt în total?', '🦊 🌼')],
    ],
  },
  {
    id: 'lighthouse', number: 8, title: 'Farul Număriliei', mission: 'Aprinde farul de la mare',
    description: 'Cinci lumini. Adunări, scăderi și numere lipsă până la 20.',
    intro: 'Se lasă seara, iar corăbiile caută drumul spre casă! Folosește ce ai învățat ca să aprinzi cele cinci lumini ale farului. La final, raza lui va lumina marea.',
    unit: 'lumini', start: 'Aprindem farul!', replay: 'Mai luminăm marea o dată',
    tasks: [
      [exercise(8, 7, '+', 'result', 'Completează mai întâi zecea: 8 + 2 = 10. Din 7 mai rămân 5.')],
      [exercise(16, 6, '-', 'result', '16 înseamnă o zece și 6 unități. Luăm cele 6 unități.')],
      [exercise(9, 5, '+', 'operandB', 'De la 9 până la 10 este un pas. De la 10 până la 14 mai sunt 4.')],
      [exercise(13, 5, '-', 'operandA', 'Ce număr avea farul înainte să folosească 5 lumini și să rămână cu 8? Adună 8 și 5.')],
      [exercise(20, 8, '-', 'result', 'Din 20 ia mai întâi 5, apoi încă 3: 20 − 5 = 15.')],
    ],
  },
];

export function adventureLevel(id: AdventureLevelId): AdventureLevel {
  return ADVENTURE_LEVELS.find(level => level.id === id)!;
}