// @vitest-environment jsdom

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
  populateRef,
  onDrag,
}: {
  populateRef: boolean;
  onDrag: (id: string, x: number, y: number) => void;
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
        onDrag,
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

describe('TileryJunction', () => {
  it('uses both pointer axes when dragging a junction', () => {
    const recorded: Array<{ id: string; x: number; y: number }> = [];
    const t = mountWithRef({
      populateRef: true,
      onDrag: (id, x, y) => recorded.push({ id, x, y }),
    });
    t.handlers.onPointerDown(pointerEvent());
    t.handlers.onPointerMove(pointerEvent({ clientX: 300, clientY: 600 }));
    expect(recorded).toEqual([{ id: 'j|v|h', x: 30, y: 75 }]);
    expect(t.el.style.cursor).toBe('move');
    expect(t.el.style.width).toBe('24px');
    expect(t.el.getAttribute('data-junction-kind')).toBe('t');
    expect(t.el.getAttribute('aria-hidden')).toBe('true');
    t.cleanup();
  });

  it('no-ops onMove when container ref is null', () => {
    const recorded: Array<{ x: number; y: number }> = [];
    const t = mountWithRef({
      populateRef: false,
      onDrag: (_, x, y) => recorded.push({ x, y }),
    });
    t.handlers.onPointerDown(pointerEvent());
    t.handlers.onPointerMove(pointerEvent({ clientX: 300, clientY: 600 }));
    expect(recorded).toEqual([]);
    t.cleanup();
  });
});
