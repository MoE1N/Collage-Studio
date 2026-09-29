#!/usr/bin/env bun
/* Syntax-check the browser scripts without running them. */
const t = new Bun.Transpiler({ loader: 'js' });
let bad = 0;
for (const f of ['js/i18n.js', 'js/data.js', 'js/app.js', 'sw.js']) {
  try { t.transformSync(await Bun.file(new URL(`../${f}`, import.meta.url)).text()); } catch (e) { bad++; console.error(`${f}: ${e.message}`); }
}
process.exit(bad ? 1 : 0);
