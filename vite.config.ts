import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig } from 'vite-plus';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /^tilery\/internal$/,
        replacement: resolve(__dirname, 'packages/core/src/internal.ts'),
      },
      {
        find: /^tilery$/,
        replacement: resolve(__dirname, 'packages/core/src/index.ts'),
      },
    ],
  },
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['packages/*/src/**/*.{ts,tsx}'],
      exclude: ['**/*.test.{ts,tsx}', '**/index.ts', '**/test-dom-setup.ts'],
    },
  },
  fmt: {
    printWidth: 80,
    singleQuote: true,
    trailingComma: 'all',
    bracketSameLine: true,
  },
  lint: {
    ignorePatterns: ['dist/**', '.next/**'],
  },
});
