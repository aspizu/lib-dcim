import {fileURLToPath, URL} from "node:url"

import {defineConfig} from "vitest/config"

export default defineConfig({
    resolve: {
        alias: {
            "#src": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
    test: {
        coverage: {
            include: ["src/**/*.ts"],
            provider: "v8",
        },
        environment: "node",
        globals: true,
        include: ["tests/**/*.test.{ts,tsx}"],
        setupFiles: ["./vitest.setup.ts"],
    },
})
