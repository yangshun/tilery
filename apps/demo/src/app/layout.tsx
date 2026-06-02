import type { Metadata } from 'next';
import '@tilery/react/style.css';
import './globals.css';
import { Sidebar } from '../components/sidebar';
import { siteNavigationGroups } from '../content/navigation';

export const metadata: Metadata = {
  title: {
    default: 'Tilery',
    template: '%s | Tilery',
  },
  description: 'A tiling panel layout engine for React',
};

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
            <Sidebar groups={siteNavigationGroups} />
          </div>
          <main className="site-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
