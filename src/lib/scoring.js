// Scoring rules, kept in one place so the games and the tests agree on them
// (and so the server's MAX_SCORE caps in api/score.js can be checked against the
// real honest maximum — see scoring.test.js).

export const QUIZ_QUESTIONS_PER_ROUND = 5;
export const QUIZ_SECONDS_PER_Q = 30;
export const WORD_COUNT = 10;
export const WORDSEARCH_SECONDS = 300;

// Quiz: a correct answer is worth a base 10 plus a speed bonus of ⌊timeLeft/3⌋.
export const quizPoints = (timeLeft) => 10 + Math.floor(timeLeft / 3);

// Word search: 10 per word found, plus a finish bonus of ⌊secondsLeft/10⌋ when
// every word is found before time runs out.
export const WORD_POINTS = 10;
export const wordsearchTimeBonus = (secondsLeft) => Math.floor(secondsLeft / 10);

// The maximum an honest player can score — answer every question instantly and
// find every word with the full clock left. These must match MAX_SCORE in
// api/score.js, or a forged score could out-rank honest play.
export const QUIZ_MAX = QUIZ_QUESTIONS_PER_ROUND * quizPoints(QUIZ_SECONDS_PER_Q); // 100
export const WORDSEARCH_MAX = WORD_COUNT * WORD_POINTS + wordsearchTimeBonus(WORDSEARCH_SECONDS); // 130
