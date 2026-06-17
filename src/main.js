import { createApp } from './app/app.js';
import { mountCartoonInteractions } from './app/cartoonInteractions.js';
import { preloadGameAudioAssets } from './services/preloadAssets.js';

const root = document.getElementById('app');
let started = false;

boot();

async function boot() {
  renderLoader({ percent: 0, label: 'Loading music...' });
  await preloadGameAudioAssets(progress => renderLoader(progress));

  if (requiresTouchStart()) {
    renderLoader({ percent: 1, label: 'Ready', ready: true });
    root.querySelector('[data-loader-start]')?.addEventListener('click', startApp, { once: true });
    root.querySelector('[data-loader-start]')?.addEventListener('touchend', startApp, { once: true, passive: true });
    return;
  }

  startApp();
}

function startApp() {
  if (started) return;
  started = true;
  createApp(root).start();
  mountCartoonInteractions();
}

function renderLoader({ percent = 0, label = 'Loading...', ready = false } = {}) {
  const safePercent = Math.max(0, Math.min(1, Number(percent) || 0));
  const width = `${Math.round(safePercent * 100)}%`;
  root.innerHTML = `
    <main style="min-height:100vh;display:grid;place-items:center;padding:24px;background:linear-gradient(135deg,#fff7ec 0%,#e9f8ff 54%,#fff0f6 100%);font-family:'Baloo 2','ZCOOL KuaiLe',sans-serif;color:#4b5872;">
      <section style="width:min(520px,100%);border:1px solid rgba(255,255,255,.84);border-radius:32px;padding:28px;background:rgba(255,255,255,.72);box-shadow:0 28px 80px rgba(94,119,160,.2);text-align:center;backdrop-filter:blur(18px);">
        <div style="width:132px;height:92px;margin:0 auto 14px;border-radius:50%;background:radial-gradient(circle at 50% 35%,#fffbed 0 48%,#383d50 49% 53%,transparent 54%),linear-gradient(90deg,#9be7ff,#72cef0);box-shadow:0 16px 36px rgba(76,148,190,.22);"></div>
        <h1 style="margin:0 0 8px;font-size:clamp(34px,8vw,56px);line-height:1;color:#ff6fa6;text-shadow:0 3px 0 #ffe88f;">Toy Planet</h1>
        <p style="margin:0 0 18px;font-weight:900;">${escapeHtml(label)}</p>
        <div style="height:18px;border-radius:999px;background:rgba(126,214,240,.24);overflow:hidden;border:1px solid rgba(255,255,255,.9);">
          <div style="height:100%;width:${width};border-radius:999px;background:linear-gradient(90deg,#ff83ad,#ffd36a,#7bdff2);transition:width .22s ease;"></div>
        </div>
        <p style="margin:10px 0 0;font-size:14px;font-weight:900;">${Math.round(safePercent * 100)}%</p>
        ${ready ? '<button data-loader-start style="margin-top:18px;border:0;border-radius:20px;padding:13px 22px;background:#2d8cff;color:white;font:900 20px Baloo 2, sans-serif;box-shadow:0 14px 28px rgba(45,140,255,.24);">Enter</button>' : ''}
      </section>
    </main>
  `;
}

function requiresTouchStart() {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.matchMedia?.('(pointer: coarse)').matches;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
}