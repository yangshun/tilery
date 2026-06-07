// @vitest-environment jsdom

import '../test-dom-setup';

import { describe, expect, it } from 'vite-plus/test';
import React, { act, useRef } from 'react';
import { createRoot } from 'react-dom/client';

import { TileryJunction } from './junction';
import type { TileryJunction as JunctionType } from 'tilery/internal';

const JUNCTION: JunctionType = {
  id: 'j|v|h',
  kind: 't',
  x: 40,
  y: 50,
  verticalDividerId: 'v',
  horizontalDividerId: 'h',
};

function mountWithRef({
  disabled,
  hitSize,
  populateRef,
  onDrag,
  onActiveChange,
}: {
  disabled?: boolean;
  hitSize?: number;
  populateRef: boolean;
  onDrag: (
    id: string,
    x: number,
    y: number,
    input: 'pointer',
  ) => boolean | void;
  onActiveChange?: (junction: JunctionType, active: boolean) => void;
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
      React.createElement(TileryJunction, {
        junction: JUNCTION,
        disabled,
        hitSize,
        onDrag,
        onActiveChange,
        containerRef: ref,
      }),
    );
  }
  act(() => {
    root.render(React.createElement(App));
  });
  const el = host.querySelector('.tilery__junction') as HTMLDivElement;
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
  overrides: Partial<{
    clientX: number;
    clientY: number;
    button: number;
    isPrimary: boolean;
  }> = {},
): React.PointerEvent {
  return {
    button: 0,
    isPrimary: true,
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

describe('TileryJunction', () => {
  it('uses both pointer axes when dragging a junction', () => {
    const recorded: Array<{ id: string; x: number; y: number }> = [];
    const activeChanges: Array<{ id: string; active: boolean }> = [];
    const t = mountWithRef({
      populateRef: true,
      onDrag: (id, x, y) => {
        recorded.push({ id, x, y });
      },
      onActiveChange: (junction, active) => {
        activeChanges.push({ id: junction.id, active });
      },
    });
    act(() => {
      t.handlers.onPointerDown(pointerEvent());
    });
    t.handlers.onPointerMove(pointerEvent({ clientX: 300, clientY: 600 }));
    expect(recorded).toEqual([{ id: 'j|v|h', x: 30, y: 75 }]);
    expect(t.el.style.cursor).toBe('move');
    expect(t.el.style.width).toBe('24px');
    expect(t.el.getAttribute('data-junction-kind')).toBe('t');
    expect(t.el.hasAttribute('data-resize-active')).toBe(true);
    expect(t.el.getAttribute('aria-hidden')).toBe('true');
    act(() => {
      t.handlers.onPointerUp(pointerEvent());
    });
    expect(t.el.hasAttribute('data-resize-active')).toBe(false);
    expect(activeChanges).toEqual([
      { id: 'j|v|h', active: true },
      { id: 'j|v|h', active: false },
    ]);
    t.cleanup();
  });

  it('marks disabled state and ignores pointer resize', () => {
    const recorded: Array<{ x: number; y: number }> = [];
    const t = mountWithRef({
      disabled: true,
      populateRef: true,
      onDrag: (_, x, y) => {
        recorded.push({ x, y });
      },
    });
    expect(t.el.hasAttribute('data-resize-disabled')).toBe(true);
    expect(t.el.style.cursor).toBe('default');
    act(() => {
      t.handlers.onPointerDown?.(pointerEvent());
    });
    t.handlers.onPointerMove?.(pointerEvent({ clientX: 300, clientY: 600 }));
    expect(recorded).toEqual([]);
    t.cleanup();
  });

  it('uses a custom hit target size', () => {
    const t = mountWithRef({
      hitSize: 36,
      populateRef: true,
      onDrag: () => {},
    });
    expect(t.el.style.width).toBe('36px');
    expect(t.el.style.height).toBe('36px');
    expect(t.el.style.left).toBe('calc(40% - 18px)');
    t.cleanup();
  });

  it('falls back to the default hit target size for invalid values', () => {
    const t = mountWithRef({
      hitSize: Number.NaN,
      populateRef: true,
      onDrag: () => {},
    });
    expect(t.el.style.width).toBe('24px');
    expect(t.el.style.height).toBe('24px');
    t.cleanup();
  });

  it('no-ops onMove when container ref is null', () => {
    const recorded: Array<{ x: number; y: number }> = [];
    const t = mountWithRef({
      populateRef: false,
      onDrag: (_, x, y) => {
        recorded.push({ x, y });
      },
    });
    act(() => {
      t.handlers.onPointerDown(pointerEvent());
    });
    t.handlers.onPointerMove(pointerEvent({ clientX: 300, clientY: 600 }));
    act(() => {
      t.handlers.onPointerUp(pointerEvent());
    });
    expect(recorded).toEqual([]);
    t.cleanup();
  });

  it('allows pointer resize commits without an onDragEnd handler', () => {
    const recorded: Array<{ x: number; y: number; input: string }> = [];
    const t = mountWithRef({
      populateRef: true,
      onDrag: (_, x, y, input) => {
        recorded.push({ x, y, input });
        return true;
      },
    });
    act(() => {
      t.handlers.onPointerDown(pointerEvent());
    });
    t.handlers.onPointerMove(pointerEvent({ clientX: 300, clientY: 600 }));
    act(() => {
      t.handlers.onPointerUp(pointerEvent());
    });

    expect(recorded).toEqual([{ x: 30, y: 75, input: 'pointer' }]);
    t.cleanup();
  });

  it('ignores non-primary pointer buttons on down', () => {
    const activeChanges: Array<{ id: string; active: boolean }> = [];
    const t = mountWithRef({
      populateRef: true,
      onDrag: () => {},
      onActiveChange: (junction, active) => {
        activeChanges.push({ id: junction.id, active });
      },
    });
    act(() => {
      t.handlers.onPointerDown(pointerEvent({ button: 1 }));
    });
    expect(activeChanges).toEqual([]);
    t.cleanup();
  });

  it('ignores non-primary pointers on down', () => {
    const activeChanges: Array<{ id: string; active: boolean }> = [];
    const t = mountWithRef({
      populateRef: true,
      onDrag: () => {},
      onActiveChange: (junction, active) => {
        activeChanges.push({ id: junction.id, active });
      },
    });
    act(() => {
      t.handlers.onPointerDown(pointerEvent({ isPrimary: false }));
    });
    expect(activeChanges).toEqual([]);
    t.cleanup();
  });
});
