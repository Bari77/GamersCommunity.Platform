# Platform — EF Core Code First

The SQL Server schema is managed by **EF Core migrations** from models in `Models/` and configuration in `GamersCommunityDbContext`.

Reference / AuthZ catalog data lives under `Seed/`: one **class per table** inheriting `ReferenceTableSeed` / `KeyTableSeed`. Classes are **auto-discovered** (no manual list). Override `Order` when FK dependencies require a sequence (e.g. GameTypes → Games → GameRoles). Applied at **runtime** after `MigrateAsync`.

**Display labels** shown raw in the UI (`Game.Title`, human `GameType.Entitled`, …) use readable casing (e.g. `World Of Warcraft`, `MMORPG`).

**Technical keys** used as routes, asset slugs, or i18n suffixes (`UrlValue`, `Picture`, status codes such as `pending` / `going`) stay **lowercase** snake_case or kebab-case.

## Workflow

### New migration (after a **schema** change only)

```powershell
cd Platform.Database
./Add-Migration.ps1 -Name MigrationName
```

Do **not** put seed rows in migrations (`HasData` / `InsertData`).

### Apply migrations + seed

Automatic on consumer startup (`Platform.Consumer`): `MigrateAsync` then `ReferenceDataSeed.EnsureAsync`.

Manual migrate only:

```powershell
dotnet ef database update `
  --project Platform.Database/Platform.Database.csproj `
  --startup-project Platform.Consumer/Platform.Consumer.csproj
```

## Change the model

1. Edit or add an entity under `Models/`
2. Adjust fluent config (`GamersCommunityDbContext` / `.AuthZ.cs`) if needed
3. Create a migration with `Add-Migration.ps1` for schema diffs
4. Add a `Seed/<Table>Seed.cs` class (auto-discovered; set `Order` if FK-dependent) — no migration

## AuthZ

Site / game / group roles are part of this database (not Authentik). Seeded catalogs:

- `SiteRoles`: admin, moderator, member
- `GroupRoles`: owner, admin, moderator, member
- `GameRoles`: per game (WoW: admin, moderator, member)

Assignment tables (`UserSiteRoles`, `UserGameRoles`, `UserGroupRoles`) are empty at seed time.

## Public identifiers (API / URLs)

Do **not** expose sequential `int` primary keys in public URLs for user-owned or enumerable resources (`User`, events, etc.).

**Retained model:** keep `int Id` as the internal PK (joins, `IKeyTable`, AuthZ FKs, catalog seeds), except **`Message`**, whose primary key is `PublicId` (`uniqueidentifier`) to avoid the 2.1B identity ceiling. `Messages` uses a nonclustered PK on `PublicId` and a clustered index on `(CreationDate, PublicId)`.

**`PublicId`** on other user-owned entities stays a unique `NEWSEQUENTIALID()` alongside `int Id`. Index unique via `PublicIdConvention` (skipped when `PublicId` is already the PK). Routes and DTOs should use `PublicId`; authorization still required (obscurity is not access control).

Catalog / reference tables (game types, roles, statuses, …) stay on stable `int` ids.

Entities with `PublicId`: `User`, `Event`, `Message`, `Friend`, `Banned`, `EventsUsersInterest`, `Post`, `Notification`. Migration: `AddPublicId` (+ later social migrations).
