// @vitest-environment jsdom

import '../test-dom-setup';

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
  accessibility = DEFAULT_ACCESSIBILITY,
  disabled,
  hitSize,
  populateRef,
  onDrag,
}: {
  divider: DividerType;
  accessibility?: typeof DEFAULT_ACCESSIBILITY;
  disabled?: boolean;
  hitSize?: number;
  populateRef: boolean;
  onDrag: (
    id: string,
    pct: number,
    input: 'keyboard' | 'pointer',
  ) => boolean | void;
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
        accessibility,
        disabled,
        hitSize,
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
      onDrag: (id, pct) => {
        recorded.push({ id, pct });
      },
    });
    act(() => {
      t.handlers.onPointerDown(pointerEvent());
    });
    t.handlers.onPointerMove(pointerEvent({ clientX: 0, clientY: 200 }));
    act(() => {
      t.handlers.onPointerUp(pointerEvent());
    });
    // 200 / 800 = 25%.
    expect(recorded).toEqual([{ id: 'h|A|B', pct: 25 }]);
    t.cleanup();
  });

  it('marks disabled state and ignores pointer and keyboard resize', () => {
    const recorded: number[] = [];
    const t = mountWithRef({
      divider: HORIZONTAL_DIVIDER,
      disabled: true,
      populateRef: true,
      onDrag: (_, pct) => {
        recorded.push(pct);
      },
    });

    expect(t.el.hasAttribute('data-resize-disabled')).toBe(true);
    expect(t.el.getAttribute('aria-disabled')).toBe('true');
    expect(t.el.tabIndex).toBe(-1);
    expect(t.el.style.cursor).toBe('default');
    act(() => {
      t.handlers.onPointerDown?.(pointerEvent());
    });
    t.handlers.onPointerMove?.(pointerEvent({ clientX: 0, clientY: 200 }));
    t.handlers.onKeyDown(keyboardEvent('ArrowDown').event);
    expect(recorded).toEqual([]);
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
    expect(t.el.getAttribute('data-orientation')).toBe('horizontal');
    expect(t.el.hasAttribute('data-resize-active')).toBe(false);
    expect(t.el.hasAttribute('data-resize-at-min')).toBe(false);
    expect(t.el.hasAttribute('data-resize-at-max')).toBe(false);
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

  it('uses a custom hit target size', () => {
    const t = mountWithRef({
      divider: HORIZONTAL_DIVIDER,
      hitSize: 32,
      populateRef: true,
      onDrag: () => {},
    });
    expect(t.el.style.height).toBe('32px');
    expect(t.el.style.top).toBe('calc(50% - 16px)');
    t.cleanup();
  });

  it('falls back to the default hit target size for invalid values', () => {
    const t = mountWithRef({
      divider: HORIZONTAL_DIVIDER,
      hitSize: 0,
      populateRef: true,
      onDrag: () => {},
    });
    expect(t.el.style.height).toBe('24px');
    t.cleanup();
  });

  it('resizes horizontal dividers from the keyboard', () => {
    const recorded: number[] = [];
    const t = mountWithRef({
      divider: HORIZONTAL_DIVIDER,
      populateRef: true,
      onDrag: (_, pct) => {
        recorded.push(pct);
      },
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
      onDrag: (_, pct) => {
        recorded.push(pct);
      },
    });
    act(() => {
      t.handlers.onPointerDown(pointerEvent());
    });
    t.handlers.onPointerMove(pointerEvent({ clientX: 500, clientY: 400 }));
    act(() => {
      t.handlers.onPointerUp(pointerEvent());
    });
    expect(recorded).toEqual([]);
    t.cleanup();
  });
});

describe('TileryDivider — vertical keyboard resizing', () => {
  it('marks min, max, and active resize states with data attributes', () => {
    const min = mountWithRef({
      divider: { ...VERTICAL_DIVIDER, position: 10 },
      populateRef: true,
      onDrag: () => {},
    });
    expect(min.el.hasAttribute('data-resize-at-min')).toBe(true);
    expect(min.el.hasAttribute('data-resize-at-max')).toBe(false);
    min.cleanup();

    const max = mountWithRef({
      divider: { ...VERTICAL_DIVIDER, position: 90 },
      populateRef: true,
      onDrag: () => {},
    });
    expect(max.el.hasAttribute('data-resize-at-min')).toBe(false);
    expect(max.el.hasAttribute('data-resize-at-max')).toBe(true);
    act(() => {
      max.handlers.onPointerDown(pointerEvent());
    });
    expect(max.el.hasAttribute('data-resize-active')).toBe(true);
    act(() => {
      max.handlers.onPointerUp(pointerEvent());
    });
    expect(max.el.hasAttribute('data-resize-active')).toBe(false);
    max.cleanup();
  });

  it('resizes vertical dividers from the keyboard', () => {
    const recorded: number[] = [];
    const t = mountWithRef({
      divider: VERTICAL_DIVIDER,
      populateRef: true,
      onDrag: (_, pct) => {
        recorded.push(pct);
      },
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

  it('allows keyboard resize commits without an onDragEnd handler', () => {
    const recorded: Array<{ pct: number; input: string }> = [];
    const t = mountWithRef({
      divider: VERTICAL_DIVIDER,
      populateRef: true,
      onDrag: (_, pct, input) => {
        recorded.push({ pct, input });
        return true;
      },
    });

    t.handlers.onKeyDown(keyboardEvent('ArrowRight').event);

    expect(recorded).toEqual([{ pct: 42, input: 'keyboard' }]);
    t.cleanup();
  });

  it('clamps keyboard resize commits to the accessible range', () => {
    const recorded: number[] = [];
    const min = mountWithRef({
      divider: { ...VERTICAL_DIVIDER, position: 10 },
      populateRef: true,
      onDrag: (_, pct) => {
        recorded.push(pct);
        return true;
      },
    });
    min.handlers.onKeyDown(keyboardEvent('ArrowLeft').event);
    min.cleanup();

    const max = mountWithRef({
      divider: { ...VERTICAL_DIVIDER, position: 90 },
      populateRef: true,
      onDrag: (_, pct) => {
        recorded.push(pct);
        return true;
      },
    });
    max.handlers.onKeyDown(keyboardEvent('ArrowRight').event);
    max.cleanup();

    expect(recorded).toEqual([10, 90]);
  });
});
