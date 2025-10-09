import js from "@eslint/js"
import globals from "globals"
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import tseslint from "typescript-eslint"
import { globalIgnores } from "eslint/config"
import reactCompiler from "eslint-plugin-react-compiler";

export default tseslint.config([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      react.configs.flat.recommended,
      reactHooks.configs["recommended-latest"],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2025,
      globals: globals.browser,
    },
    plugins: {
      react,
      "react-compiler": reactCompiler
    },
    rules: {
      "@typescript-eslint/no-require-imports": 0,
      "@typescript-eslint/ban-ts-comment": 0,
      "@typescript-eslint/no-explicit-any": 0,
      "react/react-in-jsx-scope": 0,
      "react-compiler/react-compiler": "error",
    }
  },
])
