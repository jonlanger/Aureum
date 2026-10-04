# Aureum Finance — redesign

The Aureum redo: a design system (with data-viz components), a marketing homepage, and a responsive web app (`app/`, phase 2, in progress). The app builds on `assets/`.

Source material lives in `../Aureum Finance/` (original 2024 case study: screens, brand board, personas, DALL·E illustrations).

## Run

```bash
python3 -m http.server 4321
```

Then open http://localhost:4321/ (homepage), http://localhost:4321/design-system.html, and http://localhost:4321/app/ (web app). No build step and no dependencies. Fonts load from Google Fonts.

## Files

| File | What it is |
|---|---|
| `index.html` | Homepage: hero with live phone mock, "two opening moves" coach demo, features bento, insights dashboard with a range filter, how it works, goal simulator, personas, security, CTA |
| `design-system.html` | Living documentation for brand, color, data color, type, tokens, motion, icons, illustration, components, coach patterns, data viz, and chart rules |
| `assets/tokens.css` | Primitive scales → semantic roles (`--a-*`), data-viz palettes (`--viz-*`, `--seq-*`, `--div-*`), type, space, radius, elevation, motion. Light and dark. |
| `assets/components.css` | Base styles and `.a-*` components (buttons, forms, chips, cards, nudge, stat tile, stepper, tab bar, tooltip…) |
| `assets/charts.js` | `AureumViz`: dependency-free SVG charts (line/area/forecast band, columns, cash-flow diverging, stacked bar, donut, sparkline, gauge, ring, heatmap, budget meters) |
| `assets/art.js` | `AureumArt`: logo, 40+ line icons, 11 animated vector illustrations (Sprout the coach + friends) |
| `assets/data.js` | Deterministic demo data (Emily Johnson's story) |

## Web app (`app/`)

Mobile-first: bottom tabs and a FAB on phones, an icon rail on tablets, and a sidebar plus coach rail on desktop. No build step. ES modules plus the shared `assets/`. State is saved in `localStorage` on the device, standing in for a backend.

| File | What it is |
|---|---|
| `app/js/engine.js` | The math: 50/30/20 allocator, emergency-fund ladder, employer match, **Money Map** priority waterfall, monthly allocation, goal math, debt avalanche/snowball simulator, 30-day forecast, safe-to-spend, health score. Every threshold is in `ASSUMPTIONS`. |
| `app/js/rules.js` | 61 coach rules plus the **governor** that picks the few worth showing |
| `app/js/store.js` | State, demo seed (David Lee persona), onboarding → plan, actions |
| `app/js/onboarding.js` | 10-step, one-question-per-screen setup |
| `app/js/app.js` | Router and views: Home, Budget, Plan, Goals (+ detail/new), Debt, Coach, Lessons, Settings |
| `docs/financial-rules.md` | Research, sources, and why we chose ~60 rules instead of 300 |

## Key decisions

- **Brand carried forward:** teal `#008080` (the brand surface), indigo `#1B1B6F` (ink and primary actions), Lora serif, and the twin-tree logo path from `Aureum_Logo.svg`.
- **Numbers are in Plus Jakarta Sans.** Lora is for voice only. Figures need unambiguous numerals.
- **Chart palette is validated, not eyeballed.** Light: worst adjacent CVD ΔE 11.8 and normal-vision ΔE 25.6. Dark: CVD ΔE 13.0. Slots 1–3 pass all-pairs. Slot 5 (gold) is under 3:1 on light, so it always needs a direct label.
- **Every chart** has hover/keyboard tooltips, an sr-only data table, draws in on scroll, respects reduced motion, and swaps theme through tokens.
- **Illustrations** are redrawn as native SVG (no garbled AI text) with a fixed palette and gentle idle loops.
# Aureum
