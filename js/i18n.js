'use strict';
/* Runtime side of the translations. The build inlines the merged dictionary for the page's language
   as window.I18N, so there is no fetch and no flash of untranslated text. */
const LOCALE = window.LOCALE || 'en';
const I18N = window.I18N || {};
const plural = new Intl.PluralRules(LOCALE);
const numFmt = new Intl.NumberFormat(LOCALE);
const pctFmt = new Intl.NumberFormat(LOCALE, { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fmtNum = n => numFmt.format(n);
const fmtPct = x => pctFmt.format(x);
/* L('key', {var}) looks up a string. Lh allows <b>, <kbd> and <i> (for tips), Ln picks the plural form for n. */
const L = (k, v) => {
  const s = I18N[k];
  if (s == null) return k;
  return v ? s.replace(/\{(\w+)\}/g, (m, n) => (n in v ? v[n] : m)) : s;
};
const Ln = (k, n, v) => L(I18N[`${k}.${plural.select(n)}`] != null ? `${k}.${plural.select(n)}` : `${k}.other`, Object.assign({ n: fmtNum(n) }, v));
const Lh = k => [].concat(I18N[k] || k).map(s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]).replace(/&lt;(\/?)(b|kbd|i)&gt;/g, '<$1$2>'));
