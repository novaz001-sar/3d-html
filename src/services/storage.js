import { DEFAULT_DATA } from '../data/defaultData.js';
import { clone } from '../shared/utils.js';

export const STORAGE_KEY = 'MR_GAME_DATA';
export const LANG_KEY = 'MR_LANG';

export function loadData() {
  try {
    return normalizeData(JSON.parse(localStorage.getItem(STORAGE_KEY)) || clone(DEFAULT_DATA));
  } catch (_) {
    return clone(DEFAULT_DATA);
  }
}

export function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeData(data)));
}

export function loadLanguage() {
  return localStorage.getItem(LANG_KEY) || 'zh';
}

export function saveLanguage(lang) {
  localStorage.setItem(LANG_KEY, lang);
}

export function normalizeData(data) {
  const normalized = data && typeof data === 'object' ? data : {};
  if (!Array.isArray(normalized.objects)) normalized.objects = [];
  if (!Array.isArray(normalized.levels)) normalized.levels = [];
  return normalized;
}
