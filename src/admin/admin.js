import {
  DEFAULT_ADMIN_CONFIG,
  loadAdminConfig,
  normalizeAdminConfig,
  resetAdminConfig,
  saveAdminConfig
} from '../services/adminConfig.js';
import { saveFontScale, saveLanguage, saveMenuMusicEnabled, saveMenuMusicVolume } from '../services/storage.js';

const app = document.getElementById('admin-app');
let config = loadAdminConfig();

render();

function render(message = '') {
  app.innerHTML = `
    <main class="admin-shell">
      <section class="admin-hero">
        <div>
          <h1>Toy Planet Admin</h1>
          <p>Manage language, fonts, music, sound effects, result tracks, and home Cat Planet visuals. This static admin publishes settings to the current Vercel origin via browser storage, with JSON import/export for versioned handoff.</p>
        </div>
        <div class="admin-cat" aria-hidden="true"></div>
      </section>

      <div class="admin-actions">
        <button class="button primary" data-action="publish">Publish to this browser</button>
        <button class="button gold" data-action="export">Export JSON</button>
        <label class="button">Import JSON<input id="config-file" type="file" accept=".json,application/json" hidden /></label>
        <button class="button danger" data-action="reset">Restore defaults</button>
        <a class="button pink" href="/" target="_blank" rel="noreferrer">Open game</a>
      </div>
      <p class="status" id="status">${message}</p>

      <section class="admin-grid">
        ${renderContentCard()}
        ${renderDefaultsCard()}
        ${renderMenuAudioCard()}
        ${renderSfxCard()}
        ${renderResultAudioCard()}
        ${renderVisualCard()}
        ${renderJsonCard()}
      </section>
    </main>
  `;
  bind();
}

function renderContentCard() {
  return `
    <article class="admin-card">
      <h2>Home content</h2>
      <div class="form-grid">
        ${textInput('English title', 'content.title.en', config.content.title.en)}
        ${textInput('Chinese title', 'content.title.zh', config.content.title.zh)}
        ${textInput('English subtitle', 'content.edition.en', config.content.edition.en)}
        ${textInput('Chinese subtitle', 'content.edition.zh', config.content.edition.zh)}
        ${textAreaInput('English manual text', 'content.manualText.en', config.content.manualText.en)}
        ${textAreaInput('Chinese manual text', 'content.manualText.zh', config.content.manualText.zh)}
      </div>
    </article>
  `;
}

function renderDefaultsCard() {
  return `
    <article class="admin-card">
      <h2>Language and fonts</h2>
      <div class="form-grid">
        <label>Default language
          <select data-field="defaults.language">
            <option value="en" ${selected(config.defaults.language, 'en')}>English</option>
            <option value="zh" ${selected(config.defaults.language, 'zh')}>Chinese</option>
          </select>
        </label>
        ${rangeInput('Default font size', 'defaults.fontScale', config.defaults.fontScale, 0.88, 1.28, 0.04)}
        ${textInput('English font', 'defaults.latinFont', config.defaults.latinFont)}
        ${textInput('Chinese font', 'defaults.cjkFont', config.defaults.cjkFont)}
        ${checkInput('Allow language switch', 'defaults.allowLanguageSwitch', config.defaults.allowLanguageSwitch)}
        ${checkInput('Show font control', 'defaults.allowFontControl', config.defaults.allowFontControl)}
      </div>
    </article>
  `;
}

function renderMenuAudioCard() {
  return `
    <article class="admin-card">
      <h2>Initial screen music</h2>
      <div class="form-grid">
        ${checkInput('Enabled by default', 'audio.menu.enabled', config.audio.menu.enabled)}
        ${checkInput('Loop playback', 'audio.menu.loop', config.audio.menu.loop)}
        ${checkInput('Show player controls', 'audio.menu.showControls', config.audio.menu.showControls)}
        ${rangeInput('Default volume', 'audio.menu.volume', config.audio.menu.volume, 0, 1, 0.02)}
        ${numberInput('Start second', 'audio.menu.start', config.audio.menu.start, 0, 120, 0.5)}
        ${textInput('Music URL', 'audio.menu.src', config.audio.menu.src, true)}
      </div>
    </article>
  `;
}

function renderSfxCard() {
  return `
    <article class="admin-card">
      <h2>Button sound effects</h2>
      <div class="form-grid">
        ${checkInput('Enable sound effects', 'audio.sfx.enabled', config.audio.sfx.enabled)}
        ${rangeInput('Volume multiplier', 'audio.sfx.volumeMultiplier', config.audio.sfx.volumeMultiplier, 0, 4, 0.1)}
      </div>
    </article>
  `;
}

function renderResultAudioCard() {
  return `
    <article class="admin-card">
      <h2>Result music</h2>
      <div class="form-grid">
        ${checkInput('Enable result music', 'audio.result.enabled', config.audio.result.enabled)}
        ${rangeInput('Result volume', 'audio.result.volume', config.audio.result.volume, 0, 1, 0.02)}
        ${numberInput('Start second', 'audio.result.start', config.audio.result.start, 0, 120, 0.5)}
        ${textInput('1 star track', 'audio.result.tracks.1', config.audio.result.tracks[1], true)}
        ${textInput('2 stars track', 'audio.result.tracks.2', config.audio.result.tracks[2], true)}
        ${textInput('3 stars track', 'audio.result.tracks.3', config.audio.result.tracks[3], true)}
      </div>
    </article>
  `;
}

function renderVisualCard() {
  return `
    <article class="admin-card">
      <h2>Home Cat Planet visual</h2>
      <div class="form-grid">
        ${checkInput('Show home Cat Planet', 'visual.homeCat.enabled', config.visual.homeCat.enabled)}
        ${rangeInput('Opacity', 'visual.homeCat.opacity', config.visual.homeCat.opacity, 0, 1, 0.02)}
      </div>
    </article>
  `;
}

function renderJsonCard() {
  return `
    <article class="admin-card">
      <h2>Raw configuration</h2>
      <label class="wide-label">Editable JSON
        <textarea class="json-box" id="json-box">${escapeHtml(JSON.stringify(config, null, 2))}</textarea>
      </label>
      <div class="admin-actions">
        <button class="button" data-action="apply-json">Apply JSON to form</button>
      </div>
    </article>
  `;
}

function bind() {
  document.querySelectorAll('[data-field]').forEach(input => {
    input.addEventListener('input', () => {
      config = readForm();
      syncJsonBox();
    });
    input.addEventListener('change', () => {
      config = readForm();
      syncJsonBox();
    });
  });

  document.querySelector('[data-action="publish"]')?.addEventListener('click', () => {
    config = saveAdminConfig(readForm());
    publishGamePreferences(config);
    render('Published. The game will update on refresh, focus, or immediately in another open tab.');
  });

  document.querySelector('[data-action="export"]')?.addEventListener('click', () => {
    config = readForm();
    downloadJson(config);
    setStatus('Exported configuration JSON.');
  });

  document.querySelector('[data-action="reset"]')?.addEventListener('click', () => {
    config = resetAdminConfig();
    publishGamePreferences(config);
    render('Defaults restored.');
  });

  document.querySelector('[data-action="apply-json"]')?.addEventListener('click', () => {
    try {
      config = normalizeAdminConfig(JSON.parse(document.getElementById('json-box').value));
      render('JSON applied to the form. Click Publish to use it in the game.');
    } catch {
      setStatus('Invalid JSON.');
    }
  });

  document.getElementById('config-file')?.addEventListener('change', async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      config = normalizeAdminConfig(JSON.parse(await file.text()));
      render('Imported JSON. Click Publish to use it in the game.');
    } catch {
      setStatus('Could not import that JSON file.');
    } finally {
      event.target.value = '';
    }
  });
}

function readForm() {
  const next = normalizeAdminConfig(config);
  document.querySelectorAll('[data-field]').forEach(input => {
    const value = input.type === 'checkbox'
      ? input.checked
      : input.type === 'number' || input.type === 'range'
        ? Number(input.value)
        : input.value;
    setPath(next, input.dataset.field, value);
  });
  return normalizeAdminConfig(next);
}

function syncJsonBox() {
  const box = document.getElementById('json-box');
  if (box) box.value = JSON.stringify(config, null, 2);
}

function setPath(target, path, value) {
  const parts = path.split('.');
  let node = target;
  parts.slice(0, -1).forEach(part => {
    node[part] ||= {};
    node = node[part];
  });
  node[parts.at(-1)] = value;
}

function textInput(label, field, value, wide = false) {
  return `<label class="${wide ? 'wide-label' : ''}">${label}<input data-field="${field}" value="${escapeAttr(value)}" /></label>`;
}

function textAreaInput(label, field, value) {
  return `<label class="wide-label">${label}<textarea data-field="${field}" rows="4">${escapeHtml(value)}</textarea></label>`;
}

function numberInput(label, field, value, min, max, step) {
  return `<label>${label}<input type="number" min="${min}" max="${max}" step="${step}" data-field="${field}" value="${escapeAttr(value)}" /></label>`;
}

function rangeInput(label, field, value, min, max, step) {
  return `<label>${label}: <strong>${value}</strong><input type="range" min="${min}" max="${max}" step="${step}" data-field="${field}" value="${escapeAttr(value)}" /></label>`;
}

function checkInput(label, field, checked) {
  return `<label class="check-row"><input type="checkbox" data-field="${field}" ${checked ? 'checked' : ''} />${label}</label>`;
}

function selected(value, expected) {
  return value === expected ? 'selected' : '';
}

function setStatus(message) {
  const status = document.getElementById('status');
  if (status) status.textContent = message;
}

function downloadJson(value) {
  const blob = new Blob([JSON.stringify(normalizeAdminConfig(value), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `toy-planet-config-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function publishGamePreferences(nextConfig) {
  saveLanguage(nextConfig.defaults.language);
  saveFontScale(nextConfig.defaults.fontScale);
  saveMenuMusicEnabled(nextConfig.audio.menu.enabled);
  saveMenuMusicVolume(nextConfig.audio.menu.volume);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function escapeAttr(value) {
  return escapeHtml(value);
}
