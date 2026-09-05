import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

export default defineConfig([
    {
        ignores: [".angular/", "dist/", "node_modules/"],

        files: ["**/*.ts"],

        extends: compat.extends(
            "plugin:@typescript-eslint/recommended",
            "plugin:@angular-eslint/recommended",
            "plugin:@angular-eslint/template/process-inline-templates",
        ),

        languageOptions: {
            ecmaVersion: 5,
            sourceType: "script",

            parserOptions: {
                project: ["./tsconfig.json"],
                createDefaultProgram: true,
            },
        },

        rules: {
            "@angular-eslint/component-selector": [
                "off",
                {
                    type: "element",
                    prefix: "app",
                    style: "kebab-case",
                },
            ],

            "@angular-eslint/directive-selector": [
                "off",
                {
                    type: "attribute",
                    prefix: "app",
                    style: "camelCase",
                },
            ],

            "@angular-eslint/no-output-on-prefix": "off",
            "@angular-eslint/no-inputs-metadata-property": "off",
            "@angular-eslint/no-outputs-metadata-property": "off",
            "@angular-eslint/prefer-standalone": "off",

            "@typescript-eslint/array-type": [
                "error",
                {
                    default: "array",
                },
            ],

            "@typescript-eslint/consistent-type-definitions": "error",
            "@typescript-eslint/dot-notation": "off",

            "@typescript-eslint/explicit-member-accessibility": [
                "error",
                {
                    accessibility: "explicit",
                },
            ],

            "@typescript-eslint/no-empty-interface": "off",
            "@typescript-eslint/explicit-function-return-type": "error",
            "@typescript-eslint/naming-convention": [
                "error",
                {
                    selector: "default",
                    format: ["camelCase"],
                },
                {
                    selector: "typeLike",
                    format: ["PascalCase"],
                },
                {
                    selector: "typeParameter",
                    format: ["camelCase"],
                    prefix: ["T", "K"],
                },
                {
                    selector: "enumMember",
                    format: ["UPPER_CASE"],
                },
                {
                    selector: ["memberLike", "variableLike"],
                    types: ["boolean"],
                    format: ["camelCase"],
                },
                {
                    selector: "classProperty",
                    format: ["snake_case", "UPPER_CASE"],
                    modifiers: ["public", "static"],
                },
            ],

            "@typescript-eslint/member-ordering": "error",
            "arrow-parens": ["error", "always"],
            "brace-style": ["error", "1tbs"],
            "id-blacklist": "off",
            "id-match": "off",

            "no-restricted-imports": [
                "error",
                {
                    patterns: [".*"],
                },
            ],

            "max-len": "off",
            "no-bitwise": "off",
            "no-shadow": "off",
            "no-underscore-dangle": "off",
            "no-restricted-imports": "off",

            "@typescript-eslint/no-explicit-any": "off",
        },
    },
    {
        files: ["**/*.html"],
        extends: compat.extends("plugin:@angular-eslint/template/recommended"),
        rules: {},
    },
]);
