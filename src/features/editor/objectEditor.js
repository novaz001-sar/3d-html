import { clone, esc, uid } from '../../shared/utils.js';
import { drawObject, drawVoxelGrid, gridPointFromEvent, makeDragRotator } from '../../render/index.js';

export function renderObjectEditor(ctx) {
  const { state, t } = ctx;
  const v = state.voxel;
  const shapeText = getShapeText(state.lang);
  return `
    <section class="editor-layout">
      <aside class="panel side-panel">
        <div class="toolbar">
          <button class="icon-button" title="${t('newObject')}" data-obj-action="new">+</button>
          <button class="icon-button danger" title="${t('delete')}" data-obj-action="delete">x</button>
        </div>
        <label>${t('name')}<input id="obj-name" value="${esc(v.name)}" /></label>
        <label>${t('color')}<input id="obj-color" type="color" value="${esc(v.color)}" /></label>
        <label>${t('material')}<select id="obj-mat">
          <option value="wood" ${v.mat === 'wood' ? 'selected' : ''}>${t('wood')}</option>
          <option value="glass" ${v.mat === 'glass' ? 'selected' : ''}>${t('glass')}</option>
          <option value="gem" ${v.mat === 'gem' ? 'selected' : ''}>${t('gem')}</option>
        </select></label>
        <label>${shapeText.blockStyle}<select id="obj-shape">
          <option value="cube" ${v.shape === 'cube' ? 'selected' : ''}>${shapeText.normalCube}</option>
          <option value="catMagicCube" ${v.shape === 'catMagicCube' ? 'selected' : ''}>${shapeText.catMagicCube}</option>
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

export function bindObjectEditor(ctx) {
  const { state } = ctx;
  const v = state.voxel;
  const grid = document.getElementById('voxel-grid');
  const preview = document.getElementById('voxel-preview');
  const redraw = () => {
    drawVoxelGrid(grid, v.voxels, v.layer, v.color);
    drawObject(preview, v.voxels, v.previewQ, { emptyText: ctx.t('emptyObj') });
  };

  document.getElementById('obj-name')?.addEventListener('input', event => v.name = event.target.value);
  document.getElementById('obj-color')?.addEventListener('input', event => { v.color = event.target.value; redraw(); });
  document.getElementById('obj-mat')?.addEventListener('change', event => v.mat = event.target.value);
  document.getElementById('obj-shape')?.addEventListener('change', event => {
    v.shape = event.target.value;
    v.voxels = v.voxels.map(voxel => ({ ...voxel, shape: v.shape }));
    redraw();
  });
  document.getElementById('obj-layer')?.addEventListener('input', event => {
    v.layer = Number(event.target.value);
    document.getElementById('layer-value').textContent = v.layer;
    redraw();
  });
  grid?.addEventListener('pointerdown', event => {
    const point = gridPointFromEvent(grid, event);
    if (!point) return;
    const idx = v.voxels.findIndex(voxel => voxel.x === point.x && voxel.y === point.y && voxel.z === v.layer);
    if (idx >= 0) v.voxels.splice(idx, 1);
    else v.voxels.push({ ...point, z: v.layer, color: v.color, mat: v.mat, shape: v.shape });
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

function newObject(ctx) {
  Object.assign(ctx.state.voxel, { name: '', color: '#d97706', mat: 'wood', shape: 'cube', layer: 0, voxels: [], editingId: null });
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
    mat: obj.voxels?.[0]?.mat || 'wood',
    shape: obj.voxels?.[0]?.shape || 'cube'
  });
  ctx.render();
}

function getShapeText(lang) {
  if (lang === 'zh') {
    return {
      blockStyle: '方块外观',
      normalCube: '普通方块',
      catMagicCube: '猫猫魔法方块'
    };
  }

  return {
    blockStyle: 'Block Style',
    normalCube: 'Normal Cube',
    catMagicCube: 'Cat Magic Cube'
  };
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
