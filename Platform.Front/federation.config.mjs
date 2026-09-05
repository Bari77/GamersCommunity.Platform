import { withNativeFederation, shareAll } from "@angular-architects/native-federation-v4/config";

export default withNativeFederation({
    name: "Platform.Front",

    shared: {
        ...shareAll(
            { singleton: true, strictVersion: true, requiredVersion: "auto", build: "package" },
            {
                overrides: {
                    "@angular/core": {
                        singleton: true,
                        strictVersion: true,
                        requiredVersion: "auto",
                        build: "package",
                        includeSecondaries: { keepAll: true },
                    },
                    "@angular/platform-browser": {
                        singleton: true,
                        strictVersion: true,
                        requiredVersion: "auto",
                        build: "package",
                        includeSecondaries: { keepAll: true },
                    },
                    "@angular/animations": {
                        singleton: true,
                        strictVersion: true,
                        requiredVersion: "auto",
                        build: "package",
                        includeSecondaries: { keepAll: true },
                    },
                    "@angular/cdk": {
                        singleton: true,
                        strictVersion: true,
                        requiredVersion: "21.0.6",
                        build: "package",
                        includeSecondaries: { keepAll: true },
                    },
                    "zone.js": {
                        singleton: true,
                        strictVersion: true,
                        requiredVersion: "auto",
                    },
                },
            },
        ),
    },

    skip: [
        "rxjs/ajax",
        "rxjs/fetch",
        "rxjs/testing",
        "rxjs/webSocket",
        "eva-icons",
        "@nebular/eva-icons",
        "@angular/cdk/schematics",
        "zone.js/node",
        "zone.js/testing",
        // Build / CLI tools — Node.js only, must not be bundled for browser
        "@angular/cli",
        "@angular/build",
        "@angular/compiler-cli",
        "@angular-devkit/architect",
        "@angular-devkit/build-angular",
        "@angular-devkit/core",
        "@angular-devkit/schematics",
        "@schematics/angular",
        "@angular-architects/native-federation-v4",
        "@softarc/native-federation-orchestrator",
        "source-map-support",
        /^@angular-devkit\//,
        /^@schematics\//,
    ],

    // Please read our FAQ about sharing libs:
    // https://shorturl.at/jmzH0

    features: {
        // ignoreUnusedDeps is enabled by default now
        // ignoreUnusedDeps: true,

        // Opt-in: groups chunks in remoteEntry.json for smaller metadata file
        denseChunking: true,
    },
});
