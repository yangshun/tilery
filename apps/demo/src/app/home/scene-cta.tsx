'use client';

// Scene 4 — Closing CTA. "Go deeper" reframed as a command palette: a faux
// panel whose rows are the doc/example links, each with a mono `>` prefix and a
// keycap hint. Rows reveal on scroll (CSS view() timeline) and the page ends on
// the workspace's own status bar.

import Link from 'next/link';
import { useHomeScroll } from './scroll-container-context';
import { HomeStatusBar } from './stunt-tilery';
import { links } from './home-data';

export function CtaScene() {
  const { reduce } = useHomeScroll();

  return (
    <section className="home-cta-scene" aria-labelledby="next-title">
      <div className="home-demo__shell home-cta__panel">
        <div className="home-tabbar home-cta__bar">
          <div className="home-tab home-tab--active">
            <span className="home-tab__label">command palette</span>
          </div>
          <span className="home-cta__kbd" aria-hidden="true">
            ⌘K
          </span>
        </div>

        <div className="home-cta__body">
          <h2 id="next-title" className="home-cta__title">
            Go deeper.
          </h2>
          <nav className="home-cta__rows" aria-label="Next steps">
            {links.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                className="home-cmdrow home-reveal"
                style={{ '--reveal-i': i }}>
                <span className="home-cmdrow__prefix" aria-hidden="true">
                  &gt;
                </span>
                <span className="home-cmdrow__label">{link.label}</span>
                <span className="home-cmdrow__hint">{link.hint}</span>
              </Link>
            ))}
          </nav>
        </div>

        <HomeStatusBar
          className="home-cta__statusbar"
          segments={['ready', 'go build', 'main*']}
          pulse={!reduce}
        />
      </div>
    </section>
  );
}
