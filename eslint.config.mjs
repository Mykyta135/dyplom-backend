// @ts-check
import eslintNestJs from "@darraghor/eslint-plugin-nestjs-typed";
import eslint from '@eslint/js';
import parser from '@typescript-eslint/parser';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
      languageOptions: {
          globals: {
              ...globals.node,
              ...globals.jest,
          },
          parser,
          ecmaVersion: 2022,
          sourceType: "module",
          parserOptions: {
              projectService: true,
              tsconfigRootDir: import.meta.dirname,
          },
      },
      rules: {
        '@typescript-eslint/no-extraneous-class': 'off', 
      }
  },
  eslintNestJs.configs.flatRecommended
);
