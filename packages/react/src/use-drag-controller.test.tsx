// @vitest-environment jsdom

import { describe, expect, it } from 'vite-plus/test';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useTileryDragController } from './use-drag-controller';
import { makeTileryHandle } from 'tilery/internal';
import {
  tileryCreateInitialState,
  tileryReducer,
  type TileryReducerAction,
} from 'tilery/internal';
import type { TileryLayoutState } from 'tilery/internal';

type Controller = ReturnType<typeof useTileryDragController>;

function setupStore() {
  let state: TileryLayoutState = tileryCreateInitialState({
    panels: [
      {
        id: 'P1',
        inset: { top: 0, right: 50, bottom: 0, left: 0 },
        tabs: [
          { id: 'T1', data: {} },
          { id: 'T2', data: {} },
        ],
      },
      {
        id: 'P2',
        inset: { top: 0, right: 0, bottom: 0, left: 50 },
        tabs: [{ id: 'T3', data: {} }],
      },
    ],
  });
  const dispatch = (a: TileryReducerAction) => {
    state = tileryReducer(state, a);
  };
  const handle = makeTileryHandle(() => state, dispatch);
  return { handle, getState: () => state };
}

function setBoundingClientRect(
  el: HTMLElement,
  rect: {
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
  },
) {
  el.getBoundingClientRect = () => ({
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height,
    x: rect.left,
    y: rect.top,
    toJSON: () => ({}),
  });
}

function pointerEvent(
  type: string,
  init: Partial<PointerEventInit> & {
    clientX: number;
    clientY: number;
    pointerId: number;
    button?: number;
  },
): PointerEvent {
  return new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    pointerType: 'mouse',
    isPrimary: true,
    button: 0,
    ...init,
  });
}

function asReact(e: Event): React.PointerEvent<HTMLElement> {
  // Cast — synthetic event surface compatibility: handlers only use clientX/Y, pointerId,
  // button, currentTarget, releasePointerCapture/setPointerCapture; jsdom PointerEvent
  // provides all of these via the underlying target.
  return e as unknown as React.PointerEvent<HTMLElement>;
}

function renderHook<T>(useHook: () => T): {
  current: () => T;
  unmount: () => void;
} {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  let captured!: T;
  function Probe() {
    captured = useHook();
    return null;
  }
  act(() => {
    root.render(React.createElement(Probe));
  });
  return {
    current: () => captured,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

describe('useTileryDragController — registration', () => {
  it('registers and deregisters panel/tabBar/tab elements', () => {
    const { handle } = setupStore();
    const hook = renderHook(() => useTileryDragController(() => handle));
    const ctrl = hook.current();
    const panelEl = document.createElement('div');
    act(() => {
      ctrl.registerPanel('P1', panelEl);
    });
    expect((ctrl as unknown as Controller).registerPanel).toBeDefined();
    // deregister: passing null
    act(() => {
      ctrl.registerPanel('P1', null);
      ctrl.registerTabBar('P1', null);
      ctrl.registerTab('T1', null);
    });
    hook.unmount();
  });
});

describe('useTileryDragController — pointer flow', () => {
  it('ignores non-left buttons on pointerdown', () => {
    const { handle } = setupStore();
    const hook = renderHook(() => useTileryDragController(() => handle));
    const tabEl = document.createElement('div');
    document.body.appendChild(tabEl);
    setBoundingClientRect(tabEl, {
      left: 0,
      top: 0,
      right: 50,
      bottom: 30,
      width: 50,
      height: 30,
    });
    act(() => {
      const ev = pointerEvent('pointerdown', {
        clientX: 10,
        clientY: 10,
        pointerId: 1,
        button: 2,
      });
      Object.defineProperty(ev, 'currentTarget', {
        value: tabEl,
        configurable: true,
      });
      hook.current().onTabPointerDown(asReact(ev), 'T1');
    });
    expect(hook.current().dragState).toBeNull();
    hook.unmount();
    tabEl.remove();
  });

  it('treats sub-threshold move + up as a click (calls onClick)', () => {
    const { handle } = setupStore();
    const hook = renderHook(() => useTileryDragController(() => handle));
    const tabEl = document.createElement('div');
    document.body.appendChild(tabEl);
    let clicked = false;
    const onClick = () => {
      clicked = true;
    };
    act(() => {
      const down = pointerEvent('pointerdown', {
        clientX: 10,
        clientY: 10,
        pointerId: 5,
      });
      Object.defineProperty(down, 'currentTarget', {
        value: tabEl,
        configurable: true,
      });
      hook.current().onTabPointerDown(asReact(down), 'T1');
    });
    act(() => {
      const move = pointerEvent('pointermove', {
        clientX: 11,
        clientY: 10,
        pointerId: 5,
      });
      Object.defineProperty(move, 'currentTarget', {
        value: tabEl,
        configurable: true,
      });
      hook.current().onTabPointerMove(asReact(move));
    });
    act(() => {
      const up = pointerEvent('pointerup', {
        clientX: 11,
        clientY: 10,
        pointerId: 5,
      });
      Object.defineProperty(up, 'currentTarget', {
        value: tabEl,
        configurable: true,
      });
      hook.current().onTabPointerUp(asReact(up), 'T1', onClick);
    });
    expect(clicked).toBe(true);
    expect(hook.current().dragState).toBeNull();
    hook.unmount();
    tabEl.remove();
  });

  it('enters drag state when move exceeds threshold and commits on pointerup', () => {
    const { handle, getState } = setupStore();
    const hook = renderHook(() => useTileryDragController(() => handle));
    const tabEl = document.createElement('div');
    const panel2El = document.createElement('div');
    document.body.appendChild(tabEl);
    document.body.appendChild(panel2El);
    setBoundingClientRect(tabEl, {
      left: 0,
      top: 0,
      right: 50,
      bottom: 30,
      width: 50,
      height: 30,
    });
    setBoundingClientRect(panel2El, {
      left: 500,
      top: 0,
      right: 1000,
      bottom: 1000,
      width: 500,
      height: 1000,
    });
    act(() => {
      hook.current().registerPanel('P2', panel2El);
    });
    act(() => {
      const down = pointerEvent('pointerdown', {
        clientX: 25,
        clientY: 15,
        pointerId: 9,
      });
      Object.defineProperty(down, 'currentTarget', {
        value: tabEl,
        configurable: true,
      });
      hook.current().onTabPointerDown(asReact(down), 'T1');
    });
    // Move past threshold into panel2's center zone
    act(() => {
      const m = pointerEvent('pointermove', {
        clientX: 750,
        clientY: 500,
        pointerId: 9,
      });
      hook.current().onTabPointerMove(asReact(m));
    });
    const dragState1 = hook.current().dragState;
    expect(dragState1).not.toBeNull();
    expect(dragState1!.hoverPanelId).toBe('P2');
    expect(dragState1!.hoverZone).toBe('center');
    // Another move while in drag state to exercise the "pending=null but current=non-null" branch
    act(() => {
      const m2 = pointerEvent('pointermove', {
        clientX: 755,
        clientY: 500,
        pointerId: 9,
      });
      hook.current().onTabPointerMove(asReact(m2));
    });
    expect(hook.current().dragState?.x).toBe(755);
    act(() => {
      const up = pointerEvent('pointerup', {
        clientX: 755,
        clientY: 500,
        pointerId: 9,
      });
      Object.defineProperty(up, 'currentTarget', {
        value: tabEl,
        configurable: true,
      });
      hook.current().onTabPointerUp(asReact(up), 'T1', () => {});
    });
    expect(hook.current().dragState).toBeNull();
    // tileryCommitDrag should have moved T1 into P2 (center zone → append)
    expect(getState().panels.P2!.tabs).toContain('T1');
    hook.unmount();
    tabEl.remove();
    panel2El.remove();
  });

  it('ignores pointermove with a different pointerId', () => {
    const { handle } = setupStore();
    const hook = renderHook(() => useTileryDragController(() => handle));
    const tabEl = document.createElement('div');
    document.body.appendChild(tabEl);
    act(() => {
      const down = pointerEvent('pointerdown', {
        clientX: 0,
        clientY: 0,
        pointerId: 10,
      });
      Object.defineProperty(down, 'currentTarget', {
        value: tabEl,
        configurable: true,
      });
      hook.current().onTabPointerDown(asReact(down), 'T1');
    });
    act(() => {
      const wrong = pointerEvent('pointermove', {
        clientX: 100,
        clientY: 100,
        pointerId: 99,
      });
      hook.current().onTabPointerMove(asReact(wrong));
    });
    expect(hook.current().dragState).toBeNull();
    hook.unmount();
    tabEl.remove();
  });

  it('pointer cancel clears pending and drag state', () => {
    const { handle } = setupStore();
    const hook = renderHook(() => useTileryDragController(() => handle));
    const tabEl = document.createElement('div');
    document.body.appendChild(tabEl);
    setBoundingClientRect(tabEl, {
      left: 0,
      top: 0,
      right: 50,
      bottom: 30,
      width: 50,
      height: 30,
    });
    act(() => {
      const down = pointerEvent('pointerdown', {
        clientX: 25,
        clientY: 15,
        pointerId: 7,
      });
      Object.defineProperty(down, 'currentTarget', {
        value: tabEl,
        configurable: true,
      });
      hook.current().onTabPointerDown(asReact(down), 'T1');
    });
    // Pending only — cancel
    act(() => {
      const c = pointerEvent('pointercancel', {
        clientX: 25,
        clientY: 15,
        pointerId: 7,
      });
      hook.current().onTabPointerCancel(asReact(c));
    });
    expect(hook.current().dragState).toBeNull();

    // Now enter drag state and cancel it
    act(() => {
      const down = pointerEvent('pointerdown', {
        clientX: 25,
        clientY: 15,
        pointerId: 8,
      });
      Object.defineProperty(down, 'currentTarget', {
        value: tabEl,
        configurable: true,
      });
      hook.current().onTabPointerDown(asReact(down), 'T1');
    });
    act(() => {
      const m = pointerEvent('pointermove', {
        clientX: 100,
        clientY: 100,
        pointerId: 8,
      });
      hook.current().onTabPointerMove(asReact(m));
    });
    expect(hook.current().dragState).not.toBeNull();
    act(() => {
      const c = pointerEvent('pointercancel', {
        clientX: 100,
        clientY: 100,
        pointerId: 8,
      });
      hook.current().onTabPointerCancel(asReact(c));
    });
    expect(hook.current().dragState).toBeNull();
    hook.unmount();
    tabEl.remove();
  });

  it('pointerup with no pending nor drag state is a no-op (different pointer id)', () => {
    const { handle } = setupStore();
    const hook = renderHook(() => useTileryDragController(() => handle));
    const tabEl = document.createElement('div');
    document.body.appendChild(tabEl);
    let clicked = false;
    act(() => {
      const up = pointerEvent('pointerup', {
        clientX: 0,
        clientY: 0,
        pointerId: 42,
      });
      Object.defineProperty(up, 'currentTarget', {
        value: tabEl,
        configurable: true,
      });
      hook.current().onTabPointerUp(asReact(up), 'T1', () => {
        clicked = true;
      });
    });
    expect(clicked).toBe(false);
    expect(hook.current().dragState).toBeNull();
    hook.unmount();
    tabEl.remove();
  });
});

describe('useTileryDragController — hover detection', () => {
  it('detects tab-bar hovers with before/after/append based on tab rects', () => {
    const { handle } = setupStore();
    const hook = renderHook(() => useTileryDragController(() => handle));
    const tabBarEl = document.createElement('div');
    const t1El = document.createElement('div');
    const t2El = document.createElement('div');
    document.body.appendChild(tabBarEl);
    document.body.appendChild(t1El);
    document.body.appendChild(t2El);
    setBoundingClientRect(tabBarEl, {
      left: 0,
      top: 0,
      right: 200,
      bottom: 30,
      width: 200,
      height: 30,
    });
    setBoundingClientRect(t1El, {
      left: 0,
      top: 0,
      right: 50,
      bottom: 30,
      width: 50,
      height: 30,
    });
    setBoundingClientRect(t2El, {
      left: 50,
      top: 0,
      right: 100,
      bottom: 30,
      width: 50,
      height: 30,
    });
    act(() => {
      hook.current().registerTabBar('P1', tabBarEl);
      hook.current().registerTab('T1', t1El);
      hook.current().registerTab('T2', t2El);
    });
    const tabEl = document.createElement('div');
    document.body.appendChild(tabEl);
    setBoundingClientRect(tabEl, {
      left: 1000,
      top: 1000,
      right: 1050,
      bottom: 1030,
      width: 50,
      height: 30,
    });
    act(() => {
      const down = pointerEvent('pointerdown', {
        clientX: 1025,
        clientY: 1015,
        pointerId: 30,
      });
      Object.defineProperty(down, 'currentTarget', {
        value: tabEl,
        configurable: true,
      });
      hook.current().onTabPointerDown(asReact(down), 'T3');
    });
    // Move into tab bar over t2's left half → 'before T2'
    act(() => {
      const m = pointerEvent('pointermove', {
        clientX: 60,
        clientY: 15,
        pointerId: 30,
      });
      hook.current().onTabPointerMove(asReact(m));
    });
    expect(hook.current().dragState?.hoverTabBar).toEqual({
      panelId: 'P1',
      hit: { kind: 'before', tabId: 'T2' },
    });
    // Move past last tab → append
    act(() => {
      const m = pointerEvent('pointermove', {
        clientX: 180,
        clientY: 15,
        pointerId: 30,
      });
      hook.current().onTabPointerMove(asReact(m));
    });
    expect(hook.current().dragState?.hoverTabBar).toEqual({
      panelId: 'P1',
      hit: { kind: 'append' },
    });
    hook.unmount();
    tabEl.remove();
    tabBarEl.remove();
    t1El.remove();
    t2El.remove();
  });

  it('handles tab-bar hover when the underlying panel is missing', () => {
    const { handle } = setupStore();
    const hook = renderHook(() => useTileryDragController(() => handle));
    const tabBarEl = document.createElement('div');
    document.body.appendChild(tabBarEl);
    setBoundingClientRect(tabBarEl, {
      left: 0,
      top: 0,
      right: 200,
      bottom: 30,
      width: 200,
      height: 30,
    });
    act(() => {
      hook.current().registerTabBar('PHANTOM', tabBarEl);
    });
    const tabEl = document.createElement('div');
    document.body.appendChild(tabEl);
    setBoundingClientRect(tabEl, {
      left: 500,
      top: 500,
      right: 550,
      bottom: 530,
      width: 50,
      height: 30,
    });
    act(() => {
      const down = pointerEvent('pointerdown', {
        clientX: 525,
        clientY: 515,
        pointerId: 31,
      });
      Object.defineProperty(down, 'currentTarget', {
        value: tabEl,
        configurable: true,
      });
      hook.current().onTabPointerDown(asReact(down), 'T1');
    });
    act(() => {
      const m = pointerEvent('pointermove', {
        clientX: 50,
        clientY: 15,
        pointerId: 31,
      });
      hook.current().onTabPointerMove(asReact(m));
    });
    expect(hook.current().dragState?.hoverTabBar?.hit).toEqual({
      kind: 'append',
    });
    hook.unmount();
    tabEl.remove();
    tabBarEl.remove();
  });

  it('skips tabs that have not been registered yet during tab-bar hover', () => {
    const { handle } = setupStore();
    const hook = renderHook(() => useTileryDragController(() => handle));
    const tabBarEl = document.createElement('div');
    const t1El = document.createElement('div');
    // T2 deliberately not registered
    document.body.appendChild(tabBarEl);
    document.body.appendChild(t1El);
    setBoundingClientRect(tabBarEl, {
      left: 0,
      top: 0,
      right: 200,
      bottom: 30,
      width: 200,
      height: 30,
    });
    setBoundingClientRect(t1El, {
      left: 0,
      top: 0,
      right: 50,
      bottom: 30,
      width: 50,
      height: 30,
    });
    act(() => {
      hook.current().registerTabBar('P1', tabBarEl);
      hook.current().registerTab('T1', t1El);
    });
    const tabEl = document.createElement('div');
    document.body.appendChild(tabEl);
    setBoundingClientRect(tabEl, {
      left: 1000,
      top: 1000,
      right: 1050,
      bottom: 1030,
      width: 50,
      height: 30,
    });
    act(() => {
      const down = pointerEvent('pointerdown', {
        clientX: 1025,
        clientY: 1015,
        pointerId: 51,
      });
      Object.defineProperty(down, 'currentTarget', {
        value: tabEl,
        configurable: true,
      });
      hook.current().onTabPointerDown(asReact(down), 'T3');
    });
    act(() => {
      const m = pointerEvent('pointermove', {
        clientX: 10,
        clientY: 15,
        pointerId: 51,
      });
      hook.current().onTabPointerMove(asReact(m));
    });
    // Cursor in t1's left half → before T1 (T2 was skipped because unregistered)
    expect(hook.current().dragState?.hoverTabBar?.hit).toEqual({
      kind: 'before',
      tabId: 'T1',
    });
    hook.unmount();
    tabEl.remove();
    tabBarEl.remove();
    t1El.remove();
  });

  it('iterates through multiple panels and returns null hover when cursor is outside every panel', () => {
    const { handle } = setupStore();
    const hook = renderHook(() => useTileryDragController(() => handle));
    const p1El = document.createElement('div');
    const p2El = document.createElement('div');
    document.body.appendChild(p1El);
    document.body.appendChild(p2El);
    setBoundingClientRect(p1El, {
      left: 0,
      top: 0,
      right: 100,
      bottom: 100,
      width: 100,
      height: 100,
    });
    setBoundingClientRect(p2El, {
      left: 200,
      top: 0,
      right: 300,
      bottom: 100,
      width: 100,
      height: 100,
    });
    act(() => {
      hook.current().registerPanel('P1', p1El);
      hook.current().registerPanel('P2', p2El);
    });
    const tabEl = document.createElement('div');
    document.body.appendChild(tabEl);
    setBoundingClientRect(tabEl, {
      left: 1000,
      top: 1000,
      right: 1050,
      bottom: 1030,
      width: 50,
      height: 30,
    });
    act(() => {
      const down = pointerEvent('pointerdown', {
        clientX: 1025,
        clientY: 1015,
        pointerId: 60,
      });
      Object.defineProperty(down, 'currentTarget', {
        value: tabEl,
        configurable: true,
      });
      hook.current().onTabPointerDown(asReact(down), 'T1');
    });
    // Move into the gap between P1 and P2 (tileryZoneAt → null for both)
    act(() => {
      const m = pointerEvent('pointermove', {
        clientX: 150,
        clientY: 50,
        pointerId: 60,
      });
      hook.current().onTabPointerMove(asReact(m));
    });
    expect(hook.current().dragState?.hoverPanelId).toBeNull();
    expect(hook.current().dragState?.hoverZone).toBeNull();
    // Now move into P2 — exercises the loop-continuation past P1
    act(() => {
      const m = pointerEvent('pointermove', {
        clientX: 250,
        clientY: 50,
        pointerId: 60,
      });
      hook.current().onTabPointerMove(asReact(m));
    });
    expect(hook.current().dragState?.hoverPanelId).toBe('P2');
    hook.unmount();
    tabEl.remove();
    p1El.remove();
    p2El.remove();
  });

  it('falls through tab-bars that the cursor is outside of', () => {
    const { handle } = setupStore();
    const hook = renderHook(() => useTileryDragController(() => handle));
    const offBar = document.createElement('div');
    const panelEl = document.createElement('div');
    document.body.appendChild(offBar);
    document.body.appendChild(panelEl);
    setBoundingClientRect(offBar, {
      left: 0,
      top: 0,
      right: 50,
      bottom: 20,
      width: 50,
      height: 20,
    });
    setBoundingClientRect(panelEl, {
      left: 100,
      top: 100,
      right: 300,
      bottom: 300,
      width: 200,
      height: 200,
    });
    act(() => {
      hook.current().registerTabBar('P1', offBar);
      hook.current().registerPanel('P1', panelEl);
    });
    const tabEl = document.createElement('div');
    document.body.appendChild(tabEl);
    setBoundingClientRect(tabEl, {
      left: 500,
      top: 500,
      right: 550,
      bottom: 530,
      width: 50,
      height: 30,
    });
    act(() => {
      const down = pointerEvent('pointerdown', {
        clientX: 525,
        clientY: 515,
        pointerId: 40,
      });
      Object.defineProperty(down, 'currentTarget', {
        value: tabEl,
        configurable: true,
      });
      hook.current().onTabPointerDown(asReact(down), 'T1');
    });
    // Move into the panel area (not the tab bar)
    act(() => {
      const m = pointerEvent('pointermove', {
        clientX: 200,
        clientY: 200,
        pointerId: 40,
      });
      hook.current().onTabPointerMove(asReact(m));
    });
    expect(hook.current().dragState?.hoverTabBar).toBeNull();
    expect(hook.current().dragState?.hoverPanelId).toBe('P1');
    expect(hook.current().dragState?.hoverZone).toBe('center');
    hook.unmount();
    tabEl.remove();
    offBar.remove();
    panelEl.remove();
  });

  it('side-by-side single-tab adjacent panels: opposite-side zone = swap (shown), same-side = suppress', () => {
    // Layout: P1 [A] at x=[0,200], P2 [B] at x=[200,400]. B is to the right of P1.
    // Dragging B onto P1's LEFT zone is OPPOSITE to source (B is on right) → swap is the intent → zone shown.
    // Dragging B onto P1's RIGHT zone is SAME side as B → already-where-it-is → suppress.
    let state: TileryLayoutState = tileryCreateInitialState({
      panels: [
        {
          id: 'P1',
          inset: { top: 0, right: 50, bottom: 0, left: 0 },
          tabs: [{ id: 'A', data: {} }],
        },
        {
          id: 'P2',
          inset: { top: 0, right: 0, bottom: 0, left: 50 },
          tabs: [{ id: 'B', data: {} }],
        },
      ],
    });
    const dispatch = (a: TileryReducerAction) => {
      state = tileryReducer(state, a);
    };
    const handle = makeTileryHandle(() => state, dispatch);
    const hook = renderHook(() => useTileryDragController(() => handle));
    const p1El = document.createElement('div');
    const bTabEl = document.createElement('div');
    document.body.appendChild(p1El);
    document.body.appendChild(bTabEl);
    setBoundingClientRect(p1El, {
      left: 0,
      top: 0,
      right: 200,
      bottom: 400,
      width: 200,
      height: 400,
    });
    setBoundingClientRect(bTabEl, {
      left: 210,
      top: 0,
      right: 260,
      bottom: 30,
      width: 50,
      height: 30,
    });
    act(() => {
      hook.current().registerPanel('P1', p1El);
    });
    act(() => {
      const down = pointerEvent('pointerdown', {
        clientX: 235,
        clientY: 15,
        pointerId: 80,
      });
      Object.defineProperty(down, 'currentTarget', {
        value: bTabEl,
        configurable: true,
      });
      hook.current().onTabPointerDown(asReact(down), 'B');
    });
    // Left zone of P1 — opposite to source's side (B is right of P1) → swap → shown
    act(() => {
      const m = pointerEvent('pointermove', {
        clientX: 20,
        clientY: 200,
        pointerId: 80,
      });
      hook.current().onTabPointerMove(asReact(m));
    });
    expect(hook.current().dragState?.hoverZone).toBe('left');
    expect(hook.current().dragState?.hoverPanelId).toBe('P1');
    // Right zone of P1 — same side as source → suppress
    act(() => {
      const m = pointerEvent('pointermove', {
        clientX: 180,
        clientY: 200,
        pointerId: 80,
      });
      hook.current().onTabPointerMove(asReact(m));
    });
    expect(hook.current().dragState?.hoverZone).toBeNull();
    expect(hook.current().dragState?.hoverPanelId).toBeNull();
    // Top zone of P1 — perpendicular → split
    act(() => {
      const m = pointerEvent('pointermove', {
        clientX: 100,
        clientY: 20,
        pointerId: 80,
      });
      hook.current().onTabPointerMove(asReact(m));
    });
    expect(hook.current().dragState?.hoverZone).toBe('top');
    // Bottom zone of P1 — perpendicular → split
    act(() => {
      const m = pointerEvent('pointermove', {
        clientX: 100,
        clientY: 380,
        pointerId: 80,
      });
      hook.current().onTabPointerMove(asReact(m));
    });
    expect(hook.current().dragState?.hoverZone).toBe('bottom');
    // Center zone of P1 — merge
    act(() => {
      const m = pointerEvent('pointermove', {
        clientX: 100,
        clientY: 200,
        pointerId: 80,
      });
      hook.current().onTabPointerMove(asReact(m));
    });
    expect(hook.current().dragState?.hoverZone).toBe('center');
    hook.unmount();
    bTabEl.remove();
    p1El.remove();
  });

  it('stacked single-tab adjacent panels: opposite-side zone = swap (shown), same-side = suppress', () => {
    // Layout: P1 [A] top (y=[0,200]), P2 [B] bottom (y=[200,400]). B is below P1.
    // Dragging B onto P1's TOP zone is OPPOSITE to source → swap → shown.
    // Dragging B onto P1's BOTTOM zone is SAME side as source → suppress.
    let state: TileryLayoutState = tileryCreateInitialState({
      panels: [
        {
          id: 'P1',
          inset: { top: 0, right: 0, bottom: 50, left: 0 },
          tabs: [{ id: 'A', data: {} }],
        },
        {
          id: 'P2',
          inset: { top: 50, right: 0, bottom: 0, left: 0 },
          tabs: [{ id: 'B', data: {} }],
        },
      ],
    });
    const dispatch = (a: TileryReducerAction) => {
      state = tileryReducer(state, a);
    };
    const handle = makeTileryHandle(() => state, dispatch);
    const hook = renderHook(() => useTileryDragController(() => handle));
    const p1El = document.createElement('div');
    const bTabEl = document.createElement('div');
    document.body.appendChild(p1El);
    document.body.appendChild(bTabEl);
    setBoundingClientRect(p1El, {
      left: 0,
      top: 0,
      right: 400,
      bottom: 200,
      width: 400,
      height: 200,
    });
    setBoundingClientRect(bTabEl, {
      left: 0,
      top: 210,
      right: 50,
      bottom: 240,
      width: 50,
      height: 30,
    });
    act(() => {
      hook.current().registerPanel('P1', p1El);
    });
    act(() => {
      const down = pointerEvent('pointerdown', {
        clientX: 25,
        clientY: 225,
        pointerId: 81,
      });
      Object.defineProperty(down, 'currentTarget', {
        value: bTabEl,
        configurable: true,
      });
      hook.current().onTabPointerDown(asReact(down), 'B');
    });
    // Top zone of P1 — opposite to source (B is below P1) → swap → shown
    act(() => {
      const m = pointerEvent('pointermove', {
        clientX: 200,
        clientY: 10,
        pointerId: 81,
      });
      hook.current().onTabPointerMove(asReact(m));
    });
    expect(hook.current().dragState?.hoverZone).toBe('top');
    // Bottom zone — same side as source → suppress
    act(() => {
      const m = pointerEvent('pointermove', {
        clientX: 200,
        clientY: 190,
        pointerId: 81,
      });
      hook.current().onTabPointerMove(asReact(m));
    });
    expect(hook.current().dragState?.hoverZone).toBeNull();
    // Left zone — allowed (perpendicular)
    act(() => {
      const m = pointerEvent('pointermove', {
        clientX: 20,
        clientY: 100,
        pointerId: 81,
      });
      hook.current().onTabPointerMove(asReact(m));
    });
    expect(hook.current().dragState?.hoverZone).toBe('left');
    // Right zone — allowed
    act(() => {
      const m = pointerEvent('pointermove', {
        clientX: 380,
        clientY: 100,
        pointerId: 81,
      });
      hook.current().onTabPointerMove(asReact(m));
    });
    expect(hook.current().dragState?.hoverZone).toBe('right');
    hook.unmount();
    bTabEl.remove();
    p1El.remove();
  });

  it('does NOT suppress same-axis split when the source has multiple tabs (source will survive)', () => {
    // P1 [A] | P2 [B, C]. Dragging C onto P1: source P2 won't collapse, so
    // the split IS structurally meaningful (P2 keeps B). Allow left/right.
    let state: TileryLayoutState = tileryCreateInitialState({
      panels: [
        {
          id: 'P1',
          inset: { top: 0, right: 50, bottom: 0, left: 0 },
          tabs: [{ id: 'A', data: {} }],
        },
        {
          id: 'P2',
          inset: { top: 0, right: 0, bottom: 0, left: 50 },
          tabs: [
            { id: 'B', data: {} },
            { id: 'C', data: {} },
          ],
        },
      ],
    });
    const dispatch = (a: TileryReducerAction) => {
      state = tileryReducer(state, a);
    };
    const handle = makeTileryHandle(() => state, dispatch);
    const hook = renderHook(() => useTileryDragController(() => handle));
    const p1El = document.createElement('div');
    const cTabEl = document.createElement('div');
    document.body.appendChild(p1El);
    document.body.appendChild(cTabEl);
    setBoundingClientRect(p1El, {
      left: 0,
      top: 0,
      right: 200,
      bottom: 400,
      width: 200,
      height: 400,
    });
    setBoundingClientRect(cTabEl, {
      left: 260,
      top: 0,
      right: 320,
      bottom: 30,
      width: 60,
      height: 30,
    });
    act(() => {
      hook.current().registerPanel('P1', p1El);
    });
    act(() => {
      const down = pointerEvent('pointerdown', {
        clientX: 290,
        clientY: 15,
        pointerId: 90,
      });
      Object.defineProperty(down, 'currentTarget', {
        value: cTabEl,
        configurable: true,
      });
      hook.current().onTabPointerDown(asReact(down), 'C');
    });
    act(() => {
      const m = pointerEvent('pointermove', {
        clientX: 20,
        clientY: 200,
        pointerId: 90,
      });
      hook.current().onTabPointerMove(asReact(m));
    });
    expect(hook.current().dragState?.hoverZone).toBe('left');
    hook.unmount();
    cTabEl.remove();
    p1El.remove();
  });

  it('does NOT suppress same-axis split when the target has multiple tabs (target keeps others)', () => {
    // P1 [A, B] | P2 [C]. Dragging C onto P1: target P1 keeps A and B in its
    // shrunk area, NEW gets C. Different shape, allow.
    let state: TileryLayoutState = tileryCreateInitialState({
      panels: [
        {
          id: 'P1',
          inset: { top: 0, right: 50, bottom: 0, left: 0 },
          tabs: [
            { id: 'A', data: {} },
            { id: 'B', data: {} },
          ],
        },
        {
          id: 'P2',
          inset: { top: 0, right: 0, bottom: 0, left: 50 },
          tabs: [{ id: 'C', data: {} }],
        },
      ],
    });
    const dispatch = (a: TileryReducerAction) => {
      state = tileryReducer(state, a);
    };
    const handle = makeTileryHandle(() => state, dispatch);
    const hook = renderHook(() => useTileryDragController(() => handle));
    const p1El = document.createElement('div');
    const cTabEl = document.createElement('div');
    document.body.appendChild(p1El);
    document.body.appendChild(cTabEl);
    setBoundingClientRect(p1El, {
      left: 0,
      top: 0,
      right: 200,
      bottom: 400,
      width: 200,
      height: 400,
    });
    setBoundingClientRect(cTabEl, {
      left: 210,
      top: 0,
      right: 260,
      bottom: 30,
      width: 50,
      height: 30,
    });
    act(() => {
      hook.current().registerPanel('P1', p1El);
    });
    act(() => {
      const down = pointerEvent('pointerdown', {
        clientX: 235,
        clientY: 15,
        pointerId: 91,
      });
      Object.defineProperty(down, 'currentTarget', {
        value: cTabEl,
        configurable: true,
      });
      hook.current().onTabPointerDown(asReact(down), 'C');
    });
    act(() => {
      const m = pointerEvent('pointermove', {
        clientX: 180,
        clientY: 200,
        pointerId: 91,
      });
      hook.current().onTabPointerMove(asReact(m));
    });
    expect(hook.current().dragState?.hoverZone).toBe('right');
    hook.unmount();
    cTabEl.remove();
    p1El.remove();
  });

  it('3+ panels in a row: dropping single-tab on opposite-side zone of single-tab neighbor = swap', () => {
    // Three single-tab panels in a row: A | B | C. Dragging C onto B's LEFT
    // zone is the user's "put me to the left of B" intent — swap B and C
    // positions cleanly (preserves proportions). RIGHT zone (same side as C)
    // is suppressed.
    let state: TileryLayoutState = tileryCreateInitialState({
      panels: [
        {
          id: 'P1',
          inset: { top: 0, right: 70, bottom: 0, left: 0 },
          tabs: [{ id: 'A', data: {} }],
        },
        {
          id: 'P2',
          inset: { top: 0, right: 30, bottom: 0, left: 30 },
          tabs: [{ id: 'B', data: {} }],
        },
        {
          id: 'P3',
          inset: { top: 0, right: 0, bottom: 0, left: 70 },
          tabs: [{ id: 'C', data: {} }],
        },
      ],
    });
    const dispatch = (a: TileryReducerAction) => {
      state = tileryReducer(state, a);
    };
    const handle = makeTileryHandle(() => state, dispatch);
    const hook = renderHook(() => useTileryDragController(() => handle));
    const p2El = document.createElement('div');
    const cTabEl = document.createElement('div');
    document.body.appendChild(p2El);
    document.body.appendChild(cTabEl);
    setBoundingClientRect(p2El, {
      left: 200,
      top: 0,
      right: 400,
      bottom: 400,
      width: 200,
      height: 400,
    });
    setBoundingClientRect(cTabEl, {
      left: 410,
      top: 0,
      right: 460,
      bottom: 30,
      width: 50,
      height: 30,
    });
    act(() => {
      hook.current().registerPanel('P2', p2El);
    });
    act(() => {
      const down = pointerEvent('pointerdown', {
        clientX: 435,
        clientY: 15,
        pointerId: 110,
      });
      Object.defineProperty(down, 'currentTarget', {
        value: cTabEl,
        configurable: true,
      });
      hook.current().onTabPointerDown(asReact(down), 'C');
    });
    // Left zone of P2 — C is to the right of P2 → opposite side → swap → shown
    act(() => {
      const m = pointerEvent('pointermove', {
        clientX: 215,
        clientY: 200,
        pointerId: 110,
      });
      hook.current().onTabPointerMove(asReact(m));
    });
    expect(hook.current().dragState?.hoverPanelId).toBe('P2');
    expect(hook.current().dragState?.hoverZone).toBe('left');
    // Right zone — C is already to the right of P2 → same side → suppress
    act(() => {
      const m = pointerEvent('pointermove', {
        clientX: 385,
        clientY: 200,
        pointerId: 110,
      });
      hook.current().onTabPointerMove(asReact(m));
    });
    expect(hook.current().dragState?.hoverZone).toBeNull();
    // Top zone — perpendicular → split
    act(() => {
      const m = pointerEvent('pointermove', {
        clientX: 300,
        clientY: 20,
        pointerId: 110,
      });
      hook.current().onTabPointerMove(asReact(m));
    });
    expect(hook.current().dragState?.hoverZone).toBe('top');
    hook.unmount();
    cTabEl.remove();
    p2El.remove();
  });

  it('allows same-panel split zones when the panel has multiple tabs', () => {
    // Multi-tab panel: dragging one of its tabs onto its own split zone is a
    // valid operation (source survives with the other tabs). The redundancy
    // rule doesn't apply, and the zone should be shown.
    let state: TileryLayoutState = tileryCreateInitialState({
      panels: [
        {
          id: 'MULTI',
          inset: { top: 0, right: 0, bottom: 0, left: 0 },
          tabs: [
            { id: 'A', data: {} },
            { id: 'B', data: {} },
          ],
        },
      ],
    });
    const dispatch = (a: TileryReducerAction) => {
      state = tileryReducer(state, a);
    };
    const handle = makeTileryHandle(() => state, dispatch);
    const hook = renderHook(() => useTileryDragController(() => handle));
    const panelEl = document.createElement('div');
    const aTabEl = document.createElement('div');
    document.body.appendChild(panelEl);
    document.body.appendChild(aTabEl);
    setBoundingClientRect(panelEl, {
      left: 0,
      top: 0,
      right: 400,
      bottom: 400,
      width: 400,
      height: 400,
    });
    setBoundingClientRect(aTabEl, {
      left: 10,
      top: 0,
      right: 60,
      bottom: 30,
      width: 50,
      height: 30,
    });
    act(() => {
      hook.current().registerPanel('MULTI', panelEl);
    });
    act(() => {
      const down = pointerEvent('pointerdown', {
        clientX: 35,
        clientY: 15,
        pointerId: 100,
      });
      Object.defineProperty(down, 'currentTarget', {
        value: aTabEl,
        configurable: true,
      });
      hook.current().onTabPointerDown(asReact(down), 'A');
    });
    // Right zone of own multi-tab panel → allowed
    act(() => {
      const m = pointerEvent('pointermove', {
        clientX: 380,
        clientY: 200,
        pointerId: 100,
      });
      hook.current().onTabPointerMove(asReact(m));
    });
    expect(hook.current().dragState?.hoverPanelId).toBe('MULTI');
    expect(hook.current().dragState?.hoverZone).toBe('right');
    hook.unmount();
    aTabEl.remove();
    panelEl.remove();
  });

  it('does NOT suppress same-axis split when the panels are not adjacent', () => {
    // Layout: P1 [A] top-left, P2 [B] bottom-right. Diagonal opposites — no
    // shared edge. Splitting either is a genuine layout change.
    let state: TileryLayoutState = tileryCreateInitialState({
      panels: [
        {
          id: 'P1',
          inset: { top: 0, right: 50, bottom: 50, left: 0 },
          tabs: [{ id: 'A', data: {} }],
        },
        {
          id: 'P2',
          inset: { top: 50, right: 0, bottom: 0, left: 50 },
          tabs: [{ id: 'B', data: {} }],
        },
        {
          id: 'TR',
          inset: { top: 0, right: 0, bottom: 50, left: 50 },
          tabs: [{ id: 'X', data: {} }],
        },
        {
          id: 'BL',
          inset: { top: 50, right: 50, bottom: 0, left: 0 },
          tabs: [{ id: 'Y', data: {} }],
        },
      ],
    });
    const dispatch = (a: TileryReducerAction) => {
      state = tileryReducer(state, a);
    };
    const handle = makeTileryHandle(() => state, dispatch);
    const hook = renderHook(() => useTileryDragController(() => handle));
    const p1El = document.createElement('div');
    const bTabEl = document.createElement('div');
    document.body.appendChild(p1El);
    document.body.appendChild(bTabEl);
    setBoundingClientRect(p1El, {
      left: 0,
      top: 0,
      right: 200,
      bottom: 200,
      width: 200,
      height: 200,
    });
    setBoundingClientRect(bTabEl, {
      left: 210,
      top: 210,
      right: 260,
      bottom: 240,
      width: 50,
      height: 30,
    });
    act(() => {
      hook.current().registerPanel('P1', p1El);
    });
    act(() => {
      const down = pointerEvent('pointerdown', {
        clientX: 235,
        clientY: 225,
        pointerId: 92,
      });
      Object.defineProperty(down, 'currentTarget', {
        value: bTabEl,
        configurable: true,
      });
      hook.current().onTabPointerDown(asReact(down), 'B');
    });
    // Right zone of P1 — adjacent rule wouldn't apply since P1 and P2 don't share an edge
    act(() => {
      const m = pointerEvent('pointermove', {
        clientX: 180,
        clientY: 100,
        pointerId: 92,
      });
      hook.current().onTabPointerMove(asReact(m));
    });
    expect(hook.current().dragState?.hoverZone).toBe('right');
    // Bottom zone of P1 — same reasoning
    act(() => {
      const m = pointerEvent('pointermove', {
        clientX: 100,
        clientY: 180,
        pointerId: 92,
      });
      hook.current().onTabPointerMove(asReact(m));
    });
    expect(hook.current().dragState?.hoverZone).toBe('bottom');
    hook.unmount();
    bTabEl.remove();
    p1El.remove();
  });

  it('suppresses ALL hover feedback over the source panel when it has only one tab', () => {
    // Single panel with one tab; dragging that tab over its own panel —
    // anywhere (split zones, center, or tab bar) — should produce NO hover
    // state, because every possible drop is a no-op.
    let state: TileryLayoutState = tileryCreateInitialState({
      panels: [
        {
          id: 'SOLO',
          inset: { top: 0, right: 0, bottom: 0, left: 0 },
          tabs: [{ id: 'ONE', data: {} }],
        },
      ],
    });
    const dispatch = (a: TileryReducerAction) => {
      state = tileryReducer(state, a);
    };
    const handle = makeTileryHandle(() => state, dispatch);
    const hook = renderHook(() => useTileryDragController(() => handle));
    const panelEl = document.createElement('div');
    const tabBarEl = document.createElement('div');
    const oneEl = document.createElement('div');
    document.body.appendChild(panelEl);
    document.body.appendChild(tabBarEl);
    document.body.appendChild(oneEl);
    setBoundingClientRect(panelEl, {
      left: 0,
      top: 0,
      right: 400,
      bottom: 400,
      width: 400,
      height: 400,
    });
    setBoundingClientRect(tabBarEl, {
      left: 0,
      top: 0,
      right: 400,
      bottom: 30,
      width: 400,
      height: 30,
    });
    setBoundingClientRect(oneEl, {
      left: 0,
      top: 0,
      right: 80,
      bottom: 30,
      width: 80,
      height: 30,
    });
    act(() => {
      hook.current().registerPanel('SOLO', panelEl);
      hook.current().registerTabBar('SOLO', tabBarEl);
      hook.current().registerTab('ONE', oneEl);
    });
    act(() => {
      const down = pointerEvent('pointerdown', {
        clientX: 40,
        clientY: 15,
        pointerId: 70,
      });
      Object.defineProperty(down, 'currentTarget', {
        value: oneEl,
        configurable: true,
      });
      hook.current().onTabPointerDown(asReact(down), 'ONE');
    });
    // Right zone — suppressed
    act(() => {
      const m = pointerEvent('pointermove', {
        clientX: 380,
        clientY: 200,
        pointerId: 70,
      });
      hook.current().onTabPointerMove(asReact(m));
    });
    expect(hook.current().dragState?.hoverPanelId).toBeNull();
    expect(hook.current().dragState?.hoverZone).toBeNull();
    expect(hook.current().dragState?.hoverTabBar).toBeNull();
    // Center zone — also suppressed
    act(() => {
      const m = pointerEvent('pointermove', {
        clientX: 200,
        clientY: 200,
        pointerId: 70,
      });
      hook.current().onTabPointerMove(asReact(m));
    });
    expect(hook.current().dragState?.hoverPanelId).toBeNull();
    expect(hook.current().dragState?.hoverZone).toBeNull();
    expect(hook.current().dragState?.hoverTabBar).toBeNull();
    // Tab bar — also suppressed
    act(() => {
      const m = pointerEvent('pointermove', {
        clientX: 200,
        clientY: 15,
        pointerId: 70,
      });
      hook.current().onTabPointerMove(asReact(m));
    });
    expect(hook.current().dragState?.hoverPanelId).toBeNull();
    expect(hook.current().dragState?.hoverZone).toBeNull();
    expect(hook.current().dragState?.hoverTabBar).toBeNull();
    hook.unmount();
    oneEl.remove();
    tabBarEl.remove();
    panelEl.remove();
  });
});

describe('useTileryDragController — panel drag from tab bar', () => {
  it('onTabBarPointerDown initiates a panel drag from empty tab bar area', () => {
    const { handle } = setupStore();
    const hook = renderHook(() => useTileryDragController(() => handle));
    const tabBarEl = document.createElement('div');
    tabBarEl.setAttribute('data-panel-id', 'P1');
    document.body.appendChild(tabBarEl);
    act(() => {
      hook.current().registerTabBar('P1', tabBarEl);
    });
    const down = pointerEvent('pointerdown', {
      clientX: 200,
      clientY: 10,
      pointerId: 1,
    });
    Object.defineProperty(down, 'target', { value: tabBarEl });
    Object.defineProperty(down, 'currentTarget', { value: tabBarEl });
    act(() => {
      hook.current().onTabBarPointerDown(asReact(down), 'P1');
    });
    // Move past threshold to initiate drag
    const move = pointerEvent('pointermove', {
      clientX: 250,
      clientY: 200,
      pointerId: 1,
    });
    act(() => {
      hook.current().onTabPointerMove(asReact(move));
    });
    // Drag state should be set with the active tab of P1
    expect(hook.current().dragState).not.toBeNull();
    expect(hook.current().dragState?.tabId).toBe('T1');
    hook.unmount();
    tabBarEl.remove();
  });

  it('onTabBarPointerDown ignores clicks on tab elements', () => {
    const { handle } = setupStore();
    const hook = renderHook(() => useTileryDragController(() => handle));
    const tabBarEl = document.createElement('div');
    tabBarEl.setAttribute('data-panel-id', 'P1');
    const tabEl = document.createElement('div');
    tabEl.setAttribute('data-tab-id', 'T1');
    tabBarEl.appendChild(tabEl);
    document.body.appendChild(tabBarEl);
    act(() => {
      hook.current().registerTabBar('P1', tabBarEl);
    });
    const down = pointerEvent('pointerdown', {
      clientX: 50,
      clientY: 10,
      pointerId: 1,
    });
    Object.defineProperty(down, 'target', { value: tabEl });
    Object.defineProperty(down, 'currentTarget', { value: tabBarEl });
    act(() => {
      hook.current().onTabBarPointerDown(asReact(down), 'P1');
    });
    // Move past threshold — should NOT initiate drag
    const move = pointerEvent('pointermove', {
      clientX: 100,
      clientY: 200,
      pointerId: 1,
    });
    act(() => {
      hook.current().onTabPointerMove(asReact(move));
    });
    expect(hook.current().dragState).toBeNull();
    hook.unmount();
    tabBarEl.remove();
  });

  it('onTabBarPointerUp commits the panel drag', () => {
    const { handle } = setupStore();
    const hook = renderHook(() => useTileryDragController(() => handle));
    const tabBarEl = document.createElement('div');
    tabBarEl.setAttribute('data-panel-id', 'P1');
    document.body.appendChild(tabBarEl);
    act(() => {
      hook.current().registerTabBar('P1', tabBarEl);
    });
    const down = pointerEvent('pointerdown', {
      clientX: 200,
      clientY: 10,
      pointerId: 1,
    });
    Object.defineProperty(down, 'target', { value: tabBarEl });
    Object.defineProperty(down, 'currentTarget', { value: tabBarEl });
    act(() => {
      hook.current().onTabBarPointerDown(asReact(down), 'P1');
    });
    const move = pointerEvent('pointermove', {
      clientX: 250,
      clientY: 200,
      pointerId: 1,
    });
    act(() => {
      hook.current().onTabPointerMove(asReact(move));
    });
    expect(hook.current().dragState).not.toBeNull();
    const up = pointerEvent('pointerup', {
      clientX: 250,
      clientY: 200,
      pointerId: 1,
    });
    act(() => {
      hook.current().onTabBarPointerUp(asReact(up));
    });
    expect(hook.current().dragState).toBeNull();
    hook.unmount();
    tabBarEl.remove();
  });

  it('onTabBarPointerUp with no drag clears pending state', () => {
    const { handle } = setupStore();
    const hook = renderHook(() => useTileryDragController(() => handle));
    const tabBarEl = document.createElement('div');
    tabBarEl.setAttribute('data-panel-id', 'P1');
    document.body.appendChild(tabBarEl);
    act(() => {
      hook.current().registerTabBar('P1', tabBarEl);
    });
    const down = pointerEvent('pointerdown', {
      clientX: 200,
      clientY: 10,
      pointerId: 1,
    });
    Object.defineProperty(down, 'target', { value: tabBarEl });
    Object.defineProperty(down, 'currentTarget', { value: tabBarEl });
    act(() => {
      hook.current().onTabBarPointerDown(asReact(down), 'P1');
    });
    // Pointer up without exceeding threshold (no move)
    const up = pointerEvent('pointerup', {
      clientX: 200,
      clientY: 10,
      pointerId: 1,
    });
    act(() => {
      hook.current().onTabBarPointerUp(asReact(up));
    });
    expect(hook.current().dragState).toBeNull();
    hook.unmount();
    tabBarEl.remove();
  });
});

describe('useTileryDragController — fullscreen mode', () => {
  it('suppresses hidden panel drop targets while keeping the fullscreen tab bar interactive', () => {
    const { handle } = setupStore();
    act(() => {
      handle.maximizePanel('P1');
    });
    const hook = renderHook(() => useTileryDragController(() => handle));

    const p2PanelEl = document.createElement('div');
    const p1TabBarEl = document.createElement('div');
    const p2TabBarEl = document.createElement('div');
    const t1El = document.createElement('div');
    const t2El = document.createElement('div');
    document.body.append(p2PanelEl, p1TabBarEl, p2TabBarEl, t1El, t2El);
    setBoundingClientRect(p2PanelEl, {
      left: 200,
      top: 0,
      right: 400,
      bottom: 200,
      width: 200,
      height: 200,
    });
    setBoundingClientRect(p1TabBarEl, {
      left: 0,
      top: 0,
      right: 200,
      bottom: 30,
      width: 200,
      height: 30,
    });
    setBoundingClientRect(p2TabBarEl, {
      left: 200,
      top: 0,
      right: 400,
      bottom: 30,
      width: 200,
      height: 30,
    });
    setBoundingClientRect(t1El, {
      left: 0,
      top: 0,
      right: 50,
      bottom: 30,
      width: 50,
      height: 30,
    });
    setBoundingClientRect(t2El, {
      left: 50,
      top: 0,
      right: 100,
      bottom: 30,
      width: 50,
      height: 30,
    });
    act(() => {
      hook.current().registerPanel('P2', p2PanelEl);
      hook.current().registerTabBar('P1', p1TabBarEl);
      hook.current().registerTabBar('P2', p2TabBarEl);
      hook.current().registerTab('T1', t1El);
      hook.current().registerTab('T2', t2El);
    });

    const sourceEl = document.createElement('div');
    document.body.appendChild(sourceEl);
    setBoundingClientRect(sourceEl, {
      left: 500,
      top: 500,
      right: 550,
      bottom: 530,
      width: 50,
      height: 30,
    });
    act(() => {
      const down = pointerEvent('pointerdown', {
        clientX: 525,
        clientY: 515,
        pointerId: 72,
      });
      Object.defineProperty(down, 'currentTarget', {
        value: sourceEl,
        configurable: true,
      });
      hook.current().onTabPointerDown(asReact(down), 'T1');
    });

    act(() => {
      hook.current().onTabPointerMove(
        asReact(
          pointerEvent('pointermove', {
            clientX: 250,
            clientY: 15,
            pointerId: 72,
          }),
        ),
      );
    });
    expect(hook.current().dragState?.hoverTabBar).toBeNull();
    expect(hook.current().dragState?.hoverPanelId).toBeNull();

    act(() => {
      hook.current().onTabPointerMove(
        asReact(
          pointerEvent('pointermove', {
            clientX: 60,
            clientY: 15,
            pointerId: 72,
          }),
        ),
      );
    });
    expect(hook.current().dragState?.hoverTabBar).toEqual({
      panelId: 'P1',
      hit: { kind: 'before', tabId: 'T2' },
    });

    hook.unmount();
    p2PanelEl.remove();
    p1TabBarEl.remove();
    p2TabBarEl.remove();
    t1El.remove();
    t2El.remove();
    sourceEl.remove();
  });
});
