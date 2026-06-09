import Link from 'next/link';
import type { SiteNavigationItem } from '../content/navigation';
import { cn } from '../lib/cn';

const linkClass =
  'grid gap-[3px] min-h-16 px-4 py-3.5 content-center border border-site-border rounded-lg text-site-fg bg-site-overlay-weak no-underline hover:border-site-nav-hover-border hover:bg-site-overlay-soft hover:no-underline';

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
      className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3.5 mt-13"
      aria-label="Page navigation">
      {previous ? (
        <Link href={previous.href} className={linkClass}>
          <span className="text-site-muted text-xs font-normal">
            Previous page
          </span>
          <span className="text-site-fg text-[15px] font-medium leading-[1.3] break-anywhere max-lg:truncate">
            {previous.label}
          </span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link href={next.href} className={cn(linkClass, 'text-right')}>
          <span className="text-site-muted text-xs font-normal">Next page</span>
          <span className="text-site-fg text-[15px] font-medium leading-[1.3] break-anywhere max-lg:truncate">
            {next.label}
          </span>
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
