#!/usr/bin/env bun
/* Validate dist/sitemap.xml against the built pages: bun scripts/check-sitemap.mjs */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const dist = new URL('../dist/', import.meta.url).pathname;
const site = 'https://' + readFileSync(new URL('../CNAME', import.meta.url), 'utf8').trim();
const xml = readFileSync(join(dist, 'sitemap.xml'), 'utf8');
const errors = [];
const err = m => errors.push(m);

const blocks = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(m => m[1]);
const entries = blocks.map(b => ({
  loc: b.match(/<loc>([^<]+)<\/loc>/)?.[1],
  lastmod: b.match(/<lastmod>([^<]*)<\/lastmod>/)?.[1],
  alts: Object.fromEntries([...b.matchAll(/<xhtml:link rel="alternate" hreflang="([^"]+)" href="([^"]+)"\/>/g)].map(m => [m[1], m[2]])),
}));
if (!entries.length) err('no <url> entries');
if (entries.length > 50000) err('more than 50000 URLs');
if (Buffer.byteLength(xml) > 50 * 1024 * 1024) err('sitemap larger than 50 MB');
const locs = entries.map(e => e.loc);
const set = new Set(locs);
if (set.size !== locs.length) err('duplicate <loc> entries');

const fileFor = url => join(dist, new URL(url).pathname, 'index.html');
for (const e of entries) {
  const where = e.loc;
  if (!e.loc?.startsWith(site + '/')) { err(`${where}: not on ${site}`); continue; }
  if (!e.loc.endsWith('/')) err(`${where}: missing trailing slash`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.lastmod || '')) err(`${where}: bad lastmod "${e.lastmod}"`);
  if (!existsSync(fileFor(e.loc))) { err(`${where}: no built page`); continue; }
  const html = readFileSync(fileFor(e.loc), 'utf8');
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  if (canonical !== e.loc) err(`${where}: canonical is ${canonical}`);
  if (/noindex/.test(html)) err(`${where}: page is noindex`);
  // hreflang: the sitemap alternates must equal the ones in the page head, include a self reference and x-default
  const head = Object.fromEntries([...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map(m => [m[1], m[2]]));
  if (JSON.stringify(Object.entries(head).sort()) !== JSON.stringify(Object.entries(e.alts).sort())) err(`${where}: sitemap and page hreflang sets differ`);
  if (!('x-default' in e.alts)) err(`${where}: no x-default`);
  if (!Object.values(e.alts).includes(e.loc)) err(`${where}: no self-referencing hreflang`);
  const lang = html.match(/<html lang="([^"]+)"/)?.[1];
  if (e.alts[lang] !== e.loc) err(`${where}: <html lang="${lang}"> does not match its hreflang entry`);
  // reciprocity: every alternate is itself in the sitemap and lists this URL back
  for (const [hl, href] of Object.entries(e.alts)) {
    const other = entries.find(x => x.loc === href);
    if (!other) { err(`${where}: alternate ${hl} ${href} is not in the sitemap`); continue; }
    if (!Object.values(other.alts).includes(e.loc)) err(`${where}: ${href} does not link back`);
  }
}
// every built page should be listed (except 404)
const { Glob } = Bun;
for (const f of new Glob('**/index.html').scanSync({ cwd: dist })) {
  const url = `${site}/${f.replace(/index\.html$/, '')}`;
  if (!set.has(url)) err(`${url}: built but missing from the sitemap`);
}
// robots.txt points at it
if (!readFileSync(join(dist, 'robots.txt'), 'utf8').includes(`Sitemap: ${site}/sitemap.xml`)) err('robots.txt does not reference the sitemap');

console.log(`${entries.length} URLs checked`);
if (errors.length) { console.error(errors.slice(0, 40).join('\n') + (errors.length > 40 ? `\n...and ${errors.length - 40} more` : '')); process.exit(1); }
console.log('sitemap OK');
