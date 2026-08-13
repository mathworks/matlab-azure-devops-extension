import eslint from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

export default [
    {
        files: ["tasks/**/v1/**/*.ts"],
        ignores: ["tasks/**/v1/**/test/**/*.ts"],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                project: "./tsconfig.json",
            },
            globals: {
                __dirname: "readonly",
                __filename: "readonly",
                process: "readonly",
                require: "readonly",
                module: "readonly",
                exports: "readonly",
                console: "readonly",
                Buffer: "readonly",
                NodeJS: "readonly",
                setTimeout: "readonly",
                setInterval: "readonly",
                clearTimeout: "readonly",
                clearInterval: "readonly",
            },
        },
        plugins: {
            "@typescript-eslint": tseslint,
        },
        rules: {
            ...eslint.configs.recommended.rules,
            ...tseslint.configs.recommended.rules,
            "no-console": "off",
            "sort-keys": "off",
            "prefer-const": ["error", { destructuring: "all" }],
            "@typescript-eslint/no-require-imports": "off",
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/ban-ts-comment": "warn",
            "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", caughtErrors: "none" }],
        },
    },
    {
        ignores: ["node_modules/", "_build/", "_package/", "tasks/**/v0/**"],
    },
];
