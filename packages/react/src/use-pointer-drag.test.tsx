// @vitest-environment jsdom

import { describe, expect, it } from 'vite-plus/test';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

import {
  useTileryPointerDrag,
  type TileryPointerDragHandlers,
  type TileryPointerDragOptions,
} from './use-pointer-drag';

// Renders a probe that exposes the hook's handlers, then returns helpers for
// invoking them inside `act()`.
function setup(options: Partial<TileryPointerDragOptions> = {}) {
  const moves: React.PointerEvent[] = [];
  const container = document.createElement('div');
  document.body.appendChild(container);

  let handlers!: TileryPointerDragHandlers;

  function Probe() {
    handlers = useTileryPointerDrag({
      onMove: (e) => moves.push(e),
      stopPropagationOnDown: options.stopPropagationOnDown,
    });
    return null;
  }

  const root = createRoot(container);
  act(() => {
    root.render(React.createElement(Probe));
  });

  const fakeEvent = (
    overrides: Partial<{
      button: number;
      pointerId: number;
      pointerType: string;
      clientX: number;
      clientY: number;
    }> = {},
  ): React.PointerEvent => {
    const calls = {
      preventDefault: 0,
      stopPropagation: 0,
      setPointerCapture: 0,
      releasePointerCapture: 0,
    };
    const evt = {
      button: 0,
      pointerId: 1,
      pointerType: 'mouse' as const,
      clientX: 10,
      clientY: 10,
      ...overrides,
      preventDefault() {
        calls.preventDefault++;
      },
      stopPropagation() {
        calls.stopPropagation++;
      },
      currentTarget: {
        setPointerCapture() {
          calls.setPointerCapture++;
        },
        releasePointerCapture() {
          calls.releasePointerCapture++;
        },
      } as unknown as HTMLElement,
      _calls: calls,
    };
    return evt as unknown as React.PointerEvent & { _calls: typeof calls };
  };

  return {
    moves,
    handlers: () => handlers,
    fakeEvent,
    cleanup() {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

describe('useTileryPointerDrag — gating', () => {
  it('ignores non-left buttons on pointerdown', () => {
    const t = setup();
    const e = t.fakeEvent({ button: 2 });
    act(() => {
      t.handlers().onPointerDown(e);
    });
    // pointermove afterwards is a no-op because dragging never started.
    t.handlers().onPointerMove(t.fakeEvent({ clientX: 50, clientY: 50 }));
    expect(t.moves).toHaveLength(0);
    t.cleanup();
  });

  it('pointermove without prior pointerdown is a no-op', () => {
    const t = setup();
    t.handlers().onPointerMove(t.fakeEvent({ clientX: 50, clientY: 50 }));
    expect(t.moves).toHaveLength(0);
    t.cleanup();
  });
});

describe('useTileryPointerDrag — happy path', () => {
  it('starts dragging on pointerdown and routes moves to onMove', () => {
    const t = setup();
    expect(t.handlers().isDragging).toBe(false);
    act(() => {
      t.handlers().onPointerDown(t.fakeEvent());
    });
    expect(t.handlers().isDragging).toBe(true);
    t.handlers().onPointerMove(t.fakeEvent({ clientX: 100, clientY: 80 }));
    expect(t.moves).toHaveLength(1);
    expect(t.moves[0]!.clientX).toBe(100);
    expect(t.moves[0]!.clientY).toBe(80);
    act(() => {
      t.handlers().onPointerUp(t.fakeEvent());
    });
    expect(t.handlers().isDragging).toBe(false);
    // After pointerup the drag is over — further moves are ignored.
    t.handlers().onPointerMove(t.fakeEvent({ clientX: 200, clientY: 200 }));
    expect(t.moves).toHaveLength(1);
    t.cleanup();
  });

  it('routes every move while the drag is active', () => {
    const t = setup();
    act(() => {
      t.handlers().onPointerDown(t.fakeEvent());
    });
    t.handlers().onPointerMove(t.fakeEvent({ clientX: 20, clientY: 20 }));
    t.handlers().onPointerMove(t.fakeEvent({ clientX: 30, clientY: 30 }));
    act(() => {
      t.handlers().onPointerUp(t.fakeEvent());
    });
    expect(t.moves).toHaveLength(2);
    t.cleanup();
  });
});

describe('useTileryPointerDrag — stopPropagationOnDown', () => {
  it('does not stop propagation by default', () => {
    const t = setup();
    const e = t.fakeEvent() as React.PointerEvent & {
      _calls: { stopPropagation: number };
    };
    act(() => {
      t.handlers().onPointerDown(e);
    });
    expect(e._calls.stopPropagation).toBe(0);
    t.cleanup();
  });

  it('stops propagation when opted in', () => {
    const t = setup({ stopPropagationOnDown: true });
    const e = t.fakeEvent() as React.PointerEvent & {
      _calls: { stopPropagation: number };
    };
    act(() => {
      t.handlers().onPointerDown(e);
    });
    expect(e._calls.stopPropagation).toBe(1);
    t.cleanup();
  });
});

describe('useTileryPointerDrag — robustness', () => {
  it('survives setPointerCapture throwing', () => {
    const t = setup();
    const e = {
      button: 0,
      pointerId: 1,
      preventDefault() {},
      stopPropagation() {},
      currentTarget: {
        setPointerCapture() {
          throw new Error('synthetic event');
        },
        releasePointerCapture() {},
      } as unknown as HTMLElement,
    } as unknown as React.PointerEvent;
    act(() => {
      t.handlers().onPointerDown(e);
    });
    // The hook still considers itself dragging — subsequent moves are routed.
    t.handlers().onPointerMove(t.fakeEvent({ clientX: 5, clientY: 5 }));
    expect(t.moves).toHaveLength(1);
    t.cleanup();
  });

  it('survives releasePointerCapture throwing on pointerup', () => {
    const t = setup();
    act(() => {
      t.handlers().onPointerDown(t.fakeEvent());
    });
    const e = {
      pointerId: 1,
      currentTarget: {
        releasePointerCapture() {
          throw new Error('synthetic event');
        },
      } as unknown as HTMLElement,
    } as unknown as React.PointerEvent;
    act(() => {
      t.handlers().onPointerUp(e);
    });
    // The drag still ends even though the capture release threw — a later
    // move is a no-op.
    t.handlers().onPointerMove(t.fakeEvent({ clientX: 5, clientY: 5 }));
    expect(t.moves).toHaveLength(0);
    t.cleanup();
  });
});
