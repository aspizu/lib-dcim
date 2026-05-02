import js from "@eslint/js"
import perfectionist from "eslint-plugin-perfectionist"
import {defineConfig} from "eslint/config"
import tseslint from "typescript-eslint"

export default defineConfig(
    {ignores: ["dist"]},
    js.configs.recommended,
    tseslint.configs.recommended,
    {
        languageOptions: {
            parserOptions: {
                project: ["./tsconfig.build.json", "./tsconfig.node.json"],
                tsconfigRootDir: import.meta.dirname,
            },
        },
        plugins: {perfectionist},
        rules: {
            "@typescript-eslint/consistent-type-imports": [
                "error",
                {fixStyle: "separate-type-imports", prefer: "type-imports"},
            ],
            "@typescript-eslint/no-deprecated": "error",
            "max-lines": ["error", 128],
            "perfectionist/sort-imports": [
                "error",
                {
                    groups: [
                        "builtin",
                        "external",
                        "internal",
                        ["parent", "sibling", "index"],
                    ],
                    order: "asc",
                    type: "alphabetical",
                },
            ],
        },
    },
)
