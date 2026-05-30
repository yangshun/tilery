'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type SidebarItem = {
  href: string;
  label: string;
};

export type SidebarGroup = {
  title: string;
  items: SidebarItem[];
};

export function Sidebar({ groups }: { groups: SidebarGroup[] }) {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <Link href="/docs/getting-started" className="sidebar__logo">
          Tilery
        </Link>
      </div>
      <nav className="sidebar__nav">
        {groups.map((group) => (
          <div key={group.title} className="sidebar__group">
            <div className="sidebar__group-title">{group.title}</div>
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar__link ${pathname === item.href ? 'sidebar__link--active' : ''}`}>
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar__footer">
        <a
          href="https://github.com/yangshun/tilery"
          target="_blank"
          rel="noopener noreferrer"
          className="sidebar__link">
          GitHub
        </a>
      </div>
    </aside>
  );
}
