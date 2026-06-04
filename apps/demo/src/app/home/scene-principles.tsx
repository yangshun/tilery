'use client';

// Scene 2. On desktop this is a pinned, scroll-scrubbed scene: a single panel
// splits 1 -> 2 -> 3 as you scroll, each new panel revealing one point about the
// engine (with an icon). On mobile, or when the scroller can't be resolved, or
// under reduced motion, it degrades to three stacked cards.

import { useRef } from 'react';
import type { IconType } from 'react-icons';
import { RiBracesLine, RiCpuLine, RiLayoutGridLine } from 'react-icons/ri';
import { motion, useTransform } from 'motion/react';
import { useHomeScroll } from './scroll-container-context';
import { useSceneProgress, useSmoothProgress } from './use-home-scroll';
import { principles } from './home-data';

const principleIcons: IconType[] = [RiLayoutGridLine, RiCpuLine, RiBracesLine];
const principleTabs = ['workspace.tsx', 'core.ts', 'package.json'];

function PrinciplesHead() {
  return (
    <header className="home-scene-head">
      <h2 className="home-scene-head__title">Window management, effortlessly.</h2>
    </header>
  );
}

function PrincipleBody({ index }: { index: number }) {
  const Icon = principleIcons[index];
  const item = principles[index];
  return (
    <>
      <span className="home-pp__icon" aria-hidden="true">
        <Icon />
      </span>
      <h3>{item.title}</h3>
      <p>{item.body}</p>
    </>
  );
}

function StaticPrinciples() {
  return (
    <section className="home-principles-scene home-principles-scene--static">
      <PrinciplesHead />
      <div className="home-principles-static">
        {principles.map((item, i) => (
          <article key={item.title} className="home-principle home-reveal">
            <PrincipleBody index={i} />
          </article>
        ))}
      </div>
    </section>
  );
}

function ScrubPrinciples() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const raw = useSceneProgress(sceneRef, ['start start', 'end end']);
  const p = useSmoothProgress(raw);

  const bGrow = useTransform(p, [0.12, 0.32], [0, 1]);
  const tGrow = useTransform(p, [0.5, 0.7], [0, 1]);
  const p1 = useTransform(p, [0.04, 0.16], [0, 1]);
  const p2 = useTransform(p, [0.34, 0.5], [0, 1]);
  const p3 = useTransform(p, [0.66, 0.82], [0, 1]);

  return (
    <section
      ref={sceneRef}
      className="home-principles-scene home-principles-scene--scrub">
      <div className="home-principles__sticky">
        <PrinciplesHead />
        <div className="home-principles__stage">
          <div className="home-principles__row home-workspace">
            {/* Panel A — always present */}
            <div className="home-panel home-pp__panel home-pp__a">
              <div className="home-tabbar">
                <div className="home-tab home-tab--active">
                  <span className="home-tab__label">{principleTabs[0]}</span>
                </div>
              </div>
              <motion.div className="home-pp__body" style={{ opacity: p1 }}>
                <PrincipleBody index={0} />
              </motion.div>
            </div>

            {/* Column B — grows in as the first split */}
            <motion.div className="home-pp__b" style={{ flexGrow: bGrow }}>
              <div className="home-panel home-pp__panel home-pp__editor">
                <div className="home-tabbar">
                  <div className="home-tab home-tab--active">
                    <span className="home-tab__label">{principleTabs[1]}</span>
                  </div>
                </div>
                <motion.div className="home-pp__body" style={{ opacity: p2 }}>
                  <PrincipleBody index={1} />
                </motion.div>
              </div>

              {/* Panel C — the second split */}
              <motion.div className="home-pp__term-wrap" style={{ flexGrow: tGrow }}>
                <div className="home-panel home-pp__panel home-pp__terminal">
                  <div className="home-tabbar">
                    <div className="home-tab home-tab--active">
                      <span className="home-tab__label">{principleTabs[2]}</span>
                    </div>
                  </div>
                  <motion.div className="home-pp__body" style={{ opacity: p3 }}>
                    <PrincipleBody index={2} />
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PrinciplesScene() {
  const { ready, isDesktopScroller, reduce } = useHomeScroll();

  if (!ready || !isDesktopScroller || reduce) {
    return <StaticPrinciples />;
  }
  return <ScrubPrinciples />;
}
