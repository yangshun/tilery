import { docs } from './docs';
import { exampleCategoryOrder, examples } from './examples';

export type SiteNavigationItem = {
  href: string;
  label: string;
  depth?: number;
};

export type SiteNavigationGroup = {
  title: string;
  items?: SiteNavigationItem[];
  sections?: Array<{
    title: string;
    items: SiteNavigationItem[];
  }>;
};

const referenceDocOrder = [
  'api',
  'api/component',
  'api/layout',
  'api/styling',
  'api/control',
  'api/events',
];

function getReferenceDocOrder(slug: string) {
  const index = referenceDocOrder.indexOf(slug);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

const exampleNavigationSections = exampleCategoryOrder.map((category) => ({
  title: category,
  items: examples
    .filter((example) => example.category === category)
    .map((example) => ({
      href: `/examples/${example.slug}`,
      label: example.title,
    })),
}));

export const siteNavigationGroups: SiteNavigationGroup[] = [
  {
    title: 'Guide',
    items: docs
      .filter((d) => d.group === 'Guide')
      .map((d) => ({
        href: `/docs/${d.slug}`,
        label: d.title,
      })),
  },
  {
    title: 'Examples',
    sections: exampleNavigationSections,
  },
  {
    title: 'Reference',
    items: docs
      .filter((d) => d.group === 'Reference')
      .sort(
        (a, b) => getReferenceDocOrder(a.slug) - getReferenceDocOrder(b.slug),
      )
      .map((d) => ({
        href: `/docs/${d.slug}`,
        label: d.title,
        depth: d.slug.includes('/') ? 1 : 0,
      })),
  },
];

export const siteNavigationItems = siteNavigationGroups.flatMap((group) => [
  ...(group.items ?? []),
  ...(group.sections ?? []).flatMap((section) => section.items),
]);

export function getAdjacentSiteNavigation(href: string) {
  const index = siteNavigationItems.findIndex((item) => item.href === href);
  return {
    previous: index > 0 ? siteNavigationItems[index - 1] : null,
    next:
      index !== -1 && index < siteNavigationItems.length - 1
        ? siteNavigationItems[index + 1]
        : null,
  };
}
