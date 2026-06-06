'use client';

// Hero — the page headline and primary calls to action. The workspace visuals
// live in the scenes below: first the scroll-animated split, then the real,
// usable live demo.

import Link from 'next/link';

export function HeroScene() {
  return (
    <section className="home-hero-scene" aria-labelledby="home-title">
      <div className="home-hero__copy">
        <h1 id="home-title">Build IDE-like tiled interfaces in React.</h1>
        <p className="home-hero__lead">
          A layout engine for draggable tabs, resizable panels, preserved React
          state, and programmable workspaces.
        </p>
        <div className="home-actions">
          <Link
            className="site-button site-button--hero site-button--primary home-button"
            href="/docs/getting-started">
            Start building
          </Link>
          <Link
            className="site-button site-button--hero site-button--secondary home-button"
            href="/playground">
            Open playground
          </Link>
        </div>
      </div>
    </section>
  );
}
