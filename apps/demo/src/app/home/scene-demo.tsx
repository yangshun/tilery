'use client';

import { LiveIdeDemo } from '../home-demo';
import { cn } from '../../lib/cn';
import styles from './home-demo-section.module.css';

export function DemoScene() {
  return (
    <section className={styles.demoScene} aria-labelledby="demo-title">
      <header className={cn(styles.sceneHead, styles.demoSceneHead)}>
        <h2 id="demo-title" className={styles.sceneHeadTitle}>
          Try it — resize, drag, drop.
        </h2>
      </header>
      <div className={cn(styles.demoShell, styles.demoReveal)}>
        <LiveIdeDemo />
      </div>
    </section>
  );
}
