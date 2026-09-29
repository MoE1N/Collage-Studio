'use strict';
/* ---------- Layout DSL ----------
   h(...) splits left to right, v(...) splits top to bottom.
   An item is a number (leaf, weight 1) or [weight, node]. Leaves become photo cells in reading order. */
const h = (...k) => ({ d: 'h', k });
const v = (...k) => ({ d: 'v', k });
const fill = (n, f) => Array.from({ length: n }, f);
const rows = (...c) => v(...c.map(n => h(...fill(n, () => 1))));
const cols = (...c) => h(...c.map(n => v(...fill(n, () => 1))));
const grid = (c, r) => rows(...fill(r, () => c));

function leaves(node, x, y, w, ht, out) {
  if (typeof node === 'number') { out.push([x, y, w, ht]); return out; }
  const items = node.k.map(i => (Array.isArray(i) ? i : [1, i]));
  const total = items.reduce((s, i) => s + i[0], 0);
  let pos = 0;
  for (const [wt, child] of items) {
    const f = wt / total;
    if (node.d === 'h') leaves(child, x + pos * w, y, f * w, ht, out);
    else leaves(child, x, y + pos * ht, w, f * ht, out);
    pos += f;
  }
  return out;
}

function autoRows(n) {
  const c = Math.ceil(Math.sqrt(n)), r = Math.ceil(n / c);
  const base = Math.floor(n / r), extra = n % r;
  return rows(...fill(r, (_, i) => base + (i < extra ? 1 : 0)));
}

const TEMPLATE_DEFS = {
  1: [1],
  2: [h(1, 1), v(1, 1), h([2, 1], 1), h(1, [2, 1]), v([2, 1], 1), v(1, [2, 1])],
  3: [h(1, v(1, 1)), h(v(1, 1), 1), v(1, h(1, 1)), v(h(1, 1), 1), h(1, 1, 1), v(1, 1, 1), h([2, 1], v(1, 1)), v([2, 1], h(1, 1)), h(v(1, 1), [2, 1])],
  4: [grid(2, 2), h(1, 1, 1, 1), v(1, 1, 1, 1), v([2, 1], h(1, 1, 1)), h([2, 1], v(1, 1, 1)), h(1, v(1, 1, 1)), v(h(1, 1), 1, 1), h(v(1, [2, 1]), v([2, 1], 1))],
  5: [rows(2, 3), rows(3, 2), h([2, 1], v(1, 1, 1, 1)), v([2, 1], h(1, 1, 1, 1)), h(v(1, 1), 1, v(1, 1)), rows(1, 2, 2), v(h(1, 1), 1, h(1, 1))],
  6: [grid(3, 2), grid(2, 3), rows(1, 2, 3), h([2, 1], v(1, 1, 1, 1, 1)), v([2, 1], h(1, 1, 1, 1, 1)), h(v(1, 1), v(1, 1, 1, 1)), rows(2, 1, 3)],
  7: [rows(2, 3, 2), rows(3, 4), rows(1, 3, 3), rows(3, 1, 3), h([2, 1], v(1, 1, 1, 1, 1, 1))],
  8: [grid(4, 2), grid(2, 4), rows(3, 2, 3), rows(2, 4, 2), rows(1, 3, 4)],
  9: [grid(3, 3), rows(4, 5), rows(2, 3, 4), rows(2, 5, 2), rows(1, 4, 4)],
  10: [rows(5, 5), rows(3, 4, 3), rows(2, 3, 3, 2), grid(2, 5)],
  11: [rows(4, 3, 4), rows(2, 3, 3, 3), rows(5, 6)],
  12: [grid(4, 3), grid(3, 4), rows(2, 4, 4, 2), rows(6, 6)],
};
const TEMPLATES = {};
const T_BY_ID = {};
for (let n = 1; n <= 16; n++) {
  const defs = TEMPLATE_DEFS[n] || [autoRows(n), cols(...autoRows(n).k.map(r => r.k.length))];
  TEMPLATES[n] = defs.map((tree, i) => {
    const t = { id: `n${n}-${i}`, n, tree };
    T_BY_ID[t.id] = t;
    return t;
  });
}

/* ---------- Canvas size presets ---------- */
const ASPECTS = [
  { id: 'sq', n: 'Square 1:1 (Instagram)', w: 1080, h: 1080 },
  { id: '45', n: 'Portrait 4:5 (Instagram)', w: 1080, h: 1350 },
  { id: '916', n: 'Story / Reel 9:16', w: 1080, h: 1920 },
  { id: '169', n: 'Landscape 16:9 (YouTube)', w: 1920, h: 1080 },
  { id: '23', n: 'Pinterest 2:3', w: 1000, h: 1500 },
  { id: 'fb', n: 'Facebook / Link 1.91:1', w: 1200, h: 630 },
  { id: '32', n: 'Photo print 3:2 (6x4 in)', w: 1800, h: 1200 },
  { id: 'a4', n: 'A4 portrait (150 dpi)', w: 1240, h: 1754 },
  { id: 'custom', n: 'Custom size', w: 1080, h: 1080 },
];

/* ---------- Style presets ---------- */
const SOLIDS = ['#ffffff', '#f5f1ea', '#e5e7eb', '#111111', '#0f172a', '#fde68a', '#fbcfe8', '#bfdbfe', '#bbf7d0', '#fecaca', '#ddd6fe', '#fed7aa'];
const GRADIENTS = [
  ['#fbcfe8', '#bfdbfe', 135], ['#f97316', '#ec4899', 160], ['#22d3ee', '#6366f1', 135], ['#a7f3d0', '#3b82f6', 120],
  ['#fde68a', '#f472b6', 45], ['#0f172a', '#4c1d95', 160], ['#f0abfc', '#fb7185', 90], ['#d1fae5', '#fef9c3', 180],
];
const THEMES = [
  { n: 'Clean', gap: 10, pad: 10, radius: 0, bg: { type: 'solid', c1: '#ffffff' } },
  { n: 'Airy', gap: 28, pad: 48, radius: 18, bg: { type: 'solid', c1: '#f5f1ea' }, shadow: { on: true, blur: 30, opacity: 0.18 } },
  { n: 'Night', gap: 10, pad: 10, radius: 14, bg: { type: 'solid', c1: '#0f172a' } },
  { n: 'Pastel', gap: 20, pad: 28, radius: 40, bg: { type: 'gradient', c1: '#fbcfe8', c2: '#bfdbfe', angle: 135 } },
  { n: 'Film', gap: 6, pad: 36, radius: 0, bg: { type: 'solid', c1: '#111111' }, border: { w: 3, color: '#f5f5f5' } },
  { n: 'Sunset', gap: 14, pad: 20, radius: 22, bg: { type: 'gradient', c1: '#f97316', c2: '#ec4899', angle: 160 } },
  { n: 'Mosaic', gap: 0, pad: 0, radius: 0, bg: { type: 'solid', c1: '#ffffff' } },
  { n: 'Dots', gap: 16, pad: 24, radius: 12, bg: { type: 'pattern', c1: '#fff7ed', c2: '#fdba74', pat: 'dots' } },
  { n: 'Blur', gap: 14, pad: 34, radius: 16, bg: { type: 'blur', c1: '#222222' }, shadow: { on: true, blur: 26, opacity: 0.4 } },
];

/* ---------- Photo filters ---------- */
const FILTERS = {
  none: {}, vivid: { c: 112, s: 135 }, warm: { b: 104, s: 115, sep: 25, hue: -8 }, cool: { c: 105, s: 105, hue: 12 },
  bw: { g: 100, c: 112 }, sepia: { sep: 80, c: 95 }, fade: { b: 110, c: 82, s: 85 }, noir: { g: 100, c: 140, b: 90, vig: 50 },
  dreamy: { b: 108, c: 90, s: 120, blur: 2 }, vintage: { sep: 40, c: 90, b: 105, s: 90, vig: 35 },
};

const FONTS = [
  ['Modern Sans', '"Helvetica Neue", Helvetica, Arial, sans-serif'],
  ['Classic Serif', 'Georgia, "Times New Roman", serif'],
  ['Bold Impact', 'Impact, "Arial Black", sans-serif'],
  ['Script', '"Brush Script MT", "Snell Roundhand", cursive'],
  ['Typewriter', '"Courier New", Courier, monospace'],
  ['Rounded', '"Trebuchet MS", Verdana, sans-serif'],
  ['Wide', 'Verdana, Geneva, sans-serif'],
];

const STICKERS = ['❤️', '💛', '💚', '💙', '💜', '🧡', '✨', '⭐', '🌟', '🔥', '🎉', '🎈', '🎂', '🎁', '🥳', '😍', '😎', '🤩', '😂', '🥰',
  '☀️', '🌈', '🌸', '🌼', '🌿', '🍀', '🌴', '🌊', '🏖️', '⛰️', '🌙', '☁️', '📸', '🎞️', '✈️', '🚗', '🗺️', '🏕️', '🎵', '🎶',
  '🍕', '🍔', '🍩', '🍓', '🍹', '☕', '🐶', '🐱', '🦋', '🐝', '👑', '💎', '🏆', '✅', '📍', '💬', '➕', '➡️', '💯', '🔖'];

/* ---------- Smart auto layout ----------
   Justified rows (or columns): every row shares the canvas width, so cells keep each photo's aspect
   ratio scaled by one common factor k. Crop loss is |ln k|, so we search photo orderings and row
   partitions (rows and columns orientation) for k closest to 1, i.e. the least crop / scale-to-fit. */
function smartLayout(aspects, CW, CH, tries = 1) {
  const n = aspects.length;
  if (n === 0) return null;
  if (n === 1) {
    const k = (CW / CH) / aspects[0];
    return { tree: 1, order: [0], loss: 1 - Math.exp(-Math.abs(Math.log(k))) };
  }
  let best = null;
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const ident = Array.from({ length: n }, (_, i) => i);
  for (const orient of ['rows', 'cols']) {
    const A = orient === 'rows' ? aspects : aspects.map(a => 1 / a);
    const R = orient === 'rows' ? CW / CH : CH / CW; // frame width when frame height is 1
    const orders = [ident.slice(), ident.slice().sort((a, b) => A[b] - A[a]), ident.slice().sort((a, b) => A[a] - A[b])];
    const nRand = (n <= 11 ? 150 : 60) * tries;
    for (let i = 0; i < nRand; i++) orders.push(shuffle(ident.slice()));
    orders.forEach((ord, oi) => {
      const evalCuts = lens => {
        let T = 0, p = 0, sum = 0, sq = 0;
        for (const len of lens) {
          let S = 0; for (let j = 0; j < len; j++) S += A[ord[p + j]];
          const rowH = R / S; T += rowH;
          for (let j = 0; j < len; j++) { const la = Math.log(A[ord[p + j]] * rowH * rowH); sum += la; sq += la * la; }
          p += len;
        }
        const spread = Math.sqrt(Math.max(0, sq / n - (sum / n) ** 2)); // uneven cell sizes look bad
        const cost = Math.abs(Math.log(T)) + 0.15 * spread + (oi === 0 ? 0 : 0.004) + (orient === 'cols' ? 0.002 : 0);
        if (!best || cost < best.cost) best = { cost, lens: lens.slice(), ord, orient, A, T };
      };
      if (n <= 11) {
        for (let mask = 0; mask < 1 << (n - 1); mask++) {
          const lens = []; let run = 1;
          for (let b = 0; b < n - 1; b++) { if (mask >> b & 1) { lens.push(run); run = 1; } else run++; }
          lens.push(run);
          evalCuts(lens);
        }
      } else {
        const maxLen = Math.max(2, Math.ceil(2 * Math.sqrt(n)));
        for (let t = 0; t < 1500 * tries; t++) {
          const lens = []; let left = n;
          while (left > 0) { const l = Math.min(left, 1 + Math.floor(Math.random() * maxLen)); lens.push(l); left -= l; }
          evalCuts(lens);
        }
      }
    });
  }
  const { lens, ord, orient, A } = best;
  const outer = orient === 'rows' ? v : h, inner = orient === 'rows' ? h : v;
  let p = 0;
  const groups = lens.map(len => {
    const idx = ord.slice(p, p + len); p += len;
    const S = idx.reduce((s, i) => s + A[i], 0);
    return [1 / S, inner(...idx.map(i => [A[i], 1]))];
  });
  return { tree: outer(...groups), order: ord, loss: 1 - Math.exp(-Math.abs(Math.log(best.T))) };
}
