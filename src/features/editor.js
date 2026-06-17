import { clone, esc, uid } from '../core/utils.js';
import { drawObject, drawVoxelGrid, gridPointFromEvent, makeDragRotator } from '../render/voxelRenderer.js';

export function renderEditor(ctx) {
  const { state, t } = ctx;
  return `
    <main class="screen app-screen editor-screen">
      <header class="topbar flow-row">
        <button class="button secondary" data-action="home">${t('back')}</button>
        <nav class="segmented">
          <button class="segment ${state.editorTab === 'objects' ? 'active' : ''}" data-editor-tab="objects">${t('objects')}</button>
          <button class="segment ${state.editorTab === 'levels' ? 'active' : ''}" data-editor-tab="levels">${t('levels')}</button>
        </nav>
        <button class="button ghost" data-action="lang">${t('lang')}</button>
      </header>
      ${state.editorTab === 'objects' ? objectEditor(ctx) : levelEditor(ctx)}
    </main>
  `;
}

export function bindEditor(ctx) {
  document.querySelectorAll('[data-editor-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      ctx.state.editorTab = btn.dataset.editorTab;
      ctx.render();
    });
  });
  if (ctx.state.editorTab === 'objects') bindObjectEditor(ctx);
  if (ctx.state.editorTab === 'levels') bindLevelEditor(ctx);
}

function objectEditor(ctx) {
  const { state, t } = ctx;
  const v = state.voxel;
  return `
    <section class="editor-layout">
      <aside class="panel side-panel">
        <div class="toolbar">
          <button class="icon-button" title="${t('newObject')}" data-obj-action="new">+</button>
          <button class="icon-button danger" title="${t('delete')}" data-obj-action="delete">×</button>
        </div>
        <label>${t('name')}<input id="obj-name" value="${esc(v.name)}" /></label>
        <label>${t('color')}<input id="obj-color" type="color" value="${esc(v.color)}" /></label>
        <label>${t('material')}<select id="obj-mat">
          <option value="wood" ${v.mat === 'wood' ? 'selected' : ''}>${t('wood')}</option>
          <option value="glass" ${v.mat === 'glass' ? 'selected' : ''}>${t('glass')}</option>
          <option value="gem" ${v.mat === 'gem' ? 'selected' : ''}>${t('gem')}</option>
        </select></label>
        <label>${t('layer')}: <strong id="layer-value">${v.layer}</strong><input id="obj-layer" type="range" min="-4" max="4" step="1" value="${v.layer}" /></label>
        <button class="button primary" data-obj-action="save">${t('save')}</button>
        <button class="button secondary" data-obj-action="clear">${t('clear')}</button>
        <div class="list">${state.data.objects.map((obj, idx) => `
          <button class="list-item ${obj.id === v.editingId ? 'active' : ''}" data-load-object="${idx}">${esc(obj.name)}</button>
        `).join('')}</div>
      </aside>
      <section class="workspace two-pane">
        <div class="canvas-shell"><canvas id="voxel-grid"></canvas></div>
        <div class="canvas-shell"><canvas id="voxel-preview"></canvas></div>
      </section>
    </section>
  `;
}

function levelEditor(ctx) {
  const { state, t } = ctx;
  const pack = state.logic.editingPack;
  const q = state.logic.editingQ;
  return `
    <section class="editor-layout">
      <aside class="panel side-panel">
        <button class="button primary" data-level-action="new-pack">${t('newPack')}</button>
        <div class="list">${state.data.levels.map((level, idx) => `
          <button class="list-item ${idx === state.logic.currentPackIndex ? 'active' : ''}" data-edit-pack="${idx}">${esc(level.name)}</button>
        `).join('')}</div>
      </aside>
      <section class="workspace">
        ${pack ? packEditor(ctx, pack) : `<div class="empty-state">${t('noData')}</div>`}
        ${q ? questionEditor(ctx, q) : ''}
      </section>
    </section>
  `;
}

function packEditor(ctx, pack) {
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

function questionEditor(ctx, q) {
  const { t } = ctx;
  return `
    <div class="panel question-panel">
      <div class="form-grid compact-form">
        <label>${t('type')}<select id="q-type">
          <option value="match" ${q.type === 'match' ? 'selected' : ''}>${t('match')}</option>
          <option value="mismatch" ${q.type === 'mismatch' ? 'selected' : ''}>${t('mismatch')}</option>
        </select></label>
        <label>${t('leftObj')}<select id="q-obj1">${objectOptions(ctx, q.obj1)}</select></label>
        <label>${t('rightObj')}<select id="q-obj2" ${q.type === 'match' ? 'disabled' : ''}>${objectOptions(ctx, q.obj2)}</select></label>
      </div>
      <div class="two-pane question-canvases">
        <div class="canvas-shell"><canvas id="q-left"></canvas></div>
        <div class="canvas-shell"><canvas id="q-right"></canvas></div>
      </div>
      <button class="button primary" data-level-action="save-q">${t('save')}</button>
    </div>
  `;
}

function numField(id, label, value, step = '1') {
  return `<label>${label}<input id="${id}" type="number" step="${step}" value="${Number(value || 0)}" /></label>`;
}

function objectOptions(ctx, selected) {
  return ctx.state.data.objects.map(o => `<option value="${esc(o.id)}" ${o.id === selected ? 'selected' : ''}>${esc(o.name)}</option>`).join('');
}

function bindObjectEditor(ctx) {
  const { state } = ctx;
  const v = state.voxel;
  const grid = document.getElementById('voxel-grid');
  const preview = document.getElementById('voxel-preview');
  const redraw = () => {
    drawVoxelGrid(grid, v.voxels, v.layer, v.color);
    drawObject(preview, v.voxels, v.previewQ, { emptyText: ctx.t('emptyObj') });
  };

  document.getElementById('obj-name')?.addEventListener('input', e => v.name = e.target.value);
  document.getElementById('obj-color')?.addEventListener('input', e => { v.color = e.target.value; redraw(); });
  document.getElementById('obj-mat')?.addEventListener('change', e => v.mat = e.target.value);
  document.getElementById('obj-layer')?.addEventListener('input', e => {
    v.layer = Number(e.target.value);
    document.getElementById('layer-value').textContent = v.layer;
    redraw();
  });
  grid?.addEventListener('pointerdown', event => {
    const point = gridPointFromEvent(grid, event);
    if (!point) return;
    const idx = v.voxels.findIndex(voxel => voxel.x === point.x && voxel.y === point.y && voxel.z === v.layer);
    if (idx >= 0) v.voxels.splice(idx, 1);
    else v.voxels.push({ ...point, z: v.layer, color: v.color, mat: v.mat });
    redraw();
  });
  makeDragRotator(preview, () => v.previewQ, q => v.previewQ = q, redraw);
  document.querySelectorAll('[data-load-object]').forEach(btn => btn.addEventListener('click', () => loadObject(ctx, Number(btn.dataset.loadObject))));
  document.querySelector('[data-obj-action="new"]')?.addEventListener('click', () => newObject(ctx));
  document.querySelector('[data-obj-action="delete"]')?.addEventListener('click', () => deleteObject(ctx));
  document.querySelector('[data-obj-action="clear"]')?.addEventListener('click', () => { v.voxels = []; redraw(); });
  document.querySelector('[data-obj-action="save"]')?.addEventListener('click', () => saveObject(ctx));
  redraw();
}

function bindLevelEditor(ctx) {
  const pack = ctx.state.logic.editingPack;
  document.querySelector('[data-level-action="new-pack"]')?.addEventListener('click', () => newPack(ctx));
  document.querySelectorAll('[data-edit-pack]').forEach(btn => btn.addEventListener('click', () => editPack(ctx, Number(btn.dataset.editPack))));
  document.querySelector('[data-level-action="save-pack"]')?.addEventListener('click', () => savePack(ctx));
  document.querySelector('[data-level-action="delete-pack"]')?.addEventListener('click', () => deletePack(ctx));
  document.querySelector('[data-level-action="add-q"]')?.addEventListener('click', () => addQuestion(ctx));
  document.querySelectorAll('[data-edit-q]').forEach(btn => btn.addEventListener('click', () => editQuestion(ctx, Number(btn.dataset.editQ))));
  document.querySelector('[data-level-action="save-q"]')?.addEventListener('click', () => saveQuestion(ctx));
  if (pack) bindPackFields(pack);
  if (ctx.state.logic.editingQ) bindQuestionFields(ctx);
}

function bindPackFields(pack) {
  const setNum = (id, key) => document.getElementById(id)?.addEventListener('input', e => pack[key] = Number(e.target.value || 0));
  document.getElementById('pack-name')?.addEventListener('input', e => pack.name = e.target.value);
  setNum('pack-time', 'timeLimit');
  setNum('pack-speed', 'speed');
  setNum('pack-win', 'scoreWin');
  setNum('pack-loss', 'scoreLoss');
  setNum('pack-skip', 'scoreSkip');
  setNum('pack-star1', 'star1');
  setNum('pack-star2', 'star2');
  setNum('pack-star3', 'star3');
}

function bindQuestionFields(ctx) {
  const q = ctx.state.logic.editingQ;
  const redraw = () => drawQuestionCanvases(ctx);
  document.getElementById('q-type')?.addEventListener('change', e => { q.type = e.target.value; if (q.type === 'match') q.obj2 = q.obj1; ctx.render(); });
  document.getElementById('q-obj1')?.addEventListener('change', e => { q.obj1 = e.target.value; if (q.type === 'match') q.obj2 = q.obj1; ctx.render(); });
  document.getElementById('q-obj2')?.addEventListener('change', e => { q.obj2 = e.target.value; ctx.render(); });
  makeDragRotator(document.getElementById('q-left'), () => q.rot1, value => q.rot1 = value, redraw);
  makeDragRotator(document.getElementById('q-right'), () => q.rot2, value => q.rot2 = value, redraw);
  redraw();
}

function drawQuestionCanvases(ctx) {
  const q = ctx.state.logic.editingQ;
  const left = ctx.state.data.objects.find(o => o.id === q.obj1);
  const rightId = q.type === 'match' ? q.obj1 : q.obj2;
  const right = ctx.state.data.objects.find(o => o.id === rightId);
  drawObject(document.getElementById('q-left'), left?.voxels || [], q.rot1, { emptyText: ctx.t('emptyObj') });
  drawObject(document.getElementById('q-right'), right?.voxels || [], q.rot2, { emptyText: ctx.t('emptyObj') });
}

function newObject(ctx) {
  Object.assign(ctx.state.voxel, { name: '', color: '#d97706', mat: 'wood', layer: 0, voxels: [], editingId: null });
  ctx.render();
}

function loadObject(ctx, idx) {
  const obj = ctx.state.data.objects[idx];
  if (!obj) return;
  Object.assign(ctx.state.voxel, {
    name: obj.name,
    voxels: clone(obj.voxels || []),
    editingId: obj.id,
    color: obj.voxels?.[0]?.color || '#d97706',
    mat: obj.voxels?.[0]?.mat || 'wood'
  });
  ctx.render();
}

function saveObject(ctx) {
  const v = ctx.state.voxel;
  if (!v.voxels.length) return alert(ctx.t('emptyObj'));
  const name = (v.name || '').trim();
  if (!name) return;
  const obj = { id: v.editingId || uid('obj'), name, voxels: clone(v.voxels) };
  const idx = ctx.state.data.objects.findIndex(o => o.id === obj.id);
  if (idx >= 0) ctx.state.data.objects.splice(idx, 1, obj);
  else ctx.state.data.objects.push(obj);
  v.editingId = obj.id;
  ctx.persist();
  ctx.render();
}

function deleteObject(ctx) {
  const id = ctx.state.voxel.editingId;
  if (!id || !confirm(ctx.t('deleteConfirm'))) return;
  ctx.state.data.objects = ctx.state.data.objects.filter(o => o.id !== id);
  ctx.state.data.levels.forEach(level => (level.questions || []).forEach(q => {
    if (q.obj1 === id || q.obj2 === id) {
      q.obj1 = ctx.state.data.objects[0]?.id || '';
      q.obj2 = q.obj1;
    }
  }));
  newObject(ctx);
  ctx.persist();
}

function newPack(ctx) {
  ctx.state.logic = {
    currentPackIndex: -1,
    editingQ: null,
    editingQIndex: -1,
    editingPack: { id: uid('lvl'), name: ctx.state.lang === 'zh' ? '新练习包' : 'New Level Pack', timeLimit: 60, speed: 4, scoreWin: 10, scoreLoss: 5, scoreSkip: 0, star1: 20, star2: 40, star3: 60, questions: [] }
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

function addQuestion(ctx) {
  if (!ctx.state.data.objects.length) return alert(ctx.t('emptyObj'));
  const id = ctx.state.data.objects[0].id;
  ctx.state.logic.editingQ = { type: 'match', obj1: id, obj2: id, rot1: [0, 0, 0, 1], rot2: [0.12, 0.36, 0, 0.92] };
  ctx.state.logic.editingQIndex = -1;
  ctx.render();
}

function editQuestion(ctx, idx) {
  ctx.state.logic.editingQIndex = idx;
  ctx.state.logic.editingQ = clone(ctx.state.logic.editingPack.questions[idx]);
  ctx.render();
}

function saveQuestion(ctx) {
  const pack = ctx.state.logic.editingPack;
  const q = ctx.state.logic.editingQ;
  if (!pack || !q) return;
  if (q.type === 'match') q.obj2 = q.obj1;
  if (ctx.state.logic.editingQIndex >= 0) pack.questions.splice(ctx.state.logic.editingQIndex, 1, clone(q));
  else pack.questions.push(clone(q));
  ctx.state.logic.editingQ = null;
  savePack(ctx);
}
