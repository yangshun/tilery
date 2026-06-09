'use client';

import { HomeScrollProvider } from './scroll-container-context';
import { HeroScene } from './scene-hero';
import { DemoScene } from './scene-demo';
import { CapabilitiesScene } from './scene-capabilities';
import styles from './home-content.module.css';

export function HomeContent() {
  return (
    <HomeScrollProvider>
      <div className={styles.page}>
        <div className={styles.pageContent}>
          <HeroScene />
          <DemoScene />
          <CapabilitiesScene />
        </div>
      </div>
    </HomeScrollProvider>
  );
}
