'use client';

import { HomeScrollProvider } from './scroll-container-context';
import { HeroScene } from './scene-hero';
import { DemoScene } from './scene-demo';
import { CapabilitiesScene } from './scene-capabilities';

export function HomeContent() {
  return (
    <HomeScrollProvider>
      <div
        className="relative isolate w-full"
        style={
          {
            '--tilery-accent': 'var(--site-workspace-accent)',
            '--tilery-drop-bg':
              'color-mix(in srgb, var(--site-workspace-accent), transparent 82%)',
            '--tilery-drop-border':
              'color-mix(in srgb, var(--site-workspace-accent), transparent 28%)',
            '--home-demo-accent': 'var(--site-workspace-accent)',
            '--home-demo-drop-bg': 'var(--tilery-drop-bg)',
            '--home-demo-drop-border': 'var(--tilery-drop-border)',
            '--home-cap-card-hover-shadow':
              '0 0 0 8px rgba(107, 114, 128, 0.26)',
          } as React.CSSProperties
        }>
        <div className="relative z-1 mx-auto flex max-w-[1240px] flex-col gap-24 px-12 pt-14 pb-20 max-lg:gap-14 max-lg:px-[18px] max-lg:pt-7 max-lg:pb-14">
          <HeroScene />
          <DemoScene />
          <CapabilitiesScene />
        </div>
      </div>
    </HomeScrollProvider>
  );
}
