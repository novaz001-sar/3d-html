import { DEFAULT_DATA } from '../data/defaultData.js';
import { ensureLevelNames } from '../domain/levels.js';
import { clone } from '../shared/utils.js';

export const STORAGE_KEY = 'MR_GAME_DATA';
export const LANG_KEY = 'MR_LANG_V3';
export const FONT_SCALE_KEY = 'MR_FONT_SCALE';
export const MENU_MUSIC_KEY = 'MR_MENU_MUSIC';

export function loadData() {
  try {
    return withDefaultContent(normalizeData(JSON.parse(localStorage.getItem(STORAGE_KEY)) || clone(DEFAULT_DATA)));
  } catch (_) {
    return clone(DEFAULT_DATA);
  }
}

export function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeData(data)));
}

export function loadLanguage() {
  return localStorage.getItem(LANG_KEY) || 'en';
}

export function saveLanguage(lang) {
  localStorage.setItem(LANG_KEY, lang);
}

export function loadFontScale() {
  const saved = Number(localStorage.getItem(FONT_SCALE_KEY));
  return Number.isFinite(saved) ? Math.min(1.28, Math.max(0.88, saved)) : 1;
}

export function saveFontScale(scale) {
  localStorage.setItem(FONT_SCALE_KEY, String(Math.min(1.28, Math.max(0.88, Number(scale) || 1))));
}

export function loadMenuMusicEnabled() {
  return localStorage.getItem(MENU_MUSIC_KEY) !== 'off';
}

export function saveMenuMusicEnabled(enabled) {
  localStorage.setItem(MENU_MUSIC_KEY, enabled ? 'on' : 'off');
}

export function normalizeData(data) {
  const normalized = data && typeof data === 'object' ? data : {};
  if (!Array.isArray(normalized.objects)) normalized.objects = [];
  if (!Array.isArray(normalized.levels)) normalized.levels = [];
  return normalized;
}

function withDefaultContent(data) {
  const normalized = clone(data);

  DEFAULT_DATA.objects.forEach(defaultObject => {
    const existingIndex = normalized.objects.findIndex(object => object.id === defaultObject.id);
    if (existingIndex >= 0) normalized.objects[existingIndex] = clone(defaultObject);
    else normalized.objects.push(clone(defaultObject));
  });

  DEFAULT_DATA.levels.map(level => ensureLevelNames(level, 'en')).forEach(defaultLevel => {
    const existingIndex = normalized.levels.findIndex(level => level.id === defaultLevel.id);
    if (existingIndex >= 0) normalized.levels[existingIndex] = clone(defaultLevel);
    else normalized.levels.push(clone(defaultLevel));
  });

  normalized.levels = normalized.levels.map(level => ensureLevelNames(level));

  return normalized;
}
