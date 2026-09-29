#!/usr/bin/env bun
/* Tell IndexNow search engines (Bing, Yandex, Naver, Seznam and others) that the site changed.
   Reads every URL from dist/sitemap.xml. Run after a deploy: bun scripts/indexnow.mjs */
import { readFileSync } from 'node:fs';
const host = readFileSync(new URL('../CNAME', import.meta.url), 'utf8').trim();
const keyFile = readdirSyncKey();
function readdirSyncKey() { return new Bun.Glob('*.txt').scanSync({ cwd: new URL('../dist', import.meta.url).pathname }); }
const key = [...keyFile].find(f => /^[0-9a-f]{32}\.txt$/.test(f))?.slice(0, -4);
if (!key) throw new Error('IndexNow key file not found in dist/');
const urls = [...readFileSync(new URL('../dist/sitemap.xml', import.meta.url), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key, keyLocation: `https://${host}/${key}.txt`, urlList: urls }),
});
console.log(`IndexNow: submitted ${urls.length} URLs, HTTP ${res.status}`);
if (res.status >= 400) process.exit(1);
