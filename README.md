# Psycho Bug AI

A dark, creepy‑crawly landing page and interactive front‑end demo for **Psycho Bug AI**, a concept AI video and image studio.

> **Preview build:** generation is simulated in the browser. Nothing is connected to a real AI model yet.

## What's inside
- **Hero** with a 72‑hour launch countdown
- **The Hatchery**: mock creator with 12 presets, reference upload, prompt, model / duration / aspect / quality pickers, live credit cost and a 150‑credit trial balance, simulated "hatching" progress and a result history with Remix
- **The Hive**: sample gallery with "Use this prompt"
- **Swarm Studios** feature grid, models strip, pricing (monthly/annual toggle) and a final call to action

## Run it
It's a static site. Open `index.html` in a browser, or serve the folder:

```bash
npx serve .
# or
python3 -m http.server 8000
```

## Files
- `index.html` — page markup, styles and all interactive JS
- `hark.css`, `hark-hero.css`, `hark.js` — base styles and helpers
- `assets/` — logo, hero and gallery images (AI‑generated, original)

## Next steps
Wire the Generate button to a real video/image model API using your own API key.

© 2026 Psycho Bug AI
