'use client';

// Scene 2 — Principles. On desktop this is a pinned, scroll-scrubbed scene: a
// single panel splits 1 -> 2 -> 3 as you scroll, each new panel revealing one
// principle, with a typed controller call and a mini form whose state is never
// reset (literally demonstrating "state that follows the work"). On mobile, or
// when the scroller can't be resolved, or under reduced motion, it degrades to
// three stacked cards.

import { useRef } from 'react';
import { motion, useTransform } from 'motion/react';
import { useHomeScroll } from './scroll-container-context';
import { useSceneProgress, useSmoothProgress } from './use-home-scroll';
import { principles } from './home-data';

function PrinciplesHead() {
  return (
    <header className="home-scene-head">
      <span className="home-scene-head__kicker">// principles</span>
      <h2 className="home-scene-head__title">One surface. The work splits to fit.</h2>
    </header>
  );
}

function StaticPrinciples() {
  return (
    <section className="home-principles-scene home-principles-scene--static">
      <PrinciplesHead />
      <div className="home-principles-static">
        {principles.map((item) => (
          <article key={item.title} className="home-principle home-reveal">
            <h3>{item.title}</h3>
            <p>{item.body}</p>
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
  const tGrow = useTransform(p, [0.5, 0.7], [0, 0.66]);
  const p1 = useTransform(p, [0.04, 0.16], [0, 1]);
  const p2 = useTransform(p, [0.34, 0.5], [0, 1]);
  const p3 = useTransform(p, [0.66, 0.82], [0, 1]);
  const codeReveal = useTransform(p, [0.36, 0.46], [0, 1]);

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
                  <span className="home-tab__label">workspace.tsx</span>
                </div>
              </div>
              <motion.div className="home-pp__body" style={{ opacity: p1 }}>
                <h3>{principles[0].title}</h3>
                <p>{principles[0].body}</p>
              </motion.div>
            </div>

            {/* Column B — grows in as the first split */}
            <motion.div className="home-pp__b" style={{ flexGrow: bGrow }}>
              <div className="home-panel home-pp__panel home-pp__editor">
                <div className="home-tabbar">
                  <div className="home-tab home-tab--active">
                    <span className="home-tab__label">state.tsx</span>
                  </div>
                </div>
                <motion.div className="home-pp__body" style={{ opacity: p2 }}>
                  <h3>{principles[1].title}</h3>
                  <p>{principles[1].body}</p>
                  <label className="home-pp__form">
                    <span>name</span>
                    {/* Never remounted, so the typed value survives every split. */}
                    <input
                      type="text"
                      defaultValue="ada@lovelace.dev"
                      readOnly
                      tabIndex={-1}
                      aria-hidden="true"
                    />
                  </label>
                </motion.div>
              </div>

              {/* Panel C — the second split */}
              <motion.div className="home-pp__term-wrap" style={{ flexGrow: tGrow }}>
                <div className="home-panel home-pp__panel home-pp__terminal">
                  <div className="home-tabbar">
                    <div className="home-tab home-tab--active">
                      <span className="home-tab__label">api.ts</span>
                    </div>
                  </div>
                  <motion.div className="home-pp__body" style={{ opacity: p3 }}>
                    <h3>{principles[2].title}</h3>
                    <p>{principles[2].body}</p>
                    <motion.pre className="home-code" style={{ opacity: codeReveal }}>
                      api.split(&apos;editor&apos;, &apos;right&apos;)
                    </motion.pre>
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
