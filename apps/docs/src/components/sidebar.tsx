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

  function renderLink(item: SiteNavigationItem, inSubgroup?: boolean) {
    const isActive = pathname === item.href;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          'sidebar-link block px-2 py-1.5 text-[13px] text-site-fg no-underline rounded-md transition-[background,color] duration-150 ease-in-out hover:text-site-fg hover:bg-site-overlay hover:no-underline [.sidebar-link+&]:mt-0.5',
          isActive && 'bg-site-overlay text-site-fg',
          inSubgroup && 'pl-3.5',
        )}>
        {item.label}
      </Link>
    );
  }

  return (
    <aside
      className={cn(
        'sidebar w-[var(--site-sidebar-width)] h-full flex flex-col overflow-hidden rounded-[10px] bg-site-sidebar-bg border border-site-sidebar-border max-lg:w-full max-lg:max-h-none max-lg:overflow-hidden max-lg:bg-site-bg/88',
        isOpen && 'sidebar--open',
      )}>
      <div className="flex items-center justify-between px-3 pt-[11px] pb-2.5 border-b border-site-sidebar-border max-lg:gap-4 max-lg:px-3 max-lg:py-2.5">
        <Link
          href="/"
          className="font-bold text-base text-site-fg no-underline hover:no-underline">
          Tilery
        </Link>
        <div className="flex items-center gap-1">
          <IconButton
            className="hidden max-lg:inline-flex"
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
      <nav
        id="site-sidebar-nav"
        className={cn(
          'flex-1 pt-2 px-1 pb-1 overflow-y-auto max-lg:hidden',
          isOpen &&
            'max-lg:!block max-lg:max-h-[min(60vh,420px)] max-lg:overflow-y-auto',
        )}>
        {groups.map((group) => (
          <div key={group.title} className="mb-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-site-accent px-2 py-1 mb-1">
              {group.title}
            </div>
            {group.items?.map((item) => renderLink(item))}
            {group.sections?.map((section, sectionIndex) => (
              <div
                key={section.title}
                className={cn(
                  sectionIndex === 0 && !group.items?.length ? 'mt-0' : 'mt-2',
                )}>
                <div className="px-2 py-1.5 mb-0.5 text-site-fg text-[13px] font-medium">
                  {section.title}
                </div>
                {section.items.map((item) => renderLink(item, true))}
              </div>
            ))}
          </div>
        ))}
      </nav>
      <AppearanceFooter
        className={cn(
          'shrink-0 mt-auto px-3 py-2 border-t border-site-sidebar-border',
          !isOpen && 'max-lg:border-t-0',
        )}
        iconClassName="size-7"
        githubClassName="text-lg rounded-[7px] !text-[17px]"
        utilityItem={{
          href: utilityItem.href,
          label: utilityItem.label,
          active: pathname === utilityItem.href,
        }}
      />
    </aside>
  );
}
