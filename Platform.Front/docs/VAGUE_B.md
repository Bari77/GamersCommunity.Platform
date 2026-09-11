# Vague B — Fiches joueur WoW + hub jeu

Pont identité Platform ↔ microservice jeu, fiche joueur WoW publique, rails sur la home WoW. Les guildes, le mur modéré et le LFG complet restent en **Vague C** ; le layout widgets personnalisable est une sous-étape de B (lib partagée).

## Décisions verrouillées

- **Clé publique fiche jeu** : `Player.PublicId` (GUID), pas l’`Id` Platform.
- **Lien depuis le profil Platform** : `/users/:platformPublicId` → résolution WoW → `/world-of-warcraft/players/:playerPublicId`.
- **Identité WoW** : `Player.IdKeycloak` + `Player.PlatformUserPublicId` (index uniques), `IdUser` = `Platform.User.Id` renseigné au `Load`.
- **Mute LFG** : bannière + masquage UI côté shell (session Platform) en B ; enforcement Consumer WoW ↔ Platform en C.
- **Widgets** : package DevKit `@bari77/gc-widgets` (grille + hosts) partagé shell / remotes, basé sur `angular-gridster2` v21.
- **Layout widgets** : stocké en JSON opaque dans `Player.LayoutJson`, catalogue des widgets côté front ; visible par tous, éditable par le seul propriétaire.
- **Workspace multi-pages** (`gc-widgets` 0.5.0) : `LayoutJson` porte `{ version: 2, pages: [...] }` — chaque page a son titre et ses instances de widgets (`type` + `settings`). Les tableaux plats de la v1 sont migrés à la lecture vers la première page. Le consumer accepte donc objet **ou** tableau.
- **Médias profil** : `PlayerPicture` / `PlayerVideo` / `PlayerStream` stockent des URL (pas d'upload de fichier) ; `Share` décide de la visibilité publique, le propriétaire voit tout.
- **Fédération** : `@bari77/gc-widgets` livre du `.ts` brut, il doit rester dans `skip` de `federation.config.mjs` pour passer par le compilateur Angular.

## B1 — Identité & fiche joueur WoW

- [x] Migration `Player` : `IdKeycloak`, `PlatformUserPublicId` (index uniques filtrés)
- [x] `Players.Load` (auth) : get-or-create par Keycloak + ids Platform
- [x] `Players.Get` (public) : fiche par `Player.PublicId`
- [x] `Players.Resolve` (public) : `{ platformUserPublicId }` → `{ playerPublicId? }`
- [x] `Players.Update` (auth) : présentations IRL / IG, propre fiche uniquement
- [x] Routes WoW : `/world-of-warcraft/sheet` (ma fiche), `/world-of-warcraft/players/:publicId`
- [x] Profil Platform public : section « Jeux » avec lien WoW si fiche existante

## B2 — Personnages (CRUD minimal)

- [x] Seeds `Specialization` (35), `SpecializationClass` (39), `RaceClass` (124) — `Order = 1` sur les jonctions
- [x] `Characters` : Create / Get / List (par joueur) / Update / Delete
- [x] `Characters.Options` (public) : races, serveurs, rôles, factions, classes, specs, matrice race/classe
- [x] Validations : nom unique par serveur, spec cohérente avec la classe, classe autorisée pour la race
- [x] UI fiche : cartes personnages aux couleurs de classe, formulaire création / édition, suppression confirmée
- [x] Personnage principal (`Main`) — un seul par joueur, promotion auto du suivant à la suppression

## B3 — Médias profil & layout widgets

- [x] `PlayerPicture`, `PlayerVideo`, `PlayerStream` — List (public, filtré sur `Share`) / Create / Update / Delete (propriétaire)
- [x] Colonne `LayoutJson` sur `Player` (grille widgets) — écrite via `Players.Update`, lue par tous
- [x] `@bari77/gc-widgets` : `WidgetWorkspaceComponent` (rail de pages + grille + catalogue + réglages), `WidgetGridComponent`, `WidgetDefDirective`, `WidgetEditBarComponent` (gridster2 v21)
- [x] Widgets : identité, présentation IRL, présentation IG, stats, persos, galerie photo, galerie vidéo, streams, lecteur Twitch, liens
- [x] Pages par défaut : accueil (verrouillée), personnages, vidéos, photos, liens — le propriétaire crée / renomme / réordonne / supprime les siennes
- [x] Publier DevKit 0.4.0 et remplacer la référence `file:.tmp-packs/...` par la version registry
- [x] Reporter le package widgets dans `GamersCommunity.Games.Template` — plomberie + démo `/template/workspace` (pas de persistance : le Template n'a pas d'entité joueur)

## B4 — Home WoW (rails)

- [x] `HomeFeed.Get` : derniers LFG actifs, persos créés, fiches joueur, événements à venir
- [x] Rail LFG : tchat global chronologique + SignalR (`/hubs/wow-lfg`) en temps réel
- [x] `LfgAds.Create` (auth) : titre, corps, kind, expiration
- [x] MSW handlers pour dev standalone (`useMocks: true`)

## Gateway (Vague B)

| Resource | Public | Private (auth) |
|----------|--------|----------------|
| Players | Get, Resolve | Load, Update |
| HomeFeed | Get | — |
| LfgAds | ListRecent | Create |
| Characters | Get, List, Options | Create, Update, Delete |
| PlayerPictures | List | Create, Update, Delete |
| PlayerVideos | List | Create, Update, Delete |
| PlayerStreams | List | Create, Update, Delete |

## Hors scope B

- Guildes, mur de guilde, modération jeu — Vague C
- Événements in-game (inscription perso) — Vague D
- API Blizzard / import auto — jamais au lancement

## Matrice d’accès profil

| Visiteur | Profil Platform | Fiche WoW |
|----------|-----------------|-----------|
| Anonyme | identité publique | fiche publique si existe |
| Connecté | + amis / DM / report | + lien depuis profil Platform |
| Propriétaire | édition profil Platform | `Load` + `Update` fiche + futur layout |
