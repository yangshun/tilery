'use client';

// The real, fully-interactive Tilery workspace — the second section, where the
// concept shown by the scroll animation above becomes something you can use. The
// shell fades in as it scrolls into view; the Tilery instance mounts lazily, and
// the reset button restores the default layout by remounting it.

import { LiveIdeDemo } from '../home-demo';

export function DemoScene() {
  return (
    <section className="home-demo-scene" aria-labelledby="demo-title">
      <header className="home-scene-head home-demo-scene__head">
        <h2 id="demo-title" className="home-scene-head__title">
          Try it — resize, drag, drop.
        </h2>
      </header>
      <div className="home-demo__shell home-demo-scene__shell home-reveal">
        <LiveIdeDemo />
      </div>
    </section>
  );
}
