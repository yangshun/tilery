import Link from 'next/link';
import type { SiteNavigationItem } from '../content/navigation';

export function PageNavigation({
  previous,
  next,
}: {
  previous: SiteNavigationItem | null;
  next: SiteNavigationItem | null;
}) {
  if (!previous && !next) return null;

  return (
    <nav className="page-navigation" aria-label="Page navigation">
      {previous ? (
        <Link
          href={previous.href}
          className="page-navigation__link page-navigation__link--previous">
          <span className="page-navigation__eyebrow">Previous</span>
          <span className="page-navigation__title">{previous.label}</span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={next.href}
          className="page-navigation__link page-navigation__link--next">
          <span className="page-navigation__eyebrow">Next</span>
          <span className="page-navigation__title">{next.label}</span>
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
