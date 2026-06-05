import type { ComponentType } from 'react';

import Basic, { frontmatter as basic } from './examples/basic.mdx';
import Ide, { frontmatter as ide } from './examples/ide.mdx';
import EdgePanels, {
  frontmatter as edgePanels,
} from './examples/edge-panels.mdx';
import Dashboard, { frontmatter as dashboard } from './examples/dashboard.mdx';
import Nested, { frontmatter as nested } from './examples/nested.mdx';
import Constraints, {
  frontmatter as constraints,
} from './examples/constraints.mdx';
import Collapse, { frontmatter as collapse } from './examples/collapse.mdx';
import Overflow, { frontmatter as overflow } from './examples/overflow.mdx';
import PanelLocking, {
  frontmatter as panelLocking,
} from './examples/panel-locking.mdx';
import TabLocking, {
  frontmatter as tabLocking,
} from './examples/tab-locking.mdx';
import Controlled, {
  frontmatter as controlled,
} from './examples/controlled.mdx';
import LinkTabs, { frontmatter as linkTabs } from './examples/link-tabs.mdx';
import Persistence, {
  frontmatter as persistence,
} from './examples/persistence.mdx';
import Callbacks, { frontmatter as callbacks } from './examples/callbacks.mdx';
import Floating, { frontmatter as floating } from './examples/floating.mdx';
import Themes, { frontmatter as themes } from './examples/themes.mdx';

/** Sidebar grouping order for the example category sections. */
export const exampleCategoryOrder = [
  'Layout Patterns',
  'Panel & Tab Behavior',
  'App Integration',
  'Advanced UI',
] as const;

export type ExampleCategory = (typeof exampleCategoryOrder)[number];

export type ExamplePage = {
  slug: string;
  title: string;
  description: string;
  category: ExampleCategory;
  Content: ComponentType;
};

/**
 * Validates a frontmatter `category` against the known set. Frontmatter is not
 * type-checked against the union, so this fails the build loudly on a typo.
 */
function toCategory(slug: string, raw: unknown): ExampleCategory {
  if (
    typeof raw === 'string' &&
    (exampleCategoryOrder as readonly string[]).includes(raw)
  ) {
    return raw as ExampleCategory;
  }
  throw new Error(
    `Example "${slug}" has an invalid or missing frontmatter category: ${String(raw)}`,
  );
}

function example(
  slug: string,
  Content: ComponentType,
  frontmatter: { title: string; description: string },
): ExamplePage {
  return {
    slug,
    Content,
    title: frontmatter.title,
    description: frontmatter.description,
    category: toCategory(
      slug,
      (frontmatter as { category?: unknown }).category,
    ),
  };
}

// Order here is the sidebar / prev-next order.
export const examples: ExamplePage[] = [
  example('basic', Basic, basic),
  example('ide', Ide, ide),
  example('edge-panels', EdgePanels, edgePanels),
  example('dashboard', Dashboard, dashboard),
  example('nested', Nested, nested),
  example('constraints', Constraints, constraints),
  example('collapse', Collapse, collapse),
  example('overflow', Overflow, overflow),
  example('panel-locking', PanelLocking, panelLocking),
  example('tab-locking', TabLocking, tabLocking),
  example('controlled', Controlled, controlled),
  example('link-tabs', LinkTabs, linkTabs),
  example('persistence', Persistence, persistence),
  example('callbacks', Callbacks, callbacks),
  example('floating', Floating, floating),
  example('themes', Themes, themes),
];

export const examplesBySlug = new Map(examples.map((e) => [e.slug, e]));
