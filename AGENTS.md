# Agent guidelines — Platform

Technical rules for AI agents working in GamersCommunity.Platform.

## Never start servers

Do **not** run `dotnet run`, `npm start`, `ng serve`, or long-lived app processes. The developer owns terminals. One-shot builds/tests are OK when useful.

## Database (`Platform.Database`)

- Generate EF migrations **only** with `Platform.Database/Add-Migration.ps1`. Never hand-write migration classes.
- Seeds: class-based reference data under `Seed/`, same pattern as game databases. Do not embed seed rows in migrations.

```powershell
cd Platform.Database
./Add-Migration.ps1 -Name MeaningfulName
```

## Front (`Platform.Front`)

- Design: Nebular (or close). Reusable UI must live in **DevKit** packages when it can serve other fronts.
- Specs / architecture docs: clear Markdown under docs folders with meaningful names. Feature milestones use descriptive titles, not bare letters.
- i18n: English by default; `$localize` / `i18n`; no hardcoded user-facing strings.
- `package.json`: never point at a local `dist` / `file:` path for `@bari77/*` (or similar). Publish and consume from the registry.
- User-facing profile-like surfaces that are meant to be customizable follow the same workspace/grid approach as game player/guild/team sheets when applicable.
- Never add `postinstall` (or similar) hacks that rewrite dependency `package.json` or patch `node_modules`.

## Shared pillars

Prefer putting truly shared infrastructure in **GamersCommunity.Core** or DevKit rather than forking copies across Platform and games.

## Commits / push

Only when the developer explicitly asks.
