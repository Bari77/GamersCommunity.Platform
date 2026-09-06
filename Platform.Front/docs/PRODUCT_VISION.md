# GamersCommunity — product vision (locked)

Validated architecture for the multi-game social platform.

## Positioning

Facebook-like community for gamers: one Platform identity, game-specific sheets/guilds/LFG/media in each Native Federation remote. No external game APIs at launch — players enter sheet data manually.

## Dual-layer architecture

| Layer | Owns |
|-------|------|
| **Platform.Front (shell)** | Home feed, profile wall, friends, 1:1 DMs and group chats, site-wide events (IRL / cross-game), game catalogue |
| **Game remotes** (e.g. WoW) | Game hub, player sheet, characters, guilds/teams, LFG, moderated guild wall, in-game events |

Platform `UserGroupRole.IdGroup` references a group id owned by the game microservice. Guilds are not duplicated in Platform.

## Content ownership

| Content | Home |
|---------|------|
| Profile wall posts | Platform |
| Notifications | Platform |
| Hub / guild posts + LFG ads | Game microservice |
| Site events + RSVP | Platform |
| In-game events + character signup | Game microservice |

## Roadmap waves

| Wave | Focus |
|------|--------|
| **A** | Nebular energy theme, media home, friends / DMs / Platform events UI |
| **E** | Site AuthZ, staff moderation, mute / ban, reports, rank management |
| **B** | WoW player sheet + characters + profile media |
| **C** | Guilds, moderated wall, LFG board + DM deep-link |
| **D** | In-game events, notification center, share/SEO polish |

## Display vs technical keys

- **Display**: `Game.Title`, human `Entitled` labels shown raw in the UI
- **Technical**: `UrlValue`, `Picture`, stable catalog codes used as routes/assets/i18n keys
