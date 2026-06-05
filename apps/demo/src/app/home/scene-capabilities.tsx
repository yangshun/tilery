'use client';

// Scene 3 — Capabilities. The six primitives as a grid of mini-panels, each
// crowned by a faux tab-bar and animating a tiny self-contained micro-diagram
// of that primitive. Cards reveal on scroll via a CSS view() timeline (SSR-safe,
// auto-bound to the nearest scroller). The micro-diagrams are cheap CSS loops,
// paused while the section is off-screen and disabled under reduced motion.

import { useRef } from 'react';
import { useInView } from 'motion/react';
import { useHomeScroll } from './scroll-container-context';
import { capabilities, type HomeCapability } from './home-data';

function CapDemo({ type }: { type: HomeCapability['demo'] }) {
  switch (type) {
    case 'tab-move':
      return (
        <>
          <i className="home-capx home-capx-pane home-capx-pane--l" />
          <i className="home-capx home-capx-pane home-capx-pane--r" />
          <i className="home-capx home-capx-drop" />
          <i className="home-capx home-capx-fly" />
        </>
      );
    case 'resize':
      return (
        <>
          <i className="home-capx home-capx-rpane home-capx-rpane--l" />
          <i className="home-capx home-capx-rpane home-capx-rpane--r" />
          <i className="home-capx home-capx-grip" />
        </>
      );
    case 'render':
      return (
        <>
          <i className="home-capx home-capx-rbar" />
          <i className="home-capx home-capx-render-a" />
          <i className="home-capx home-capx-render-icon" />
          <i className="home-capx home-capx-render-b" />
        </>
      );
    case 'styling':
      return (
        <>
          <i className="home-capx home-capx-style-bar" />
          <i className="home-capx home-capx-style-accent" />
          <i className="home-capx home-capx-style-swatch" />
          <i className="home-capx home-capx-style-line" />
        </>
      );
    case 'core':
      return (
        <>
          <i className="home-capx home-capx-layer home-capx-layer--3" />
          <i className="home-capx home-capx-layer home-capx-layer--2" />
          <i className="home-capx home-capx-layer home-capx-layer--1" />
        </>
      );
    case 'imperative':
      return (
        <>
          <span className="home-capx home-capx-line">panel.split()</span>
          <i className="home-capx home-capx-imp-pane home-capx-imp-a" />
          <i className="home-capx home-capx-imp-pane home-capx-imp-b" />
        </>
      );
    case 'floating':
      return (
        <>
          <i className="home-capx home-capx-float-base" />
          <i className="home-capx home-capx-float-slot" />
          <i className="home-capx home-capx-float-panel" />
        </>
      );
    case 'persist':
      return (
        <>
          <i className="home-capx home-capx-persist-pane home-capx-persist-pane--l" />
          <i className="home-capx home-capx-persist-pane home-capx-persist-pane--r" />
          <pre className="home-capx home-capx-persist-token">
            {'{ "panels": 2,\n  "tabs": 7 }'}
          </pre>
        </>
      );
    case 'lock':
      return (
        <>
          <i className="home-capx home-capx-lock-pane home-capx-lock-pane--l" />
          <i className="home-capx home-capx-lock-pane home-capx-lock-pane--r" />
          <i className="home-capx home-capx-lock-divider" />
          <i className="home-capx home-capx-lock-icon home-capx-lock-icon--l" />
          <i className="home-capx home-capx-lock-shackle home-capx-lock-shackle--l" />
          <i className="home-capx home-capx-lock-icon home-capx-lock-icon--r" />
          <i className="home-capx home-capx-lock-shackle home-capx-lock-shackle--r" />
        </>
      );
  }
}

export function CapabilitiesScene() {
  const { container, isDesktopScroller } = useHomeScroll();
  const gridRef = useRef<HTMLDivElement>(null);
  const inView = useInView(gridRef, {
    root: isDesktopScroller
      ? (container as React.RefObject<Element>)
      : undefined,
    margin: '0px 0px -10% 0px',
  });

  return (
    <section
      className="home-capabilities-scene"
      aria-labelledby="capabilities-title">
      <header className="home-scene-head">
        <h2 id="capabilities-title" className="home-scene-head__title">
          The primitives for panel-based apps.
        </h2>
      </header>

      <div ref={gridRef} className="home-cap-grid" data-play={inView}>
        {capabilities.map((cap) => (
          <article key={cap.title} className="home-cap-card">
            <div className="home-tabbar home-cap-card__bar">
              <div className="home-tab home-tab--active">
                <span className="home-tab__label">{cap.title}</span>
              </div>
            </div>
            <div className="home-cap-card__body">
              <div
                className={`home-cap-demo home-cap-demo--${cap.demo} home-workspace`}>
                <CapDemo type={cap.demo} />
              </div>
              <p className="home-cap-card__desc">{cap.body}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
