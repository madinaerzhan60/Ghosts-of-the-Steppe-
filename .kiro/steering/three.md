---
inclusion: always
---

# 3D Rules

## Components
- Use React Three Fiber components, one component per file.

## Performance
- Target 60 FPS on a mid-range laptop.
- Particle budget: max 20,000 points per ghost.
- Provide a "light mode" flag that lowers particle counts and disables glass transmission on weak devices.

## Models
- Format: `.glb` with Draco compression.
- Max 3 MB per model.
- Stored in `public/models`.

## Credits
- Every asset (model, sound, font) must be listed in `CREDITS.md` with its author and license.
- Do not add an asset without its `CREDITS.md` entry.
