'use strict';
/* Collage Studio: everything runs locally in the browser. Konva handles the canvas, hit testing and
   transform handles; jsPDF is used for PDF export. */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const uid = () => Math.random().toString(36).slice(2, 9);
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const ACCENT = '#7c5cff';
const MAX_CELLS = 30;
const isMobile = () => matchMedia('(max-width: 760px)').matches;
const CTX_FILTER = 'filter' in CanvasRenderingContext2D.prototype;

/* ---------- icons ---------- */
const ICONS = {
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
  shuffle: '<path d="m18 14 4 4-4 4"/><path d="m18 2 4 4-4 4"/><path d="M2 18h1.97a4 4 0 0 0 3.14-1.5l5.78-7A4 4 0 0 1 16.03 8H22"/><path d="M2 6h1.97a4 4 0 0 1 3.14 1.5l.63.77"/><path d="M22 18h-5.97a4 4 0 0 1-3.14-1.5l-.63-.77"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
  layout: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
  palette: '<circle cx="13.5" cy="6.5" r="1"/><circle cx="17.5" cy="10.5" r="1"/><circle cx="8.5" cy="7.5" r="1"/><circle cx="6.5" cy="12.5" r="1"/><path d="M12 22a10 10 0 1 1 10-10c0 2.8-2.2 3-4 3h-2a2 2 0 0 0-1 3.7c.6.5.5 1.3 0 2-.5.6-1.7 1.3-3 1.3Z"/>',
  type: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/>',
  rotcw: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5"/>',
  rotccw: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5"/>',
  flip: '<path d="M12 3v18M8 7 3 12l5 5V7zM16 7l5 5-5 5V7z"/>',
  replace: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/>',
  front: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M3 16V5a2 2 0 0 1 2-2h11"/>',
  back: '<rect x="3" y="3" width="13" height="13" rx="2"/><path d="M21 8v11a2 2 0 0 1-2 2H8"/>',
  zoomin: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3M11 8v6M8 11h6"/>',
  zoomout: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3M8 11h6"/>',
  fit: '<path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8"/>',
  folder: '<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9l-.8-1.2A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z"/>',
  external: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  sparkle: '<path d="m12 3 1.9 5.8L20 10l-6.1 1.2L12 17l-1.9-5.8L4 10l6.1-1.2z"/><path d="M19 3v4M17 5h4"/>',
  more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  dup: '<rect x="8" y="8" width="13" height="13" rx="2"/><rect x="3" y="3" width="13" height="13" rx="2"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6"/>',
};
const svg = n => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[n] || ''}</svg>`;

/* ---------- state ---------- */
const DEF_F = () => ({ b: 100, c: 100, s: 100, g: 0, sep: 0, blur: 0, hue: 0, vig: 0 });
const newCrop = (photoId = null) => ({ photoId, zoom: 1, ox: 0, oy: 0, rot: 0, flip: false, fit: false, f: DEF_F() });
const defaultState = () => ({
  canvas: { w: 1080, h: 1080, preset: 'sq' },
  bg: { type: 'solid', c1: '#ffffff', c2: '#e9d5ff', angle: 135, pat: 'dots' },
  gap: 12, pad: 12, radius: 0,
  border: { w: 0, color: '#ffffff' },
  shadow: { on: false, blur: 24, opacity: 0.35 },
  mode: 'grid', layoutId: 'n4-0', smartTree: null, smartLoss: null, autoLayout: true,
  cells: fill(4, () => newCrop()), items: [],
});
let state = defaultState();
const photos = new Map(); // id -> {id,name,blob,bmp,prev,w,h,thumb}
let photoOrder = [];
let sel = null; // {t:'cell',i} | {t:'item',id}
let exporting = false;
let rects = [];

/* ---------- history + autosave ---------- */
const hist = { u: [], r: [] };
const snap = () => JSON.stringify({ s: state, o: photoOrder }); // photo order is part of history so undo can bring photos back
let lastSnap = snap();
function restoreSnap(str) { const d = JSON.parse(str); state = d.s; photoOrder = d.o.filter(id => photos.has(id)); }
const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
function commit() {
  const s = snap();
  if (s === lastSnap) return;
  hist.u.push(lastSnap); if (hist.u.length > 80) hist.u.shift();
  hist.r = []; lastSnap = s;
  updateHistBtns(); scheduleSave();
}
function undo() { if (!hist.u.length) return; hist.r.push(lastSnap); lastSnap = hist.u.pop(); restoreSnap(lastSnap); afterRestore(); }
function redo() { if (!hist.r.length) return; hist.u.push(lastSnap); lastSnap = hist.r.pop(); restoreSnap(lastSnap); afterRestore(); }
function updateHistBtns() { $('#undoBtn').disabled = !hist.u.length; $('#redoBtn').disabled = !hist.r.length; }
function afterRestore() {
  if (sel && ((sel.t === 'cell' && !state.cells[sel.i]) || (sel.t === 'item' && !state.items.find(i => i.id === sel.id)))) sel = null;
  fullRefresh(); updateHistBtns(); scheduleSave();
}

const idb = {
  open: () => new Promise((res, rej) => { const r = indexedDB.open('collage-studio', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }),
  async get(k) { const d = await this.open(); return new Promise((res, rej) => { const q = d.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); },
  async set(k, val) { const d = await this.open(); return new Promise((res, rej) => { const t = d.transaction('kv', 'readwrite'); t.objectStore('kv').put(val, k); t.oncomplete = res; t.onerror = () => rej(t.error); }); },
};
let saveTimer, saveWarned = false;
async function saveNow() {
  clearTimeout(saveTimer);
  try { await idb.set('session', { state, order: photoOrder, photos: photoOrder.map(id => { const p = photos.get(id); return { id, name: p.name, blob: p.blob }; }) }); }
  catch (e) { if (!saveWarned) { saveWarned = true; toast(L('toast.autosave')); } }
}
function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 800); }
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveNow(); });
window.addEventListener('pagehide', saveNow);

/* ---------- toast ---------- */
let toastTimer;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ---------- photo loading ---------- */
function scaleBmp(bmp, max) {
  const k = max / Math.max(bmp.width, bmp.height);
  if (k >= 1) return Promise.resolve(bmp);
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(bmp, 0, 0, c.width, c.height);
  return createImageBitmap(c);
}
async function loadPhoto(blob, name, id = uid()) {
  // Only a 1600px preview stays in memory; full resolution is decoded on demand at export (see loadHi)
  const orig = await createImageBitmap(blob);
  const w = orig.width, h = orig.height;
  const prev = await scaleBmp(orig, 1600);
  if (prev !== orig) orig.close();
  const tc = document.createElement('canvas'); const tk = 200 / Math.max(w, h);
  tc.width = Math.max(1, Math.round(w * tk)); tc.height = Math.max(1, Math.round(h * tk));
  tc.getContext('2d').drawImage(prev, 0, 0, tc.width, tc.height);
  const p = { id, name, blob, prev, hi: null, w, h, thumb: tc.toDataURL('image/jpeg', 0.8) };
  photos.set(id, p); photoOrder.push(id);
  return p;
}

/* decode a photo at about `need` px on its long side (never above 5000); returns the preview when that is enough */
async function loadHi(p, need) {
  const k = Math.min(1, Math.min(5000, need) / Math.max(p.w, p.h)), tw = Math.round(p.w * k), th = Math.round(p.h * k);
  if (p.prev.width >= tw) return p.prev;
  try { return await createImageBitmap(p.blob, { resizeWidth: tw, resizeHeight: th, resizeQuality: 'high' }); }
  catch (e) { const o = await createImageBitmap(p.blob); const r = await scaleBmp(o, Math.max(tw, th)); if (r !== o) o.close(); return r; }
}

/* ---------- drawing helpers ---------- */
function rr(c, x, y, w, hh, r) {
  r = Math.max(0, Math.min(r, w / 2, hh / 2));
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + hh, r); c.arcTo(x + w, y + hh, x, y + hh, r); c.arcTo(x, y + hh, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
const isDefaultF = f => f.b === 100 && f.c === 100 && f.s === 100 && f.g === 0 && f.sep === 0 && f.blur === 0 && f.hue === 0;
function cssFilter(f, sc) {
  const a = [];
  if (f.b !== 100) a.push(`brightness(${f.b}%)`);
  if (f.c !== 100) a.push(`contrast(${f.c}%)`);
  if (f.s !== 100) a.push(`saturate(${f.s}%)`);
  if (f.g) a.push(`grayscale(${f.g}%)`);
  if (f.sep) a.push(`sepia(${f.sep}%)`);
  if (f.hue) a.push(`hue-rotate(${f.hue}deg)`);
  if (f.blur) a.push(`blur(${(f.blur * sc).toFixed(2)}px)`);
  return a.join(' ') || 'none';
}
const fcache = new Map();
function fallbackFilter(p, f, full, base) { // browsers without ctx.filter (Safari)
  const key = p.id + full + base.width + JSON.stringify(f);
  if (fcache.has(key)) return fcache.get(key);
  const c = document.createElement('canvas'); c.width = base.width; c.height = base.height;
  const x = c.getContext('2d'); x.drawImage(base, 0, 0);
  const d = x.getImageData(0, 0, c.width, c.height), a = d.data;
  const b = f.b / 100, ct = f.c / 100, sa = f.s / 100, g = f.g / 100, se = f.sep / 100;
  for (let i = 0; i < a.length; i += 4) {
    let r = (a[i] * b - 128) * ct + 128, gg = (a[i + 1] * b - 128) * ct + 128, bl = (a[i + 2] * b - 128) * ct + 128;
    const l = 0.299 * r + 0.587 * gg + 0.114 * bl;
    r = l + (r - l) * sa; gg = l + (gg - l) * sa; bl = l + (bl - l) * sa;
    r += (l - r) * g; gg += (l - gg) * g; bl += (l - bl) * g;
    const sr = 0.393 * r + 0.769 * gg + 0.189 * bl, sg = 0.349 * r + 0.686 * gg + 0.168 * bl, sb = 0.272 * r + 0.534 * gg + 0.131 * bl;
    a[i] = r + (sr - r) * se; a[i + 1] = gg + (sg - gg) * se; a[i + 2] = bl + (sb - bl) * se;
  }
  x.putImageData(d, 0, 0);
  fcache.set(key, c); if (fcache.size > 10) fcache.delete(fcache.keys().next().value);
  return c;
}

/* cover-fit a photo (with zoom / pan / quarter turns / flip / filters) inside a w*h box at the origin */
function panLimit(cr, w, hh) {
  const p = photos.get(cr.photoId); if (!p) return { mx: 0, my: 0 };
  const q = cr.rot % 2, rw = q ? p.h : p.w, rh = q ? p.w : p.h;
  const s = (cr.fit ? Math.min(w / rw, hh / rh) : Math.max(w / rw, hh / rh)) * cr.zoom;
  return { mx: Math.max(0, (rw * s - w) / 2), my: Math.max(0, (rh * s - hh) / 2), s, rw, rh };
}
function clampPan(cr, w, hh) {
  const { mx, my } = panLimit(cr, w, hh);
  cr.ox = clamp(cr.ox, -mx / w, mx / w); cr.oy = clamp(cr.oy, -my / hh, my / hh);
}
function drawCrop(c, cr, w, hh, rad) {
  const p = photos.get(cr.photoId); if (!p) return;
  const sc = Math.hypot(c.getTransform().a, c.getTransform().b);
  const { mx, my, s } = panLimit(cr, w, hh);
  const px = clamp(cr.ox * w, -mx, mx), py = clamp(cr.oy * hh, -my, my);
  const f = cr.f || DEF_F();
  let src = exporting && p.hi ? p.hi : p.prev;
  if (!CTX_FILTER && !isDefaultF(f)) src = fallbackFilter(p, f, exporting, src);
  c.save(); rr(c, 0, 0, w, hh, rad); c.clip();
  c.save();
  c.translate(w / 2 + px, hh / 2 + py);
  if (cr.flip) c.scale(-1, 1);
  c.rotate(cr.rot * Math.PI / 2);
  if (CTX_FILTER) c.filter = cssFilter(f, sc);
  c.drawImage(src, -p.w * s / 2, -p.h * s / 2, p.w * s, p.h * s);
  c.restore();
  if (f.vig > 0) {
    const g = c.createRadialGradient(w / 2, hh / 2, Math.min(w, hh) * 0.25, w / 2, hh / 2, Math.hypot(w, hh) / 2);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${f.vig / 100 * 0.85})`);
    c.fillStyle = g; c.fillRect(0, 0, w, hh);
  }
  c.restore();
}
function drawShadow(c, w, hh, rad) {
  const s = state.shadow; if (!s.on) return;
  const sc = Math.hypot(c.getTransform().a, c.getTransform().b);
  c.save(); c.shadowColor = `rgba(0,0,0,${s.opacity})`; c.shadowBlur = s.blur * sc; c.shadowOffsetY = s.blur * 0.25 * sc;
  c.fillStyle = '#000'; rr(c, 0, 0, w, hh, rad); c.fill(); c.restore();
}
function drawBorder(c, w, hh, rad) {
  const b = state.border; if (!b.w) return;
  c.save(); c.strokeStyle = b.color; c.lineWidth = b.w; rr(c, b.w / 2, b.w / 2, w - b.w, hh - b.w, rad - b.w / 2); c.stroke(); c.restore();
}

function firstPhotoId() {
  const c = state.cells.find(c => c.photoId && photos.has(c.photoId));
  if (state.mode === 'grid' && c) return c.photoId;
  const it = state.items.find(i => i.type === 'image' && photos.has(i.photoId));
  return c ? c.photoId : it ? it.photoId : photoOrder[0];
}
function drawBg(c, w, hh) {
  const b = state.bg; c.save();
  if (b.type === 'solid') { c.fillStyle = b.c1; c.fillRect(0, 0, w, hh); }
  else if (b.type === 'gradient') {
    const a = b.angle * Math.PI / 180, dx = Math.sin(a), dy = -Math.cos(a), len = Math.abs(w * dx) + Math.abs(hh * dy);
    const g = c.createLinearGradient(w / 2 - dx * len / 2, hh / 2 - dy * len / 2, w / 2 + dx * len / 2, hh / 2 + dy * len / 2);
    g.addColorStop(0, b.c1); g.addColorStop(1, b.c2); c.fillStyle = g; c.fillRect(0, 0, w, hh);
  } else if (b.type === 'pattern') {
    c.fillStyle = b.c1; c.fillRect(0, 0, w, hh); c.fillStyle = b.c2; c.strokeStyle = b.c2; c.lineWidth = 2;
    const st = 40;
    if (b.pat === 'dots') { for (let y = st / 2; y < hh; y += st) for (let x = st / 2; x < w; x += st) { c.beginPath(); c.arc(x, y, 3.5, 0, 7); c.fill(); } }
    else if (b.pat === 'grid') { c.beginPath(); for (let x = 0; x < w; x += st) { c.moveTo(x, 0); c.lineTo(x, hh); } for (let y = 0; y < hh; y += st) { c.moveTo(0, y); c.lineTo(w, y); } c.stroke(); }
    else if (b.pat === 'stripes') { c.lineWidth = 8; c.beginPath(); for (let x = -hh; x < w; x += st) { c.moveTo(x, hh); c.lineTo(x + hh, 0); } c.stroke(); }
    else { for (let y = 0; y < hh; y += st) for (let x = 0; x < w; x += st) if (((x + y) / st) % 2 === 0) c.fillRect(x, y, st, st); }
  } else if (b.type === 'blur') {
    c.fillStyle = b.c1; c.fillRect(0, 0, w, hh);
    const p = photos.get(firstPhotoId());
    if (p) {
      const sc = c.getTransform().a, s = Math.max(w / p.w, hh / p.h) * 1.2;
      if (CTX_FILTER) c.filter = `blur(${45 * sc}px) brightness(0.85) saturate(1.3)`;
      c.drawImage(p.prev, (w - p.w * s) / 2, (hh - p.h * s) / 2, p.w * s, p.h * s);
      c.filter = 'none';
      if (!CTX_FILTER) { c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, 0, w, hh); }
    }
  }
  c.restore();
}

/* ---------- layout ---------- */
const layoutTree = () => (state.layoutId === 'smart' && state.smartTree) ? state.smartTree : (T_BY_ID[state.layoutId] || T_BY_ID['n4-0']).tree;
function cellRects() {
  const raw = leaves(layoutTree(), 0, 0, 1, 1, []);
  const { w, h } = state.canvas, g = state.gap, p = state.pad;
  const X = p - g / 2, Y = p - g / 2, W = w - 2 * p + g, H = h - 2 * p + g;
  return raw.map(([x, y, ww, hh]) => ({ x: X + x * W + g / 2, y: Y + y * H + g / 2, w: Math.max(4, ww * W - g), h: Math.max(4, hh * H - g) }));
}
function setLayout(id) {
  const n = leaves(T_BY_ID[id].tree, 0, 0, 1, 1, []).length;
  if (n < state.cells.length) state.cells = [...state.cells.filter(c => c.photoId), ...state.cells.filter(c => !c.photoId)].slice(0, n);
  while (state.cells.length < n) state.cells.push(newCrop());
  state.layoutId = id; state.smartTree = null; state.smartLoss = null;
}
function setCount(n) { n = clamp(n, 1, 16); state.autoLayout = false; setLayout(TEMPLATES[n][0].id); }

/* Auto-fit: choose ordering + rows/columns partition so photos need the least crop */
function runSmart(tries = 1) {
  const ids = photoOrder.slice(0, MAX_CELLS);
  if (!ids.length) return;
  const old = new Map(state.cells.filter(c => c.photoId).map(c => [c.photoId, c]));
  const asp = ids.map(id => { const p = photos.get(id), o = old.get(id); return o && o.rot % 2 ? p.h / p.w : p.w / p.h; });
  const { w, h } = state.canvas, pad = state.pad;
  const res = smartLayout(asp, Math.max(50, w - 2 * pad), Math.max(50, h - 2 * pad), tries);
  state.smartTree = res.tree; state.layoutId = 'smart'; state.smartLoss = res.loss; state.autoLayout = true;
  state.cells = res.order.map(i => {
    const o = old.get(ids[i]);
    return o ? Object.assign(o, { zoom: 1, ox: 0, oy: 0 }) : newCrop(ids[i]);
  });
}
function relayoutAuto() { if (state.mode === 'grid' && state.autoLayout && photoOrder.length) runSmart(); }

/* ---------- Konva scene ---------- */
const stage = new Konva.Stage({ container: 'stage', width: 600, height: 600 });
const bgLayer = new Konva.Layer({ listening: false });
const cellLayer = new Konva.Layer();
const itemLayer = new Konva.Layer();
const uiLayer = new Konva.Layer();
const trLayer = new Konva.Layer();
stage.add(bgLayer, cellLayer, itemLayer, uiLayer, trLayer);
const tr = new Konva.Transformer({
  rotationSnaps: [0, 90, 180, 270], rotationSnapTolerance: 6, borderStroke: ACCENT, anchorStroke: ACCENT, anchorFill: '#fff',
  anchorSize: 11, anchorCornerRadius: 3, padding: 2, ignoreStroke: true, rotateAnchorOffset: 26,
  boundBoxFunc: (o, n) => (n.width < 24 || n.height < 24 ? o : n),
});
trLayer.add(tr);
const bgShape = new Konva.Shape({ sceneFunc: (ctx) => drawBg(ctx._context, state.canvas.w, state.canvas.h) });
bgLayer.add(bgShape);

const hitRect = (ctx, shape) => { ctx.beginPath(); ctx.rect(0, 0, shape.width(), shape.height()); ctx.closePath(); ctx.fillStrokeShape(shape); };
const cellNodes = [];
function cellScene(ctx, shape) {
  const c = ctx._context, cr = state.cells[shape.attrs.idx]; if (!cr) return;
  const w = shape.width(), hh = shape.height(), rad = state.radius;
  if (cr.photoId && photos.has(cr.photoId)) { drawShadow(c, w, hh, rad); drawCrop(c, cr, w, hh, rad); drawBorder(c, w, hh, rad); }
  else if (!exporting) {
    c.save(); rr(c, 0, 0, w, hh, rad); c.fillStyle = 'rgba(128,128,150,.16)'; c.fill();
    c.setLineDash([10, 8]); c.lineWidth = 2; c.strokeStyle = 'rgba(128,128,150,.6)'; rr(c, 1, 1, w - 2, hh - 2, rad); c.stroke(); c.setLineDash([]);
    const a = Math.min(w, hh) * 0.09; c.lineWidth = 3; c.beginPath(); c.moveTo(w / 2 - a, hh / 2); c.lineTo(w / 2 + a, hh / 2); c.moveTo(w / 2, hh / 2 - a); c.lineTo(w / 2, hh / 2 + a); c.stroke();
    c.restore();
  }
}
function syncCells() {
  rects = cellRects();
  while (cellNodes.length < rects.length) {
    const n = new Konva.Shape({ role: 'cell', idx: cellNodes.length, fill: '#000', sceneFunc: cellScene, hitFunc: hitRect });
    cellLayer.add(n); cellNodes.push(n);
  }
  while (cellNodes.length > rects.length) cellNodes.pop().destroy();
  rects.forEach((r, i) => cellNodes[i].setAttrs({ x: r.x, y: r.y, width: r.w, height: r.h }));
  cellLayer.visible(state.mode === 'grid');
}

/* free items: images, text, stickers (positions are item centres) */
const itemNodes = new Map();
const itemById = id => state.items.find(i => i.id === id);
function frameInsets(it, w, hh) {
  if (it.frame === 'white') { const t = Math.min(w, hh) * 0.04; return { l: t, t, r: t, b: t }; }
  if (it.frame === 'polaroid') { const t = Math.min(w, hh) * 0.05; return { l: t, t, r: t, b: t * 3.6 }; }
  return { l: 0, t: 0, r: 0, b: 0 };
}
function itemScene(ctx, shape) {
  const c = ctx._context, it = itemById(shape.attrs.id); if (!it || !photos.has(it.photoId)) return;
  const w = shape.width(), hh = shape.height(), rad = it.frame === 'none' ? state.radius : Math.min(state.radius, 24);
  drawShadow(c, w, hh, rad);
  if (it.frame === 'none') { drawCrop(c, it, w, hh, rad); drawBorder(c, w, hh, rad); return; }
  const m = frameInsets(it, w, hh);
  c.save(); c.fillStyle = '#fff'; rr(c, 0, 0, w, hh, rad); c.fill(); c.restore();
  c.save(); c.translate(m.l, m.t); drawCrop(c, it, w - m.l - m.r, hh - m.t - m.b, 0); c.restore();
}
function textProps(it) {
  return {
    text: it.text, fontFamily: it.font, fontSize: it.size, fontStyle: `${it.italic ? 'italic ' : ''}${it.bold ? 'bold' : 'normal'}`.trim(),
    fill: it.color, stroke: it.stroke > 0 ? it.strokeColor : undefined, strokeWidth: it.stroke, fillAfterStrokeEnabled: true, lineJoin: 'round',
    align: 'center', shadowColor: 'rgba(0,0,0,.45)', shadowBlur: it.shadow ? it.size * 0.12 : 0, shadowOffsetY: it.shadow ? it.size * 0.04 : 0, shadowEnabled: !!it.shadow,
  };
}
function makeNode(it) {
  let n;
  if (it.type === 'image') n = new Konva.Shape({ id: it.id, role: 'item', fill: '#000', sceneFunc: itemScene, hitFunc: hitRect });
  else n = new Konva.Text({ id: it.id, role: 'item' });
  n.draggable(true);
  n.on('dragstart', () => { if (!sel || sel.id !== it.id) select({ t: 'item', id: it.id }); });
  n.on('dragend', () => { const o = itemById(it.id); if (o) { o.x = n.x(); o.y = n.y(); commit(); } });
  n.on('transformend', () => {
    const o = itemById(it.id); if (!o) return;
    if (o.type === 'image') { o.w = Math.max(24, o.w * n.scaleX()); o.h = Math.max(24, o.h * n.scaleY()); const cr = o; clampPan(cr, o.w, o.h); }
    else o.size = Math.max(10, o.size * n.scaleY());
    n.scale({ x: 1, y: 1 }); o.x = n.x(); o.y = n.y(); o.r = n.rotation();
    updateNode(n, o); renderInspector(); commit();
  });
  return n;
}
function updateNode(n, it) {
  if (it.type === 'image') n.setAttrs({ width: it.w, height: it.h, offsetX: it.w / 2, offsetY: it.h / 2 });
  else { n.setAttrs(textProps(it)); n.offset({ x: n.width() / 2, y: n.height() / 2 }); }
  n.setAttrs({ x: it.x, y: it.y, rotation: it.r || 0, opacity: it.op == null ? 1 : it.op });
}
function syncItems() {
  const want = new Set();
  state.items.forEach((it, idx) => {
    if (it.type === 'image' && (state.mode !== 'free' || !photos.has(it.photoId))) return;
    want.add(it.id);
    let n = itemNodes.get(it.id);
    if (!n) { n = makeNode(it); itemNodes.set(it.id, n); itemLayer.add(n); }
    updateNode(n, it); n.zIndex(idx);
  });
  for (const [id, n] of itemNodes) if (!want.has(id)) { n.destroy(); itemNodes.delete(id); }
  syncTransformer();
}
function syncTransformer() {
  const n = sel && sel.t === 'item' ? itemNodes.get(sel.id) : null;
  if (n) {
    const it = itemById(sel.id);
    tr.enabledAnchors(it.type === 'image' ? ['top-left', 'top-center', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right'] : ['top-left', 'top-right', 'bottom-left', 'bottom-right']);
    tr.nodes([n]);
  } else tr.nodes([]);
  trLayer.batchDraw();
}

/* ---------- selection ui ---------- */
let swapState = null, dropHi = null;
function drawUi() {
  uiLayer.destroyChildren();
  const S = viewScale;
  const cellOutline = (i, color, dash) => {
    const r = rects[i]; if (!r) return;
    uiLayer.add(new Konva.Rect({ x: r.x, y: r.y, width: r.w, height: r.h, stroke: color, strokeWidth: 3 / S, dash: dash ? [8 / S, 6 / S] : undefined, cornerRadius: Math.min(state.radius, r.w / 2, r.h / 2), listening: false }));
  };
  if (state.mode === 'grid') {
    if (sel && sel.t === 'cell' && rects[sel.i]) {
      cellOutline(sel.i, ACCENT);
      if (state.cells[sel.i].photoId && !swapState) {
        const r = rects[sel.i], cx = r.x + 24 / S, cy = r.y + 24 / S;
        uiLayer.add(new Konva.Circle({ x: cx, y: cy, radius: 15 / S, fill: '#fff', stroke: ACCENT, strokeWidth: 2 / S, role: 'swap', shadowColor: '#000', shadowBlur: 6 / S, shadowOpacity: 0.25 }));
        uiLayer.add(new Konva.Text({ x: cx - 15 / S, y: cy - 8 / S, width: 30 / S, align: 'center', text: '⇄', fontSize: 16 / S, fill: ACCENT, listening: false }));
      }
    }
    if (dropHi != null) cellOutline(dropHi, '#22c55e');
    const hd = hoverDiv >= 0 ? dividers()[hoverDiv] : null;
    if (hd) uiLayer.add(hd.axis === 'x'
      ? new Konva.Rect({ x: hd.line - 3 / S, y: hd.a, width: 6 / S, height: hd.b - hd.a, fill: ACCENT, opacity: 0.75, cornerRadius: 3 / S, listening: false })
      : new Konva.Rect({ x: hd.a, y: hd.line - 3 / S, width: hd.b - hd.a, height: 6 / S, fill: ACCENT, opacity: 0.75, cornerRadius: 3 / S, listening: false }));
    if (swapState) {
      if (swapState.target != null && swapState.target !== swapState.from) cellOutline(swapState.target, '#22c55e');
      const r = rects[swapState.from];
      if (r) uiLayer.add(new Konva.Rect({ x: swapState.p.x - r.w * 0.2, y: swapState.p.y - r.h * 0.2, width: r.w * 0.4, height: r.h * 0.4, fill: ACCENT, opacity: 0.5, cornerRadius: 8 / S, listening: false }));
    }
  }
  uiLayer.batchDraw();
}
function select(s, force) {
  if (!force && JSON.stringify(s) === JSON.stringify(sel)) return;
  sel = s; if (s && isMobile()) document.body.dataset.sheet = '';
  syncTransformer(); drawUi(); renderInspector();
}
const target = () => (!sel ? null : sel.t === 'cell' ? state.cells[sel.i] : itemById(sel.id));

/* ---------- redraw ---------- */
function redrawAll(bg = true) {
  syncCells(); syncItems();
  if (bg) bgLayer.batchDraw();
  cellLayer.batchDraw(); itemLayer.batchDraw(); drawUi();
}
function fullRefresh() {
  syncControls(); redrawAll(); applyView(); renderTray(); renderTemplates(); renderInspector();
}

/* ---------- view scaling ---------- */
const area = $('#area'), wrap = $('#wrap');
let viewZoom = 1, viewScale = 1;
function applyView() {
  const r = area.getBoundingClientRect();
  const fit = Math.max(0.05, Math.min((r.width - 56) / state.canvas.w, (r.height - 110) / state.canvas.h));
  viewScale = fit * viewZoom;
  stage.size({ width: state.canvas.w * viewScale, height: state.canvas.h * viewScale });
  stage.scale({ x: viewScale, y: viewScale });
  wrap.classList.toggle('checker', state.bg.type === 'none');
  $('#sizeLabel').textContent = `${state.canvas.w} × ${state.canvas.h}px · ${Math.round(viewScale * 100)}%`;
  drawUi(); stage.batchDraw();
}
new ResizeObserver(() => applyView()).observe(area);

const cont = stage.container();
cont.style.touchAction = 'none';
/* ---------- resizable dividers ---------- */
function normNode(n) {
  if (typeof n === 'number') return 1;
  return { d: n.d, k: n.k.map(i => { const [w, c] = Array.isArray(i) ? i : [1, i]; return [w, normNode(c)]; }) };
}
function ensureEditable() { state.smartTree = normNode(layoutTree()); state.layoutId = 'smart'; }
function dividers() {
  const out = [], { w, h } = state.canvas, g = state.gap, p = state.pad;
  const X = p - g / 2, Y = p - g / 2, W = w - 2 * p + g, H = h - 2 * p + g;
  (function walk(node, x, y, ww, hh) {
    if (typeof node === 'number') return;
    const items = node.k.map(i => (Array.isArray(i) ? i : [1, i])), tot = items.reduce((s, i) => s + i[0], 0);
    let pos = 0;
    items.forEach(([wt, child], idx) => {
      if (idx > 0) {
        if (node.d === 'h') out.push({ node, idx, axis: 'x', line: X + (x + pos * ww) * W, a: Y + y * H, b: Y + (y + hh) * H, n0: x, n1: x + ww });
        else out.push({ node, idx, axis: 'y', line: Y + (y + pos * hh) * H, a: X + x * W, b: X + (x + ww) * W, n0: y, n1: y + hh });
      }
      const f = wt / tot;
      if (node.d === 'h') walk(child, x + pos * ww, y, f * ww, hh); else walk(child, x, y + pos * hh, ww, f * hh);
      pos += f;
    });
  })(layoutTree(), 0, 0, 1, 1);
  return out;
}
function dividerAt(p, touch) {
  const tol = (touch ? 16 : 7) / viewScale; let best = -1, bd = Infinity;
  dividers().forEach((d, k) => {
    const along = d.axis === 'x' ? p.y : p.x, across = Math.abs((d.axis === 'x' ? p.x : p.y) - d.line);
    if (across <= tol && along >= d.a - tol && along <= d.b + tol && across < bd) { bd = across; best = k; }
  });
  return best;
}
let hoverDiv = -1;
function startDivider(k) {
  ensureEditable(); state.autoLayout = false; state.smartLoss = null;
  const d = dividers()[k]; if (!d) return;
  const { w, h } = state.canvas, g = state.gap, p = state.pad;
  const org = (d.axis === 'x' ? p : p) - g / 2, size = d.axis === 'x' ? w - 2 * p + g : h - 2 * p + g;
  const items = d.node.k, tot = items.reduce((s, i) => s + i[0], 0), span = d.n1 - d.n0;
  let before = 0; for (let j = 0; j < d.idx - 1; j++) before += items[j][0];
  const pairW = items[d.idx - 1][0] + items[d.idx][0], pairStart = d.n0 + before / tot * span, pairSpan = pairW / tot * span;
  hoverDiv = k; let moved = false;
  const mv = ev => {
    const lp = logical(ev), q = ((d.axis === 'x' ? lp.x : lp.y) - org) / size;
    const frac = clamp((q - pairStart) / pairSpan, 0.1, 0.9);
    items[d.idx - 1][0] = pairW * frac; items[d.idx][0] = pairW * (1 - frac);
    moved = true; syncCells(); cellLayer.batchDraw(); drawUi();
  };
  track(mv, () => { hoverDiv = -1; drawUi(); if (moved) { renderTemplates(); renderInspector(); commit(); } });
}
cont.addEventListener('pointermove', e => {
  if (e.buttons || state.mode !== 'grid') return;
  const k = dividerAt(logical(e));
  if (k !== hoverDiv) { hoverDiv = k; const d = dividers()[k]; cont.style.cursor = d ? (d.axis === 'x' ? 'col-resize' : 'row-resize') : ''; drawUi(); }
});
cont.addEventListener('pointerleave', () => { if (hoverDiv !== -1) { hoverDiv = -1; cont.style.cursor = ''; drawUi(); } });

/* ---------- pointer interaction ---------- */
function track(mv, up) {
  const end = ev => { for (const [n, f] of [['pointermove', mv], ['pointerup', end], ['pointercancel', end]]) window.removeEventListener(n, f); up(ev); };
  window.addEventListener('pointermove', mv); window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end);
}
const cpos = e => { const r = cont.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
const logical = e => { const p = cpos(e); return { x: p.x / viewScale, y: p.y / viewScale }; };
const cellAt = p => { for (let i = 0; i < rects.length; i++) { const r = rects[i]; if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) return i; } return null; };

/* two-finger pinch zooms the selected photo */
const ptrs = new Map(); let pinch = null;
const dist = () => { const [a, b] = [...ptrs.values()]; return Math.hypot(a.x - b.x, a.y - b.y) || 1; };
cont.addEventListener('pointerdown', e => {
  if (e.pointerType !== 'touch') return;
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ptrs.size === 2 && sel && sel.t === 'cell' && state.cells[sel.i].photoId) pinch = { i: sel.i, d: dist(), z: state.cells[sel.i].zoom };
});
window.addEventListener('pointermove', e => {
  if (!ptrs.has(e.pointerId)) return;
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pinch && ptrs.size === 2) { const cr = state.cells[pinch.i], r = rects[pinch.i]; cr.zoom = clamp(pinch.z * dist() / pinch.d, 1, 6); clampPan(cr, r.w, r.h); cellLayer.batchDraw(); }
});
const endPtr = e => { if (ptrs.delete(e.pointerId) && pinch && ptrs.size < 2) { pinch = null; renderInspector(); commit(); } };
window.addEventListener('pointerup', endPtr); window.addEventListener('pointercancel', endPtr);

cont.addEventListener('pointerdown', e => {
  if (e.button > 0 || ptrs.size > 1) return;
  const t = stage.getIntersection(cpos(e));
  if (t && t.getParent() && t.getParent().className === 'Transformer') return;
  if (state.mode === 'grid' && (!t || (t.attrs.role !== 'item' && t.attrs.role !== 'swap'))) { const k = dividerAt(logical(e), e.pointerType === 'touch'); if (k >= 0) { startDivider(k); return; } }
  if (!t) { select(null); return; }
  const role = t.attrs.role;
  if (role === 'cell') {
    select({ t: 'cell', i: t.attrs.idx });
    if (state.cells[t.attrs.idx].photoId) startPan(e, t.attrs.idx);
  } else if (role === 'swap') startSwap(e);
  else if (role === 'item') select({ t: 'item', id: t.attrs.id });
});
function startPan(e, i) {
  const cr = state.cells[i], r = rects[i], s0 = logical(e), o0 = { x: cr.ox, y: cr.oy };
  let moved = false;
  const mv = ev => { const p = logical(ev); cr.ox = o0.x + (p.x - s0.x) / r.w; cr.oy = o0.y + (p.y - s0.y) / r.h; clampPan(cr, r.w, r.h); moved = true; cellLayer.batchDraw(); };
  track(mv, () => { if (moved) commit(); });
}
function startSwap(e) {
  const from = sel.i;
  swapState = { from, p: logical(e), target: from }; drawUi();
  const mv = ev => { const p = logical(ev); swapState.p = p; swapState.target = cellAt(p); drawUi(); };
  track(mv, () => {
    const to = swapState.target; swapState = null;
    if (to != null && to !== from) {
      [state.cells[from], state.cells[to]] = [state.cells[to], state.cells[from]];
      state.autoLayout = false; state.smartLoss = null; sel = { t: 'cell', i: to };
      syncTransformer(); renderInspector(); renderTemplates(); commit();
    }
    redrawAll(false);
  });
}
let wheelTimer;
cont.addEventListener('wheel', e => {
  const t = stage.getIntersection(cpos(e));
  if (!t || t.attrs.role !== 'cell') return;
  const i = t.attrs.idx, cr = state.cells[i]; if (!cr.photoId) return;
  e.preventDefault();
  cr.zoom = clamp(cr.zoom * Math.exp(-e.deltaY * 0.0015), 1, 6);
  clampPan(cr, rects[i].w, rects[i].h); cellLayer.batchDraw();
  if (!sel || sel.t !== 'cell' || sel.i !== i) select({ t: 'cell', i }); else { const z = $('#insp [data-k=zoom]'); if (z) { z.value = cr.zoom; z.nextElementSibling.value = cr.zoom.toFixed(2) + '×'; } }
  clearTimeout(wheelTimer); wheelTimer = setTimeout(commit, 300);
}, { passive: false });
cont.addEventListener('dblclick', e => {
  const t = stage.getIntersection(cpos(e)); if (!t) return;
  if (t.attrs.role === 'cell' && !state.cells[t.attrs.idx].photoId) { replaceTarget = { t: 'cell', i: t.attrs.idx }; $('#replaceInput').click(); }
  else if (t.attrs.role === 'cell') { const cr = state.cells[t.attrs.idx]; Object.assign(cr, { zoom: 1, ox: 0, oy: 0 }); cellLayer.batchDraw(); renderInspector(); commit(); }
  else if (t.attrs.role === 'item') { const it = itemById(t.attrs.id); if (it && it.type === 'text') { const ta = $('#insp [data-k=text]'); if (ta) { ta.focus(); ta.select(); } } }
});

/* drag & drop (files anywhere, tray thumbnails onto cells) */
let dragDepth = 0;
window.addEventListener('dragenter', e => { if ([...(e.dataTransfer?.types || [])].includes('Files')) { dragDepth++; $('#veil').classList.add('on'); } });
window.addEventListener('dragleave', () => { dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) $('#veil').classList.remove('on'); });
window.addEventListener('dragover', e => {
  e.preventDefault();
  if (state.mode === 'grid' && cont.contains(e.target)) { const i = cellAt(logical(e)); if (i !== dropHi) { dropHi = i; drawUi(); } }
});
window.addEventListener('drop', async e => {
  e.preventDefault(); dragDepth = 0; $('#veil').classList.remove('on');
  const over = cont.contains(e.target), p = over ? logical(e) : null;
  dropHi = null; drawUi();
  const txt = e.dataTransfer.getData('text/plain');
  if (txt.startsWith('photo:')) { if (over) dropPhoto(txt.slice(6), p); return; }
  const files = [...e.dataTransfer.files].filter(f => f.type.startsWith('image/'));
  if (files.length) await addFiles(files);
});
function dropPhoto(id, p) {
  if (state.mode === 'grid') {
    const i = cellAt(p);
    if (i == null) return placePhoto(id, true);
    assignPhotoToCell(i, id);
  } else { addImageItem(id, p.x, p.y); commit(); }
}

/* ---------- adding photos ---------- */
async function addFiles(files, opts = {}) {
  files = [...files].filter(f => f.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|avif|bmp)$/i.test(f.name));
  if (!files.length) return toast(L('toast.noImages'));
  const added = []; let failed = 0;
  for (const f of files) { try { added.push(await loadPhoto(f, f.name)); } catch (e) { failed++; } }
  if (failed) toast(Ln('toast.unreadable', failed));
  if (!added.length) return;
  if (opts.replace) { // replace the selected cell / item photo
    if (opts.replace.t === 'cell') assignPhotoToCell(opts.replace.i, added[0].id);
    else { const t = itemById(opts.replace.id); if (t) { t.photoId = added[0].id; t.zoom = 1; t.ox = 0; t.oy = 0; } }
    if (added.length === 1) { redrawAll(); renderTray(); renderInspector(); commit(); return; }
    added.slice(1).forEach(p => placePhoto(p.id, false, true));
  } else added.forEach(p => placePhoto(p.id, false, true));
  if (state.mode === 'grid' && state.autoLayout) runSmart();
  finishPlacement(added.length);
}
function finishPlacement(n) {
  if (isMobile()) document.body.dataset.sheet = '';
  if (sel && sel.t === 'cell' && !state.cells[sel.i]) sel = null;
  redrawAll(); renderTray(); renderTemplates(); renderInspector(); syncControls(); commit();
  if (state.mode === 'grid' && state.autoLayout && photoOrder.length > MAX_CELLS) toast(L('toast.maxCells', { max: MAX_CELLS }));
  else if (n > 1) toast(state.mode === 'grid' && state.smartLoss != null ? L('toast.autoFitDone', { count: Ln('photos.count', photoOrder.length), pct: fmtPct(state.smartLoss) }) : Ln('toast.photosAdded', n));
}
function placePhoto(id, single, bulk) {
  if (state.mode === 'free') { addImageItem(id); if (single) { redrawAll(); commit(); } return; }
  if (state.autoLayout) { if (!bulk) { runSmart(); finishPlacement(1); } return; }
  let i = sel && sel.t === 'cell' && !state.cells[sel.i].photoId ? sel.i : state.cells.findIndex(c => !c.photoId);
  if (i < 0) { toast(L('toast.cellsFull')); return; }
  state.cells[i] = newCrop(id);
  if (single) { redrawAll(false); renderTray(); commit(); }
}
function addImageItem(photoId, x, y) {
  const p = photos.get(photoId), ar = p.w / p.h, base = Math.min(state.canvas.w, state.canvas.h) * 0.5;
  const w = ar >= 1 ? base : base * ar, hh = w / ar;
  const jit = () => (Math.random() - 0.5) * state.canvas.w * 0.25;
  const it = Object.assign({ id: uid(), type: 'image', x: x ?? state.canvas.w / 2 + jit(), y: y ?? state.canvas.h / 2 + jit(), w, h: hh, r: Math.round((Math.random() - 0.5) * 14), frame: 'white', op: 1 }, newCrop(photoId));
  state.items.push(it); redrawAll(false); select({ t: 'item', id: it.id }, true);
  return it;
}
function removePhoto(id) {
  photoOrder = photoOrder.filter(x => x !== id); // stays in `photos` so undo can restore it
  state.items = state.items.filter(i => i.photoId !== id);
  if (state.autoLayout) {
    state.cells = state.cells.filter(c => c.photoId !== id);
    if (photoOrder.length) runSmart(); else { state.layoutId = 'n4-0'; state.smartTree = null; state.smartLoss = null; state.cells = fill(4, () => newCrop()); }
  } else if (state.cells.some(c => c.photoId === id)) { state.cells = state.cells.filter(c => c.photoId !== id); rebuildForCount(); }
  sel = null; fullRefresh(); commit();
}
/* pick the template for the current cell count that crops the placed photos the least */
function bestTemplate(n) {
  const list = TEMPLATES[n]; if (!list) return null;
  const { w, h } = state.canvas, ca = (w - 2 * state.pad) / (h - 2 * state.pad);
  const asp = state.cells.map(c => { const p = photos.get(c.photoId); return p ? (c.rot % 2 ? p.h / p.w : p.w / p.h) : 1; });
  let best = list[0], bc = Infinity;
  for (const t of list) {
    const cost = leaves(t.tree, 0, 0, 1, 1, []).reduce((s, r, i) => s + Math.abs(Math.log((r[2] * ca) / r[3] / asp[i])), 0);
    if (cost < bc) { bc = cost; best = t; }
  }
  return best;
}
function rebuildForCount() {
  if (!state.cells.length) state.cells = [newCrop()];
  const t = bestTemplate(state.cells.length);
  if (t) { state.layoutId = t.id; state.smartTree = null; state.smartLoss = null; }
  else { state.autoLayout = true; runSmart(); }
}
function removeCell(i) {
  const c = state.cells[i]; if (!c) return;
  if (c.photoId && state.autoLayout) { removePhoto(c.photoId); return; }
  state.cells.splice(i, 1); rebuildForCount();
  sel = null; fullRefresh(); commit();
}
/* put a photo into a cell: swaps if it is already placed elsewhere, otherwise replaces */
function assignPhotoToCell(i, id) {
  const old = state.cells[i].photoId;
  if (old === id) return;
  const j = state.cells.findIndex((c, k) => k !== i && c.photoId === id);
  if (j >= 0) { [state.cells[i], state.cells[j]] = [state.cells[j], state.cells[i]]; state.autoLayout = false; state.smartLoss = null; }
  else {
    state.cells[i] = Object.assign(newCrop(id), { f: state.cells[i].f });
    if (state.autoLayout) {
      if (old && !state.cells.some(c => c.photoId === old)) { photoOrder = photoOrder.filter(x => x !== old); }
      runSmart();
    }
  }
  const k = state.cells.findIndex(c => c.photoId === id);
  sel = { t: 'cell', i: k };
  redrawAll(); renderTray(); renderTemplates(); renderInspector(); commit();
}

/* ---------- free-mode helpers ---------- */
function cellsToItems() {
  state.cells.forEach((cr, i) => {
    if (!cr.photoId) return;
    const r = rects[i]; if (!r) return;
    state.items.push(Object.assign(JSON.parse(JSON.stringify(cr)), { id: uid(), type: 'image', x: r.x + r.w / 2, y: r.y + r.h / 2, w: r.w, h: r.h, r: 0, frame: 'none', op: 1 }));
  });
}
function scatter() {
  const imgs = state.items.filter(i => i.type === 'image'); if (!imgs.length) return;
  const { w, h } = state.canvas, n = imgs.length, base = Math.min(w, h) * clamp(0.62 - n * 0.03, 0.3, 0.6);
  imgs.forEach((it, i) => {
    const p = photos.get(it.photoId), ar = p ? p.w / p.h : 1;
    it.w = ar >= 1 ? base * 1.15 : base * 1.15 * ar; it.h = it.w / ar;
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.6, rad = n === 1 ? 0 : Math.min(w, h) * 0.22;
    it.x = w / 2 + Math.cos(a) * rad * (w / Math.min(w, h)); it.y = h / 2 + Math.sin(a) * rad * (h / Math.min(w, h));
    it.r = Math.round((Math.random() - 0.5) * 24); it.frame = 'white'; it.zoom = 1; it.ox = it.oy = 0;
  });
}
function arrangeToLayout() {
  const imgs = state.items.filter(i => i.type === 'image'); if (!imgs.length) return;
  if (state.autoLayout && state.mode === 'free') {
    const asp = imgs.map(i => { const p = photos.get(i.photoId); return p.w / p.h; });
    const res = smartLayout(asp, state.canvas.w - 2 * state.pad, state.canvas.h - 2 * state.pad);
    const saved = [state.layoutId, state.smartTree]; state.layoutId = 'smart'; state.smartTree = res.tree;
    const rs = cellRects(); [state.layoutId, state.smartTree] = saved;
    res.order.forEach((oi, k) => { const it = imgs[oi], r = rs[k]; Object.assign(it, { x: r.x + r.w / 2, y: r.y + r.h / 2, w: r.w, h: r.h, r: 0, frame: 'none', zoom: 1, ox: 0, oy: 0 }); });
  } else {
    const rs = rects.length ? rects : cellRects();
    imgs.forEach((it, k) => { const r = rs[k % rs.length]; Object.assign(it, { x: r.x + r.w / 2, y: r.y + r.h / 2, w: r.w, h: r.h, r: 0, frame: 'none', zoom: 1, ox: 0, oy: 0 }); });
  }
}
function setMode(m) {
  if (state.mode === m) return;
  state.mode = m; sel = null;
  if (m === 'free' && !state.items.some(i => i.type === 'image')) cellsToItems();
  fullRefresh(); commit();
}

/* ---------- extras: text + stickers ---------- */
function addText(preset) {
  const P = { head: { text: L('text.defaultHead'), size: 150, bold: true }, sub: { text: L('text.defaultSub'), size: 84, bold: false }, cap: { text: L('text.defaultCap'), size: 52, bold: false, italic: true } }[preset];
  const dark = ['#111111', '#0f172a'].includes(state.bg.c1) && state.bg.type === 'solid';
  const it = Object.assign({ id: uid(), type: 'text', x: state.canvas.w / 2, y: state.canvas.h / 2, r: 0, font: FONTS[0][1], color: dark ? '#ffffff' : '#111111', bold: false, italic: false, stroke: 0, strokeColor: '#ffffff', shadow: false, op: 1 }, P);
  state.items.push(it); redrawAll(false); select({ t: 'item', id: it.id }, true); commit();
}
function addSticker(ch) {
  const it = { id: uid(), type: 'sticker', text: ch, x: state.canvas.w / 2 + (Math.random() - 0.5) * 200, y: state.canvas.h / 2 + (Math.random() - 0.5) * 200, r: 0, font: 'system-ui, sans-serif', size: 170, color: '#000', bold: false, italic: false, stroke: 0, strokeColor: '#fff', shadow: false, op: 1 };
  state.items.push(it); redrawAll(false); select({ t: 'item', id: it.id }, true); commit();
}

/* ---------- inspector ---------- */
let replaceTarget = null;
const setPath = (o, path, val) => { const ks = path.split('.'), last = ks.pop(); ks.reduce((a, k) => a[k], o)[last] = val; };
const sl = (label, k, min, max, step, val, suffix = '') => `<label class="row"><span>${esc(label)}</span><input type="range" data-k="${k}" min="${min}" max="${max}" step="${step}" value="${val}"><output>${step < 1 ? (+val).toFixed(step < 0.1 ? 2 : 1) : val}${suffix}</output></label>`;
const btn = (a, icon, label, v = '', cls = '') => `<button class="btn sm ${cls}" data-a="${a}" ${v ? `data-v="${v}"` : ''} title="${esc(label)}">${svg(icon)}<span>${esc(label)}</span></button>`;

function renderInspector() {
  const el = $('#insp'), t = target();
  el.classList.toggle('idle', !t); document.body.classList.toggle('has-sel', !!t);
  if (!t) {
    const auto = state.mode === 'grid' && state.smartLoss != null && state.layoutId === 'smart';
    el.innerHTML = `<h3>${L('inspector.title')}</h3>
      ${auto ? `<div class="stat"><b>${fmtPct(state.smartLoss)}</b><span>${L('inspector.cropStat')}</span></div>` : ''}
      <p class="muted">${L('inspector.hint')}</p>
      <ul class="tips">${Lh('inspector.tips').map(x => `<li>${x}</li>`).join('')}</ul>`;
    return;
  }
  if (sel.t === 'cell' && !t.photoId) {
    el.innerHTML = `<h3>${L('inspector.emptyCell')}</h3><p class="muted">${L('inspector.emptyCellHint')}</p><div class="btnrow">${btn('pick', 'upload', L('act.upload'))}${btn('del', 'trash', L('act.removeCell'), '', 'danger')}</div>`;
    return;
  }
  let html = '';
  const isImg = sel.t === 'cell' || t.type === 'image';
  if (isImg) {
    const p = photos.get(t.photoId);
    html += `<h3>${sel.t === 'cell' ? L('inspector.photo') : L('inspector.freePhoto')}</h3><p class="muted trunc" title="${p ? esc(p.name) : ''}">${p ? esc(p.name) : ''}</p>`;
    html += `<div class="btnrow">${btn('rotL', 'rotccw', L('act.rotL'))}${btn('rotR', 'rotcw', L('act.rotR'))}${btn('flip', 'flip', L('act.flip'))}${btn('pick', 'replace', L('act.replace'))}</div>`;
    html += sl(L('insp.zoom'), 'zoom', 1, 5, 0.01, t.zoom, '×');
    html += `<div class="chips"><button class="chip ${t.fit ? 'on' : ''}" data-a="fit" title="${esc(L('insp.fitTitle'))}">${L('insp.fit')}</button></div>`;
    if (sel.t === 'item') {
      html += `<div class="sub">${L('insp.frame')}</div><div class="chips">${['none', 'white', 'polaroid'].map(f => `<button class="chip ${t.frame === f ? 'on' : ''}" data-a="frame" data-v="${f}">${L('frame.' + f)}</button>`).join('')}</div>`;
      html += sl(L('insp.opacity'), 'op', 0.1, 1, 0.01, t.op == null ? 1 : t.op);
    }
    html += `<div class="sub">${L('insp.filters')}</div><div class="chips">${Object.keys(FILTERS).map(k => `<button class="chip" data-a="filter" data-v="${k}">${esc(L('filter.' + k))}</button>`).join('')}</div>`;
    html += sl(L('insp.brightness'), 'f.b', 50, 150, 1, t.f.b) + sl(L('insp.contrast'), 'f.c', 50, 150, 1, t.f.c) + sl(L('insp.saturation'), 'f.s', 0, 200, 1, t.f.s) + sl(L('insp.hue'), 'f.hue', -60, 60, 1, t.f.hue) + sl(L('insp.blur'), 'f.blur', 0, 12, 0.5, t.f.blur) + sl(L('insp.vignette'), 'f.vig', 0, 100, 1, t.f.vig);
    html += `<div class="btnrow">${btn('applyAll', 'sparkle', L('act.applyAll'))}${btn('resetF', 'undo', L('act.reset'))}</div>`;
    html += `<div class="btnrow">`;
    if (sel.t === 'item') html += btn('front', 'front', L('act.front')) + btn('back', 'back', L('act.back')) + btn('dup', 'dup', L('act.dup'));
    html += btn('del', 'trash', sel.t === 'cell' ? L('act.removeCell') : L('act.delete'), '', 'danger') + `</div>`;
  } else if (t.type === 'text') {
    html += `<h3>${L('inspector.text')}</h3><textarea data-k="text" rows="2">${esc(t.text)}</textarea>
      <label class="row"><span>${L('insp.font')}</span><select data-k="font">${FONTS.map(f => `<option value='${f[1]}' ${f[1] === t.font ? 'selected' : ''}>${esc(L('font.' + f[0].toLowerCase().replace(/ /g, '-')))}</option>`).join('')}</select></label>
      ${sl(L('insp.size'), 'size', 16, 400, 1, Math.round(t.size))}
      <label class="row"><span>${L('insp.color')}</span><input type="color" data-k="color" value="${t.color}"></label>
      <div class="chips"><label class="chip chk"><input type="checkbox" data-k="bold" ${t.bold ? 'checked' : ''}>${L('insp.bold')}</label><label class="chip chk"><input type="checkbox" data-k="italic" ${t.italic ? 'checked' : ''}>${L('insp.italic')}</label><label class="chip chk"><input type="checkbox" data-k="shadow" ${t.shadow ? 'checked' : ''}>${L('insp.shadow')}</label></div>
      ${sl(L('insp.outline'), 'stroke', 0, 24, 1, t.stroke)}
      <label class="row"><span>${L('insp.outlineColor')}</span><input type="color" data-k="strokeColor" value="${t.strokeColor}"></label>
      ${sl(L('insp.opacity'), 'op', 0.1, 1, 0.01, t.op)}
      <div class="btnrow">${btn('front', 'front', L('act.front'))}${btn('back', 'back', L('act.back'))}${btn('dup', 'dup', L('act.dup'))}${btn('del', 'trash', L('act.delete'), '', 'danger')}</div>`;
  } else {
    html += `<h3>${L('inspector.sticker')}</h3>${sl(L('insp.size'), 'size', 30, 500, 1, Math.round(t.size))}${sl(L('insp.opacity'), 'op', 0.1, 1, 0.01, t.op)}
      <div class="btnrow">${btn('front', 'front', L('act.front'))}${btn('back', 'back', L('act.back'))}${btn('dup', 'dup', L('act.dup'))}${btn('del', 'trash', L('act.delete'), '', 'danger')}</div>`;
  }
  el.innerHTML = html;
}
function refreshTarget() {
  const t = target(); if (!t) return;
  if (sel.t === 'cell') cellLayer.batchDraw();
  else { const n = itemNodes.get(t.id); if (n) updateNode(n, t); itemLayer.batchDraw(); trLayer.batchDraw(); }
}
function clampTarget(t) { if (sel.t === 'cell') { const r = rects[sel.i]; if (r) clampPan(t, r.w, r.h); } else if (t.type === 'image') clampPan(t, t.w, t.h); }
$('#insp').addEventListener('input', e => {
  const k = e.target.dataset.k; if (!k) return;
  const t = target(); if (!t) return;
  const ty = e.target.type;
  const val = ty === 'checkbox' ? e.target.checked : ty === 'range' ? +e.target.value : e.target.value;
  setPath(t, k, val);
  if (k === 'zoom') clampTarget(t);
  const o = e.target.nextElementSibling;
  if (o && o.tagName === 'OUTPUT') o.value = (k === 'zoom' ? (+val).toFixed(2) + '×' : ty === 'range' && +e.target.step < 1 ? (+val).toFixed(+e.target.step < 0.1 ? 2 : 1) : val);
  refreshTarget();
});
$('#insp').addEventListener('change', e => { if (e.target.dataset.k) commit(); });
$('#insp').addEventListener('click', e => {
  const b = e.target.closest('[data-a]'); if (!b) return;
  const t = target(); const a = b.dataset.a, v = b.dataset.v;
  if (a === 'pick') { replaceTarget = sel; $('#replaceInput').click(); return; }
  if (!t) return;
  if (a === 'rotL' || a === 'rotR') { t.rot = (t.rot + (a === 'rotR' ? 1 : 3)) % 4; t.ox = t.oy = 0; if (sel.t === 'cell' && state.autoLayout) { runSmart(); redrawAll(); renderTemplates(); commit(); return; } }
  else if (a === 'flip') t.flip = !t.flip;
  else if (a === 'fit') { t.fit = !t.fit; t.zoom = 1; t.ox = t.oy = 0; }
  else if (a === 'frame') t.frame = v;
  else if (a === 'filter') t.f = Object.assign(DEF_F(), FILTERS[v]);
  else if (a === 'resetF') t.f = DEF_F();
  else if (a === 'applyAll') { const f = JSON.stringify(t.f); state.cells.forEach(c => { c.f = JSON.parse(f); }); state.items.forEach(i => { if (i.type === 'image') i.f = JSON.parse(f); }); toast(L('toast.filterAll')); }
  else if (a === 'del') {
    if (sel.t === 'cell') { removeCell(sel.i); return; }
    state.items = state.items.filter(i => i.id !== sel.id); sel = null;
    redrawAll(); renderTray(); renderTemplates(); renderInspector(); commit(); return;
  }
  else if (a === 'dup') { const c = JSON.parse(JSON.stringify(t)); c.id = uid(); c.x += 40; c.y += 40; state.items.push(c); redrawAll(false); select({ t: 'item', id: c.id }, true); commit(); return; }
  else if (a === 'front' || a === 'back') {
    state.items = state.items.filter(i => i.id !== t.id); a === 'front' ? state.items.push(t) : state.items.unshift(t);
    syncItems(); itemLayer.batchDraw(); commit(); return;
  }
  clampTarget(t); redrawAll(false); renderInspector(); commit();
});
$('#replaceInput').addEventListener('change', async e => {
  const files = [...e.target.files]; e.target.value = '';
  if (files.length && replaceTarget) await addFiles(files, { replace: replaceTarget });
});

/* ---------- side panels ---------- */
function tplSvg(tree) {
  const raw = leaves(tree, 0, 0, 1, 1, []), ar = state.canvas.w / state.canvas.h;
  const W = ar >= 1 ? 56 : 56 * ar, H = ar >= 1 ? 56 / ar : 56;
  return `<svg viewBox="0 0 56 56" width="56" height="56"><g transform="translate(${(56 - W) / 2} ${(56 - H) / 2})">${raw.map(r => `<rect x="${(r[0] * W + 1).toFixed(2)}" y="${(r[1] * H + 1).toFixed(2)}" width="${Math.max(1, r[2] * W - 2).toFixed(2)}" height="${Math.max(1, r[3] * H - 2).toFixed(2)}" rx="1.5" fill="currentColor"/>`).join('')}</g></svg>`;
}
function renderTemplates() {
  const n = state.cells.length;
  $('#cellCount').textContent = state.layoutId === 'smart' ? L('layout.autoBadge', { n }) : n;
  $('#autoBtn').classList.toggle('on', state.autoLayout && state.layoutId === 'smart');
  $('#autoInfo').textContent = state.layoutId === 'smart' && state.smartLoss != null ? L('layout.autoInfo.loss', { pct: fmtPct(state.smartLoss) }) : state.layoutId === 'smart' ? L('layout.autoInfo.custom') : photoOrder.length ? L('layout.autoInfo.pick') : L('layout.autoInfo.empty');
  const list = TEMPLATES[n] || [];
  $('#tplGrid').innerHTML = list.length ? list.map(t => `<button class="tpl ${t.id === state.layoutId ? 'on' : ''}" data-id="${t.id}" title="${esc(L('layout.template'))}">${tplSvg(t.tree)}</button>`).join('') : `<p class="muted">${L('layout.maxTemplates')}</p>`;
}
function renderTray() {
  const used = new Map();
  state.cells.forEach(c => c.photoId && used.set(c.photoId, (used.get(c.photoId) || 0) + 1));
  state.items.forEach(i => i.type === 'image' && used.set(i.photoId, (used.get(i.photoId) || 0) + 1));
  $('#tray').innerHTML = photoOrder.map(id => { const p = photos.get(id); return `<div class="thumb ${used.has(id) ? 'used' : ''}" draggable="true" data-id="${id}" title="${esc(p.name)}"><img src="${p.thumb}" alt="" draggable="false"><button class="x" data-del="${id}" title="${esc(L('photos.remove'))}">${svg('x')}</button>${used.has(id) ? '<i>✓</i>' : ''}</div>`; }).join('');
  $('#trayEmpty').style.display = photoOrder.length ? 'none' : 'block';
  $('#photoCount').textContent = photoOrder.length ? Ln('photos.count', photoOrder.length) : '';
}
$('#tray').addEventListener('dragstart', e => { const t = e.target.closest('.thumb'); if (t) e.dataTransfer.setData('text/plain', 'photo:' + t.dataset.id); });
$('#tray').addEventListener('click', e => {
  const d = e.target.closest('[data-del]'); if (d) { removePhoto(d.dataset.del); return; }
  const t = e.target.closest('.thumb'); if (!t) return;
  if (state.mode === 'grid' && sel && sel.t === 'cell' && state.cells[sel.i].photoId !== t.dataset.id) { assignPhotoToCell(sel.i, t.dataset.id); toast(L('toast.placed')); return; }
  if (state.mode === 'free') { addImageItem(t.dataset.id); commit(); renderTray(); }
  else if (state.autoLayout) toast(L('toast.autoPlaces'));
  else placePhoto(t.dataset.id, true);
});
$('#tplGrid').addEventListener('click', e => {
  const b = e.target.closest('.tpl'); if (!b) return;
  state.autoLayout = false; setLayout(b.dataset.id);
  if (sel && sel.t === 'cell' && !state.cells[sel.i]) sel = null;
  redrawAll(); renderTemplates(); renderInspector(); commit();
});
$('#autoBtn').addEventListener('click', () => {
  if (!photoOrder.length) return toast(L('toast.uploadFirst'));
  runSmart(); sel = null; redrawAll(); renderTemplates(); renderInspector(); renderTray(); commit();
  toast(L('toast.autoFitCrop', { pct: fmtPct(state.smartLoss) }));
});
$('#cellMinus').addEventListener('click', () => { setCount(state.cells.length - 1); redrawAll(); renderTemplates(); renderTray(); commit(); });
$('#cellPlus').addEventListener('click', () => { setCount(state.cells.length + 1); redrawAll(); renderTemplates(); commit(); });

/* canvas size */
$('#presetSel').innerHTML = ASPECTS.map(a => `<option value="${a.id}">${esc(L('aspect.' + a.id))}</option>`).join('');
function setCanvas(w, hh, preset) {
  state.canvas = { w: clamp(Math.round(w), 200, 6000), h: clamp(Math.round(hh), 200, 6000), preset };
  if (state.mode === 'grid' && state.autoLayout && photoOrder.length) runSmart();
  fullRefresh(); commit();
}
$('#presetSel').addEventListener('change', e => { const a = ASPECTS.find(x => x.id === e.target.value); setCanvas(a.w, a.h, a.id); });
$('#swapAspect').addEventListener('click', () => setCanvas(state.canvas.h, state.canvas.w, state.canvas.preset));
['#canvasW', '#canvasH'].forEach(s => $(s).addEventListener('change', () => setCanvas(+$('#canvasW').value, +$('#canvasH').value, 'custom')));

/* style bindings */
const getPath = (o, p) => p.split('.').reduce((a, k) => a[k], o);
$$('[data-bind]').forEach(el => {
  const k = el.dataset.bind;
  el.addEventListener('input', () => {
    const val = el.type === 'checkbox' ? el.checked : el.type === 'range' ? +el.value : el.value;
    setPath(state, k, val);
    const o = el.nextElementSibling; if (o && o.tagName === 'OUTPUT') o.value = val;
    redrawAll(k.startsWith('bg')); if (k.startsWith('bg')) applyView();
    if (k.startsWith('bg')) syncBgUi();
  });
  el.addEventListener('change', () => { if (k === 'pad' && state.mode === 'grid' && state.autoLayout && photoOrder.length) { runSmart(); redrawAll(false); renderTemplates(); } commit(); });
});
function syncBgUi() {
  $$('[data-bgtype]').forEach(b => b.classList.toggle('on', b.dataset.bgtype === state.bg.type));
  $$('[data-bgshow]').forEach(s => { s.hidden = !s.dataset.bgshow.split(' ').includes(state.bg.type); });
}
function syncControls() {
  $$('[data-bind]').forEach(el => {
    const val = getPath(state, el.dataset.bind);
    if (el.type === 'checkbox') el.checked = !!val; else el.value = val;
    const o = el.nextElementSibling; if (o && o.tagName === 'OUTPUT') o.value = val;
  });
  $('#presetSel').value = state.canvas.preset; $('#canvasW').value = state.canvas.w; $('#canvasH').value = state.canvas.h;
  $$('#modeSeg button').forEach(b => b.classList.toggle('on', b.dataset.mode === state.mode));
  document.body.dataset.mode = state.mode;
  syncBgUi();
}
$$('[data-bgtype]').forEach(b => b.addEventListener('click', () => { state.bg.type = b.dataset.bgtype; syncBgUi(); syncControls(); redrawAll(); applyView(); commit(); }));
$('#solidSw').innerHTML = SOLIDS.map(c => `<button class="sw" style="background:${c}" data-c="${c}" title="${c}"></button>`).join('');
$('#gradSw').innerHTML = GRADIENTS.map((g, i) => `<button class="sw" style="background:linear-gradient(${g[2]}deg,${g[0]},${g[1]})" data-g="${i}"></button>`).join('');
$('#solidSw').addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (!b) return; Object.assign(state.bg, { type: 'solid', c1: b.dataset.c }); syncControls(); redrawAll(); applyView(); commit(); });
$('#gradSw').addEventListener('click', e => { const b = e.target.closest('[data-g]'); if (!b) return; const g = GRADIENTS[b.dataset.g]; Object.assign(state.bg, { type: 'gradient', c1: g[0], c2: g[1], angle: g[2] }); syncControls(); redrawAll(); applyView(); commit(); });
const bgCss = b => b.type === 'gradient' ? `linear-gradient(${b.angle}deg,${b.c1},${b.c2})` : b.c1;
$('#themes').innerHTML = THEMES.map((t, i) => `<button class="theme" data-i="${i}"><span class="tp" style="background:${bgCss(t.bg)};padding:${Math.min(6, t.pad / 6)}px;gap:${Math.min(4, t.gap / 5)}px"><i style="border-radius:${Math.min(6, t.radius / 6)}px"></i><i style="border-radius:${Math.min(6, t.radius / 6)}px"></i><i style="border-radius:${Math.min(6, t.radius / 6)}px"></i><i style="border-radius:${Math.min(6, t.radius / 6)}px"></i></span><em>${esc(L('theme.' + t.n.toLowerCase()))}</em></button>`).join('');
$('#themes').addEventListener('click', e => {
  const b = e.target.closest('.theme'); if (!b) return; const t = THEMES[b.dataset.i];
  state.gap = t.gap; state.pad = t.pad; state.radius = t.radius;
  state.bg = Object.assign({ type: 'solid', c1: '#ffffff', c2: '#e9d5ff', angle: 135, pat: 'dots' }, t.bg);
  state.border = t.border ? Object.assign({}, t.border) : { w: 0, color: '#ffffff' };
  state.shadow = t.shadow ? Object.assign({}, t.shadow) : { on: false, blur: 24, opacity: 0.35 };
  if (state.mode === 'grid' && state.autoLayout && photoOrder.length) runSmart();
  fullRefresh(); commit();
});
$('#stickerGrid').innerHTML = STICKERS.map(s => `<button data-s="${s}">${s}</button>`).join('');
$('#stickerGrid').addEventListener('click', e => { const b = e.target.closest('[data-s]'); if (b) addSticker(b.dataset.s); });
$$('[data-text]').forEach(b => b.addEventListener('click', () => addText(b.dataset.text)));

/* tabs */
$$('.tabs button').forEach(b => b.addEventListener('click', () => {
  if (isMobile()) document.body.dataset.sheet = b.classList.contains('on') && document.body.dataset.sheet === 'open' ? '' : 'open';
  $$('.tabs button').forEach(x => x.classList.toggle('on', x === b));
  $$('.pane').forEach(p => p.classList.toggle('on', p.id === 'pane-' + b.dataset.tab));
}));

/* top bar */
$$('#modeSeg button').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
$('#moreBtn').addEventListener('click', e => { e.stopPropagation(); $('.tools').classList.toggle('open'); });
document.addEventListener('click', e => { if (!e.target.closest('#moreBtn')) $('.tools').classList.remove('open'); });
$('#doneBtn').addEventListener('click', () => select(null));
$('#area').addEventListener('click', e => { if (e.target === area || e.target === wrap) select(null); });
$('#undoBtn').addEventListener('click', undo); $('#redoBtn').addEventListener('click', redo);
$('#shuffleBtn').addEventListener('click', () => {
  if (state.mode === 'free') { scatter(); redrawAll(false); commit(); return; }
  if (!photoOrder.length) return;
  photoOrder.sort(() => Math.random() - 0.5);
  if (state.autoLayout) runSmart(); else { const f = state.cells.filter(c => c.photoId); f.sort(() => Math.random() - 0.5); let k = 0; state.cells = state.cells.map(c => (c.photoId ? f[k++] : c)); }
  redrawAll(); renderTray(); commit();
});
$('#arrangeBtn').addEventListener('click', () => { arrangeToLayout(); redrawAll(false); commit(); });
$('#scatterBtn').addEventListener('click', () => { scatter(); redrawAll(false); commit(); });
$('#zoomIn').addEventListener('click', () => { viewZoom = clamp(viewZoom * 1.25, 0.5, 4); applyView(); });
$('#zoomOut').addEventListener('click', () => { viewZoom = clamp(viewZoom / 1.25, 0.5, 4); applyView(); });
$('#zoomFit').addEventListener('click', () => { viewZoom = 1; applyView(); });
$('#themeBtn').addEventListener('click', () => {
  const d = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = d; try { localStorage.setItem('cs-theme', d); } catch (e) { /* ignore */ }
});
$('#newBtn').addEventListener('click', async () => {
  if (!confirm(L('confirm.new'))) return;
  photos.clear(); photoOrder = []; state = defaultState(); sel = null; hist.u = []; hist.r = []; lastSnap = snap(); blobCache = null;
  fullRefresh(); updateHistBtns(); scheduleSave();
});
$('#fileInput').addEventListener('change', async e => { const f = [...e.target.files]; e.target.value = ''; await addFiles(f); });
$$('[data-pick]').forEach(b => b.addEventListener('click', () => $('#fileInput').click()));
$('#sampleBtn').addEventListener('click', async () => {
  const files = []; const sizes = [[1600, 1067], [1067, 1600], [1600, 1200], [1200, 1200], [1600, 900], [1000, 1500], [1500, 1000]];
  for (let i = 0; i < 7; i++) files.push(new File([await makeSample(i, sizes[i])], `sample-${i + 1}.jpg`, { type: 'image/jpeg' }));
  await addFiles(files);
});
function makeSample(i, [w, hh]) {
  const c = document.createElement('canvas'); c.width = w; c.height = hh; const x = c.getContext('2d');
  const hue = (i * 53 + 10) % 360;
  const g = x.createLinearGradient(0, 0, 0, hh); g.addColorStop(0, `hsl(${hue},85%,72%)`); g.addColorStop(0.7, `hsl(${(hue + 40) % 360},90%,62%)`); g.addColorStop(1, `hsl(${(hue + 70) % 360},80%,50%)`);
  x.fillStyle = g; x.fillRect(0, 0, w, hh);
  x.fillStyle = 'rgba(255,255,255,.9)'; x.beginPath(); x.arc(w * (0.25 + (i % 3) * 0.25), hh * 0.32, Math.min(w, hh) * 0.11, 0, 7); x.fill();
  for (let l = 0; l < 4; l++) {
    x.fillStyle = `hsl(${(hue + 200 + l * 12) % 360},${45 - l * 6}%,${42 - l * 9}%)`; x.beginPath(); x.moveTo(0, hh);
    const base = hh * (0.52 + l * 0.12), amp = hh * (0.07 - l * 0.01), fr = 1.5 + l + (i % 4) * 0.6, ph = i * 1.7 + l * 2;
    for (let px = 0; px <= w; px += 8) x.lineTo(px, base + Math.sin(px / w * fr * Math.PI * 2 + ph) * amp);
    x.lineTo(w, hh); x.fill();
  }
  return new Promise(r => c.toBlob(r, 'image/jpeg', 0.9));
}

/* keyboard */
window.addEventListener('keydown', e => {
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  if ($('#exportDlg').open) return;
  const m = e.metaKey || e.ctrlKey;
  if (m && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
  else if (m && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
  else if (m && e.key.toLowerCase() === 'd' && sel && sel.t === 'item') { e.preventDefault(); $('#insp [data-a=dup]')?.click(); }
  else if ((e.key === 'Delete' || e.key === 'Backspace') && sel) { e.preventDefault(); $('#insp [data-a=del]')?.click(); }
  else if (e.key === 'Escape') select(null);
  else if (sel && sel.t === 'item' && e.key.startsWith('Arrow')) {
    e.preventDefault(); const it = itemById(sel.id), d = e.shiftKey ? 10 : 1;
    if (e.key === 'ArrowLeft') it.x -= d; if (e.key === 'ArrowRight') it.x += d; if (e.key === 'ArrowUp') it.y -= d; if (e.key === 'ArrowDown') it.y += d;
    syncItems(); itemLayer.batchDraw(); clearTimeout(wheelTimer); wheelTimer = setTimeout(commit, 400);
  }
});

/* ---------- export ---------- */
const IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const WEBP = document.createElement('canvas').toDataURL('image/webp').startsWith('data:image/webp');
/* how many pixels each photo needs at this export scale, so only that much is decoded */
function exportNeeds(mult) {
  const need = new Map();
  const add = (cr, w, hh) => { const p = photos.get(cr.photoId); if (!p) return; const n = Math.max(p.w, p.h) * panLimit(cr, w, hh).s * mult; need.set(p.id, Math.max(need.get(p.id) || 0, n)); };
  if (state.mode === 'grid') state.cells.forEach((cr, i) => rects[i] && add(cr, rects[i].w, rects[i].h));
  else state.items.forEach(it => it.type === 'image' && add(it, it.w, it.h));
  return need;
}
let renderChain = Promise.resolve(); // renders share the stage, so run them one at a time
function renderToCanvas(mult) { const run = renderChain.then(() => renderNow(mult)); renderChain = run.catch(() => {}); return run; }
async function renderNow(mult) {
  const used = [];
  try {
    for (const [id, n] of exportNeeds(mult)) { const p = photos.get(id), b = await loadHi(p, Math.ceil(n)); if (b !== p.prev) { p.hi = b; used.push(p); } }
    exporting = true;
    const nodes = tr.nodes(); tr.nodes([]); uiLayer.hide(); trLayer.hide();
    const old = { w: stage.width(), h: stage.height(), s: viewScale };
    stage.size({ width: state.canvas.w, height: state.canvas.h }); stage.scale({ x: 1, y: 1 });
    try { return stage.toCanvas({ pixelRatio: mult }); }
    finally {
      stage.size({ width: old.w, height: old.h }); stage.scale({ x: old.s, y: old.s });
      uiLayer.show(); trLayer.show(); exporting = false; tr.nodes(nodes); stage.batchDraw();
    }
  } finally { used.forEach(p => { if (p.hi) p.hi.close(); p.hi = null; }); }
}
const maxMult = () => Math.min(16384 / Math.max(state.canvas.w, state.canvas.h), Math.sqrt((IOS ? 16e6 : 67e6) / (state.canvas.w * state.canvas.h)));
const exp = { fmt: 'png', mult: 2, q: 0.92, page: 'fit' };
const MIME = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' };
async function makeBlob(fmt = exp.fmt, mult = exp.mult) {
  mult = Math.min(mult, maxMult());
  const c = await renderToCanvas(mult);
  if (fmt === 'pdf') return makePdf(c);
  let out = c;
  if (fmt === 'jpg') { out = document.createElement('canvas'); out.width = c.width; out.height = c.height; const x = out.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(c, 0, 0); }
  const blob = await new Promise(r => out.toBlob(r, MIME[fmt], exp.q));
  if (!blob) throw new Error(L('toast.tooLarge'));
  return blob;
}
/* the last render is cached, so Download / Share / Copy right after the size estimate are instant */
let blobCache = null;
async function getBlob(fmt = exp.fmt, mult = exp.mult) {
  const key = [snap(), fmt, Math.min(mult, maxMult()), exp.q, exp.page].join('|');
  if (blobCache && blobCache.key === key) return blobCache.blob;
  const blob = await makeBlob(fmt, mult); blobCache = { key, blob }; return blob;
}
async function makePdf(c) {
  if (!window.jspdf) await new Promise((ok, fail) => { const sc = document.createElement('script'); sc.src = (window.ROOT || '') + 'vendor/jspdf.umd.min.js'; sc.onload = ok; sc.onerror = fail; document.head.append(sc); }); // loaded on first PDF export to keep startup light
  const { jsPDF } = window.jspdf;
  const flat = document.createElement('canvas'); flat.width = c.width; flat.height = c.height; const x = flat.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(c, 0, 0);
  const data = flat.toDataURL('image/jpeg', exp.q);
  let doc;
  if (exp.page === 'fit') { doc = new jsPDF({ unit: 'px', format: [c.width, c.height], orientation: c.width > c.height ? 'l' : 'p', hotfixes: ['px_scaling'], compress: true }); doc.addImage(data, 'JPEG', 0, 0, c.width, c.height); }
  else {
    const land = c.width > c.height; doc = new jsPDF({ unit: 'mm', format: exp.page, orientation: land ? 'l' : 'p', compress: true });
    const pw = doc.internal.pageSize.getWidth() - 20, ph = doc.internal.pageSize.getHeight() - 20, k = Math.min(pw / c.width, ph / c.height);
    const iw = c.width * k, ih = c.height * k; doc.addImage(data, 'JPEG', (doc.internal.pageSize.getWidth() - iw) / 2, (doc.internal.pageSize.getHeight() - ih) / 2, iw, ih);
  }
  return doc.output('blob');
}
const ext = () => (exp.fmt === 'jpg' ? 'jpg' : exp.fmt);
const fname = () => ($('#expName').value.trim() || 'collage') + '.' + ext();
function download(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
let estId = 0, estTimer;
function scaleLabel() {
  const mm = maxMult();
  $('#expScale').innerHTML = [1, 2, 3, 4].map(m => `<button data-m="${m}" class="${exp.mult === m ? 'on' : ''}" ${m > mm ? 'disabled' : ''}>${m}×<small>${Math.round(state.canvas.w * m)}×${Math.round(state.canvas.h * m)}</small></button>`).join('');
}
function estimate() {
  clearTimeout(estTimer); const id = ++estId; $('#expInfo').textContent = L('export.calculating');
  estTimer = setTimeout(async () => {
    let b; try { b = await getBlob(); } catch (err) { if (id === estId) $('#expInfo').textContent = err.message; return; } if (id !== estId) return;
    $('#expInfo').textContent = `${Math.round(state.canvas.w * Math.min(exp.mult, maxMult()))} × ${Math.round(state.canvas.h * Math.min(exp.mult, maxMult()))}px · ${(b.size / 1048576).toFixed(2)} MB`;
  }, 350);
}
function syncExportUi() {
  $$('#expFmt button').forEach(b => b.classList.toggle('on', b.dataset.f === exp.fmt));
  $('#qRow').hidden = !(exp.fmt === 'jpg' || exp.fmt === 'webp' || exp.fmt === 'pdf');
  $('#pdfRow').hidden = exp.fmt !== 'pdf';
  $('#expBg').hidden = !(state.bg.type === 'none' && exp.fmt !== 'png' && exp.fmt !== 'webp');
  scaleLabel(); estimate();
}
$('#exportBtn').addEventListener('click', async () => {
  if (!state.cells.some(c => c.photoId) && !state.items.length) return toast(L('toast.addFirst'));
  select(null);
  const c = await renderToCanvas(Math.min(1, 640 / Math.max(state.canvas.w, state.canvas.h)));
  $('#expPrev').src = c.toDataURL('image/png');
  $('#expPrev').parentElement.classList.toggle('checker', state.bg.type === 'none');
  $('#expShare').disabled = !navigator.share;
  $('#exportDlg').showModal(); syncExportUi();
});
$('#expClose').addEventListener('click', () => $('#exportDlg').close());
$('#expFmt').addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (b) { exp.fmt = b.dataset.f; syncExportUi(); } });
$('#expScale').addEventListener('click', e => { const b = e.target.closest('[data-m]'); if (b && !b.disabled) { exp.mult = +b.dataset.m; syncExportUi(); } });
$('#expQ').addEventListener('input', e => { exp.q = +e.target.value; e.target.nextElementSibling.value = Math.round(exp.q * 100) + '%'; estimate(); });
$('#pdfPage').addEventListener('change', e => { exp.page = e.target.value; estimate(); });
async function withBusy(btnEl, fn) { btnEl.classList.add('busy'); try { await fn(); } catch (err) { console.error(err); toast(err.name === 'NotAllowedError' ? L('toast.tapAgain') : L('toast.error', { msg: err.message || err })); } btnEl.classList.remove('busy'); }
$('#expDownload').addEventListener('click', e => withBusy(e.currentTarget, async () => { const b = await getBlob(); download(b, fname()); toast(L('toast.saved', { name: fname() })); }));
$('#expCopy').addEventListener('click', e => withBusy(e.currentTarget, async () => {
  if (!navigator.clipboard || !window.ClipboardItem) return toast(L('toast.noClipboard'));
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': getBlob('png', exp.mult) })]);
  toast(L('toast.copied'));
}));
$('#expShare').addEventListener('click', e => withBusy(e.currentTarget, async () => {
  const b = await getBlob(); const file = new File([b], fname(), { type: b.type });
  if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: L('export.shareTitle') }); } catch (err) { if (err.name !== 'AbortError') throw err; } }
  else toast(L('toast.noShare'));
}));
$('#expOpen').addEventListener('click', e => withBusy(e.currentTarget, async () => {
  const w = window.open('', '_blank'); if (!w) return toast(L('toast.popupOpen'));
  try { w.location.href = URL.createObjectURL(await getBlob()); } catch (err) { w.close(); throw err; }
}));
$('#expPrint').addEventListener('click', e => withBusy(e.currentTarget, async () => {
  const w = window.open('', '_blank'); if (!w) return toast(L('toast.popupPrint'));
  try {
    const u = URL.createObjectURL(await getBlob('png', exp.mult)), d = w.document;
    d.title = L('export.printTitle');
    const st = d.createElement('style'); st.textContent = '@page{margin:0}body{margin:0;display:grid;place-items:center;min-height:100vh}img{max-width:100%;max-height:100vh}';
    const im = d.createElement('img'); im.onload = () => setTimeout(() => w.print(), 200); im.src = u;
    d.head.append(st); d.body.append(im);
  } catch (err) { w.close(); throw err; }
}));
const blobToDataURL = b => new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); });
$('#expSave').addEventListener('click', e => withBusy(e.currentTarget, async () => {
  const ph = []; for (const id of photoOrder) { const p = photos.get(id); ph.push({ id, name: p.name, data: await blobToDataURL(p.blob) }); }
  download(new Blob([JSON.stringify({ v: 1, state, order: photoOrder, photos: ph })], { type: 'application/json' }), ($('#expName').value.trim() || 'collage') + '.collage.json');
  toast(L('toast.projectSaved'));
}));
$('#expLoad').addEventListener('click', () => $('#projInput').click());
function sanitizeState(d) {
  const st = Object.assign(defaultState(), d);
  st.canvas = Object.assign(defaultState().canvas, d.canvas); st.bg = Object.assign(defaultState().bg, d.bg);
  st.border = Object.assign(defaultState().border, d.border); st.shadow = Object.assign(defaultState().shadow, d.shadow);
  st.items = Array.isArray(d.items) ? d.items.filter(i => i && i.id && i.type).map(i => (i.type === 'image' ? Object.assign(newCrop(), i, { f: Object.assign(DEF_F(), i.f) }) : i)) : [];
  st.cells = (Array.isArray(d.cells) ? d.cells : []).map(c => Object.assign(newCrop(), c, { f: Object.assign(DEF_F(), c && c.f) }));
  const prev = state; state = st;
  try {
    if (!(st.layoutId === 'smart' && st.smartTree) && !T_BY_ID[st.layoutId]) st.layoutId = 'n4-0';
    const n = leaves(layoutTree(), 0, 0, 1, 1, []).length;
    while (st.cells.length < n) st.cells.push(newCrop());
    st.cells.length = n;
  } catch (e) { state = prev; throw e; }
  state = prev; return st;
}
$('#projInput').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  const oldPhotos = new Map(photos), oldOrder = photoOrder;
  try {
    const d = JSON.parse(await f.text());
    if (!d || !Array.isArray(d.photos) || !d.state || !Array.isArray(d.order)) throw new Error('bad project');
    photos.clear(); photoOrder = [];
    for (const p of d.photos) await loadPhoto(await (await fetch(p.data)).blob(), p.name, p.id);
    photoOrder = d.order.filter(id => photos.has(id));
    state = sanitizeState(d.state); sel = null; hist.u = []; hist.r = []; lastSnap = snap();
    $('#exportDlg').close(); fullRefresh(); updateHistBtns(); scheduleSave(); toast(L('toast.projectOpened'));
  } catch (err) {
    photos.clear(); oldPhotos.forEach((v, k) => photos.set(k, v)); photoOrder = oldOrder;
    toast(L('toast.projectBad'));
  }
});

/* paste images from the clipboard */
window.addEventListener('paste', e => {
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || $('#exportDlg').open) return;
  const files = [...(e.clipboardData?.files || [])].filter(f => f.type.startsWith('image/'));
  if (files.length) { e.preventDefault(); addFiles(files.map((f, i) => new File([f], `pasted-${Date.now()}-${i}.${f.type.split('/')[1] || 'png'}`, { type: f.type }))); }
});

/* about + language dialogs. Language links are real anchors (crawlable); the click only remembers the choice and saves the session first. */
[['#aboutBtn', '#aboutDlg'], ['#langBtn', '#langDlg']].forEach(([b, d]) => $(b).addEventListener('click', () => $(d).showModal()));
$$('dialog.info').forEach(d => d.addEventListener('click', e => { if (e.target === d || e.target.closest('[data-close]')) d.close(); }));
$$('[data-lang]').forEach(a => a.addEventListener('click', async e => {
  try { localStorage.setItem('cs-lang', a.dataset.lang); } catch (err) { /* ignore */ }
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
  e.preventDefault(); await saveNow(); location.href = a.href;
}));

/* ---------- init ---------- */
async function init() {
  $$('[data-icon]').forEach(el => el.insertAdjacentHTML('afterbegin', svg(el.dataset.icon)));
  let theme = null; try { theme = localStorage.getItem('cs-theme'); } catch (e) { /* ignore */ }
  document.documentElement.dataset.theme = theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  try {
    const d = await idb.get('session');
    if (d && d.photos && d.photos.length) {
      for (const p of d.photos) await loadPhoto(p.blob, p.name, p.id);
      photoOrder = d.order.filter(id => photos.has(id)); state = sanitizeState(d.state); lastSnap = snap();
      toast(L('toast.restored'));
    }
  } catch (e) { /* no saved session */ }
  if (!WEBP) $('#expFmt [data-f=webp]').hidden = true;
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register((window.ROOT || '') + 'sw.js').catch(() => {});
  if (isMobile() && !photoOrder.length) document.body.dataset.sheet = 'open';
  fullRefresh(); updateHistBtns();
  window.__collage = { get state() { return state; }, photos, runSmart, addFiles };
}
init();
