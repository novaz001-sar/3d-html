# Architecture

This project is a static browser app. The entry files stay small, while domain rules,
rendering, feature screens, persistence, and styles are split into focused modules.

## Runtime flow

1. `index.html` loads `src/main.js`.
2. `src/main.js` creates the app from `src/app/app.js`.
3. `src/app` owns application state, routing, shell rendering, and the home screen.
4. `src/features/editor` owns level and object authoring workflows.
5. `src/features/game` owns quiz gameplay, timers, scoring, and results.
6. `src/render` owns canvas setup, projection, rotation, interaction, and voxel drawing.
7. `src/services` owns browser storage, import/export, and translations.
8. `src/domain` owns pure question and scoring rules.

## Folder responsibilities

| Path | Responsibility |
| --- | --- |
| `src/app` | App composition, state bootstrap, routing, home view, and shell layout. |
| `src/domain` | Pure business rules that should not touch the DOM or canvas directly. |
| `src/features/editor` | Editor views and interaction binding. |
| `src/features/game` | Game views, session lifecycle, scoring application, and timer behavior. |
| `src/render` | 3D math, canvas lifecycle, voxel rendering, and pointer interactions. |
| `src/services` | Persistence, language lookup, JSON import/export. |
| `src/shared` | Small reusable utilities. |
| `src/styles` | CSS entrypoint plus themed component and screen-level styles. |
| `scripts` | Local maintenance scripts. |
| `docs` | Architecture and deployment notes. |

## Change guidelines

- Put pure rules in `src/domain` before wiring them into a screen.
- Put browser APIs such as `localStorage`, downloads, and file reads in `src/services`.
- Keep feature folders responsible for user interactions, not low-level rendering math.
- Keep `src/render` independent from editor/game UI markup so canvas code can be reused.
- Add new CSS through `src/styles/app.css` imports instead of expanding one large stylesheet.
