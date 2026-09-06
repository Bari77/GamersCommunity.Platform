# Social schema gaps — Post / LfgAd / Notification

Ownership split locked in [PRODUCT_VISION.md](../../Platform.Front/docs/PRODUCT_VISION.md).

## Platform

| Entity | Role |
|--------|------|
| `Post` | Profile wall post (`IdAuthor` → User). Optional `MediaUrl` / `MediaKind` (`image` \| `video` \| `link`). |
| `PostStatus` | Catalog: `draft`, `published`, `hidden`. |
| `Notification` | Inbox row for a user (`Kind`, `Title`, `Body`, `LinkUrl`, `IsRead`, `PayloadJson`). |

Kinds (convention): `friend_request`, `message`, `event_rsvp`, `content_approval`, `guild_request`, `lfg`.

## World of Warcraft (game microservice)

| Entity | Role |
|--------|------|
| `LfgAd` | Looking-for-group/guild/team ad (`IdPlayer`, optional `IdGuild`, `Kind`, TTL via `ExpiresAt`). |
| `GamePost` | Hub feed (`IdGuild` null) or guild wall post; moderation via `IdStatus` → `GamePostStatus`. |
| `GamePostStatus` | `pending`, `approved`, `rejected`. |
| `EventParticipantStatus` | Formalizes `EventParticipant.IdStatus`: `registered`, `confirmed`, `declined`, `waitlist`. |

LFG + game/guild posts stay in the game DB so each remote can evolve fields (server, direction, roster) without Platform schema churn.
