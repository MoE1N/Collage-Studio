#!/usr/bin/env bun
/* Tiny static server for dist/ (bun scripts/serve.mjs [port]). */
import { join, normalize } from 'node:path';
const root = join(import.meta.dir, '..', 'dist');
const port = +process.argv[2] || 5180;
Bun.serve({
  port,
  async fetch(req) {
    let p = decodeURIComponent(new URL(req.url).pathname);
    if (p.endsWith('/')) p += 'index.html';
    const file = Bun.file(join(root, normalize(p)));
    if (!normalize(p).startsWith('/') || !(await file.exists())) return new Response(Bun.file(join(root, '404.html')), { status: 404 });
    return new Response(file);
  },
});
console.log(`http://localhost:${port}`);
