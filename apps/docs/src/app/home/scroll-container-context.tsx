'use client';

// Resolves which element actually scrolls the homepage and exposes it to scenes
// that need viewport-aware playback. Above 1024px the page scrolls inside
// `<main data-scroll-root>`, but at <=1024px the layout flips to
// `overflow: visible` and the WINDOW scrolls instead.
//
// Strategy: render a `display:contents` sentinel, walk up to `[data-scroll-root]`, and
// decide per-breakpoint whether that element is the scroller. Capability cards
// use this as their in-view root, and every animated scene shares the reduced
// motion preference from here.

import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { useReducedMotion } from 'motion/react';

type HomeScrollContextValue = {
  /** The scroll container ref for `useScroll({ container })`; null on mobile/window. */
  container: RefObject<HTMLElement | null>;
  /** True once the scroller has been resolved on the client. */
  ready: boolean;
  /** True when the data-scroll-root element is the active scroller (desktop layout). */
  isDesktopScroller: boolean;
  /** OS "reduce motion" preference; the single source of truth for all scenes. */
  reduce: boolean;
};

const HomeScrollContext = createContext<HomeScrollContextValue | null>(null);

const MOBILE_QUERY = '(max-width: 1024px)';

export function HomeScrollProvider({ children }: { children: ReactNode }) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const [ready, setReady] = useState(false);
  const [isDesktopScroller, setIsDesktopScroller] = useState(false);
  const reduce = useReducedMotion() ?? false;

  useLayoutEffect(() => {
    const resolve = () => {
      const main =
        sentinelRef.current?.closest<HTMLElement>('[data-scroll-root]') ?? null;
      const mobile = window.matchMedia(MOBILE_QUERY).matches;
      const desktopScroller = !mobile && main !== null;
      // null => useScroll falls back to the window (correct on mobile).
      containerRef.current = desktopScroller ? main : null;
      setIsDesktopScroller(desktopScroller);
      setReady(true);
    };

    resolve();
    const mq = window.matchMedia(MOBILE_QUERY);
    mq.addEventListener('change', resolve);
    window.addEventListener('resize', resolve);
    return () => {
      mq.removeEventListener('change', resolve);
      window.removeEventListener('resize', resolve);
    };
  }, []);

  return (
    <HomeScrollContext.Provider
      value={{ container: containerRef, ready, isDesktopScroller, reduce }}>
      <div ref={sentinelRef} style={{ display: 'contents' }}>
        {children}
      </div>
    </HomeScrollContext.Provider>
  );
}

export function useHomeScroll(): HomeScrollContextValue {
  const ctx = useContext(HomeScrollContext);
  if (ctx === null) {
    throw new Error('useHomeScroll must be used within a HomeScrollProvider');
  }
  return ctx;
}
