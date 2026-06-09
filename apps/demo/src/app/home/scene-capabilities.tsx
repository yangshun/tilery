'use client';

import { useEffect, useRef } from 'react';
import { capabilities, type HomeCapability } from './home-data';
import { cn } from '../../lib/cn';
import styles from './home-capabilities.module.css';

function CapDemo({ type }: { type: HomeCapability['demo'] }) {
  switch (type) {
    case 'tab-move':
      return (
        <>
          <i
            className={cn(styles.capx, styles.capxPane, styles['capxPane--l'])}
          />
          <i
            className={cn(styles.capx, styles.capxPane, styles['capxPane--r'])}
          />
          <i className={cn(styles.capx, styles.capxDrop)} />
          <i className={cn(styles.capx, styles.capxFly)} />
        </>
      );
    case 'resize':
      return (
        <>
          <i
            className={cn(
              styles.capx,
              styles.capxRpane,
              styles['capxRpane--l'],
            )}
          />
          <i
            className={cn(
              styles.capx,
              styles.capxRpane,
              styles['capxRpane--r'],
            )}
          />
          <i className={cn(styles.capx, styles.capxGrip)} />
        </>
      );
    case 'render':
      return (
        <>
          <i className={cn(styles.capx, styles.capxRbar)} />
          <i className={cn(styles.capx, styles.capxRenderA)} />
          <i className={cn(styles.capx, styles.capxRenderIcon)} />
          <i className={cn(styles.capx, styles.capxRenderB)} />
        </>
      );
    case 'styling':
      return (
        <>
          <i className={cn(styles.capx, styles.capxStyleBar)} />
          <i className={cn(styles.capx, styles.capxStyleAccent)} />
          <i className={cn(styles.capx, styles.capxStyleSwatch)} />
          <i className={cn(styles.capx, styles.capxStyleLine)} />
        </>
      );
    case 'core':
      return (
        <>
          <i
            className={cn(
              styles.capx,
              styles.capxLayer,
              styles['capxLayer--3'],
            )}
          />
          <i
            className={cn(
              styles.capx,
              styles.capxLayer,
              styles['capxLayer--2'],
            )}
          />
          <i
            className={cn(
              styles.capx,
              styles.capxLayer,
              styles['capxLayer--1'],
            )}
          />
        </>
      );
    case 'imperative':
      return (
        <>
          <span className={cn(styles.capx, styles.capxLine)}>
            panel.split()
          </span>
          <i className={cn(styles.capx, styles.capxImpPane, styles.capxImpA)} />
          <i className={cn(styles.capx, styles.capxImpPane, styles.capxImpB)} />
        </>
      );
    case 'floating':
      return (
        <>
          <i className={cn(styles.capx, styles.capxFloatBase)} />
          <i className={cn(styles.capx, styles.capxFloatSlot)} />
          <i className={cn(styles.capx, styles.capxFloatPanel)} />
        </>
      );
    case 'persist':
      return (
        <>
          <i
            className={cn(
              styles.capx,
              styles.capxPersistPane,
              styles['capxPersistPane--l'],
            )}
          />
          <i
            className={cn(
              styles.capx,
              styles.capxPersistPane,
              styles['capxPersistPane--r'],
            )}
          />
          <pre className={cn(styles.capx, styles.capxPersistToken)}>
            {'{ "panels": 2,\n  "tabs": 7 }'}
          </pre>
        </>
      );
    case 'lock':
      return (
        <>
          <i
            className={cn(
              styles.capx,
              styles.capxLockPane,
              styles['capxLockPane--l'],
            )}
          />
          <i
            className={cn(
              styles.capx,
              styles.capxLockPane,
              styles['capxLockPane--r'],
            )}
          />
          <i className={cn(styles.capx, styles.capxLockDivider)} />
          <i
            className={cn(
              styles.capx,
              styles.capxLockIcon,
              styles['capxLockIcon--l'],
            )}
          />
          <i
            className={cn(
              styles.capx,
              styles.capxLockShackle,
              styles['capxLockShackle--l'],
            )}
          />
          <i
            className={cn(
              styles.capx,
              styles.capxLockIcon,
              styles['capxLockIcon--r'],
            )}
          />
          <i
            className={cn(
              styles.capx,
              styles.capxLockShackle,
              styles['capxLockShackle--r'],
            )}
          />
        </>
      );
  }
}

export function CapabilitiesScene() {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gridRef.current?.setAttribute('data-play', 'true');
  }, []);

  return (
    <section
      className={styles.capabilitiesScene}
      aria-labelledby="capabilities-title">
      <header className={styles.sceneHead}>
        <h2 id="capabilities-title" className={styles.sceneHeadTitle}>
          The primitives for panel-based apps.
        </h2>
      </header>

      <div ref={gridRef} className={styles.capGrid} data-play="true">
        {capabilities.map((cap) => (
          <article key={cap.title} className={styles.capCard}>
            <div className={cn(styles.tabbar, 'home-cap-card__bar')}>
              <div className={cn(styles.tab, styles['tab--active'])}>
                <span className={styles.tabLabel}>{cap.title}</span>
              </div>
            </div>
            <div className={styles.capCardBody}>
              <div
                className={cn(styles.capDemo, styles[`capDemo--${cap.demo}`])}>
                <CapDemo type={cap.demo} />
              </div>
              <p className={styles.capCardDesc}>{cap.body}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
