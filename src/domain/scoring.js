export function isCorrectAnswer(question, isSame) {
  return (question.type === 'match' && isSame) || (question.type === 'mismatch' && !isSame);
}

export function applyAnswerScore(game, correct) {
  const win = Number(game.level?.scoreWin || 0);
  const loss = Number(game.level?.scoreLoss || 0);
  game.score = correct ? game.score + win : Math.max(0, game.score - loss);
}

export function applySkipScore(game) {
  game.score = Math.max(0, game.score + Number(game.level?.scoreSkip || 0));
}

export function starsForScore(level, score) {
  const star1 = Number(level?.star1 ?? Infinity);
  const star2 = Number(level?.star2 ?? Infinity);
  const star3 = Number(level?.star3 ?? Infinity);
  if (score >= star3) return 3;
  if (score >= star2) return 2;
  if (score >= star1) return 1;
  return 0;
}
