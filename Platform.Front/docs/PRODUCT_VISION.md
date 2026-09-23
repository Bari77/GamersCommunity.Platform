# Platform — product vision (locked)

Facebook-like community for gamers: one identity, a site-wide social layer, and a catalogue of game remotes loaded by Native Federation. No external game APIs at launch — players enter sheet data manually.

## This layer owns

Home feed, profile wall, friends, 1:1 DMs and group chats, site-wide events (IRL / cross-game), game catalogue, notifications, site AuthZ and sanctions.

Game remotes own their hub, player sheet, organisations, LFG, moderated org wall, and in-game events. `UserGroupRole.IdGroup` references a group id owned by the game remote. Those groups are not duplicated here.

## Content

| Content | Owner |
|---------|-------|
| Profile wall posts | Platform |
| Notifications | Platform |
| Site events + RSVP | Platform |
| Hub / org posts + LFG ads | Game remote |
| In-game events + signup | Game remote |

## Specs

| Spec | Focus |
|------|--------|
| Home and social | Energy theme, media home, friends, DMs, site events |
| Staff and sanctions | Site AuthZ, staff moderation, mute / ban, reports, ranks |

## Display vs technical keys

- **Display**: `Game.Title`, human `Entitled` labels shown raw in the UI
- **Technical**: `UrlValue`, `Picture`, stable catalog codes used as routes/assets/i18n keys
