import { resolve } from 'node:path';
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
      external: ['react', 'react-dom', 'react/jsx-runtime', 'tilery'],
      output: {
        banner: '"use client";',
      },
    },
  },
  plugins: [dts({ rollupTypes: true })],
});
