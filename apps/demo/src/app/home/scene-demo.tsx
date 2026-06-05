'use client';

// The real, fully-interactive Tilery workspace — the second section, where the
// concept shown by the scroll animation above becomes something you can use. The
// shell fades in as it scrolls into view; the Tilery instance mounts lazily, and
// the reset button restores the default layout by remounting it.

import { useState } from 'react';
import { LiveIdeDemo } from '../home-demo';

export function DemoScene() {
  const [resetKey, setResetKey] = useState(0);

  return (
    <section className="home-demo-scene" aria-labelledby="demo-title">
      <header className="home-scene-head home-demo-scene__head">
        <h2 id="demo-title" className="home-scene-head__title">
          Try it — drag a tab between panels.
        </h2>
        <button
          type="button"
          className="site-button home-demo-scene__reset"
          onClick={() => setResetKey((key) => key + 1)}>
          Reset workspace
        </button>
      </header>
      <div className="home-demo__shell home-demo-scene__shell home-reveal">
        <LiveIdeDemo resetKey={resetKey} />
      </div>
    </section>
  );
}
