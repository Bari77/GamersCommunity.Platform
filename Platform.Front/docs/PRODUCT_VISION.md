# GamersCommunity — product vision (locked)

Validated architecture for the multi-game social platform.

## Positioning

Facebook-like community for gamers: one Platform identity, game-specific sheets/guilds/LFG/media in each Native Federation remote. No external game APIs at launch — players enter sheet data manually.

## Dual-layer architecture

| Layer | Owns |
|-------|------|
| **Platform.Front (shell)** | Home feed, profile wall, friends, 1:1 DMs and group chats, site-wide events (IRL / cross-game), game catalogue |
| **Game remotes** (WoW, LoL, …) | Game hub, player sheet, characters (WoW) or champion+lane (LoL), guilds/teams, LFG, moderated org wall, in-game events |

Platform `UserGroupRole.IdGroup` references a group id owned by the game microservice (guild or team). Those groups are not duplicated in Platform. A LoL player may hold several team badges.

## Content ownership

| Content | Home |
|---------|------|
| Profile wall posts | Platform |
| Notifications | Platform |
| Hub / guild or team posts + LFG ads | Game microservice |
| Site events + RSVP | Platform |
| In-game events + signup (WoW character / LoL player) | Game microservice |

## Roadmap waves

| Wave | Focus |
|------|--------|
| **A** | Nebular energy theme, media home, friends / DMs / Platform events UI |
| **E** | Site AuthZ, staff moderation, mute / ban, reports, rank management |
| **B** | WoW player sheet + characters + profile media |
| **C** | Guilds, moderated wall, LFG board + DM deep-link |
| **D** | In-game events, notification center, share/SEO polish |
| **F** | LoL player sheet + lanes + champions — [tickets](../../../GamersCommunity.Games.LeagueOfLegends/LeagueOfLegends.Front/docs/VAGUE_B.md) |
| **G** | LoL teams (5 + coach + manager, several per player), moderated wall, LFG — [tickets](../../../GamersCommunity.Games.LeagueOfLegends/LeagueOfLegends.Front/docs/VAGUE_C.md) |
| **H** | LoL in-game events, notifs, substitutes — [tickets](../../../GamersCommunity.Games.LeagueOfLegends/LeagueOfLegends.Front/docs/VAGUE_D.md) |

## Display vs technical keys

- **Display**: `Game.Title`, human `Entitled` labels shown raw in the UI
- **Technical**: `UrlValue`, `Picture`, stable catalog codes used as routes/assets/i18n keys
