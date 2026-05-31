// @vitest-environment jsdom

import { describe, expect, it } from 'vite-plus/test';
import React, { act, useRef } from 'react';
import { createRoot } from 'react-dom/client';

import { TileryDivider } from './divider';
import type { TileryDivider as DividerType } from 'tilery/internal';

// The happy paths for TileryDivider (vertical drag, horizontal drag, divider
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

const DEFAULT_ACCESSIBILITY = {
  label: 'Resize A pane',
  controls: 'tilery-panel-A',
  valueMin: 10,
  valueMax: 90,
  valueNow: 40,
  valueText: '40%',
  minPosition: 10,
  maxPosition: 90,
  axisStart: 0,
  axisEnd: 100,
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
      React.createElement(TileryDivider, {
        divider,
        accessibility: DEFAULT_ACCESSIBILITY,
        onDrag,
        containerRef: ref,
      }),
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

function keyboardEvent(key: string, shiftKey = false) {
  let prevented = false;
  let stopped = false;
  const event = {
    key,
    shiftKey,
    preventDefault() {
      prevented = true;
    },
    stopPropagation() {
      stopped = true;
    },
  } as unknown as React.KeyboardEvent<HTMLDivElement>;
  return {
    event,
    get prevented() {
      return prevented;
    },
    get stopped() {
      return stopped;
    },
  };
}

describe('TileryDivider — horizontal axis math', () => {
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
    expect(t.el.style.height).toBe('24px');
    expect(t.el.style.width).toBe('100%');
    expect(t.el.getAttribute('role')).toBe('separator');
    expect(t.el.tabIndex).toBe(0);
    expect(t.el.getAttribute('aria-label')).toBe('Resize A pane');
    expect(t.el.getAttribute('aria-controls')).toBe('tilery-panel-A');
    expect(t.el.getAttribute('aria-orientation')).toBe('horizontal');
    expect(t.el.getAttribute('aria-valuemin')).toBe('10');
    expect(t.el.getAttribute('aria-valuemax')).toBe('90');
    expect(t.el.getAttribute('aria-valuenow')).toBe('40');
    expect(t.el.getAttribute('aria-valuetext')).toBe('40%');
    expect(t.el.getAttribute('aria-keyshortcuts')).toBe(
      'ArrowUp ArrowDown Home End',
    );
    t.cleanup();
  });

  it('resizes horizontal dividers from the keyboard', () => {
    const recorded: number[] = [];
    const t = mountWithRef({
      divider: HORIZONTAL_DIVIDER,
      populateRef: true,
      onDrag: (_, pct) => recorded.push(pct),
    });
    const up = keyboardEvent('ArrowUp');
    const down = keyboardEvent('ArrowDown');
    const home = keyboardEvent('Home');
    const end = keyboardEvent('End');
    const noop = keyboardEvent('ArrowLeft');

    t.handlers.onKeyDown(up.event);
    t.handlers.onKeyDown(down.event);
    t.handlers.onKeyDown(home.event);
    t.handlers.onKeyDown(end.event);
    t.handlers.onKeyDown(noop.event);

    expect(recorded).toEqual([48, 52, 10, 90]);
    expect(up.prevented).toBe(true);
    expect(up.stopped).toBe(true);
    expect(noop.prevented).toBe(false);
    expect(noop.stopped).toBe(false);
    t.cleanup();
  });
});

describe('TileryDivider — defensive null container', () => {
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

describe('TileryDivider — vertical keyboard resizing', () => {
  it('resizes vertical dividers from the keyboard', () => {
    const recorded: number[] = [];
    const t = mountWithRef({
      divider: VERTICAL_DIVIDER,
      populateRef: true,
      onDrag: (_, pct) => recorded.push(pct),
    });
    const left = keyboardEvent('ArrowLeft');
    const right = keyboardEvent('ArrowRight');
    const fastRight = keyboardEvent('ArrowRight', true);
    const noop = keyboardEvent('ArrowDown');

    t.handlers.onKeyDown(left.event);
    t.handlers.onKeyDown(right.event);
    t.handlers.onKeyDown(fastRight.event);
    t.handlers.onKeyDown(noop.event);

    expect(recorded).toEqual([38, 42, 50]);
    expect(left.prevented).toBe(true);
    expect(left.stopped).toBe(true);
    expect(noop.prevented).toBe(false);
    expect(noop.stopped).toBe(false);
    expect(t.el.getAttribute('aria-keyshortcuts')).toBe(
      'ArrowLeft ArrowRight Home End',
    );
    t.cleanup();
  });
});
