import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import vitest from "@vitest/eslint-plugin";
import testingLibrary from "eslint-plugin-testing-library";
import prettier from "eslint-config-prettier/flat";

export default [
  {
    ignores: [
      "dist/**",
      "coverage/**",
      "src/routeTree.gen.js",
      ".tanstack/**",
      // Placeholder tokens here are substituted at deploy time by
      // deployment/runtimeConfig.js, so this is a template rather than source.
      "public/env.js",
    ],
  },

  js.configs.recommended,
  reactHooks.configs.flat.recommended,
  jsxA11y.flatConfigs.recommended,

  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        ...globals.browser,
        // Substituted at build time by the `define` block in vite.config.js.
        __APP_VERSION__: "readonly",
      },
    },
    rules: {
      // A leading underscore is the tree's existing mark for a binding that
      // exists to hold a position — a Zustand `_get`, an event arg the handler
      // ignores — and must stay for arity or destructuring order.
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          // `const { owner, ...query } = x` names `owner` in order to keep it
          // out of `query`. Reading it would defeat the point, so the binding
          // is used precisely by going unread.
          ignoreRestSiblings: true,
        },
      ],
    },
  },

  {
    files: ["src/**/*.test.{js,jsx}", "src/tests/**/*.{js,jsx}"],
    plugins: { vitest, "testing-library": testingLibrary },
    languageOptions: {
      globals: { ...vitest.environments.env.globals, ...globals.node },
    },
    rules: {
      ...vitest.configs.recommended.rules,
      ...testingLibrary.configs["flat/react"].rules,
      // Vitest's `expect(value, message)` carries a failure label; the corpus
      // tests use it to name the case that failed. The rule defaults to Jest's
      // one-argument form.
      "vitest/valid-expect": ["error", { maxArgs: 2 }],
    },
  },

  {
    files: ["*.config.{js,mjs}", "deployment/**/*.{js,mjs}"],
    languageOptions: {
      sourceType: "module",
      globals: { ...globals.node },
    },
  },

  prettier,
];
