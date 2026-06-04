'use client';

// Top-level client orchestrator for the homepage. Provides the resolved scroll
// container to every scene, paints the ambient accent glow behind a full-width
// canvas, and lays out the scenes: headline, the scroll-animated split, the
// live usable workspace, then the capabilities grid. The page text is authored
// inside these (server-rendered) client components, so it still ships in SSR.

import { HomeScrollProvider } from './scroll-container-context';
import { HeroScene } from './scene-hero';
import { PrinciplesScene } from './scene-principles';
import { DemoScene } from './scene-demo';
import { CapabilitiesScene } from './scene-capabilities';

export function HomeContent() {
  return (
    <HomeScrollProvider>
      <div className="home-page">
        <div className="home-page__bg" aria-hidden="true">
          <div className="home-glow" />
        </div>
        <div className="home-page__content">
          <HeroScene />
          <PrinciplesScene />
          <DemoScene />
          <CapabilitiesScene />
        </div>
      </div>
    </HomeScrollProvider>
  );
}
