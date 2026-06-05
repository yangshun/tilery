'use client';

// Thin wrappers over motion's scroll hooks, bound to the resolved homepage
// scroller (see scroll-container-context.tsx). Only call these from a subtree
// that is mounted when `isDesktopScroller` is true, so `container.current` is a
// real element rather than null.

import { useScroll, useSpring, type MotionValue } from 'motion/react';
import type { RefObject } from 'react';
import { useHomeScroll } from './scroll-container-context';

type UseScrollOptions = NonNullable<Parameters<typeof useScroll>[0]>;
type ScrollOffset = UseScrollOptions['offset'];

/** Scroll progress (0..1) of `targetRef` within the resolved scroller. */
export function useSceneProgress(
  targetRef: RefObject<HTMLElement | null>,
  offset: ScrollOffset = ['start start', 'end end'],
): MotionValue<number> {
  const { container } = useHomeScroll();
  const { scrollYProgress } = useScroll({
    container: container as RefObject<HTMLElement>,
    target: targetRef as RefObject<HTMLElement>,
    offset,
  });
  return scrollYProgress;
}

/** Adds weight to raw scroll progress so scrubbing feels deliberate, not twitchy. */
export function useSmoothProgress(
  value: MotionValue<number>,
): MotionValue<number> {
  return useSpring(value, { stiffness: 90, damping: 26, mass: 0.4 });
}
