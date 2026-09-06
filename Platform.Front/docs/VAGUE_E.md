# Vague E — AuthZ staff + sanctions

Site-wide moderation for Platform. Identity stays in Authentik; **authorization lives in Platform** (`UserSiteRole` / `UserGameRole`). Guild / LFG moderation stays in later game waves.

Locked decisions:

- Mute does **not** block DMs or profile-wall posts. It blocks future public recruitment (enforced in Vague C when LFG ships).
- Player reports are in this wave (E7): staff need an intake queue before bans.

## E1 — AuthZ source of truth

- [ ] `Users.Load` / `Touch` return `siteRoles` + `gameRoles[{ gameUrlValue, code }]`
- [ ] Consumer helper `RequireSiteRole("admin" | "moderator")` (admin implies moderator)
- [ ] Signup assigns site role `member`
- [ ] Bootstrap first admin (`AuthZ:BootstrapAdminKeycloakId` or targeted seed)
- [ ] Front `PermissionsService` + route guard `/moderation` from Platform payload (not JWT realm roles)
- [ ] Active **ban** also blocks Messages / Posts / Friends, not only `Users.Load`

## E2 — Sanctions (extend `Banned`)

Reuse `Banned` (`BeginDate`, `EndDate`, `Entitled`, `IdModo`, `IdUserBan`). Add:

- [ ] `Kind`: `mute` | `ban`
- [ ] `EndDate` nullable — `null` = permanent (ban only)
- [ ] `RevokedAt` to lift a sanction without deleting history
- [ ] Mute: moderator + admin, duration required
- [ ] Ban: admin only, temporary or permanent

## E3 — Staff user directory

- [ ] Private action `Users.StaffList` (do not reuse public `Search`)
- [ ] Pagination via `PublicId` / date
- [ ] Filters: nick `#discr`, site role, active sanction (`none` / `muted` / `banned`), last connection
- [ ] UI `/moderation/users` + `/moderation/users/:publicId` (sanctions + roles)
- [ ] Row actions follow caller role (mute vs ban vs ranks)

## E4 — Mute, player-facing

- [ ] Shell banner: muted by a moderator, reason, remaining time
- [ ] Notification `Kind = sanction`
- [ ] Persist + display only this wave; LFG create/update enforcement in Vague C

## E5 — Admin bans

- [ ] From staff profile or a report: temporary (`EndDate`) or permanent (`EndDate` null)
- [ ] Banned account: `Users.Load` → `BANNED` + session cut
- [ ] Lift ban = set `RevokedAt`

## E6 — Ranks (admin only)

- [ ] Assign / remove `UserSiteRole` (one site role: `member` | `moderator` | `admin`)
- [ ] Assign / remove `UserGameRole` per game (WoW admin / moderator / member)
- [ ] Guardrails: cannot sanction self; moderator cannot sanction an admin; cannot remove the last admin
- [ ] Nebular ACL codes (`admin`, `moderator`, `admin_wow`, `moderator_wow`) map to these DB roles

## E7 — Reports

- [ ] `Reports`: reporter, target user, reason, status (`open` / `actioned` / `dismissed`), optional link (profile / whisper)
- [ ] “Report” on public profile (DM entry later)
- [ ] Queue `/moderation/reports` → mute or ban

## Site permission matrix

| Action | Site moderator | Site admin |
|--------|----------------|------------|
| Access `/moderation` | yes | yes |
| Paginated user list + filters | yes | yes |
| Handle a report | yes | yes |
| Mute + lift mute | yes | yes |
| Ban / unban | no | yes |
| Promote / demote site roles | no | yes |
| Per-game roles | no | yes |

## Gateway resources (Vague E)

Staff checks run in the Consumer (Gateway has no role notion today): Private + `RequireSiteRole`.

| Resource | Public | Private (auth) | Staff |
|----------|--------|----------------|-------|
| Users | Load, Search, Get | Update, Touch | StaffList |
| Reports | — | Create | List, Update |
| Sanctions (`Banned`) | — | — | List, Create, Update (revoke) |
| UserSiteRoles / UserGameRoles | — | — | Update (admin) |

## Out of scope for E

- Guild / game-wall moderation — Vague C
- LFG mute enforcement — Vague C (mute row already exists)
- Legacy `Rank` / `Right` / `RankRight` — unused, ignore
- Authentik roles as authorization source — no
