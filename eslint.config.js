import js from "@eslint/js"
import tseslint from "typescript-eslint"
import astro from "eslint-plugin-astro"
import svelte from "eslint-plugin-svelte"

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.astro"],
    plugins: { astro },
    languageOptions: { parser: astro.parser },
    rules: {
      // tus reglas Astro
    },
  },
  {
    files: ["**/*.svelte"],
    plugins: { svelte },
    languageOptions: { parser: svelte.parser },
    rules: {
      // tus reglas Svelte
    },
  },
]