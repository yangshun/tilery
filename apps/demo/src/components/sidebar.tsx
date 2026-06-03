'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { RiCloseLine, RiMenuLine } from 'react-icons/ri';

export type SidebarItem = {
  href: string;
  label: string;
  depth?: number;
};

export type SidebarGroup = {
  title: string;
  items?: SidebarItem[];
  sections?: Array<{
    title: string;
    items: SidebarItem[];
  }>;
};

export function Sidebar({ groups }: { groups: SidebarGroup[] }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  function renderLink(item: SidebarItem) {
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`sidebar__link ${item.depth ? 'sidebar__link--nested' : ''} ${pathname === item.href ? 'sidebar__link--active' : ''}`}>
        {item.label}
      </Link>
    );
  }

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
      <div className="sidebar__header">
        <Link href="/" className="sidebar__logo">
          Tilery
        </Link>
        <button
          type="button"
          className="sidebar__toggle"
          aria-expanded={isOpen}
          aria-controls="site-sidebar-nav"
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={() => setIsOpen((open) => !open)}>
          {isOpen ? (
            <RiCloseLine aria-hidden="true" />
          ) : (
            <RiMenuLine aria-hidden="true" />
          )}
        </button>
      </div>
      <nav id="site-sidebar-nav" className="sidebar__nav">
        {groups.map((group) => (
          <div key={group.title} className="sidebar__group">
            <div className="sidebar__group-title">{group.title}</div>
            {group.items?.map(renderLink)}
            {group.sections?.map((section) => (
              <div key={section.title} className="sidebar__subgroup">
                <div className="sidebar__subgroup-title">{section.title}</div>
                {section.items.map(renderLink)}
              </div>
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
