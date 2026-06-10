'use client';

import Link from 'next/link';
import { RiGithubFill } from 'react-icons/ri';
import { AccentSelector } from './accent-selector';
import { ThemeToggle } from './theme-toggle';
import { cn } from '../lib/cn';
import { Button } from './ui/button';
import { ICON_BUTTON_BASE } from './ui/icon-button';

export function AppearanceFooter({
  className,
  githubClassName,
  iconClassName,
  utilityItem,
}: {
  className?: string;
  githubClassName?: string;
  iconClassName?: string;
  utilityItem?: { href: string; label: string; active?: boolean };
}) {
  return (
    <div className={cn('flex items-center justify-between gap-1', className)}>
      <div className="flex items-center gap-1">
        <a
          href="https://github.com/yangshun/tilery"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(ICON_BUTTON_BASE, iconClassName, githubClassName)}
          aria-label="GitHub repository">
          <RiGithubFill aria-hidden="true" />
        </a>
        <ThemeToggle className={iconClassName} />
        <AccentSelector className={iconClassName} />
      </div>
      {utilityItem ? (
        <Button
          variant="secondary"
          asChild
          as={Link}
          href={utilityItem.href}
          data-active={utilityItem.active}>
          {utilityItem.label}
        </Button>
      ) : null}
    </div>
  );
}
