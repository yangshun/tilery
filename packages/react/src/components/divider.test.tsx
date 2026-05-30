// @vitest-environment jsdom

import { describe, expect, it } from 'vite-plus/test';
import React, { act, useRef } from 'react';
import { createRoot } from 'react-dom/client';

import { Divider } from './divider';
import type { Divider as DividerType } from 'tilery';

// The happy paths for Divider (vertical drag, horizontal drag, divider
// styling) are covered through Tilery's integration test. This file pins
// the defensive branches the integration test doesn't reach — the
// null-container guard and the horizontal-axis math.

const VERTICAL_DIVIDER: DividerType = {
  id: 'v|A|B',
  orientation: 'vertical',
  position: 40,
  start: 0,
  end: 100,
  beforePanels: ['A'],
  afterPanels: ['B'],
};

const HORIZONTAL_DIVIDER: DividerType = {
  id: 'h|A|B',
  orientation: 'horizontal',
  position: 50,
  start: 0,
  end: 100,
  beforePanels: ['A'],
  afterPanels: ['B'],
};

function mountWithRef({
  divider,
  populateRef,
  onDrag,
}: {
  divider: DividerType;
  populateRef: boolean;
  onDrag: (id: string, pct: number) => void;
}) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);

  function App() {
    const ref = useRef<HTMLDivElement | null>(null);
    return React.createElement(
      'div',
      {
        ref: (el: HTMLDivElement | null) => {
          if (!populateRef) return;
          ref.current = el;
          if (el) {
            el.getBoundingClientRect = () =>
              ({
                left: 0,
                top: 0,
                right: 1000,
                bottom: 800,
                width: 1000,
                height: 800,
                x: 0,
                y: 0,
                toJSON: () => ({}),
              }) as DOMRect;
          }
        },
      },
      React.createElement(Divider, { divider, onDrag, containerRef: ref }),
    );
  }
  act(() => {
    root.render(React.createElement(App));
  });
  const el = host.querySelector('.tilery__divider') as HTMLDivElement;
  const key = Object.keys(el).find((k) => k.startsWith('__reactProps')) as
    | string
    | undefined;
  const handlers = (
    el as unknown as Record<string, Record<string, (e: unknown) => void>>
  )[key!];
  return {
    el,
    handlers,
    cleanup() {
      act(() => {
        root.unmount();
      });
      host.remove();
    },
  };
}

function pointerEvent(
  overrides: Partial<{ clientX: number; clientY: number }> = {},
): React.PointerEvent {
  return {
    button: 0,
    pointerId: 1,
    clientX: 0,
    clientY: 0,
    ...overrides,
    preventDefault() {},
    stopPropagation() {},
    currentTarget: {
      setPointerCapture() {},
      releasePointerCapture() {},
    } as unknown as HTMLElement,
  } as unknown as React.PointerEvent;
}

describe('Divider — horizontal axis math', () => {
  it('uses clientY for horizontal dividers', () => {
    const recorded: Array<{ id: string; pct: number }> = [];
    const t = mountWithRef({
      divider: HORIZONTAL_DIVIDER,
      populateRef: true,
      onDrag: (id, pct) => recorded.push({ id, pct }),
    });
    t.handlers.onPointerDown(pointerEvent());
    t.handlers.onPointerMove(pointerEvent({ clientX: 0, clientY: 200 }));
    // 200 / 800 = 25%.
    expect(recorded).toEqual([{ id: 'h|A|B', pct: 25 }]);
    t.cleanup();
  });

  it('renders horizontal dividers with row-resize cursor + correct geometry', () => {
    const t = mountWithRef({
      divider: HORIZONTAL_DIVIDER,
      populateRef: true,
      onDrag: () => {},
    });
    expect(t.el.style.cursor).toBe('row-resize');
    expect(t.el.style.height).toBe('8px');
    expect(t.el.style.width).toBe('100%');
    expect(t.el.getAttribute('aria-orientation')).toBe('horizontal');
    t.cleanup();
  });
});

describe('Divider — defensive null container', () => {
  it('no-ops onMove when container ref is null', () => {
    const recorded: number[] = [];
    const t = mountWithRef({
      divider: VERTICAL_DIVIDER,
      populateRef: false, // ref never points at anything
      onDrag: (_, pct) => recorded.push(pct),
    });
    t.handlers.onPointerDown(pointerEvent());
    t.handlers.onPointerMove(pointerEvent({ clientX: 500, clientY: 400 }));
    expect(recorded).toEqual([]);
    t.cleanup();
  });
});
