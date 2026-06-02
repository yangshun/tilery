import type { Metadata } from 'next';
import '@tilery/react/style.css';
import './globals.css';
import { Sidebar, type SidebarGroup } from '../components/sidebar';
import { docs } from '../content/docs';
import { examples } from '../content/examples';

export const metadata: Metadata = {
  title: 'Tilery',
  description: 'A tiling panel layout engine for React',
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

const sidebarGroups: SidebarGroup[] = [
  {
    title: 'Guide',
    items: docs
      .filter((d) => d.group === 'Guide')
      .map((d) => ({ href: `/docs/${d.slug}`, label: d.title })),
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
  {
    title: 'Examples',
    items: examples.map((e) => ({
      href: `/examples/${e.slug}`,
      label: e.title,
    })),
  },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="site-layout">
          <div className="sidebar-container">
            <Sidebar groups={sidebarGroups} />
          </div>
          <main className="site-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
