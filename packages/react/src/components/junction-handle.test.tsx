// @vitest-environment jsdom

import { describe, expect, it } from 'vite-plus/test';
import React, { act, useRef } from 'react';
import { createRoot } from 'react-dom/client';

import { JunctionHandle } from './junction-handle';
import type { Junction } from 'tilery';

const JUNCTION: Junction = {
  id: 'j|v|h',
  x: 40,
  y: 50,
  verticalDividerId: 'v',
  horizontalDividerId: 'h',
};

// Stub a 1000×800 viewport on the container so percentage math is
// deterministic. clientX=500 / clientY=600 → (50%, 75%).
function stubRect(el: HTMLElement) {
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

type Handlers = {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerCancel: (e: React.PointerEvent) => void;
};

function setup({
  onDrag,
}: {
  onDrag: (j: Junction, xPct: number, yPct: number) => void;
}) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);

  function App() {
    const ref = useRef<HTMLDivElement | null>(null);
    return React.createElement(
      'div',
      {
        className: 'tilery__inner',
        ref: (el: HTMLDivElement | null) => {
          ref.current = el;
          if (el) stubRect(el);
        },
      },
      React.createElement(JunctionHandle, {
        junction: JUNCTION,
        onDrag,
        containerRef: ref,
      }),
    );
  }
  act(() => {
    root.render(React.createElement(App));
  });

  const handleEl = host.querySelector('.tilery__junction') as HTMLDivElement;
  const propsKey = Object.keys(handleEl).find((k) =>
    k.startsWith('__reactProps'),
  ) as string;
  const handlers = (handleEl as unknown as Record<string, Handlers>)[propsKey];

  return {
    handleEl,
    handlers,
    cleanup() {
      act(() => {
        root.unmount();
      });
      host.remove();
    },
  };
}

function fakeEvent(
  overrides: Partial<{ clientX: number; clientY: number; button: number }> = {},
): React.PointerEvent & { stopCalls: number } {
  const state = { stopCalls: 0 };
  return {
    button: 0,
    pointerId: 1,
    clientX: 0,
    clientY: 0,
    ...overrides,
    preventDefault() {},
    stopPropagation() {
      state.stopCalls++;
    },
    currentTarget: {
      setPointerCapture() {},
      releasePointerCapture() {},
    } as unknown as HTMLElement,
    get stopCalls() {
      return state.stopCalls;
    },
  } as unknown as React.PointerEvent & { stopCalls: number };
}

describe('JunctionHandle — rendering', () => {
  it('renders at (x, y) with the centred hit zone, role, label, and id', () => {
    const t = setup({ onDrag: () => {} });
    expect(t.handleEl.style.left).toBe('calc(40% - 7px)');
    expect(t.handleEl.style.top).toBe('calc(50% - 7px)');
    expect(t.handleEl.style.width).toBe('14px');
    expect(t.handleEl.style.height).toBe('14px');
    expect(t.handleEl.getAttribute('role')).toBe('separator');
    expect(t.handleEl.getAttribute('aria-label')).toBe('Resize junction');
    expect(t.handleEl.getAttribute('data-junction-id')).toBe('j|v|h');
    t.cleanup();
  });
});

describe('JunctionHandle — drag flow', () => {
  it('translates cursor coords into (xPct, yPct) and routes to onDrag', () => {
    const recorded: Array<{ j: Junction; xPct: number; yPct: number }> = [];
    const t = setup({
      onDrag: (j, xPct, yPct) => recorded.push({ j, xPct, yPct }),
    });
    t.handlers.onPointerDown(fakeEvent({ clientX: 400, clientY: 400 }));
    t.handlers.onPointerMove(fakeEvent({ clientX: 500, clientY: 600 }));
    expect(recorded).toEqual([{ j: JUNCTION, xPct: 50, yPct: 75 }]);
    t.cleanup();
  });

  it('stops propagation on pointerdown so the underlying divider is not engaged', () => {
    const t = setup({ onDrag: () => {} });
    const e = fakeEvent();
    t.handlers.onPointerDown(e);
    expect(e.stopCalls).toBe(1);
    t.cleanup();
  });

  it('pointermove without a prior pointerdown is a no-op', () => {
    const recorded: number[] = [];
    const t = setup({ onDrag: (_, x) => recorded.push(x) });
    t.handlers.onPointerMove(fakeEvent({ clientX: 500, clientY: 500 }));
    expect(recorded).toEqual([]);
    t.cleanup();
  });

  it('pointercancel ends the drag', () => {
    const recorded: number[] = [];
    const t = setup({ onDrag: (_, x) => recorded.push(x) });
    t.handlers.onPointerDown(fakeEvent({ clientX: 400, clientY: 400 }));
    t.handlers.onPointerCancel(fakeEvent());
    // After cancel, a further move is a no-op — nothing is dispatched.
    t.handlers.onPointerMove(fakeEvent({ clientX: 500, clientY: 600 }));
    expect(recorded).toEqual([]);
    t.cleanup();
  });

  it('no-ops when the container ref is null (defensive: post-unmount drag)', () => {
    // Setup variant where the container ref never gets populated. The
    // move math must short-circuit instead of crashing on rect access.
    const recorded: number[] = [];
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    function App() {
      const ref = useRef<HTMLDivElement | null>(null);
      return React.createElement(JunctionHandle, {
        junction: JUNCTION,
        onDrag: (_, x) => recorded.push(x),
        containerRef: ref,
      });
    }
    act(() => {
      root.render(React.createElement(App));
    });
    const handleEl = host.querySelector('.tilery__junction') as HTMLDivElement;
    const propsKey = Object.keys(handleEl).find((k) =>
      k.startsWith('__reactProps'),
    ) as string;
    const handlers = (handleEl as unknown as Record<string, Handlers>)[
      propsKey
    ];
    handlers.onPointerDown(fakeEvent());
    handlers.onPointerMove(fakeEvent({ clientX: 100, clientY: 100 }));
    expect(recorded).toEqual([]);
    act(() => {
      root.unmount();
    });
    host.remove();
  });
});
