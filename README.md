# 3d-html

A browser-based 3D voxel quiz and editor. The app runs as a static site, stores data in
the browser, and lets players answer object-recognition questions from custom voxel
objects and level packs.

## What is inside

- 3D voxel renderer with drag rotation and auto-rotation.
- Object editor for creating reusable voxel shapes.
- Level editor for grouping questions and answer options.
- Game mode with scoring, timer, skip behavior, and result summary.
- Local JSON import/export for moving content between browsers.
- English and Chinese UI text through a lightweight translation service.

## Project structure

```text
.
|-- index.html
|-- package.json
|-- vercel.json
|-- docs/
|   |-- architecture.md
|   `-- deployment.md
|-- scripts/
|   |-- check-syntax.mjs
|   `-- serve.mjs
`-- src/
    |-- app/
    |-- domain/
    |-- features/
    |-- render/
    |-- services/
    |-- shared/
    `-- styles/
```

Read `docs/architecture.md` for module ownership and change guidelines.

## Local development

```bash
npm run serve
```

Open `http://127.0.0.1:4173`.

## Checks

```bash
npm run check
```

The check script runs Node syntax validation across `src` and `scripts`.

## Deployment

The project is ready for static hosting. `vercel.json` keeps clean URLs enabled and
prevents stale cache issues for source modules. See `docs/deployment.md` for the
recommended GitHub and Vercel flow.
