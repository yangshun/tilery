declare module '*.mdx' {
  import type { ComponentType } from 'react';

  const MDXContent: ComponentType;
  export const frontmatter: {
    title: string;
    description: string;
  };
  export default MDXContent;
}
