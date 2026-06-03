'use client';

// Top-level client orchestrator for the homepage. Provides the resolved scroll
// container to every scene, paints the ambient blueprint grid + accent glow
// behind a full-width canvas, and lays out the four scenes. The page text is
// authored inside these (server-rendered) client components, so it still ships
// in the SSR HTML.

import { HomeScrollProvider } from './scroll-container-context';
import { HeroScene } from './scene-hero';
import { PrinciplesScene } from './scene-principles';
import { CapabilitiesScene } from './scene-capabilities';
import { CtaScene } from './scene-cta';

export function HomeContent() {
  return (
    <HomeScrollProvider>
      <div className="home-page">
        <div className="home-page__bg" aria-hidden="true">
          <div className="home-grid" />
          <div className="home-glow" />
        </div>
        <div className="home-page__content">
          <HeroScene />
          <PrinciplesScene />
          <CapabilitiesScene />
          <CtaScene />
        </div>
      </div>
    </HomeScrollProvider>
  );
}
