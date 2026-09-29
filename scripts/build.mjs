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

/* Per-page lastmod: the newest commit that touched the files a page is built from (search engines ignore a lastmod that is always "today"). */
const gitDates = new Map();
function modified(...files) {
  const ds = files.map(f => {
    if (!gitDates.has(f)) { let d = ''; try { d = execSync(`git log -1 --format=%cs -- ${f}`, { cwd: ROOT }).toString().trim(); } catch { /* not a git checkout */ } gitDates.set(f, d); }
    return gitDates.get(f);
  }).filter(Boolean).sort();
  return ds.length ? ds[ds.length - 1] : date;
}
const homeMod = l => modified(`locales/${l.code}.json`, 'locales/en.json', 'src/index.template.html');
const pageMod = l => modified(`locales/${l.code}.json`, 'src/page.template.html', 'css/page.css', 'scripts/build.mjs');
const active = langs.filter(l => dicts[l.code]);
const INDEXNOW_KEY = 'b7e2c94f1d6a4a8e9c3f5d20a1e8b6c7';
const PAGES = [
  { id: 'howto', slug: 'how-to-make-a-photo-collage', kind: 'howto' },
  { id: 'instagram', slug: 'instagram-collage-maker', kind: 'article' },
  { id: 'print', slug: 'print-photo-collage', kind: 'article' },
  { id: 'compare', slug: 'collage-maker-no-upload-no-watermark', kind: 'compare' },
];
const pageUrl = (l, pg) => `${urlOf(l)}${pg.slug}/`;
const homeRel = l => (l === DEFAULT ? '' : l.code + '/');
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
    guideLinks: PAGES.map(pg => `<li><a href="${root}${homeRel(l)}${pg.slug}/">${esc(d[`page.${pg.id}.h1`])}</a></li>`).join(''),
    faqHtml: faq.map(f => `<section class="faq"><h4>${esc(f.q)}</h4><p>${esc(f.a)}</p></section>`).join('\n    '),
    langLinks: active.map(x => `<a href="${x === DEFAULT ? root || './' : root + x.code + '/'}" hreflang="${x.hreflang}" lang="${x.hreflang}" dir="${x.dir}" data-lang="${x.code}"${x === l ? ' aria-current="true"' : ''}>${esc(x.name)}</a>`).join('\n      '),
    i18n: JSON.stringify(Object.fromEntries(Object.entries(d).filter(([k]) => !/^(page|faq|about|meta)\./.test(k)))).replace(/</g, '\\u003c'),
  };
  const raw = new Set(['hreflang', 'jsonld', 'ogAlternates', 'redirect', 'guideLinks', 'faqHtml', 'langLinks', 'i18n']);
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
    icons: [
      { src: `${root}icon.svg`, sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: `${root}icon-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: `${root}icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: `${root}icon-maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }, null, 2) + '\n';
}

/* ---------- write dist/ ---------- */
rmSync(DIST, { recursive: true, force: true });
for (const dir of ['css', 'js', 'vendor']) cpSync(join(ROOT, dir), join(DIST, dir), { recursive: true });
for (const f of ['icon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'og.png', 'CNAME']) cpSync(join(ROOT, f), join(DIST, f));
write('.nojekyll', '');
write('sw.js', read('sw.js').replace('__VERSION__', ver));
for (const l of active) {
  const out = l === DEFAULT ? '' : l.code + '/';
  write(out + 'index.html', render(l));
  write(out + 'manifest.webmanifest', manifest(l));
}
write('404.html', render(DEFAULT).replace('<title>', '<meta name="robots" content="noindex">\n<title>'));

function renderPage(l, pg) {
  const d = dicts[l.code];
  const k = x => d[`page.${pg.id}.${x}`];
  const root = l === DEFAULT ? '../' : '../../';
  const sections = [1, 2, 3].map(i => `<section><h2>${esc(k(`s${i}.h`))}</h2><p>${esc(k(`s${i}.p`))}</p></section>`);
  let body = '';
  if (pg.kind === 'howto') body = `<section><ol>${[1, 2, 3, 4, 5].map(i => `<li>${esc(k(`step${i}`))}</li>`).join('')}</ol></section>` + sections.join('');
  else if (pg.kind === 'compare') body = `<table><thead><tr><th scope="col">${esc(k('colFeature'))}</th><th scope="col">${esc(k('colUs'))}</th><th scope="col">${esc(k('colThem'))}</th></tr></thead><tbody>${[1, 2, 3, 4, 5, 6].map(i => `<tr><th scope="row">${esc(k(`row${i}.label`))}</th><td>${esc(k(`row${i}.us`))}</td><td>${esc(k(`row${i}.them`))}</td></tr>`).join('')}</tbody></table>` + sections.slice(0, 2).join('');
  else body = sections.join('');
  const url = pageUrl(l, pg);
  const graph = [
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Collage Studio', item: urlOf(l) }, { '@type': 'ListItem', position: 2, name: k('h1'), item: url }] },
    pg.kind === 'howto'
      ? { '@type': 'HowTo', name: k('h1'), description: k('desc'), inLanguage: l.hreflang, dateModified: pageMod(l), tool: { '@type': 'HowToTool', name: 'Collage Studio' }, step: [1, 2, 3, 4, 5].map(i => ({ '@type': 'HowToStep', position: i, text: k(`step${i}`) })) }
      : { '@type': 'Article', headline: k('h1'), description: k('desc'), inLanguage: l.hreflang, dateModified: pageMod(l), mainEntityOfPage: url, image: `${site}/og.png`, author: { '@type': 'Organization', name: 'Collage Studio', url: `${site}/` }, publisher: { '@type': 'Organization', name: 'Collage Studio', url: `${site}/` } },
  ];
  const map = {
    lang: l.hreflang, dir: l.dir, canonical: url, site, root, ver, ogLocale: l.og, appHref: '../',
    title: k('title'), desc: k('desc'), h1: k('h1'), intro: k('intro'), body, updated: d['page.updated'].replace('{date}', pageMod(l)),
    cta: d['page.cta'], openApp: d['page.openApp'], related: d['page.related'],
    hreflang: active.map(x => `<link rel="alternate" hreflang="${x.hreflang}" href="${pageUrl(x, pg)}">`).concat(`<link rel="alternate" hreflang="x-default" href="${pageUrl(DEFAULT, pg)}">`).join('\n'),
    jsonld: JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c'),
    relatedLinks: PAGES.filter(x => x !== pg).map(x => `<li><a href="../${x.slug}/">${esc(d[`page.${x.id}.h1`])}</a></li>`).join(''),
    langLinks: active.map(x => `<a href="${l === DEFAULT ? '../' : '../../'}${homeRel(x)}${pg.slug}/" hreflang="${x.hreflang}" lang="${x.hreflang}" dir="${x.dir}"${x === l ? ' aria-current="true"' : ''}>${esc(x.name)}</a>`).join(''),
  };
  const raw = new Set(['hreflang', 'jsonld', 'body', 'relatedLinks', 'langLinks']);
  return read('src/page.template.html').replace(/\{\{([\w.-]+)\}\}/g, (m, key) => { if (!(key in map)) throw new Error(`Page template uses unknown key "${key}"`); return raw.has(key) ? map[key] : esc(map[key]); });
}
for (const l of active) for (const pg of PAGES) write(`${homeRel(l)}${pg.slug}/index.html`, renderPage(l, pg));

const aiBots = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'anthropic-ai', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'CCBot', 'Bytespider', 'cohere-ai', 'Meta-ExternalAgent', 'DuckAssistBot'];
write('robots.txt', `User-agent: *\nAllow: /\n\n${aiBots.map(b => `User-agent: ${b}\nAllow: /\n`).join('\n')}\nSitemap: ${site}/sitemap.xml\n`);
const smUrl = (loc, alt, lastmod) => `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n${active.map(x => `    <xhtml:link rel="alternate" hreflang="${x.hreflang}" href="${alt(x)}"/>`).join('\n')}\n    <xhtml:link rel="alternate" hreflang="x-default" href="${alt(DEFAULT)}"/>\n  </url>`;
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${[...active.map(l => smUrl(urlOf(l), urlOf, homeMod(l))), ...PAGES.flatMap(pg => active.map(l => smUrl(pageUrl(l, pg), x => pageUrl(x, pg), pageMod(l))))].join('\n')}\n</urlset>\n`);
write(`${INDEXNOW_KEY}.txt`, INDEXNOW_KEY);

const faqEn = [1, 2, 3, 4, 5, 6].map(i => `### ${en[`faq.q${i}`]}\n${en[`faq.a${i}`]}`).join('\n\n');
write('llms.txt', `# Collage Studio\n\n> ${en['meta.description']}\n\nCollage Studio is a free, open source photo collage maker. It is a static web app: photos are processed locally in the browser with the HTML canvas and are never uploaded. No account, no watermark, no tracking. It can be installed as an offline-capable progressive web app.\n\n## Key facts\n\n- Price: free\n- Privacy: everything runs on the user's device\n- Export formats: PNG, JPG, WebP, PDF (up to 4x canvas size)\n- Layouts: auto-fit (least crop), 1 to 16 cell templates, draggable dividers, freeform mode\n- Editing: filters, borders, shadows, gradients and patterns, text, stickers\n- Source code: https://github.com/MoE1N/Collage-Studio\n\n## Languages\n\n${active.map(l => `- [${l.name}](${urlOf(l)})`).join('\n')}\n\n## Guides\n\n${PAGES.map(pg => `- [${en[`page.${pg.id}.h1`]}](${pageUrl(DEFAULT, pg)}): ${en[`page.${pg.id}.desc`]}`).join('\n')}\n\n## FAQ\n\n${faqEn}\n`);
write('llms-full.txt', `# Collage Studio\n\n${en['about.intro']}\n\n## FAQ\n\n${faqEn}\n\n${PAGES.map(pg => { const g = x => en[`page.${pg.id}.${x}`]; const parts = [`## ${g('h1')}`, g('intro')]; if (pg.kind === 'howto') parts.push([1, 2, 3, 4, 5].map(i => `${i}. ${g(`step${i}`)}`).join('\n')); if (pg.kind === 'compare') parts.push([1, 2, 3, 4, 5, 6].map(i => `- ${g(`row${i}.label`)}: ${g(`row${i}.us`)} (typical cloud apps: ${g(`row${i}.them`)})`).join('\n')); for (const i of [1, 2, 3]) if (g(`s${i}.h`)) parts.push(`### ${g(`s${i}.h`)}\n${g(`s${i}.p`)}`); return parts.join('\n\n'); }).join('\n\n')}\n`);

console.log(`Built ${active.length} language(s) into dist/ (v${ver})${problems.length ? `, ${problems.length} locale warning(s)` : ''}`);
