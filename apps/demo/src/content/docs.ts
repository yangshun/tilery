import type { ComponentType } from 'react';

import Api, { frontmatter as api } from './docs/api.mdx';
import ApiComponent, {
  frontmatter as apiComponent,
} from './docs/api/component.mdx';
import ApiControl, { frontmatter as apiControl } from './docs/api/control.mdx';
import ApiEvents, { frontmatter as apiEvents } from './docs/api/events.mdx';
import ApiLayout, { frontmatter as apiLayout } from './docs/api/layout.mdx';
import ApiStyling, { frontmatter as apiStyling } from './docs/api/styling.mdx';
import Concepts, { frontmatter as concepts } from './docs/concepts.mdx';
import GettingStarted, {
  frontmatter as gettingStarted,
} from './docs/getting-started.mdx';
import Styling, { frontmatter as styling } from './docs/styling.mdx';

export type DocPage = {
  slug: string;
  title: string;
  description: string;
  group: 'Guide' | 'Reference';
  Content: ComponentType;
};

function doc(
  slug: string,
  group: DocPage['group'],
  Content: ComponentType,
  frontmatter: Pick<DocPage, 'title' | 'description'>,
): DocPage {
  return {
    slug,
    group,
    Content,
    title: frontmatter.title,
    description: frontmatter.description,
  };
}

export const docs: DocPage[] = [
  doc('getting-started', 'Guide', GettingStarted, gettingStarted),
  doc('concepts', 'Guide', Concepts, concepts),
  doc('styling', 'Guide', Styling, styling),
  doc('api', 'Reference', Api, api),
  doc('api/styling', 'Reference', ApiStyling, apiStyling),
  doc('api/component', 'Reference', ApiComponent, apiComponent),
  doc('api/layout', 'Reference', ApiLayout, apiLayout),
  doc('api/events', 'Reference', ApiEvents, apiEvents),
  doc('api/control', 'Reference', ApiControl, apiControl),
];

export const docsBySlug = new Map(docs.map((doc) => [doc.slug, doc]));
