import { I18N } from '../i18n/messages.js';

export function translate(lang, key) {
  return I18N[lang]?.[key] || I18N.zh[key] || key;
}
