# SatQuery AI

Vision-language assistant for natural-language querying of satellite / remote-sensing imagery.
Prototype build for SIH — Problem Statement SIH26167.

## Structure

- `index.html` — page markup
- `style.css` — all styling
- `script.js` — application logic

## Pipeline

1. **Local pixel-composition analysis** — classical CV (no ML), computed client-side, estimates vegetation / water / built-up % from image RGB distribution.
2. **Query classification / routing** — keyword-based intent detection (Disaster, Change Detection, Vegetation Health, Land Cover, General).
3. **Category-specific prompt construction** — tailors the instruction sent to the model based on detected category, plus the local composition data as grounding context.
4. **Vision-language reasoning** — currently powered by the Gemini Vision API (`gemini-3.6-flash`) for rapid prototype validation.
5. **Structured response parsing** — parses the model's fixed-format output (SUMMARY / OBSERVATIONS / CONFIDENCE / FOLLOWUP) into a report-card UI.

## Running locally

Just open `index.html` in a browser — no build step required. On first use, you'll be prompted to add a free Gemini API key (from [aistudio.google.com/apikey](https://aistudio.google.com/apikey)), which is stored only in your browser's `localStorage`.

## Roadmap

- **Phase 1 (current):** hybrid prototype — custom pixel-analysis, routing, and prompting logic + Gemini as the underlying VLM.
- **Phase 2:** replace Gemini with a domain-fine-tuned remote sensing model (GeoChat/LLaVA-based, LoRA fine-tuned) trained on ISRO datasets (Bhuvan/VEDAS, Chandrayaan-2 OHRC/TMC/IIRS imagery).
- **Phase 3:** backend API, auth, and integration with ISRO data portals for institutional deployment.
