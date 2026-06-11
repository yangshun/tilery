'use client';

import Link from 'next/link';
import { HeroPrinciplesVisual } from './scene-principles';
import { Button } from '../../components/ui/button';

export function HeroScene() {
  return (
    <section
      className="relative flex min-h-[clamp(520px,70vh,760px)] flex-col justify-center gap-8 overflow-visible pt-5 perspective-distant max-lg:min-h-auto max-lg:overflow-visible max-lg:pt-0"
      aria-labelledby="home-title">
      <div className="relative z-2 max-w-3xl pt-20 pb-20 max-lg:max-w-3xl max-lg:p-0 light:[text-shadow:0_0_1px_var(--site-bg),0_0_18px_var(--site-bg),0_0_34px_var(--site-bg)]">
        <h1
          id="home-title"
          className="m-0 max-w-3xl border-0 p-0 text-[clamp(34px,4.8vw,62px)] font-semibold leading-none tracking-tighter text-site-fg">
          Build IDE-like tiled interfaces in React.
        </h1>
        <p className="m-0 max-w-screen-sm text-[clamp(16px,1.5vw,18px)] leading-normal text-site-fg-soft">
          A layout engine for draggable tabs, resizable panels, preserved React
          state, and programmable workspaces.
        </p>
        <div className="mt-7 flex flex-wrap gap-2.5 text-shadow-none max-lg:flex-col">
          <Button
            asChild
            as={Link}
            variant="primary"
            size="hero"
            href="/docs/getting-started">
            Start building
          </Button>
          <Button
            asChild
            as={Link}
            variant="secondary"
            size="hero"
            href="/playground">
            Open playground
          </Button>
        </div>
      </div>
      <HeroPrinciplesVisual />
    </section>
  );
}
