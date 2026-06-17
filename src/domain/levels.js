export function levelName(level, lang, fallback = 'Start') {
  if (!level) return fallback;
  if (lang === 'zh') return clean(level.nameZh) || clean(level.name) || clean(level.nameEn) || fallback;
  return clean(level.nameEn) || clean(level.name) || clean(level.nameZh) || fallback;
}

export function ensureLevelNames(level, lang = 'en') {
  const fallback = clean(level?.name) || 'Untitled';
  const nameEn = clean(level?.nameEn) || (lang === 'en' ? fallback : 'Untitled');
  const nameZh = clean(level?.nameZh) || (lang === 'zh' ? fallback : '未命名关卡');

  return {
    ...level,
    name: nameEn,
    nameEn,
    nameZh
  };
}

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}
