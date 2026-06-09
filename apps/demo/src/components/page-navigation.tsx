import Link from 'next/link';
import type { SiteNavigationItem } from '../content/navigation';
import styles from './page-navigation.module.css';
import { cn } from '../lib/cn';

export function PageNavigation({
  previous,
  next,
}: {
  previous: SiteNavigationItem | null;
  next: SiteNavigationItem | null;
}) {
  if (!previous && !next) return null;

  return (
    <nav
      data-page-nav
      className={styles.navigation}
      aria-label="Page navigation">
      {previous ? (
        <Link href={previous.href} className={styles.link}>
          <span className={styles.eyebrow}>Previous page</span>
          <span className={styles.title}>{previous.label}</span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={next.href}
          className={cn(styles.link, styles['link--next'])}>
          <span className={styles.eyebrow}>Next page</span>
          <span className={styles.title}>{next.label}</span>
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
