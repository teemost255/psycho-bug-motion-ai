# Psycho Bug AI

A dark, creepy‑crawly landing page and interactive front‑end demo for **Psycho Bug AI**, a concept AI video and image studio.

> **Live with Pollinations, $0 to run.** Press **Pollinations Connect** in the Hatchery, sign in with GitHub and approve a small budget. Generations are billed to the visitor's own Pollinations balance; this repo holds no keys and needs no backend. Without a connection the page falls back to its simulated preview.

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
- `live.js` — Pollinations Connect + real generation
- `assets/` — logo, hero and gallery images (AI‑generated, original)

## Live generation (live.js)
Uses [Pollinations Pay (BYOP)](https://github.com/pollinations/pollinations/blob/main/BRING_YOUR_OWN_POLLEN.md): an OAuth + PKCE "Connect" button that gives the browser a scoped key from the visitor's own account.

| Psycho Bug model | Pollinations model |
| --- | --- |
| Chrysalis 2 (image) | black-forest-labs/flux.1-schnell |
| Chrysalis 2 Ultra (image) | tongyi-mai/z-image-turbo |
| Mandible 3 Turbo (video) | alibaba/wan-2.2-fast |
| Mandible 3 (video) | prunaai/p-video |
| Hivemind Omni (video) | bytedance/seedance-1-pro-fast |

- **Images** work on free Quest Pollen (earn it at enter.pollinations.ai, no card).
- **Video** models are paid-only on Pollinations. With no paid balance, video jobs return a real AI keyframe with a motion effect, labelled as such.
- Presets add style/motion directions to the prompt. Reference uploads are not sent to the model yet.

The Connect flow needs a real URL (it redirects back to the page): run it on `localhost` or host it (GitHub Pages on a public repo, Netlify, Cloudflare Pages).

© 2026 Psycho Bug AI
