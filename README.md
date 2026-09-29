<div align="center">

<img src="icon.svg" width="88" alt="Collage Studio logo">

# Collage Studio

**A fast, private photo collage maker that runs entirely in your browser.**
No sign-up, no uploads. Available in 24 languages.

![Languages](https://img.shields.io/badge/languages-24-blue?style=for-the-badge)
![Vanilla JS](https://img.shields.io/badge/vanilla-JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Konva](https://img.shields.io/badge/canvas-Konva-0D83CD?style=for-the-badge)
![PWA](https://img.shields.io/badge/PWA-offline%20ready-7c5cff?style=for-the-badge&logo=pwa&logoColor=white)
![Privacy](https://img.shields.io/badge/photos-never%20leave%20your%20device-2ea44f?style=for-the-badge)

<img src="docs/hero.png" alt="Collage Studio editor with a 7 photo grid collage" width="900">

</div>

## Features

| | |
|---|---|
| **Auto-fit layouts** | Add photos and the layout with the least cropping is picked for you. |
| **Grid and Freeform** | Resizable grid cells, or scattered, rotated photos. |
| **Quick styles** | One-click themes: Clean, Airy, Night, Pastel, Film, Sunset, Mosaic, Dots, Blur. |
| **Fine control** | Gap, margin, corner radius, border, shadow, solid, gradient, pattern or blurred backgrounds. |
| **Photo filters** | Vivid, Warm, Cool, B&W, Sepia, Fade, Noir, Dreamy, Vintage. |
| **Text and stickers** | Headings, subtitles, captions and an emoji sticker library. |
| **Social presets** | Instagram, Stories, YouTube, Pinterest, Facebook, 3:2 print, A4 and custom sizes. |
| **High-res export** | PNG, JPG, WebP or PDF at 1x to 4x, plus copy, share and print. |
| **Projects** | Save and reopen your work as a file. Undo and redo included. |
| **Works offline** | Installable as an app, with a service worker cache. |

## Quick start

The page is generated per language by a small static build (no dependencies, runs on [Bun](https://bun.sh)):

```bash
bun run dev      # builds dist/ and serves it on http://localhost:5180
```

Then open <http://localhost:5180> and click **Try sample photos**. Other commands: `bun run build` (just build `dist/`), `bun run check` (strict build, fails on any incomplete locale).

> Serve over `http://localhost` or HTTPS. Opening a page directly with `file://` disables the service worker and PWA install.

## Languages and SEO

Each language is a static page (`/`, `/es/`, `/ar/`, ...) with its own `lang`/`dir`, title, description, canonical URL, `hreflang` alternates, Open Graph tags and JSON-LD (WebApplication and FAQPage). Each language also gets four content pages (how-to, Instagram sizes, print, comparison) generated from the `page.*` locale keys, with HowTo/Article and BreadcrumbList JSON-LD. The build also writes `sitemap.xml`, `robots.txt` (AI crawlers allowed), `llms.txt` and `llms-full.txt`. After each deploy the workflow pings IndexNow (Bing, Yandex, Naver and others). jsPDF is loaded only on the first PDF export. Translations are inlined into each page, so there are no extra requests at runtime. First-time visitors on the English root are redirected to their browser language.

To add or fix a translation, edit `locales/<code>.json` (keys mirror `locales/en.json`) and register new languages in `locales/languages.json`. Validate with `bun scripts/build.mjs --check=<code>`. Deployment to GitHub Pages runs from `.github/workflows/pages.yml` (set Pages source to "GitHub Actions").

## How it works

<table>
<tr>
<td width="50%"><img src="docs/layout.png" alt="Layout tab"><br><b>1. Layout</b><br>Pick a canvas size and a template, or let Auto-fit choose.</td>
<td width="50%"><img src="docs/style.png" alt="Style tab"><br><b>2. Style</b><br>Apply a quick style, then tune spacing, borders and background.</td>
</tr>
<tr>
<td width="50%"><img src="docs/freeform.png" alt="Freeform mode"><br><b>3. Extras</b><br>Switch to Freeform, add text and stickers.</td>
<td width="50%"><img src="docs/export.png" alt="Export dialog"><br><b>4. Export</b><br>Choose format and resolution, then download or share.</td>
</tr>
</table>

## Shortcuts and gestures

| Action | How |
|---|---|
| Reposition a photo in its cell | Drag it |
| Zoom a photo | Scroll over it |
| Resize cells | Drag the lines between them |
| Swap two photos | Use the swap handle on a selected cell |
| Add or reset a photo | Double-click an empty cell or a photo |
| Paste an image | `Cmd/Ctrl + V` |
| Undo / Redo | `Cmd/Ctrl + Z` / `Cmd/Ctrl + Shift + Z` |
| Duplicate / Remove | `Cmd/Ctrl + D` / `Del` |

## Project structure

```
.
├── src/index.template.html  App shell template ({{key}} placeholders)
├── locales/              en.json (source), one JSON per language, languages.json
├── scripts/build.mjs     Static build: renders dist/ per language + SEO files
├── .github/workflows/    Build and deploy to GitHub Pages
├── css/style.css         Styles (light and dark themes)
├── js/
│   ├── i18n.js           Runtime translation helpers (L, Ln, Lh)
│   ├── app.js            Editor logic, rendering, export
│   └── data.js           Templates, aspect presets, themes, filters, fonts, stickers
├── vendor/               Konva (canvas) and jsPDF (PDF export), bundled locally
├── sw.js                 Service worker (network first, cache fallback)
├── manifest.webmanifest  PWA manifest
└── docs/                 README screenshots
```

## Privacy

Everything happens locally in your browser. **No tracking and no data collection.** Photos are read with the browser File API and drawn to a local canvas. Nothing is uploaded, and no analytics or external requests are made. All dependencies are bundled in `vendor/`.

## Built with

[![Konva](https://img.shields.io/badge/Konva-canvas%20engine-0D83CD?style=flat-square)](https://konvajs.org)
[![jsPDF](https://img.shields.io/badge/jsPDF-PDF%20export-e5332a?style=flat-square)](https://github.com/parallax/jsPDF)
