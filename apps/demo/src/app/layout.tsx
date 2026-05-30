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
      .map((d) => ({ href: `/docs/${d.slug}`, label: d.title })),
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
          <Sidebar groups={sidebarGroups} />
          <main className="site-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
