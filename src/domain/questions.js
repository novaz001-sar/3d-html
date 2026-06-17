export function currentQuestion(game) {
  return game.level?.questions?.[game.qIndex] || null;
}

export function getQuestionObjects(data, question) {
  const left = data.objects.find(object => object.id === question?.obj1);
  const rightId = question?.type === 'match' ? question?.obj1 : question?.obj2;
  const right = data.objects.find(object => object.id === rightId);
  return [left, right];
}

export function getObjectOptions(data, selectedId, esc) {
  return data.objects
    .map(object => `<option value="${esc(object.id)}" ${object.id === selectedId ? 'selected' : ''}>${esc(object.name)}</option>`)
    .join('');
}
