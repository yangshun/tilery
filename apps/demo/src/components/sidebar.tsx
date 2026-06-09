'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { RiCloseLine, RiMenuLine } from 'react-icons/ri';
import type {
  SiteNavigationGroup,
  SiteNavigationItem,
} from '../content/navigation';
import { AppearanceFooter } from './appearance-footer';
import { IconButton } from './ui/icon-button';
import { cn } from '../lib/cn';
import styles from './sidebar.module.css';

export function Sidebar({
  groups,
  utilityItem,
}: {
  groups: SiteNavigationGroup[];
  utilityItem: SiteNavigationItem;
}) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  function renderLink(item: SiteNavigationItem) {
    const isActive = pathname === item.href;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          styles.sidebar__link,
          isActive && styles['sidebar__link--active'],
        )}>
        {item.label}
      </Link>
    );
  }

  return (
    <aside className={cn(styles.sidebar, isOpen && styles['sidebar--open'])}>
      <div className={styles.sidebar__header}>
        <Link href="/" className={styles.sidebar__logo}>
          Tilery
        </Link>
        <div className={styles.sidebar__headerActions}>
          <IconButton
            className={styles.sidebar__toggle}
            aria-expanded={isOpen}
            aria-controls="site-sidebar-nav"
            aria-label={
              isOpen ? 'Close navigation menu' : 'Open navigation menu'
            }
            onClick={() => setIsOpen((open) => !open)}>
            {isOpen ? (
              <RiCloseLine aria-hidden="true" />
            ) : (
              <RiMenuLine aria-hidden="true" />
            )}
          </IconButton>
        </div>
      </div>
      <nav id="site-sidebar-nav" className={styles.sidebar__nav}>
        {groups.map((group) => (
          <div key={group.title} className={styles.sidebar__group}>
            <div className={styles.sidebar__groupTitle}>{group.title}</div>
            {group.items?.map(renderLink)}
            {group.sections?.map((section) => (
              <div key={section.title} className={styles.sidebar__subgroup}>
                <div className={styles.sidebar__subgroupTitle}>
                  {section.title}
                </div>
                {section.items.map(renderLink)}
              </div>
            ))}
          </div>
        ))}
      </nav>
      <AppearanceFooter
        className={styles.sidebar__appearance}
        githubClassName={cn(styles.sidebar__iconButton, styles.sidebar__github)}
        utilityItem={{
          href: utilityItem.href,
          label: utilityItem.label,
          active: pathname === utilityItem.href,
        }}
      />
    </aside>
  );
}
