# Social schema gaps — Post / LfgAd / Notification

Ownership split locked in [PRODUCT_VISION.md](../../Platform.Front/docs/PRODUCT_VISION.md).

## Platform

| Entity | Role |
|--------|------|
| `Post` | Profile wall post (`IdAuthor` → User). Optional `MediaUrl` / `MediaKind` (`image` \| `video` \| `link`). |
| `PostStatus` | Catalog: `draft`, `published`, `hidden`. |
| `Notification` | Inbox row for a user (`Kind`, `Title`, `Body`, `LinkUrl`, `IsRead`, `PayloadJson`). |
| `Conversation` | Whisper thread. `Kind` `dm` (exactly two members) or `group` (named, pictured, `IdOwner`). |
| `ConversationMember` | Membership (`JoinedAt` is the history cursor: a new member only sees messages at/after join). `LastReadAt` for unread. |
| `Message` | Belongs to a `Conversation` (`IdConversation` + `IdSender`). No per-row `IsRead` / `IdReceiver`. |

Kinds (convention): `friend_request`, `message`, `event_rsvp`, `content_approval`, `guild_request`, `lfg`.

## World of Warcraft (game microservice)

| Entity | Role |
|--------|------|
| `LfgAd` | Looking-for-group/guild/team ad (`IdPlayer`, optional `IdGuild`, `Kind`, TTL via `ExpiresAt`). |
| `GamePost` | Hub feed (`IdGuild` null) or guild wall post; moderation via `IdStatus` → `GamePostStatus`. |
| `GamePostStatus` | `pending`, `approved`, `rejected`. |
| `EventParticipantStatus` | Formalizes `EventParticipant.IdStatus`: `registered`, `confirmed`, `declined`, `waitlist`. |

LFG + game/guild posts stay in the game DB so each remote can evolve fields (server, direction, roster) without Platform schema churn.
