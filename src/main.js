import { clone, esc } from './core/utils.js';
import { loadData, loadLanguage, saveData, saveLanguage } from './core/store.js';
import { I18N } from './i18n/messages.js';
import { bindEditor, renderEditor } from './features/editor.js';
import { bindGame, renderGame, renderResult, startGame, stopTimer, tickGame } from './features/game.js';

const app = document.getElementById('app');

const state = {
  lang: loadLanguage(),
  screen: 'main',
  editorTab: 'objects',
  paused: false,
  showManual: false,
  data: loadData(),
  voxel: { name: '', color: '#d97706', mat: 'wood', layer: 0, voxels: [], editingId: null, previewQ: [0.25, -0.35, 0, 0.9] },
  logic: { currentPackIndex: -1, editingPack: null, editingQ: null, editingQIndex: -1 },
  game: { level: null, qIndex: 0, score: 0, timeLeft: 0, timer: null, zoom: 1, leftQ: [0, 0, 0, 1], rightQ: [0, 0, 0, 1], leftAuto: 0, feedback: '', feedbackKind: 'good', lastT: 0 },
  result: { stars: 0, score: 0 }
};

const ctx = {
  state,
  t,
  render,
  persist: () => saveData(state.data)
};

function t(key) {
  return I18N[state.lang]?.[key] || I18N.zh[key] || key;
}

function shell(content) {
  return `<div class="ambient" aria-hidden="true"></div>${content}`;
}

function render() {
  if (state.screen !== 'game') stopTimer(ctx);
  if (state.screen === 'main') app.innerHTML = shell(renderHome());
  if (state.screen === 'editor') app.innerHTML = shell(renderEditor(ctx));
  if (state.screen === 'game') app.innerHTML = shell(renderGame(ctx));
  if (state.screen === 'result') app.innerHTML = shell(renderResult(ctx));
  bindCommon();
  if (state.screen === 'editor') bindEditor(ctx);
  if (state.screen === 'game') bindGame(ctx);
}

function renderHome() {
  const levels = state.data.levels || [];
  return `
    <main class="screen home-screen">
      <header class="topbar">
        <button class="button ghost" data-action="export">${t('export')}</button>
        <label class="button ghost">${t('import')}<input id="import-file" type="file" accept=".json,application/json" hidden /></label>
        <button class="button ghost" data-action="lang">${t('lang')}</button>
      </header>
      <section class="hero">
        <div>
          <h1>${t('title')}</h1>
          <p>${t('edition')}</p>
        </div>
        <div class="level-grid">
          ${levels.length ? levels.map((level, idx) => `<button class="level-card" data-start="${esc(level.id)}"><span>${idx + 1}</span>${esc(level.name || t('start'))}</button>`).join('') : `<div class="empty-state">${t('noData')}</div>`}
        </div>
        <div class="hero-actions">
          <button class="button primary" data-action="editor">${t('editor')}</button>
          <button class="button secondary" data-action="manual">${t('manual')}</button>
        </div>
      </section>
      ${state.showManual ? `<div class="modal"><section class="panel manual"><h2>${t('manual')}</h2><p>${t('manualText')}</p><button class="button primary" data-action="close-manual">OK</button></section></div>` : ''}
    </main>
  `;
}

function bindCommon() {
  document.querySelectorAll('[data-action="home"]').forEach(el => el.addEventListener('click', () => { state.screen = 'main'; state.paused = false; stopTimer(ctx); render(); }));
  document.querySelectorAll('[data-action="editor"]').forEach(el => el.addEventListener('click', () => { state.screen = 'editor'; render(); }));
  document.querySelectorAll('[data-action="manual"]').forEach(el => el.addEventListener('click', () => { state.showManual = true; render(); }));
  document.querySelectorAll('[data-action="close-manual"]').forEach(el => el.addEventListener('click', () => { state.showManual = false; render(); }));
  document.querySelectorAll('[data-action="lang"]').forEach(el => el.addEventListener('click', () => { state.lang = state.lang === 'zh' ? 'en' : 'zh'; saveLanguage(state.lang); render(); }));
  document.querySelectorAll('[data-action="export"]').forEach(el => el.addEventListener('click', exportJson));
  document.querySelectorAll('[data-start]').forEach(el => el.addEventListener('click', () => startGame(ctx, el.dataset.start)));
  document.getElementById('import-file')?.addEventListener('change', importJson);
}

function exportJson() {
  const blob = new Blob([JSON.stringify(state.data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'MR_DATA.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function importJson(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!Array.isArray(data.objects) || !Array.isArray(data.levels)) throw new Error('bad data');
      state.data = clone(data);
      saveData(state.data);
      state.screen = 'main';
      render();
    } catch (_) {
      alert(t('badJson'));
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function loop(ts) {
  tickGame(ctx, ts);
  requestAnimationFrame(loop);
}

window.addEventListener('resize', () => {
  if (state.screen === 'game') bindGame(ctx);
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && state.screen === 'game') {
    state.paused = !state.paused;
    render();
  }
});

render();
requestAnimationFrame(loop);
