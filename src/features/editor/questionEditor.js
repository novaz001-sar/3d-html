import { clone, esc } from '../../shared/utils.js';
import { getObjectOptions } from '../../domain/questions.js';
import { drawObject, makeDragRotator } from '../../render/index.js';

export function renderQuestionEditor(ctx, question) {
  const { t } = ctx;
  return `
    <div class="panel question-panel">
      <div class="form-grid compact-form">
        <label>${t('type')}<select id="q-type">
          <option value="match" ${question.type === 'match' ? 'selected' : ''}>${t('match')}</option>
          <option value="mismatch" ${question.type === 'mismatch' ? 'selected' : ''}>${t('mismatch')}</option>
        </select></label>
        <label>${t('leftObj')}<select id="q-obj1">${getObjectOptions(ctx.state.data, question.obj1, esc)}</select></label>
        <label>${t('rightObj')}<select id="q-obj2" ${question.type === 'match' ? 'disabled' : ''}>${getObjectOptions(ctx.state.data, question.obj2, esc)}</select></label>
      </div>
      <div class="two-pane question-canvases">
        <div class="canvas-shell"><canvas id="q-left"></canvas></div>
        <div class="canvas-shell"><canvas id="q-right"></canvas></div>
      </div>
      <button class="button primary" data-level-action="save-q">${t('save')}</button>
    </div>
  `;
}

export function bindQuestionEditor(ctx) {
  const q = ctx.state.logic.editingQ;
  const redraw = () => drawQuestionCanvases(ctx);
  document.getElementById('q-type')?.addEventListener('change', event => {
    q.type = event.target.value;
    if (q.type === 'match') q.obj2 = q.obj1;
    ctx.render();
  });
  document.getElementById('q-obj1')?.addEventListener('change', event => {
    q.obj1 = event.target.value;
    if (q.type === 'match') q.obj2 = q.obj1;
    ctx.render();
  });
  document.getElementById('q-obj2')?.addEventListener('change', event => {
    q.obj2 = event.target.value;
    ctx.render();
  });
  makeDragRotator(document.getElementById('q-left'), () => q.rot1, value => q.rot1 = value, redraw);
  makeDragRotator(document.getElementById('q-right'), () => q.rot2, value => q.rot2 = value, redraw);
  redraw();
}

export function addQuestion(ctx) {
  if (!ctx.state.data.objects.length) return alert(ctx.t('emptyObj'));
  const id = ctx.state.data.objects[0].id;
  ctx.state.logic.editingQ = { type: 'match', obj1: id, obj2: id, rot1: [0, 0, 0, 1], rot2: [0.12, 0.36, 0, 0.92] };
  ctx.state.logic.editingQIndex = -1;
  ctx.render();
}

export function editQuestion(ctx, idx) {
  ctx.state.logic.editingQIndex = idx;
  ctx.state.logic.editingQ = clone(ctx.state.logic.editingPack.questions[idx]);
  ctx.render();
}

export function saveQuestion(ctx) {
  const pack = ctx.state.logic.editingPack;
  const q = ctx.state.logic.editingQ;
  if (!pack || !q) return;
  if (q.type === 'match') q.obj2 = q.obj1;
  if (ctx.state.logic.editingQIndex >= 0) pack.questions.splice(ctx.state.logic.editingQIndex, 1, clone(q));
  else pack.questions.push(clone(q));
  if (ctx.state.logic.currentPackIndex >= 0) ctx.state.data.levels[ctx.state.logic.currentPackIndex] = clone(pack);
  else {
    ctx.state.data.levels.push(clone(pack));
    ctx.state.logic.currentPackIndex = ctx.state.data.levels.length - 1;
  }
  ctx.state.logic.editingQ = null;
  ctx.persist();
  ctx.render();
}

function drawQuestionCanvases(ctx) {
  const q = ctx.state.logic.editingQ;
  const left = ctx.state.data.objects.find(o => o.id === q.obj1);
  const rightId = q.type === 'match' ? q.obj1 : q.obj2;
  const right = ctx.state.data.objects.find(o => o.id === rightId);
  drawObject(document.getElementById('q-left'), left?.voxels || [], q.rot1, { emptyText: ctx.t('emptyObj') });
  drawObject(document.getElementById('q-right'), right?.voxels || [], q.rot2, { emptyText: ctx.t('emptyObj') });
}
