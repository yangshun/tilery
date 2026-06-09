'use client';

import Link from 'next/link';
import { HeroPrinciplesVisual } from './scene-principles';
import styles from './home-hero.module.css';
import { Button } from '../../components/ui/button';

export function HeroScene() {
  return (
    <section className={styles.heroScene} aria-labelledby="home-title">
      <div className={styles.heroCopy}>
        <h1 id="home-title">Build IDE-like tiled interfaces in React.</h1>
        <p className={styles.heroLead}>
          A layout engine for draggable tabs, resizable panels, preserved React
          state, and programmable workspaces.
        </p>
        <div className={styles.actions}>
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
