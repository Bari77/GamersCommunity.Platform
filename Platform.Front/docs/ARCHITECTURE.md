# 🧱 GamersCommunity Front — Angular 21 Architecture Guide

## 📘 Overview

This document defines the **architecture, structure, and naming best practices** used in the **GamersCommunity** project.  
The goal is to ensure a **clean, maintainable, and consistent codebase** for all developers joining the team.

---

## 🚀 Tech Stack

| Element          | Version / Technology                 | Description                                                  |
| ---------------- | ------------------------------------ | ------------------------------------------------------------ |
| Framework        | **Angular 21**                       | Using _standalone components_                                |
| Micro-frontends  | **Native Federation**                | Shell orchestrates game remotes at runtime                   |
| State management | **Signals API** + `resource()`     | Native Angular signal-based stores                           |
| Routing          | **Standalone Routes** + resolvers    | `loadChildren`, `loadRemoteModule`, `resolve: { load }`    |
| Styling          | **SCSS**                             | Per component                                                |
| HTTP & Services  | **Angular HttpClient**               | + global interceptors                                        |
| UI               | **Nebular 17**                       | Theme, Auth, Security                                        |
| Structure        | **Clean Feature-Based Architecture** | Clear separation between `core/`, `shared/`, and `features/` |

---

## 🌐 Native Federation (Shell + Remotes)

### Shell — `Platform.Front`

The shell is the **host** application (port **4200**). It owns:

- Layout (header, footer, splash)
- Authentication (Nebular OAuth2 / Keycloak)
- Global interceptors and security ACL
- Transverse features (`home`, `users`, `games` catalogue)
- Federation manifest: `public/federation.manifest.json`

```typescript
// app.routes.ts — lazy-load a game remote
{
    path: "world-of-warcraft",
    loadChildren: () =>
        loadRemoteModule("worldOfWarcraft", "./Routes").then((m) => m.worldOfWarcraftRoutes),
}
```

### Remotes — one front per game

Each game lives in its own repo folder, e.g.:

```
GamersCommunity.Games.WorldOfWarcraft/
└── WorldOfWarcraft.Front/     ← remote (port 4201)
```

The remote **exposes routes** via federation (`./Routes` → `worldOfWarcraftRoutes`).

### Local development

```bash
# Shell + WoW remote together
npm run dev:federation

# Or separately
npm run dev                              # shell :4200
npm run start:remote:wow                 # remote :4201
```

---

## 🧩 Project Structure (Shell)

```
src/
 ├── app/
 │   ├── core/
 │   │   ├── guards/
 │   │   ├── interceptors/
 │   │   ├── layout/
 │   │   ├── security/          # ACL per game (merged in app.config)
 │   │   └── stores/            # LoadingStore (global loader)
 │   │
 │   ├── features/
 │   │   ├── home/
 │   │   ├── users/
 │   │   ├── games/             # catalogue Platform (stays in shell)
 │   │   └── league-of-legends/ # stub until its remote exists
 │   │
 │   ├── shared/
 │   │   ├── components/
 │   │   ├── services/          # base.service.ts
 │   │   └── utils/             # promise.utils.ts
 │   │
 │   ├── app.config.ts
 │   └── app.routes.ts
 │
 ├── bootstrap.ts               # Angular bootstrap (after federation init)
 ├── main.ts                    # initFederation → bootstrap
 └── environments/
```

### Remote structure (example WoW)

```
WorldOfWarcraft.Front/src/app/
 ├── core/
 ├── shared/
 ├── features/
 │   └── classes/
 │       ├── dto/
 │       ├── models/
 │       ├── services/          # HTTP layer
 │       └── stores/            # resource() stores
 ├── pages/
 │   └── home-container/
 │       ├── home-container.component.ts
 │       └── home.resolver.ts
 └── world-of-warcraft.routes.ts
```

---

## ⚡ State Management with Signals

Stores are `@Injectable()` classes using `signal()`, `computed()`, and **`resource()`**.  
They **inject HTTP services** and expose `reload()` / `loaded()` for resolvers.

### Store pattern

```ts
@Injectable()
export class ClassesStore {
    public readonly classes = resource({
        loader: () => firstValueFrom(this.classesService.list()),
        defaultValue: [],
    });

    private readonly classesService = inject(ClassesService);

    public reload(): void {
        this.classes.reload();
    }

    public async loaded(): Promise<void> {
        return PromiseUtils.waitUntilFalse(() => this.classes.isLoading());
    }
}
```

### Page components consume stores directly

```ts
export class HomeContainerComponent {
    public readonly classesStore = inject(ClassesStore);
}
```

Register scoped stores in route `providers`:

```ts
{
    path: "",
    providers: [ClassesService, ClassesStore],
    resolve: { load: homeResolver },
    loadComponent: () => import("./home-container.component").then((m) => m.HomeContainerComponent),
}
```

---

## 🧭 Route Resolvers

Resolvers preload data **before** the route activates, using stores:

```ts
export const homeResolver: ResolveFn<void> = async () => {
    const loadingStore = inject(LoadingStore);
    const classesStore = inject(ClassesStore);

    loadingStore.loading.set(true);
    try {
        classesStore.reload();
        await classesStore.loaded();
    } finally {
        loadingStore.loading.set(false);
    }
};
```

Shell routes wrap main content with `gamesResolver` to preload the games menu.

---

## 📦 Naming Conventions

| Type        | File Naming                    | Example                     | Associated Class       |
| ----------- | ------------------------------ | --------------------------- | ---------------------- |
| Component   | `xxx.component.ts`             | `user-profile.component.ts` | `UserProfileComponent` |
| Service     | `xxx.service.ts`               | `classes.service.ts`        | `ClassesService`       |
| Store       | `xxx.store.ts`                 | `classes.store.ts`          | `ClassesStore`         |
| Resolver    | `xxx.resolver.ts`              | `home.resolver.ts`          | `homeResolver`         |
| Model / Dto | `xxx.model.ts` / `xxx.dto.ts`  | `class.model.ts`            | `WowClass`             |
| Routes      | `xxx.routes.ts`                | `world-of-warcraft.routes.ts` | `worldOfWarcraftRoutes` |

---

## 🔥 Summary

| Principle            | Best Practice                                           |
| -------------------- | ------------------------------------------------------- |
| **Architecture**     | Shell + Native Federation remotes per game              |
| **State**            | Signal stores with `resource()`, services for HTTP      |
| **Routing**          | Resolvers `resolve: { load }` + lazy / remote loading   |
| **Components**       | 100% standalone; pages inject stores directly           |
| **Shared layer**     | BaseService, PromiseUtils, LoadingStore                 |

---

📅 **Last updated:** June 2026  
🧠 **Maintainer:** GamersCommunity Frontend Team
