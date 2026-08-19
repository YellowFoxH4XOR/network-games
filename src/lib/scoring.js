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

// Memory match: 8 pairs on a 60s clock. Points per pair are 15 × combo (combo
// caps at 4) plus a small speed bonus, and clearing the board pays a finish
// bonus — but the running total is clamped to MEMORY_MAX, because the combo
// multiplier alone can carry an unclamped board past the cap (see below).
export const MEMORY_PAIRS = 8;
export const MEMORY_SECONDS = 60;
export const MEMORY_COMBO_CAP = 4;
export const memoryPairPoints = (combo, secondsLeft) =>
  15 * Math.min(combo, MEMORY_COMBO_CAP) + Math.floor(secondsLeft / 4);
export const memoryClearBonus = (secondsLeft) => Math.floor(secondsLeft * 0.8);

// ZTP basketball: 5 shots, 40 per goal, −10 for hitting the wrong hoop
// (floored at 0), 0 for an airball.
export const ZTP_SHOTS = 5;
export const ZTP_GOAL_POINTS = 40;
export const ZTP_PENALTY = 10;

// Spin wheel: 3 spins; each lands on a networking topic and asks one question
// from it, scored exactly like a quiz question (10 + speed bonus).
export const SPIN_ROUNDS = 3;
export const SPIN_SECONDS_PER_Q = 30;

// The maximum an honest player can score — answer every question instantly,
// find every word with the full clock left, sink every shot. These must match
// MAX_SCORE in api/score.js, or a forged score could out-rank honest play.
export const QUIZ_MAX = QUIZ_QUESTIONS_PER_ROUND * quizPoints(QUIZ_SECONDS_PER_Q); // 100
export const WORDSEARCH_MAX = WORD_COUNT * WORD_POINTS + wordsearchTimeBonus(WORDSEARCH_SECONDS); // 130
export const ZTP_MAX = ZTP_SHOTS * ZTP_GOAL_POINTS; // 200
export const SPIN_MAX = SPIN_ROUNDS * quizPoints(SPIN_SECONDS_PER_Q); // 60
// Memory's own formula has no natural 200 ceiling — a perfect combo run scores
// 15×(1+2+3+4+4+4+4+4) = 390 in base points alone — so the game clamps to this
// value as it accumulates. Without the clamp the server rejects the honest
// score outright (api/score.js returns 400 above the cap rather than clamping),
// which silently drops a top run from the leaderboard.
export const MEMORY_MAX = 200;
