import { esc } from '../shared/utils.js';
import { levelName } from '../domain/levels.js';
import { downloadJson, readJsonFile } from '../services/dataTransfer.js';
import { saveData } from '../services/storage.js';

export function renderHome(ctx) {
  const { state, t } = ctx;
  const levels = state.data.levels || [];
  return `
    <main class="screen home-screen">
      <header class="topbar">
        <button class="button ghost" data-home-action="export">${t('export')}</button>
        <label class="button ghost">${t('import')}<input id="import-file" type="file" accept=".json,application/json" hidden /></label>
        <button class="button ghost" data-action="lang">${t('lang')}</button>
        <button class="button ghost music-toggle ${state.musicEnabled ? 'is-on' : 'is-off'}" data-action="music">${state.musicEnabled ? t('musicOn') : t('musicOff')}</button>
        <label class="font-scale-control volume-control">
          <span>${t('volume')}</span>
          <input type="range" min="0" max="1" step="0.02" value="${state.musicVolume}" data-action="music-volume" />
        </label>
        <label class="font-scale-control">
          <span>${t('fontSize')}</span>
          <input type="range" min="0.88" max="1.28" step="0.04" value="${state.fontScale}" data-action="font-scale" />
        </label>
      </header>
      <section class="hero">
        <div>
          <h1>${t('title')}</h1>
          <p>${t('edition')}</p>
        </div>
        <div class="level-grid">
          ${levels.length ? levels.map((level, idx) => `<button class="level-card" data-start="${esc(level.id)}"><span class="level-number">${idx + 1}</span>${esc(levelName(level, state.lang, t('start')))}</button>`).join('') : `<div class="empty-state">${t('noData')}</div>`}
        </div>
        <div class="hero-actions">
          <button class="button primary" data-home-action="editor">${t('editor')}</button>
          <button class="button secondary" data-home-action="manual">${t('manual')}</button>
        </div>
      </section>
      ${state.showManual ? `<div class="modal"><section class="panel manual"><h2>${t('manual')}</h2><p>${t('manualText')}</p><button class="button primary" data-home-action="close-manual">OK</button></section></div>` : ''}
    </main>
  `;
}

export function bindHome(ctx) {
  const { state } = ctx;
  document.querySelector('[data-home-action="editor"]')?.addEventListener('click', () => {
    state.screen = 'editor';
    ctx.render();
  });
  document.querySelector('[data-home-action="manual"]')?.addEventListener('click', () => {
    state.showManual = true;
    ctx.render();
  });
  document.querySelector('[data-home-action="close-manual"]')?.addEventListener('click', () => {
    state.showManual = false;
    ctx.render();
  });
  document.querySelector('[data-home-action="export"]')?.addEventListener('click', () => downloadJson(state.data));
  document.querySelectorAll('[data-start]').forEach(el => el.addEventListener('click', () => ctx.startGame(el.dataset.start)));
  document.getElementById('import-file')?.addEventListener('change', async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      state.data = await readJsonFile(file);
      saveData(state.data);
      state.screen = 'main';
      ctx.render();
    } catch (_) {
      alert(ctx.t('badJson'));
    } finally {
      event.target.value = '';
    }
  });
}
