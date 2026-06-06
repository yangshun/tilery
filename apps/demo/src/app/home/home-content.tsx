'use client';

// Top-level client orchestrator for the homepage. Provides the resolved scroll
// container to every scene and lays out the scenes: headline, the live usable
// workspace, then the capabilities grid. The page text is authored inside these
// (server-rendered) client components, so it still ships in SSR.

import { HomeScrollProvider } from './scroll-container-context';
import { HeroScene } from './scene-hero';
import { DemoScene } from './scene-demo';
import { CapabilitiesScene } from './scene-capabilities';

export function HomeContent() {
  return (
    <HomeScrollProvider>
      <div className="home-page">
        <div className="home-page__content">
          <HeroScene />
          <DemoScene />
          <CapabilitiesScene />
        </div>
      </div>
    </HomeScrollProvider>
  );
}
