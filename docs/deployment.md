# Deployment

The app is deployed as a static site from the repository root.

## Local commands

```bash
npm run check
npm run serve
```

`npm run check` verifies JavaScript syntax across `src` and `scripts`.
`npm run serve` starts a small static server at `http://127.0.0.1:4173`.

## GitHub flow

1. Make changes on a feature branch.
2. Open or update a pull request into `main`.
3. GitHub Actions runs the syntax check on pull requests and pushes to `main`.
4. Merge the pull request after the branch is ready.

## Vercel flow

The repository is configured for static deployment with `vercel.json`.
When `main` changes, the connected Vercel project should redeploy the latest static files.

Recommended Vercel settings:

- Framework preset: `Other`
- Build command: empty
- Output directory: `.`
- Install command: empty or `npm install`
