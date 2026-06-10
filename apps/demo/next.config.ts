import createMDX from '@next/mdx';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
  transpilePackages: ['tilery', '@tilery/react'],
  turbopack: {
    rules: {
      // Allow `import code from './file.tsx?raw'` to return the file's
      // source as a raw string instead of compiling it as a module.
      '*.tsx': {
        condition: { query: /raw/ },
        loaders: ['./raw-loader.cjs'],
        as: '*.js',
      },
    },
  },
};

export default createMDX({
  options: {
    remarkPlugins: [
      'remark-gfm',
      'remark-frontmatter',
      ['remark-mdx-frontmatter', { name: 'frontmatter' }],
    ],
  },
})(nextConfig);
