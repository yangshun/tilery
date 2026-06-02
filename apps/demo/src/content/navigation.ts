import { docs } from './docs';
import { examples } from './examples';

export type SiteNavigationItem = {
  href: string;
  label: string;
  depth?: number;
};

export type SiteNavigationGroup = {
  title: string;
  items: SiteNavigationItem[];
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
    items: examples.map((e) => ({
      href: `/examples/${e.slug}`,
      label: e.title,
    })),
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

export const siteNavigationItems = siteNavigationGroups.flatMap(
  (group) => group.items,
);

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
