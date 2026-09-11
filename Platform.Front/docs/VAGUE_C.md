# Vague C — Guildes, mur modéré, board LFG

Gouvernance de guilde dans le microservice WoW, mur de guilde modéré par les officiers, board LFG dédié avec filtres, et enforcement serveur du mute Platform promis en Vague E. Les événements in-game et le centre de notifications restent en **Vague D**.

## Décisions verrouillées

- **Clé publique guilde** : `Guild.PublicId` (GUID). Handle affiché = `Entitled#Discriminator`, index unique sur le couple.
- **Rangs de guilde** : `GuildMember.IdGuildRank` est la **seule** source de vérité (`leader` / `officer` / `member`). `Platform.UserGroupRole` reste vide — il sera câblé si Platform doit afficher des badges guilde (Vague D).
- **Appartenance** : `GuildMember` est la seule source de vérité. `Character.IdGuild` (FK legacy dupliquée) est supprimée ; l'affichage de la guilde d'un personnage se projette depuis `GuildMember`.
- **Leader** : `Guild.IdLeader` reste le pointeur canonique (il porte serveur et faction de la fiche) et doit toujours avoir un `GuildMember` de rang `leader` en regard. Les deux sont écrits dans la même transaction.
- **Un personnage, une guilde** : un `Character` ne peut appartenir qu'à une guilde à la fois. Un joueur peut en revanche être dans plusieurs guildes via des personnages différents.
- **Candidatures** : nouvelle table `GuildApplication` (candidat = `Character`, statut `pending` / `accepted` / `rejected` / `withdrawn`). Une seule candidature `pending` par couple (guilde, personnage).
- **Mur modéré** : `GamePost` + `GamePostStatus` (`pending` / `approved` / `rejected`). Leader et officiers publient directement en `approved` ; les membres passent en `pending`. La file de modération est visible par le leader et les officiers uniquement.
- **Pas de deep-link DM.** Le parcours de contact est : annonce LFG guilde → fiche de guilde → liste des membres → clic sur le pseudo → profil Platform `/users/:platformUserPublicId` → demande d'ami → DM dans Whispers. Aucune route DM n'est ajoutée au shell.
- **Mute** : enforcement serveur par **RPC synchrone** WoW → `platform_queue` (action interne `Users.Sanctions`), avec cache mémoire court. Conforme à `IntegrationEventContracts` : les sanctions ne sont **jamais** répliquées dans la base WoW.
- **Client RPC** : implémenté localement dans `WorldOfWarcraft.Consumer/Integration` (le Gateway a déjà le sien). À remonter dans `GamersCommunity.Core` quand un deuxième jeu en aura besoin — pas de release Core dans cette vague.
- **Tables legacy supprimées** : `GuildMessages` (remplacée par `GamePost`) et `GuildRequests` (ancienne forme sans candidat ni statut, remplacée par `GuildApplication`).

## C1 — Gouvernance de guilde

- [x] Migration `GuildGovernance` : `GuildApplication` + `GuildApplicationStatus`, colonnes de modération sur `GamePost`, drop `GuildMessages` / `GuildRequests` / `Character.IdGuild`
- [x] Seed `GuildApplicationStatus` (`pending`, `accepted`, `rejected`, `withdrawn`)
- [x] `Guilds.Search` (public) : recherche par nom, filtres serveur / faction, pagination curseur
- [x] `Guilds.Create` (auth) : personnage fondateur sans guilde, handle unique, `GuildMember` leader créé dans la même transaction
- [x] `Guilds.Update` (auth) : description et liens Discord / forum, leader et officiers
- [x] `Guilds.SetRank` (auth) : leader uniquement, promotion / rétrogradation
- [x] `Guilds.Kick` (auth) : leader et officiers, interdit sur un rang supérieur ou égal
- [x] `Guilds.Leave` (auth) : membre ; le leader doit transférer avant de partir
- [x] `Guilds.TransferLeadership` (auth) : leader uniquement, bascule des deux rangs
- [x] `Guilds.Disband` (auth) : leader uniquement, confirmation par handle
- [x] `Guilds.Get` enrichi : effectif, rang du visiteur, état de sa candidature
- [x] `GuildApplications` : `Create` / `ListMine` / `Withdraw` (candidat), `List` / `Review` (officiers)
- [x] Projections `Characters` et `HomeFeed` rebranchées sur `GuildMember`
- [x] Front : annuaire `/world-of-warcraft/guilds` (recherche, filtres serveur / faction, fondation)
- [x] Front : fiche enrichie (badge de rang, roster avec actions officier / leader, panneau de réglages, candidature)

## C2 — Mur de guilde modéré

- [x] `GamePosts.ListGuildWall` (public) : posts `approved` d'une guilde, pagination curseur
- [x] `GamePosts.Create` (auth) : membre de la guilde ; `approved` si leader / officier, `pending` sinon
- [x] `GamePosts.ListPending` (auth) : file de modération, leader et officiers
- [x] `GamePosts.Moderate` (auth) : `approved` / `rejected` + motif, traçabilité `IdModerator` / `ModeratedAt`
- [x] `GamePosts.Delete` (auth) : auteur ou officier
- [x] Front : mur dans la fiche de guilde, composeur avec avertissement de modération pour les membres
- [x] Front : file de modération affichée au-dessus du mur pour le leader et les officiers

## C3 — Board LFG

- [x] `LfgAds.Search` (public) : filtres `kind` / serveur / rôle, pagination curseur
- [x] `LfgAds.Create` estampille serveur et rôle (leader de la guilde, ou personnage principal de l'auteur)
- [x] Page `/world-of-warcraft/lfg` : board filtrable, séparé des rails temps réel de la home
- [x] Annonce de guilde : lien vers la fiche de guilde (entrée du parcours de contact)
- [x] Annonce de joueur : lien vers la fiche joueur puis le profil Platform

## C4 — Enforcement du mute

- [x] Action interne Platform `Users.Sanctions` : mute et ban actifs du caller (non exposée au Gateway)
- [x] Client RPC `PlatformSanctionsClient` côté Consumer WoW + cache mémoire court
- [x] Garde `EnsureCanPublishAsync` sur `LfgAds.Create`, `GamePosts.Create` et `GuildApplications.Create`
- [x] Ban actif : blocage des publications WoW
- [x] Front : messages d'erreur dédiés `MUTED` / `BANNED` / `SANCTIONS_UNAVAILABLE`

## Gateway (Vague C)

| Resource | Public | Private (auth) |
|----------|--------|----------------|
| Guilds | Get, Search | ListPostable, Create, Update, SetRank, Kick, Leave, TransferLeadership, Disband |
| GuildApplications | — | Create, ListMine, Withdraw, List, Review |
| GamePosts | ListGuildWall | Create, ListPending, Moderate, Delete |
| LfgAds | ListRecent, ListBefore, Search | Create |

`Users.Sanctions` reste hors table de routage : c'est un appel interne de bus, jamais joignable en HTTP.

## Matrice de permissions guilde

| Action | Visiteur | Membre | Officier | Leader |
|--------|----------|--------|----------|--------|
| Voir la fiche et le mur | oui | oui | oui | oui |
| Candidater | oui (connecté) | — | — | — |
| Publier sur le mur | non | oui (`pending`) | oui (`approved`) | oui (`approved`) |
| Modérer le mur | non | non | oui | oui |
| Traiter les candidatures | non | non | oui | oui |
| Exclure un membre | non | non | oui (rang inférieur) | oui |
| Éditer la fiche | non | non | oui | oui |
| Changer les rangs | non | non | non | oui |
| Transférer / dissoudre | non | non | non | oui |

## Hors scope C

- Événements in-game et inscription de personnages — Vague D
- Centre de notifications, partage / SEO — Vague D
- Rosters de raid (`Roster`, `RosterMember` déjà en base) — Vague D
- `Platform.UserGroupRole` et badges guilde côté shell — Vague D
- Remontée du client RPC dans `GamersCommunity.Core` — quand un deuxième jeu en aura besoin
- API Blizzard / import automatique — jamais au lancement
