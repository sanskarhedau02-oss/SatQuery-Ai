# SatQuery AI

Vision-language assistant for querying and comparing satellite imagery — built for **SIH 2026 (PS ID: SIH26167)**, ISRO / Space Technology theme.

## What it does

- **Single Scene & AI Vision Q&A** — upload a satellite image and ask natural-language questions about it (land cover, flooding, vegetation, structures). Answers come from Gemini's vision-language API, constrained to a structured `SUMMARY / OBSERVATIONS / CONFIDENCE / FOLLOWUP` format, with an explicit refusal policy for claims optical imagery can't actually support (e.g. it will decline to confirm individual vehicles/people at 10 m resolution and recommend SAR/sub-meter imagery instead).
- **Before / After Change Triage** — upload two images of the same area at different times and get a pixel-level change mask, change percentage, and a downloadable GeoJSON of changed regions.
- **On-device land-cover breakdown** — a lightweight RGB-threshold heuristic (not a trained model) that estimates vegetation / water / built-up / soil composition instantly, client-side.
- **Offline fallback mode** — if no Gemini API key is configured (or a request fails), the app falls back to a clearly-labeled offline "ground-truth" response so the demo never breaks.

## Running it

No build step — it's a static site.

```bash
# from the project root
python3 -m http.server 8000
# then open http://localhost:8000
```

Or just open `index.html` directly in a browser.

To enable live AI responses, add a Gemini API key via the "Configure / Clear API Key" link in the app (stored client-side only, not committed to this repo).

## Files

| File | Purpose |
|---|---|
| `index.html` | Page structure/markup |
| `style.css` | All styling (dark/light theme via CSS variables) |
| `classifier.js` | On-device RGB-heuristic land-cover classifier |
| `app.js` | Core app logic — image handling, change detection, Gemini API calls, chat UI |

## Known limitations (prototype scope)

- The on-device classifier is a rule-based RGB heuristic, not a trained ML model.
- "Simulated NDVI" is a visual approximation — true NDVI requires a near-infrared band, which RGB JPG/PNG inputs don't have.
- GeoJSON export coordinates are placeholder/demo values, not derived from real image georeferencing.
- Change detection is raw pixel-differencing; it assumes reasonably aligned before/after images and doesn't correct for sun angle, shadows, or atmospheric differences.
- The Gemini API key is used client-side, which is fine for a demo but would need to move behind a backend proxy for production use.
