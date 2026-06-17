import { loadAdminConfig } from './adminConfig.js';

const DEFAULT_AUDIO_ASSETS = [
  '/assets/audio/menu-theme.m4a',
  '/assets/audio/1-star.m4a',
  '/assets/audio/2-stars.m4a',
  '/assets/audio/3-stars.m4a',
  '/assets/audio/meow.m4a'
];
const primedAudioElements = [];

export async function preloadGameAudioAssets(onProgress = () => {}) {
  const assets = collectAudioAssets();
  let completed = 0;
  onProgress({ completed, total: assets.length, percent: 0, label: 'Preparing music...' });

  const results = await Promise.allSettled(assets.map(async (src, index) => {
    await preloadOneAudio(src);
    completed += 1;
    onProgress({
      completed,
      total: assets.length,
      percent: assets.length ? completed / assets.length : 1,
      label: `Loading music ${Math.min(index + 1, assets.length)} / ${assets.length}`
    });
  }));

  onProgress({ completed: assets.length, total: assets.length, percent: 1, label: 'Ready' });
  return results;
}

function collectAudioAssets() {
  try {
    const config = loadAdminConfig();
    return uniqueAudioAssets([
      config?.audio?.menu?.src,
      config?.audio?.result?.tracks?.[1],
      config?.audio?.result?.tracks?.[2],
      config?.audio?.result?.tracks?.[3],
      ...DEFAULT_AUDIO_ASSETS
    ]);
  } catch {
    return DEFAULT_AUDIO_ASSETS;
  }
}

async function preloadOneAudio(src) {
  if (!src || src.startsWith('data:') || src.startsWith('blob:')) return;
  await Promise.race([
    fetchAudio(src),
    wait(45000)
  ]);
  primeAudioElement(src);
}

async function fetchAudio(src) {
  try {
    const response = await fetch(src, { cache: 'force-cache' });
    if (!response.ok) return;

    if (!response.body?.getReader) {
      await response.arrayBuffer();
      return;
    }

    const reader = response.body.getReader();
    while (true) {
      const { done } = await reader.read();
      if (done) break;
    }
  } catch {
    // Custom admin audio URLs can fail CORS; the media element can still attempt playback later.
  }
}

function primeAudioElement(src) {
  try {
    const audio = new Audio(src);
    audio.preload = 'auto';
    audio.playsInline = true;
    audio.setAttribute('playsinline', '');
    audio.setAttribute('webkit-playsinline', '');
    audio.load();
    primedAudioElements.push(audio);
  } catch {
    // Keep boot resilient even if a custom audio URL is invalid.
  }
}

function uniqueAudioAssets(items) {
  return [...new Set(items.filter(item => typeof item === 'string' && item.trim()).map(item => item.trim()))];
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
