import { bindLevelEditor, renderLevelEditor } from './levelEditor.js';
import { bindObjectEditor, renderObjectEditor } from './objectEditor.js';

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
      ${state.editorTab === 'objects' ? renderObjectEditor(ctx) : renderLevelEditor(ctx)}
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
