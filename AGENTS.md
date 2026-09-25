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

### Consumer bus scan

- Scrutor skips `[BusInternal]` (e.g. Cities, FriendStatuses, EventsUsersStatuses).
- Every other scannable CRUD service needs a Gateway route or a documented bus-only exception (`Gateway/docs/ROUTING.md`).
