import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  {
    rules: {
      // useActionState hands every action a previous-state argument, which
      // most of ours ignore. A leading underscore marks that deliberately.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  // .claude/skills holds the design system's own source (UI kits, preview
  // cards). It is reference material we copy tokens out of, not code this
  // project builds or owns.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "drizzle/**",
    ".claude/**",
  ]),
]);
