export const ADMIN_CONFIG_KEY = 'MR_ADMIN_CONFIG_V1';

export const DEFAULT_ADMIN_CONFIG = {
  version: 1,
  content: {
    title: {
      en: 'Toy Planet',
      zh: '积木星球'
    },
    edition: {
      en: '3D Mental Rotation',
      zh: '3D 心理旋转训练'
    },
    manualText: {
      en: 'Compare the left and right 3D block models and decide whether they are the same object shown from different angles. The editor can create voxel objects, levels, and questions; data can be imported and exported.',
      zh: '\u901a\u8fc7\u6bd4\u5bf9\u5de6\u53f3\u4e24\u4fa7\u7684\u4e09\u7ef4\u79ef\u6728\uff0c\u5224\u65ad\u5b83\u4eec\u662f\u5426\u662f\u540c\u4e00\u4e2a\u7269\u4f53\u5728\u4e0d\u540c\u89d2\u5ea6\u4e0b\u7684\u5f62\u6001\u3002\u7f16\u8f91\u5668\u53ef\u4ee5\u521b\u5efa\u4f53\u7d20\u7269\u4f53\u3001\u5173\u5361\u548c\u9898\u76ee\uff0c\u6570\u636e\u53ef\u5bfc\u5165\u5bfc\u51fa\u3002'
    }
  },
  defaults: {
    language: 'en',
    allowLanguageSwitch: true,
    fontScale: 1,
    allowFontControl: true,
    latinFont: 'Baloo 2',
    cjkFont: 'ZCOOL KuaiLe'
  },
  audio: {
    menu: {
      enabled: true,
      showControls: true,
      src: '/assets/audio/menu-theme.m4a',
      volume: 0.5,
      start: 0,
      loop: true
    },
    sfx: {
      enabled: true,
      volumeMultiplier: 2
    },
    result: {
      enabled: true,
      volume: 0.72,
      start: 2,
      tracks: {
        1: '/assets/audio/1-star.m4a',
        2: '/assets/audio/2-stars.m4a',
        3: '/assets/audio/3-stars.m4a'
      }
    }
  },
  visual: {
    homeCat: {
      enabled: true,
      opacity: 0.5
    }
  }
};

export function loadAdminConfig() {
  try {
    const stored = JSON.parse(localStorage.getItem(ADMIN_CONFIG_KEY) || 'null');
    return normalizeAdminConfig(stored);
  } catch {
    return clone(DEFAULT_ADMIN_CONFIG);
  }
}

export function saveAdminConfig(config) {
  const normalized = normalizeAdminConfig(config);
  localStorage.setItem(ADMIN_CONFIG_KEY, JSON.stringify(normalized));
  return normalized;
}

export function resetAdminConfig() {
  localStorage.removeItem(ADMIN_CONFIG_KEY);
  return clone(DEFAULT_ADMIN_CONFIG);
}

export function localizedConfigText(value, lang, fallback = '') {
  if (!value || typeof value !== 'object') return fallback;
  return value[lang] || value.en || value.zh || fallback;
}

export function normalizeAdminConfig(config) {
  const merged = deepMerge(DEFAULT_ADMIN_CONFIG, config && typeof config === 'object' ? config : {});
  merged.version = 1;
  merged.defaults.language = ['en', 'zh'].includes(merged.defaults.language) ? merged.defaults.language : 'en';
  merged.defaults.fontScale = clampNumber(merged.defaults.fontScale, 0.88, 1.28, 1);
  merged.audio.menu.volume = clampNumber(merged.audio.menu.volume, 0, 1, 0.5);
  merged.audio.menu.start = clampNumber(merged.audio.menu.start, 0, 120, 0);
  merged.audio.sfx.volumeMultiplier = clampNumber(merged.audio.sfx.volumeMultiplier, 0, 4, 2);
  merged.audio.result.volume = clampNumber(merged.audio.result.volume, 0, 1, 0.72);
  merged.audio.result.start = clampNumber(merged.audio.result.start, 0, 120, 2);
  merged.visual.homeCat.opacity = clampNumber(merged.visual.homeCat.opacity, 0, 1, 0.5);
  return merged;
}

function deepMerge(base, override) {
  const output = clone(base);
  Object.entries(override || {}).forEach(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value) && output[key] && typeof output[key] === 'object') {
      output[key] = deepMerge(output[key], value);
    } else if (value !== undefined) {
      output[key] = value;
    }
  });
  return output;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function clampNumber(value, min, max, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, numeric));
}
