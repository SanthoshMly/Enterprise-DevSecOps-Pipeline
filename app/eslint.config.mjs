import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,cjs}"],
    plugins: { js },
    extends: ["js/recommended"],

    languageOptions: {
      globals: globals.node,
      sourceType: "commonjs",
      ecmaVersion: "latest"
    },

    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "off",
      "semi": ["error", "always"],
      "quotes": ["error", "double"]
    }
  },

  // This config file itself is an ES module, not CommonJS
  {
    files: ["**/*.mjs"],
    plugins: { js },
    extends: ["js/recommended"],

    languageOptions: {
      globals: globals.node,
      sourceType: "module",
      ecmaVersion: "latest"
    },

    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "off",
      "semi": ["error", "always"],
      "quotes": ["error", "double"]
    }
  },

  // Jest test files
  {
    files: ["tests/**/*.js"],

    languageOptions: {
      globals: {
        ...globals.node,

        describe: "readonly",
        test: "readonly",
        expect: "readonly",
        jest: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly"
      }
    }
  }
]);