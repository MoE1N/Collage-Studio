# Collage Studio: contributor and agent guide

A single-page photo collage maker that runs entirely in the browser. No backend, no build step, no uploads. Photos stay on the user's device.

## Run it

Serve the folder over HTTP (opening `index.html` via `file://` works only partly, and the service worker needs http):

```bash
python3 -m http.server 5173
```

Then open http://localhost:5173. There is no package manager, bundler, transpiler or test runner. Syntax check with:

```bash
node --check js/app.js && node --check js/data.js
```

## Layout of the repo

| Path | Purpose |
| --- | --- |
| `index.html` | App shell: top bar, left tabs (Photos, Layout, Style, Extras), stage, inspector, export dialog, hidden file inputs |
| `css/style.css` | All styles. Light/dark theme variables, desktop grid, tablet rule at 1100px, phone rules at 760px |
| `js/data.js` | Data and pure logic: layout DSL, templates, aspect presets, colors, filters, fonts, stickers, and the `smartLayout` auto-fit solver |
| `js/app.js` | Everything else: state, drawing, Konva scene, interactions, inspector, panels, export, init |
| `vendor/` | Vendored Konva 9.3.22 and jsPDF 2.5.2 (no CDN, works offline) |
| `sw.js`, `manifest.webmanifest`, `icon.svg` | PWA: installable and offline (network first, cache fallback) |
| `.claude/launch.json` | Dev server config for the Claude preview pane (port 5173) |

Scripts are classic (non-module) files, so top-level functions and constants are globals. Load order is Konva, jsPDF, `data.js`, `app.js`.

## Architecture in brief

**State.** One `state` object (canvas size, bg, gap/pad/radius, border, shadow, `mode`, `layoutId`, `smartTree`, `autoLayout`, `cells[]`, `items[]`). Photos live outside it in a `photos` Map (id to `{blob, prev, hi, w, h, thumb}`) plus `photoOrder`. Cells and items reference photos by `photoId`.

**Crop model.** `newCrop(photoId)` gives `{zoom, ox, oy, rot, flip, fit, f:{filters}}`. `drawCrop` does cover-fit (or contain when `fit`), pan, quarter turns, flip and filters. `panLimit`/`clampPan` keep the photo covering the cell.

**Memory model.** Only a 1600px preview (`p.prev`) stays in memory. Full resolution is decoded on demand at export (`loadHi`, `exportNeeds`, capped at 5000px per photo) into `p.hi` and released right after. Do not store full-size bitmaps.

**Layouts.** Templates are split trees built with `h(...)` and `v(...)` in `data.js`, with optional weights `[weight, node]`. `leaves()` flattens a tree to normalized rects, and `cellRects()` applies gap and margin. Manual templates exist for 1 to 16 cells (`TEMPLATES[n]`, `T_BY_ID`).
- **Auto-fit:** `smartLayout(aspects, W, H, tries)` searches photo orderings and row/column partitions for the layout with the least crop. Its result is stored as `layoutId: 'smart'` with `smartTree`.
- **Resizable cells:** dragging a divider edits weights in a normalized copy of the tree (`ensureEditable`, `dividers`, `startDivider`) and turns `autoLayout` off.
- **Removal:** `removePhoto` re-fits in auto mode. In manual mode `removeCell` re-picks the best template for the new count (`bestTemplate`, `rebuildForCount`).

**Rendering.** Konva stage with layers `bgLayer`, `cellLayer`, `itemLayer`, `uiLayer`, `trLayer`. Cells and image items are custom `Konva.Shape`s using `sceneFunc` with plain canvas 2D calls. Stage scale equals the view scale. Selection UI (outlines, swap handle, divider highlight) is redrawn in `drawUi`.

**Interaction.** Raw pointer events on the stage container (`cont`) with `stage.getIntersection`. Drags use the `track(mv, up)` helper, which also handles `pointercancel`. Touch adds a larger divider hit area and two-finger pinch zoom.

**History and persistence.** `commit()` pushes JSON snapshots of `{s: state, o: photoOrder}`. Call it after every user-visible change, once per gesture (not per pointer move). `undo`/`redo` restore snapshots. Removed photos stay in `photos` so undo can bring them back. Autosave writes to IndexedDB (`collage-studio`, key `session`) with a debounce and on page hide. Projects save and open as JSON with photos as data URLs (`sanitizeState` validates on load).

**Export.** `renderToCanvas` renders serially (a promise chain), temporarily sets the stage to logical size with scale 1, hides UI layers, and calls `stage.toCanvas({pixelRatio})`. `makeBlob` encodes PNG, JPG, WebP or PDF. `getBlob` caches the last result so Download, Share and Copy are instant. Limits: `maxMult()` caps area (16MP on iOS, 67MP elsewhere).

**Mobile.** Below 760px the side panes and inspector become bottom sheets over a fixed tab bar. `body[data-sheet="open"]` and `body.has-sel` drive which sheet shows, and `isMobile()` gates the JS behavior.

## Conventions

- Vanilla JS, no dependencies beyond the vendored libraries. Keep it that way unless there is a strong reason.
- Match the surrounding style: compact code, few comments, comments explain why.
- User-provided strings (file names, text) must go through `esc()` before entering `innerHTML`.
- Never use the em dash character in code, comments, docs or commit messages. Use commas, colons, parentheses or separate sentences.
- New UI must work in light and dark themes and at phone width.
- Any state change that should be undoable needs `commit()`. Anything that changes cell count or order in auto mode should go through `runSmart()`.

## Testing

There is no automated suite. Test manually in the browser, and for logic, from the console:

- `window.__collage` exposes `state`, `photos`, `runSmart` and `addFiles`.
- Because scripts are global, you can call `makeBlob`, `dividers()`, `select`, `removePhoto`, `undo` and others directly.
- Use "Try sample photos" to load seven photos of mixed aspect ratios.
- Clear stale data when testing code changes: run `indexedDB.deleteDatabase('collage-studio')` and unregister the service worker (or hard refresh), otherwise an old session is restored.

Checklist for a change: add photos (mixed sizes, 30+), remove and undo, replace via tray and upload, drag dividers, freeform mode, export every format at 1x and 4x, save and reopen a project, dark mode, and a phone-width viewport.

## Known limits and ideas

- Safari has no `ctx.filter`: a slower pixel-loop fallback handles brightness, contrast, saturation, gray and sepia, but not blur or hue rotation.
- Auto-fit places at most 30 photos (`MAX_CELLS`). Manual templates go to 16 cells.
- HEIC and other formats the browser cannot decode are skipped with a message.
- Not yet verified on real iOS Safari: share sheet, clipboard image copy, and canvas memory limits.
- Ideas: per-cell pinch and rotate gestures in freeform, more templates, text along shapes, batch filter presets, keyboard shortcut sheet, automated tests (Playwright) for the interaction flows.
