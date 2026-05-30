import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite-plus';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
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
