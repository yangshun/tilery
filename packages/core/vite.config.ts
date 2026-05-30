import { resolve } from 'node:path';
import { copyFileSync, mkdirSync } from 'node:fs';
import { defineConfig } from 'vite-plus';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        internal: resolve(__dirname, 'src/internal.ts'),
      },
      formats: ['es'],
    },
    cssCodeSplit: false,
    rollupOptions: {
      external: [],
    },
  },
  plugins: [
    dts(),
    {
      name: 'copy-css',
      closeBundle() {
        mkdirSync(resolve(__dirname, 'dist'), { recursive: true });
        copyFileSync(
          resolve(__dirname, 'src/tilery.css'),
          resolve(__dirname, 'dist/style.css'),
        );
      },
    },
  ],
});
