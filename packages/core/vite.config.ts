import { resolve } from 'node:path';
import { copyFileSync, mkdirSync } from 'node:fs';
import { defineConfig } from 'vite-plus';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    cssCodeSplit: false,
    rollupOptions: {
      external: [],
    },
  },
  plugins: [
    dts({ rollupTypes: true }),
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
