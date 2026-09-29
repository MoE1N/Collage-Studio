#!/usr/bin/env bun
/* Static site build: renders src/index.template.html once per language into dist/.
   No dependencies. Usage: bun scripts/build.mjs [--strict | --check=<code>]
   --check=xx validates one locale file and exits without building.
   --strict fails on any locale problem (missing or extra keys, placeholder mismatches). CI uses it. */
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const strict = process.argv.includes('--strict');
const checkArg = process.argv.find(a => a.startsWith('--check='));
const checkOnly = checkArg && checkArg.slice(8);
const read = p => readFileSync(join(ROOT, p), 'utf8');
const write = (p, s) => { mkdirSync(dirname(join(DIST, p)), { recursive: true }); writeFileSync(join(DIST, p), s); };

const site = 'https://' + read('CNAME').trim();
const langs = JSON.parse(read('locales/languages.json'));
const DEFAULT = langs[0];
const en = JSON.parse(read('locales/en.json'));

/* ---------- validate and merge locales ---------- */
const problems = [];
const warn = (lang, msg) => problems.push(`[${lang}] ${msg}`);
const vars = v => [...new Set((Array.isArray(v) ? v.join('\n') : String(v)).match(/\{\w+\}/g) || [])].sort().join(',');
const pluralBase = k => (k.endsWith('.other') ? k.slice(0, -6) : null);
const pluralKeys = (dict, base) => Object.keys(dict).filter(k => k.startsWith(base + '.') && /^(zero|one|two|few|many|other)$/.test(k.slice(base.length + 1)));
const enPlurals = Object.keys(en).map(pluralBase).filter(Boolean);
const enSingles = Object.keys(en).filter(k => !enPlurals.some(b => k.startsWith(b + '.') && /^(zero|one|two|few|many|other)$/.test(k.slice(b.length + 1))));

const dicts = {};
for (const l of langs) {
  if (checkOnly && l.code !== checkOnly) continue;
  if (l === DEFAULT) { dicts[l.code] = en; continue; }
  const file = `locales/${l.code}.json`;
  if (!existsSync(join(ROOT, file))) { warn(l.code, 'no locale file'); continue; }
  const loc = JSON.parse(read(file));
  const merged = { ...en };
  for (const b of enPlurals) {
    const own = pluralKeys(loc, b);
    if (!own.length) { warn(l.code, `missing plural group "${b}"`); continue; }
    pluralKeys(en, b).forEach(k => delete merged[k]);
    const need = new Intl.PluralRules(l.hreflang).resolvedOptions().pluralCategories;
    for (const c of need) if (loc[`${b}.${c}`] == null) warn(l.code, `plural "${b}" needs the "${c}" form`);
    for (const k of own) {
      if (!need.includes(k.slice(b.length + 1))) warn(l.code, `plural "${k}" is not used in this language`);
      merged[k] = loc[k];
    }
  }
  for (const k of enSingles) {
    if (loc[k] == null) { warn(l.code, `missing "${k}"`); continue; }
    if (Array.isArray(en[k]) !== Array.isArray(loc[k]) || (Array.isArray(en[k]) && en[k].length !== loc[k].length)) { warn(l.code, `"${k}" has the wrong shape`); continue; }
    merged[k] = loc[k];
  }
  for (const k of Object.keys(loc)) if (en[k] == null && !enPlurals.some(b => k.startsWith(b + '.'))) warn(l.code, `unknown key "${k}"`);
  for (const [k, v] of Object.entries(merged)) {
    const s = Array.isArray(v) ? v.join('\n') : String(v);
    if (!s.trim()) warn(l.code, `"${k}" is empty`);
    if (s.includes('—')) warn(l.code, `"${k}" contains an em dash`);
    const ref = en[k];
    if (ref != null && !/\.(zero|one|two|few|many|other)$/.test(k) && vars(ref) !== vars(v)) warn(l.code, `"${k}" placeholders differ from English (${vars(ref)} vs ${vars(v)})`);
  }
  dicts[l.code] = merged;
}
if (checkOnly) {
  console.log(problems.length ? problems.join('\n') + `\n${problems.length} problem(s) in ${checkOnly}` : `${checkOnly}: OK`);
  process.exit(problems.length ? 1 : 0);
}
if (problems.length) {
  console.warn(problems.join('\n'));
  if (strict) { console.error(`\n${problems.length} locale problem(s).`); process.exit(1); }
}

/* ---------- helpers ---------- */
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const urlOf = l => `${site}/${l === DEFAULT ? '' : l.code + '/'}`;
const ver = createHash('sha1').update(['css/style.css', 'js/i18n.js', 'js/data.js', 'js/app.js'].map(read).join('')).digest('hex').slice(0, 8);
let date = new Date().toISOString().slice(0, 10);
try { date = execSync('git log -1 --format=%cs', { cwd: ROOT }).toString().trim() || date; } catch { /* not a git checkout */ }

const active = langs.filter(l => dicts[l.code]);
const hreflang = active.map(l => `<link rel="alternate" hreflang="${l.hreflang}" href="${urlOf(l)}">`).concat(`<link rel="alternate" hreflang="x-default" href="${urlOf(DEFAULT)}">`).join('\n');

/* Root page only: send first-time visitors to their language. Crawlers keep the English page. */
const redirectMap = {};
for (const l of active) if (l !== DEFAULT) for (const m of l.match) redirectMap[m] = l.code;
const redirect = `<script>(function(){try{var s=localStorage.getItem('cs-lang'),m=${JSON.stringify(redirectMap)},c=s||'',i,p,n=navigator.languages||[navigator.language||''];if(!c)for(i=0;i<n.length&&!c;i++){p=String(n[i]).toLowerCase();c=m[p]||m[p.split('-')[0]]||(p.split('-')[0]==='en'?'en':'');}if(c&&c!=='en'&&Object.values(m).indexOf(c)>-1)location.replace(c+'/'+location.search+location.hash)}catch(e){}})()</script>`;

function render(l) {
  const d = dicts[l.code];
  const root = l === DEFAULT ? '' : '../';
  const faq = [1, 2, 3, 4, 5, 6].map(i => ({ q: d[`faq.q${i}`], a: d[`faq.a${i}`] }));
  const jsonld = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', '@id': `${site}/#site`, name: 'Collage Studio', url: `${site}/`, inLanguage: active.map(x => x.hreflang) },
      {
        '@type': 'WebApplication', '@id': `${urlOf(l)}#app`, name: 'Collage Studio', alternateName: d['meta.title'], url: urlOf(l), description: d['meta.description'],
        inLanguage: l.hreflang, applicationCategory: 'MultimediaApplication', applicationSubCategory: 'Photo collage maker', operatingSystem: 'Any', browserRequirements: 'Requires JavaScript',
        isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, image: `${site}/og.png`, screenshot: `${site}/og.png`, isPartOf: { '@id': `${site}/#site` },
        featureList: ['Auto-fit photo layouts', 'Grid and freeform modes', 'Filters', 'Text and stickers', 'PNG, JPG, WebP and PDF export', 'Works offline', 'Photos never leave the device'],
      },
      { '@type': 'FAQPage', '@id': `${urlOf(l)}#faq`, inLanguage: l.hreflang, mainEntity: faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    ],
  }).replace(/</g, '\\u003c');
  const map = {
    lang: l.hreflang, dir: l.dir, locale: l.hreflang, canonical: urlOf(l), site, root, ver, hreflang, jsonld, langName: l.name, ogLocale: l.og,
    ogAlternates: active.filter(x => x !== l).map(x => `<meta property="og:locale:alternate" content="${x.og}">`).join('\n'),
    redirect: l === DEFAULT ? redirect : '',
    faqHtml: faq.map(f => `<section class="faq"><h4>${esc(f.q)}</h4><p>${esc(f.a)}</p></section>`).join('\n    '),
    langLinks: active.map(x => `<a href="${x === DEFAULT ? root || './' : root + x.code + '/'}" hreflang="${x.hreflang}" lang="${x.hreflang}" dir="${x.dir}" data-lang="${x.code}"${x === l ? ' aria-current="true"' : ''}>${esc(x.name)}</a>`).join('\n      '),
    i18n: JSON.stringify(d).replace(/</g, '\\u003c'),
  };
  const raw = new Set(['hreflang', 'jsonld', 'ogAlternates', 'redirect', 'faqHtml', 'langLinks', 'i18n']);
  return read('src/index.template.html').replace(/\{\{([\w.-]+)\}\}/g, (m, k) => {
    if (k in map) return raw.has(k) ? map[k] : esc(map[k]);
    if (k in d) return esc(d[k]);
    throw new Error(`Template uses unknown key "${k}"`);
  });
}

function manifest(l) {
  const d = dicts[l.code], root = l === DEFAULT ? '' : '../';
  return JSON.stringify({
    id: urlOf(l), name: 'Collage Studio', short_name: 'Collage', description: d['meta.manifestDescription'], lang: l.hreflang, dir: l.dir,
    start_url: './', scope: './', display: 'standalone', background_color: '#f3f4f8', theme_color: '#7c5cff',
    icons: [{ src: `${root}icon.svg`, sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  }, null, 2) + '\n';
}

/* ---------- write dist/ ---------- */
rmSync(DIST, { recursive: true, force: true });
for (const dir of ['css', 'js', 'vendor']) cpSync(join(ROOT, dir), join(DIST, dir), { recursive: true });
for (const f of ['icon.svg', 'og.png', 'CNAME']) cpSync(join(ROOT, f), join(DIST, f));
write('.nojekyll', '');
write('sw.js', read('sw.js').replace('__VERSION__', ver));
for (const l of active) {
  const out = l === DEFAULT ? '' : l.code + '/';
  write(out + 'index.html', render(l));
  write(out + 'manifest.webmanifest', manifest(l));
}
write('404.html', render(DEFAULT).replace('<title>', '<meta name="robots" content="noindex">\n<title>'));

const aiBots = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'anthropic-ai', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'CCBot', 'Bytespider', 'cohere-ai', 'Meta-ExternalAgent', 'DuckAssistBot'];
write('robots.txt', `User-agent: *\nAllow: /\n\n${aiBots.map(b => `User-agent: ${b}\nAllow: /\n`).join('\n')}\nSitemap: ${site}/sitemap.xml\n`);
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${active.map(l => `  <url>\n    <loc>${urlOf(l)}</loc>\n    <lastmod>${date}</lastmod>\n${active.map(x => `    <xhtml:link rel="alternate" hreflang="${x.hreflang}" href="${urlOf(x)}"/>`).join('\n')}\n    <xhtml:link rel="alternate" hreflang="x-default" href="${urlOf(DEFAULT)}"/>\n  </url>`).join('\n')}\n</urlset>\n`);

const faqEn = [1, 2, 3, 4, 5, 6].map(i => `### ${en[`faq.q${i}`]}\n${en[`faq.a${i}`]}`).join('\n\n');
write('llms.txt', `# Collage Studio\n\n> ${en['meta.description']}\n\nCollage Studio is a free, open source photo collage maker. It is a static web app: photos are processed locally in the browser with the HTML canvas and are never uploaded. No account, no watermark, no tracking. It can be installed as an offline-capable progressive web app.\n\n## Key facts\n\n- Price: free\n- Privacy: everything runs on the user's device\n- Export formats: PNG, JPG, WebP, PDF (up to 4x canvas size)\n- Layouts: auto-fit (least crop), 1 to 16 cell templates, draggable dividers, freeform mode\n- Editing: filters, borders, shadows, gradients and patterns, text, stickers\n- Source code: https://github.com/MoE1N/Collage-Studio\n\n## Languages\n\n${active.map(l => `- [${l.name}](${urlOf(l)})`).join('\n')}\n\n## FAQ\n\n${faqEn}\n`);

console.log(`Built ${active.length} language(s) into dist/ (v${ver})${problems.length ? `, ${problems.length} locale warning(s)` : ''}`);
