import { clone } from './utils.js';
import { DEFAULT_DATA } from '../data/defaultData.js';

export const STORAGE_KEY = 'MR_GAME_DATA';
export const LANG_KEY = 'MR_LANG';

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : clone(DEFAULT_DATA);
    if (!Array.isArray(parsed.objects)) parsed.objects = [];
    if (!Array.isArray(parsed.levels)) parsed.levels = [];
    return parsed;
  } catch (_) {
    return clone(DEFAULT_DATA);
  }
}

export function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadLanguage() {
  return localStorage.getItem(LANG_KEY) || 'zh';
}

export function saveLanguage(lang) {
  localStorage.setItem(LANG_KEY, lang);
}
