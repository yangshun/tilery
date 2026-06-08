'use client';

import Link from 'next/link';
import { RiGithubFill } from 'react-icons/ri';
import { AccentSelector } from './accent-selector';
import { ThemeToggle } from './theme-toggle';
import { cn } from '../lib/cn';
import styles from './appearance-footer.module.css';
import { Button } from './ui/button';

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
    <div className={cn(styles.appearanceFooter, className)}>
      <div className={styles.appearanceFooter__actions}>
        <a
          href="https://github.com/yangshun/tilery"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(githubClassName)}
          aria-label="GitHub repository">
          <RiGithubFill aria-hidden="true" />
        </a>
        <ThemeToggle />
        <AccentSelector />
      </div>
      {utilityItem ? (
        <Button
          variant="secondary"
          asChild
          data-active={utilityItem.active}>
          <Link href={utilityItem.href}>{utilityItem.label}</Link>
        </Button>
      ) : null}
    </div>
  );
}
