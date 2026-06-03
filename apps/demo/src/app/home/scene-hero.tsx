'use client';

// Scene 1 — Hero. The workspace "boots up" on load (panels assemble, tabs
// stagger in, code types itself), runs one auto-play tab-drag loop showcasing
// the signature drop-into-split interaction, then dissolves to reveal the real,
// interactive <LiveIdeDemo/> underneath. Boot/drag are load-based (not scroll)
// and fully skipped under reduced motion, where the live demo shows immediately.

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { LiveIdeDemo } from '../home-demo';
import { useHomeScroll } from './scroll-container-context';
import {
  HomeCursor,
  HomeDragGhost,
  HomeDropOverlay,
  HomeStatusBar,
} from './stunt-tilery';

const EASE = [0.22, 1, 0.36, 1] as const;

const BOOT_MS = 1500;
const DRAG_MS = 2400;

// ---------------------------------------------------------------------------
// Typewriter — reveals text character by character after a delay. Returns the
// full string immediately when disabled (reduced motion / SSR).
// ---------------------------------------------------------------------------
function useTyped(text: string, startDelay: number, cps: number, enabled: boolean) {
  const [count, setCount] = useState(enabled ? 0 : text.length);

  useEffect(() => {
    if (!enabled) {
      setCount(text.length);
      return;
    }
    setCount(0);
    let i = 0;
    let interval: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      interval = setInterval(() => {
        i += 1;
        setCount(i);
        if (i >= text.length && interval) clearInterval(interval);
      }, 1000 / cps);
    }, startDelay);
    return () => {
      clearTimeout(start);
      if (interval) clearInterval(interval);
    };
  }, [text, startDelay, cps, enabled]);

  return text.slice(0, count);
}

function Typed({
  text,
  startDelay,
  cps = 30,
  enabled,
}: {
  text: string;
  startDelay: number;
  cps?: number;
  enabled: boolean;
}) {
  const shown = useTyped(text, startDelay, cps, enabled);
  return (
    <>
      {shown}
      {enabled && shown.length < text.length ? (
        <span className="home-code__caret" aria-hidden="true" />
      ) : null}
    </>
  );
}

// ---------------------------------------------------------------------------
// Boot overlay — the faux workspace that assembles, runs one drag loop, then
// fades out to reveal the live demo. Sits above the live demo, pointer-events
// none, so the real engine is interactive even during the intro.
// ---------------------------------------------------------------------------
function panelRise(delay: number): {
  initial: { opacity: number; scale: number; y: number };
  animate: { opacity: number; scale: number; y: number };
  transition: { delay: number; duration: number; ease: typeof EASE };
} {
  return {
    initial: { opacity: 0, scale: 0.97, y: 6 },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: { delay, duration: 0.4, ease: EASE },
  };
}

function BootTab({ label, active, delay }: { label: string; active?: boolean; delay: number }) {
  return (
    <motion.div
      className={`home-tab${active ? ' home-tab--active' : ''}`}
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.26, ease: EASE }}>
      <span className="home-tab__label">{label}</span>
    </motion.div>
  );
}

function BootOverlay() {
  const [phase, setPhase] = useState<'boot' | 'drag' | 'out'>('boot');

  useEffect(() => {
    const toDrag = setTimeout(() => setPhase('drag'), BOOT_MS);
    const toOut = setTimeout(() => setPhase('out'), BOOT_MS + DRAG_MS);
    return () => {
      clearTimeout(toDrag);
      clearTimeout(toOut);
    };
  }, []);

  return (
    <motion.div
      className="home-boot"
      aria-hidden="true"
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === 'out' ? 0 : 1 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}>
      <div className="home-boot__row">
        {/* Sidebar / explorer */}
        <motion.div className="home-panel home-boot__sidebar" {...panelRise(0.12)}>
          <div className="home-tabbar">
            <BootTab label="Explorer" active delay={0.7} />
          </div>
          <div className="home-boot__content home-boot__tree">
            <div>src/</div>
            <div className="home-boot__indent">index.ts</div>
            <div className="home-boot__indent">app.tsx</div>
            <div>package.json</div>
          </div>
        </motion.div>

        <div className="home-boot__col">
          {/* Editor */}
          <motion.div className="home-panel home-boot__editor" {...panelRise(0.32)}>
            <div className="home-tabbar">
              <BootTab label="index.ts" active delay={0.76} />
              <BootTab label="app.tsx" delay={0.82} />
            </div>
            <pre className="home-boot__content home-code">
              <Typed
                text={"export function index() {\n  return 'hello';\n}"}
                startDelay={1000}
                enabled
              />
            </pre>
          </motion.div>

          {/* Terminal */}
          <motion.div className="home-panel home-boot__terminal" {...panelRise(0.5)}>
            <div className="home-tabbar">
              <BootTab label="Terminal" active delay={0.88} />
            </div>
            <pre className="home-boot__content home-code home-boot__term">
              <Typed
                text={'$ npm run dev\n> ready on http://localhost:3000'}
                startDelay={1180}
                cps={42}
                enabled
              />
            </pre>
          </motion.div>
        </div>
      </div>

      {/* Auto-play drag loop: ghost cursor carries the app.tsx tab into the
          terminal, the blue drop overlay blooms, then it releases. One cycle. */}
      <AnimatePresence>
        {phase === 'drag' ? (
          <motion.div
            className="home-boot__drag"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}>
            <motion.div
              className="home-boot__drop"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0, 1, 1, 0.6] }}
              transition={{ duration: DRAG_MS / 1000, times: [0, 0.45, 0.6, 0.85, 1], ease: 'easeOut' }}>
              <HomeDropOverlay />
            </motion.div>
            <motion.div
              className="home-boot__cursor"
              initial={{ left: '58%', top: '14%', opacity: 0 }}
              animate={{
                left: ['58%', '58%', '72%', '72%'],
                top: ['14%', '14%', '74%', '74%'],
                opacity: [0, 1, 1, 0],
                scale: [1, 1, 0.92, 1],
              }}
              transition={{ duration: DRAG_MS / 1000, times: [0, 0.1, 0.7, 1], ease: EASE }}>
              <HomeCursor />
              <HomeDragGhost className="home-boot__ghost" label="app.tsx" />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Hero scene
// ---------------------------------------------------------------------------
function Reveal({
  children,
  className,
  delay = 0,
  reduce,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  reduce: boolean;
}) {
  if (reduce) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: EASE }}>
      {children}
    </motion.div>
  );
}

export function HeroScene() {
  const { reduce } = useHomeScroll();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showBoot = mounted && !reduce;

  return (
    <section className="home-hero-scene" aria-labelledby="home-title">
      <Reveal className="home-hero__copy" delay={0.05} reduce={reduce}>
        <h1 id="home-title">Build IDE-like tiled interfaces in React.</h1>
        <p className="home-hero__lead">
          A layout engine for draggable tabs, resizable panels, preserved React
          state, and programmable workspaces.
        </p>
        <div className="home-actions">
          <Link
            className="home-button home-button--primary"
            href="/docs/getting-started">
            Start building
          </Link>
          <Link
            className="home-button home-button--secondary"
            href="/examples/ide">
            Open the IDE example
          </Link>
        </div>
      </Reveal>

      <Reveal className="home-hero__shell" delay={0.18} reduce={reduce}>
        <div className="home-demo__shell home-hero__demo-shell">
          <div className="home-hero__stage">
            <LiveIdeDemo className="home-hero__viewport" />
            {showBoot ? <BootOverlay /> : null}
          </div>
          <HomeStatusBar
            className="home-hero__statusbar"
            segments={['ready', '4 panels', '7 tabs', 'main*']}
            pulse={!reduce}
          />
        </div>
        <p className="home-hero__hint">
          <span aria-hidden="true">↑</span> live — drag a tab between panels
        </p>
      </Reveal>
    </section>
  );
}
