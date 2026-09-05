# GamersCommunity Front — Angular i18n (JSON)

## Source language

**English (`en-US`) is the only language in source code** (templates, `$localize` default text, comments).

- Do **not** put French (or any other locale) in HTML/TS sources.
- French (and other locales) live only in translation files under `src/locale/` (e.g. `source.fr.json`), filled later.
- `angular.json` → `i18n.sourceLocale: "en-US"`.

Game remotes (e.g. WorldOfWarcraft.Front) own their own i18n catalogs with a scoped key prefix (`wow.*`). The shell does not ship remote strings.

## Marking text

### HTML

```html
<h1 i18n="@@users.login.title">Log in to your account</h1>
```

### TypeScript

```ts
const message = $localize`:@@users.error.invalidCredentials:Invalid email or password.`;
```

Always use stable custom IDs: `@@feature.section.key`.

## Extracting the English catalog

```bash
npm run i18n
```

Writes / updates `src/locale/source.json` (English reference catalog).

## Adding a locale later (e.g. French)

1. Start from `source.json` (or keep evolving `source.fr.json`).
2. Translate values only — keep the same keys.
3. Register the file under `angular.json` → `i18n.locales` (already done for `fr`).

Until French is ready, develop and run against the **source locale** (`en-US`). The existing `source.fr.json` may lag behind; refresh it when starting the FR effort.

## Dynamic keys from database seeds

Reference / catalog rows store **lowercase snake_case** codes (`Entitled`, `Title`, `Code`, `Name`, …) so the front can build i18n IDs:

| Domain | Pattern | Example seed value | Full key |
| --- | --- | --- | --- |
| Shell game title | `games.` + title | `world_of_warcraft` | `games.world_of_warcraft` |
| Friend status | `friends.status.` + entitled | `pending` | `friends.status.pending` |
| WoW class (remote) | `wow.class.` + entitled | `demon_hunter` | `wow.class.demon_hunter` |

Use `$localize` with a computed message ID only when the ID is known at build time; for truly dynamic catalogs, prefer a small map of `$localize` entries or a dedicated translation helper keyed by seed code. Never rely on uppercase DB codes.

## Key naming

| Type | Pattern | Example |
| --- | --- | --- |
| Feature / page | `feature.section.key` | `users.login.title` |
| Layout | `core.header.*` | `core.header.games` |
| Errors | `error.*` | `error.httpCode.notFound` |

## Folder layout

```
src/locale/
  source.json       # extracted EN catalog (reference)
  source.fr.json    # French translations (deferred / incomplete OK)
```

## angular.json (reference)

```json
"i18n": {
  "sourceLocale": "en-US",
  "locales": {
    "fr": {
      "translation": "src/locale/source.fr.json"
    }
  }
}
```

## Summary

| Step | Action |
| --- | --- |
| Write UI copy | English only in source |
| Mark strings | `i18n="@@…"` / `$localize` |
| Extract | `npm run i18n` → `source.json` |
| Translate later | Edit `source.fr.json` (etc.) |
