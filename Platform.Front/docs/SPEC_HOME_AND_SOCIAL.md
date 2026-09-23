# Spec — Home and social

Theme and home foundation; friends / DMs / events pages wired once routes are opened.

## A1 — Nebular “energy” theme

- [x] Cosmic base + CSS token overrides (deep surfaces, cyan accent)
- [x] Orbitron for display titles only; readable body stack
- [x] Motion: hero fade, game-tile hover lift, stagger-friendly section enter
- [x] `--game-accent` CSS variable for remotes to override per game

## A2 — Media home

- [x] Full-bleed hero video with brand + CTA overlay
- [x] Game tiles from catalogue (`Title` / `Picture` / `UrlValue`)
- [x] Placeholder rails for upcoming site events and hot LFG

## A3 — Seed labels

- [x] `GameTypes.Entitled` → `MMORPG` (display)
- [x] `Games.Title` already `World Of Warcraft`

## A4 — Friends UI

- [x] Route `/social/friends` (auth)
- [x] List pending / accepted / blocked from `Friends` + statuses
- [x] Accept / refuse / block actions
- [x] Header shortcut when logged in → replaced by messenger dock bubble
- [x] Consumer scopes List/Update to the authenticated caller

## A5 — Direct messages UI

- [x] Route `/social/messages` (auth)
- [x] Two-column layout (`nb-chat` + conversation list)
- [x] Facebook-style messenger dock (bubble + right panel: chats / contacts)
- [x] Backed by `Messages` (1:1)
- [x] Realtime push via SignalR (`/hubs/messenger`) after Create

## A6 — Site events UI

- [x] Route `/events` list + `/events/:publicId` detail
- [x] RSVP via `EventsUsersInterest` (`interested` / `going` / `declined`)
- [x] Home rail consumes public `Events` list

## Gateway resources

Open on microservice `platform`:

| Resource | Public actions | Private actions |
|----------|----------------|-----------------|
| Events | List, Get | Create, Update, Delete |
| Friends | — | List, Get, Create, Update |
| Messages | — | List, Get, Create |
| EventsUsersInterests | — | List, Get, Create, Update |
| Posts | List (author wall) | Create, Update, Delete |
| Notifications | — | List, Update (mark read) |

## Out of scope

Game posts, LFG board, guild moderation, in-game events — game remotes. Site staff AuthZ / sanctions — spec Staff and sanctions.
