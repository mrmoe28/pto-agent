import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "**/*.js",
      "python-scraper/**",
      "pto-agent/**",
      "qa/**",
      "scripts/**",
      "tests/**",
      "dev-tools/**",
    ],
  },
  {
    rules: {
      // Prevent 'any' type usage to maintain type safety
      "@typescript-eslint/no-explicit-any": "error",

      // Prevent unused imports and variables
      "@typescript-eslint/no-unused-vars": ["error", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        ignoreRestSiblings: true
      }],

      // Prevent Function type usage (use specific function signatures)
      "@typescript-eslint/prefer-function-type": "error",

      // Require consistent return types (only for exported functions)
      "@typescript-eslint/explicit-function-return-type": "off",

      // Enforce consistent type definitions (warn level)
      "@typescript-eslint/consistent-type-definitions": ["warn", "interface"],

      // Prevent empty interfaces (unless extending)
      "@typescript-eslint/no-empty-interface": ["error", {
        allowSingleExtends: true
      }]
    }
  }
];

export default eslintConfig;
