import { clone, esc, uid } from '../../shared/utils.js';
import { addQuestion, bindQuestionEditor, editQuestion, renderQuestionEditor, saveQuestion } from './questionEditor.js';

export function renderLevelEditor(ctx) {
  const { state, t } = ctx;
  const pack = state.logic.editingPack;
  return `
    <section class="editor-layout">
      <aside class="panel side-panel">
        <button class="button primary" data-level-action="new-pack">${t('newPack')}</button>
        <div class="list">${state.data.levels.map((level, idx) => `
          <button class="list-item ${idx === state.logic.currentPackIndex ? 'active' : ''}" data-edit-pack="${idx}">${esc(level.name)}</button>
        `).join('')}</div>
      </aside>
      <section class="workspace">
        ${pack ? renderPackEditor(ctx, pack) : `<div class="empty-state">${t('noData')}</div>`}
        ${state.logic.editingQ ? renderQuestionEditor(ctx, state.logic.editingQ) : ''}
      </section>
    </section>
  `;
}

export function bindLevelEditor(ctx) {
  const pack = ctx.state.logic.editingPack;
  document.querySelector('[data-level-action="new-pack"]')?.addEventListener('click', () => newPack(ctx));
  document.querySelectorAll('[data-edit-pack]').forEach(btn => btn.addEventListener('click', () => editPack(ctx, Number(btn.dataset.editPack))));
  document.querySelector('[data-level-action="save-pack"]')?.addEventListener('click', () => savePack(ctx));
  document.querySelector('[data-level-action="delete-pack"]')?.addEventListener('click', () => deletePack(ctx));
  document.querySelector('[data-level-action="add-q"]')?.addEventListener('click', () => addQuestion(ctx));
  document.querySelectorAll('[data-edit-q]').forEach(btn => btn.addEventListener('click', () => editQuestion(ctx, Number(btn.dataset.editQ))));
  document.querySelector('[data-level-action="save-q"]')?.addEventListener('click', () => saveQuestion(ctx));
  if (pack) bindPackFields(pack);
  if (ctx.state.logic.editingQ) bindQuestionEditor(ctx);
}

function renderPackEditor(ctx, pack) {
  const { t } = ctx;
  return `
    <div class="panel form-grid compact-form">
      <label>${t('name')}<input id="pack-name" value="${esc(pack.name)}" /></label>
      ${numField('pack-time', t('time'), pack.timeLimit)}
      ${numField('pack-speed', t('speed'), pack.speed, '0.5')}
      ${numField('pack-win', t('win'), pack.scoreWin)}
      ${numField('pack-loss', t('loss'), pack.scoreLoss)}
      ${numField('pack-skip', t('skipScore'), pack.scoreSkip)}
      ${numField('pack-star1', t('star1'), pack.star1)}
      ${numField('pack-star2', t('star2'), pack.star2)}
      ${numField('pack-star3', t('star3'), pack.star3)}
      <button class="button primary" data-level-action="save-pack">${t('save')}</button>
      <button class="button danger" data-level-action="delete-pack">${t('delete')}</button>
    </div>
    <div class="panel">
      <div class="section-head"><h2>${t('questions')}</h2><button class="button secondary" data-level-action="add-q">${t('addQ')}</button></div>
      <div class="question-list">${(pack.questions || []).map((question, idx) => `
        <button class="list-item" data-edit-q="${idx}">${idx + 1}. ${question.type === 'match' ? t('match') : t('mismatch')}</button>
      `).join('')}</div>
    </div>
  `;
}

function numField(id, label, value, step = '1') {
  return `<label>${label}<input id="${id}" type="number" step="${step}" value="${Number(value || 0)}" /></label>`;
}

function bindPackFields(pack) {
  const setNum = (id, key) => document.getElementById(id)?.addEventListener('input', event => pack[key] = Number(event.target.value || 0));
  document.getElementById('pack-name')?.addEventListener('input', event => pack.name = event.target.value);
  setNum('pack-time', 'timeLimit');
  setNum('pack-speed', 'speed');
  setNum('pack-win', 'scoreWin');
  setNum('pack-loss', 'scoreLoss');
  setNum('pack-skip', 'scoreSkip');
  setNum('pack-star1', 'star1');
  setNum('pack-star2', 'star2');
  setNum('pack-star3', 'star3');
}

function newPack(ctx) {
  ctx.state.logic = {
    currentPackIndex: -1,
    editingQ: null,
    editingQIndex: -1,
    editingPack: {
      id: uid('lvl'),
      name: ctx.state.lang === 'zh' ? '新练习包' : 'New Level Pack',
      timeLimit: 60,
      speed: 4,
      scoreWin: 10,
      scoreLoss: 5,
      scoreSkip: 0,
      star1: 20,
      star2: 40,
      star3: 60,
      questions: []
    }
  };
  ctx.render();
}

function editPack(ctx, idx) {
  ctx.state.logic.currentPackIndex = idx;
  ctx.state.logic.editingPack = clone(ctx.state.data.levels[idx]);
  ctx.state.logic.editingQ = null;
  ctx.state.logic.editingQIndex = -1;
  ctx.render();
}

function savePack(ctx) {
  const pack = ctx.state.logic.editingPack;
  if (!pack) return;
  pack.name = (pack.name || '').trim() || 'Untitled';
  if (ctx.state.logic.currentPackIndex >= 0) ctx.state.data.levels.splice(ctx.state.logic.currentPackIndex, 1, clone(pack));
  else {
    ctx.state.data.levels.push(clone(pack));
    ctx.state.logic.currentPackIndex = ctx.state.data.levels.length - 1;
  }
  ctx.persist();
  ctx.render();
}

function deletePack(ctx) {
  if (!confirm(ctx.t('deleteConfirm'))) return;
  const idx = ctx.state.logic.currentPackIndex;
  if (idx >= 0) ctx.state.data.levels.splice(idx, 1);
  ctx.state.logic = { currentPackIndex: -1, editingPack: null, editingQ: null, editingQIndex: -1 };
  ctx.persist();
  ctx.render();
}
