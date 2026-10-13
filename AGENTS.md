# Agent guidelines — Platform

Shared module: [`AgentKit/`](AgentKit/) → [GamersCommunity.AgentKit](https://github.com/Bari77/GamersCommunity.AgentKit)

- [`AgentKit/AGENTS.base.md`](AgentKit/AGENTS.base.md)
- [`AgentKit/ENGINEERING_STANDARDS.md`](AgentKit/ENGINEERING_STANDARDS.md)
- [`AgentKit/POLICY.md`](AgentKit/POLICY.md)
- Optional: [`AGENTS.override.md`](AGENTS.override.md)

## Repo-specific

### Database

```powershell
cd Platform.Database
./Add-Migration.ps1 -Name MeaningfulName
```

### Front

- Reusable UI → DevKit. Shell profile is **not** required to use a game workspace grid unless product says so.
- Nebular ACL (`nebular.security.ts` / `NbSecurityModule.forRoot`) = **Platform shell resources only**. Do not register per-game `wow_*` / `lol_*` (or future game) accessControl matrices here; remotes own ranks/capabilities (AgentKit ENGINEERING_STANDARDS §5.7). Session role mapping (`toAclRoles`) may keep generic `admin_${slug}` names for shell chrome.

### Consumer bus scan

- Scrutor skips `[BusInternal]` (e.g. Cities, FriendStatuses, EventsUsersStatuses).
- Every other scannable CRUD service needs a Gateway route or a documented bus-only exception (`Gateway/docs/ROUTING.md`).
