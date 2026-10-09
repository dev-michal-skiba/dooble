# CLAUDE.md

Dobble (Spot It!) card generator: users upload images in the browser and get a printable A4 PDF of cards. Static site, served at `dobble.michalskiba.dev` (see `CNAME`).

## Commands

- `npm test` — runs `dobble.test.js` and `i18n.test.js` with `node --test` (Node ≥ 18, CI uses 22)
- Run locally: open `index.html` in a browser — no server, build step, or install needed

## Files

- `index.html` — UI, styles, image upload handling, orchestration (inline script)
- `dobble.js` — card generation (finite projective plane), canvas rendering, layout, PDF assembly via jsPDF
- `i18n.js` — Polish/English translations, `t()` / `tn()` helpers, language persistence
- `dobble.test.js`, `i18n.test.js` — Node tests

## Conventions

- Vanilla HTML/CSS/JS only; no framework, no bundler, no npm runtime deps. jsPDF is loaded from CDN.
- Files used by tests end with an `if (typeof module !== 'undefined') module.exports = {...}` guard so they work both as browser globals and in Node.
- **Every user-facing string goes through `t(key, params)`** (or `data-i18n` / `data-i18n-html` / `data-i18n-aria` attributes in HTML) and must be added to **both** `pl` and `en` in `i18n.js` — `i18n.test.js` enforces matching keys and placeholders.
- Countable words use `tn(key, n)` with `|`-separated plural forms (Polish: `one|few|many`, English: `one|other`).
- Polish is the default language. The user's choice is stored in `localStorage['dobble-lang']` (no expiry); storage access is wrapped in try/catch.
- After changing language, dynamic text must be re-rendered (`renderLanguage()` in `index.html` re-runs `updateStats()` and `drawPreview()`).

## Algorithm

For prime `p`: images = cards = `p² + p + 1`, images per card = `p + 1`, every pair of cards shares exactly one image. Valid deck sizes: 7, 13, 31, 57, 133, … The largest deck that fits the uploaded image count is used; extra images are skipped. **57 images (p = 7) is the recommended size** — same as the original game — and the UI nudges users toward it.
