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
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'tilery',
        'tilery/internal',
        'tilery/style.css',
      ],
      output: {
        banner: '"use client";',
      },
    },
  },
  plugins: [
    dts({ rollupTypes: true }),
    {
      // Emit a self-contained stylesheet for the advertised
      // `@tileryjs/react/style.css` export (publishConfig maps it to
      // dist/index.css). Inlining the core stylesheet — rather than shipping
      // `@import 'tilery/style.css'` — means the published file needs no
      // bare-specifier resolution from the consumer's bundler.
      name: 'copy-css',
      closeBundle() {
        mkdirSync(resolve(__dirname, 'dist'), { recursive: true });
        copyFileSync(
          resolve(__dirname, '../core/src/tilery.css'),
          resolve(__dirname, 'dist/index.css'),
        );
      },
    },
  ],
});
