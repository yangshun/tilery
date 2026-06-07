'use client';

import Link from 'next/link';
import { RiGithubFill } from 'react-icons/ri';
import { AccentSelector } from './accent-selector';
import { ThemeToggle } from './theme-toggle';

export function AppearanceFooter({
  className,
  githubClassName,
  utilityItem,
}: {
  className?: string;
  githubClassName?: string;
  utilityItem?: { href: string; label: string; active?: boolean };
}) {
  return (
    <div className={className}>
      <div className="appearance-footer__actions">
        <a
          href="https://github.com/yangshun/tilery"
          target="_blank"
          rel="noopener noreferrer"
          className={`site-icon-button${githubClassName ? ` ${githubClassName}` : ''}`}
          aria-label="GitHub repository">
          <RiGithubFill aria-hidden="true" />
        </a>
        <ThemeToggle />
        <AccentSelector />
      </div>
      {utilityItem ? (
        <Link
          href={utilityItem.href}
          className="site-button site-button--secondary"
          data-active={utilityItem.active}>
          {utilityItem.label}
        </Link>
      ) : null}
    </div>
  );
}
