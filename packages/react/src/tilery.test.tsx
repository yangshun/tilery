// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import React, { act, createRef } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';

import {
  Tilery,
  type TileryActiveTabChangeEvent,
  type TileryPanelsCloseEvent,
  type TileryPanelsOpenEvent,
  type TileryPanelSplitEvent,
  type TileryProps,
  type TileryResizeEvent,
  type TileryTabsCloseEvent,
  type TileryTabsMoveEvent,
  type TileryTabsOpenEvent,
} from './tilery';
import type { TileryInitialLayout, TileryHandle } from 'tilery/internal';

// Integration tests for the Tilery component itself. They exercise the
// JSX tree that the per-piece unit tests don't reach: panel-chrome, tab,
// tab-bar, divider, drop-overlay, and the wiring in tilery.tsx itself
// (handle caches, the tab portal effect, divider-drag dispatch). Each
// test mounts a small layout, performs a single interaction, and asserts
// the resulting DOM and the imperative-handle state.

type Data = { title: string };

afterEach(() => {
  vi.restoreAllMocks();
});

function lShapeLayout(
  opts: { editorFullScreen?: boolean } = {},
): TileryInitialLayout<Data> {
  // Sidebar + (editor / terminal) = two nested one-dimensional groups.
  return {
    type: 'group',
    direction: 'horizontal',
    children: [
      {
        type: 'panel',
        id: 'sidebar',
        size: 40,
        tabs: [{ id: 'side', data: { title: 'Side' } }],
      },
      {
        type: 'group',
        direction: 'vertical',
        size: 60,
        children: [
          {
            type: 'panel',
            id: 'editor',
            size: 50,
            fullScreen: opts.editorFullScreen,
            tabs: [
              { id: 'foo', data: { title: 'foo.ts' } },
              { id: 'bar', data: { title: 'bar.ts' } },
            ],
          },
          {
            type: 'panel',
            id: 'term',
            size: 50,
            tabs: [{ id: 'sh', data: { title: 'bash' } }],
          },
        ],
      },
    ],
  };
}

function simpleLayout(): TileryInitialLayout<Data> {
  return {
    type: 'group',
    direction: 'horizontal',
    children: [
      {
        type: 'panel',
        id: 'left',
        size: 60,
        tabs: [{ id: 'left-tab', data: { title: 'Left' } }],
      },
      {
        type: 'panel',
        id: 'right',
        size: 40,
        tabs: [{ id: 'right-tab', data: { title: 'Right' } }],
      },
    ],
  };
}

function singlePanelLayout(): TileryInitialLayout<Data> {
  return {
    type: 'panel',
    id: 'solo',
    tabs: [{ id: 'only', data: { title: 'Only' } }],
  };
}

function floatingLayout(): TileryInitialLayout<Data> {
  return {
    type: 'root',
    main: {
      type: 'panel',
      id: 'main',
      tabs: [{ id: 'main-tab', data: { title: 'Main' } }],
    },
    floating: [
      {
        type: 'floatingPanel',
        id: 'palette',
        bounds: { x: 10, y: 10, width: 32, height: 40 },
        tabs: [{ id: 'palette-tab', data: { title: 'Palette' } }],
      },
    ],
  };
}

function constrainedLayout(): TileryInitialLayout<Data> {
  return {
    type: 'group',
    direction: 'horizontal',
    children: [
      {
        type: 'panel',
        id: 'navigator',
        size: 24,
        minSize: 18,
        maxSize: 34,
        tabs: [{ id: 'navigator-tab', data: { title: 'Navigator' } }],
      },
      {
        type: 'group',
        direction: 'vertical',
        size: 76,
        children: [
          {
            type: 'panel',
            id: 'editor',
            size: 68,
            minSize: 36,
            tabs: [{ id: 'editor-tab', data: { title: 'Editor' } }],
          },
          {
            type: 'panel',
            id: 'console',
            size: 32,
            minSize: 18,
            maxSize: 42,
            tabs: [{ id: 'console-tab', data: { title: 'Console' } }],
          },
        ],
      },
    ],
  };
}

function lockedNavigatorLayout(): TileryInitialLayout<Data> {
  return {
    type: 'group',
    direction: 'horizontal',
    children: [
      {
        type: 'panel',
        id: 'navigator',
        size: 30,
        resizable: false,
        tabs: [{ id: 'navigator-tab', data: { title: 'Navigator' } }],
      },
      {
        type: 'panel',
        id: 'editor',
        size: 70,
        tabs: [{ id: 'editor-tab', data: { title: 'Editor' } }],
      },
    ],
  };
}

function pixelConstrainedLayout(): TileryInitialLayout<Data> {
  return {
    type: 'group',
    direction: 'horizontal',
    children: [
      {
        type: 'panel',
        id: 'left',
        size: 30,
        minSize: '200px',
        maxSize: '400px',
        tabs: [{ id: 'left-tab', data: { title: 'Left' } }],
      },
      {
        type: 'panel',
        id: 'right',
        size: 70,
        minSize: '100px',
        tabs: [{ id: 'right-tab', data: { title: 'Right' } }],
      },
    ],
  };
}

function impossiblePixelConstrainedLayout(): TileryInitialLayout<Data> {
  return {
    type: 'group',
    direction: 'horizontal',
    children: [
      {
        type: 'panel',
        id: 'left',
        size: 50,
        minSize: '700px',
        tabs: [{ id: 'left-tab', data: { title: 'Left' } }],
      },
      {
        type: 'panel',
        id: 'right',
        size: 50,
        minSize: '400px',
        tabs: [{ id: 'right-tab', data: { title: 'Right' } }],
      },
    ],
  };
}

function containerResizeConstrainedLayout(): TileryInitialLayout<Data> {
  return {
    type: 'group',
    direction: 'horizontal',
    children: [
      {
        type: 'panel',
        id: 'left',
        size: 30,
        minSize: '400px',
        tabs: [{ id: 'left-tab', data: { title: 'Left' } }],
      },
      {
        type: 'panel',
        id: 'right',
        size: 70,
        tabs: [{ id: 'right-tab', data: { title: 'Right' } }],
      },
    ],
  };
}

function installResizeObserverMock() {
  const original = window.ResizeObserver;
  const observers: { callback: ResizeObserverCallback }[] = [];
  class ResizeObserverMock {
    readonly callback: ResizeObserverCallback;
    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
      observers.push(this);
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver =
    ResizeObserverMock as unknown as typeof window.ResizeObserver;
  return {
    observers,
    restore() {
      window.ResizeObserver = original;
    },
  };
}

// Stubs the container so percentage math is deterministic.
function stubContainerRect(el: HTMLElement) {
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

function mount(
  initialLayout: TileryInitialLayout<Data>,
  onChange?: (s: unknown) => void,
  extraProps: Partial<TileryProps<Data>> = {},
  opts: { stubRect?: boolean } = {},
) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  const ref = createRef<TileryHandle>();
  act(() => {
    root.render(
      <Tilery<Data>
        ref={ref}
        initialLayout={initialLayout}
        renderTabHeader={(tab) => <span>{tab.data.title}</span>}
        renderTabContent={(tab) => (
          <div data-content-of={tab.id}>{tab.data.title}</div>
        )}
        onChange={onChange}
        {...extraProps}
      />,
    );
  });
  // The container ref is `.tilery__inner` — stub its rect so any drag math
  // can convert clientX/Y into percentages without relying on jsdom layout.
  const inner = host.querySelector('.tilery__inner') as HTMLDivElement;
  if (opts.stubRect !== false) stubContainerRect(inner);

  return {
    host,
    inner,
    handle: () => ref.current!,
    cleanup() {
      act(() => {
        root.unmount();
      });
      host.remove();
    },
  };
}

// Find a React fiber handler by name on a DOM element.
function reactProps(el: Element): Record<string, (e: unknown) => void> {
  const key = Object.keys(el).find((k) => k.startsWith('__reactProps')) as
    | string
    | undefined;
  if (!key) throw new Error('no react props key');
  return (
    el as unknown as Record<string, Record<string, (e: unknown) => void>>
  )[key];
}

function pointerEvent(
  overrides: Partial<{
    clientX: number;
    clientY: number;
    button: number;
    pointerId: number;
  }> = {},
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

type PopoutWindowMock = Window & {
  document: Document;
  closed: boolean;
  screenX: number;
  screenY: number;
  outerWidth: number;
  outerHeight: number;
  focus: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  dispatchPopoutEvent: (type: string) => void;
};

function createPopoutWindowMock(
  bounds = { left: 90, top: 80, width: 760, height: 540 },
): PopoutWindowMock {
  const doc = document.implementation.createHTMLDocument('Popout');
  const listeners = new Map<string, Set<EventListenerOrEventListenerObject>>();
  const win = {
    document: doc,
    closed: false,
    screenX: bounds.left,
    screenY: bounds.top,
    outerWidth: bounds.width,
    outerHeight: bounds.height,
    focus: vi.fn(),
    close: vi.fn(),
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject,
    ) {
      const set = listeners.get(type) ?? new Set();
      set.add(listener);
      listeners.set(type, set);
    },
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject,
    ) {
      listeners.get(type)?.delete(listener);
    },
    dispatchPopoutEvent(type: string) {
      const event = new Event(type);
      for (const listener of listeners.get(type) ?? []) {
        if (typeof listener === 'function') listener.call(win, event);
        else listener.handleEvent(event);
      }
    },
  } as unknown as PopoutWindowMock;
  win.close = vi.fn(() => {
    win.closed = true;
    win.dispatchPopoutEvent('beforeunload');
  });
  return win;
}

describe('Tilery — rendering', () => {
  it('renders one panel per initial layout tree leaf with the right tab strip', () => {
    const t = mount(lShapeLayout());
    const panels = t.host.querySelectorAll('.tilery__panel');
    expect(panels).toHaveLength(3);
    const tabs = t.host.querySelectorAll('.tilery__tab');
    // sidebar(1) + editor(2) + term(1) = 4 tabs.
    expect(tabs).toHaveLength(4);
    expect(Array.from(tabs).map((el) => el.textContent?.trim())).toEqual([
      'Side×',
      'foo.ts×',
      'bar.ts×',
      'bash×',
    ]);
    t.cleanup();
  });

  it('isolates the root stacking context', () => {
    const css = readFileSync('packages/core/src/tilery.css', 'utf8');

    expect(css).toMatch(/\.tilery\s*\{[^}]*isolation:\s*isolate;/);
  });

  it('marks locked panel and tab-bar affordance state in the DOM', () => {
    const t = mount({
      type: 'group',
      direction: 'horizontal',
      children: [
        {
          type: 'panel',
          id: 'locked-panel',
          locked: true,
          tabs: [{ id: 'locked-tab', data: { title: 'Locked' } }],
        },
        {
          type: 'panel',
          id: 'mixed-panel',
          tabs: [
            { id: 'dragging-tab', data: { title: 'Drag' } },
            {
              id: 'static-tab',
              data: { title: 'Static' },
              draggable: false,
            },
          ],
        },
      ],
    });

    const lockedPanel = t.host.querySelector<HTMLElement>(
      '[data-panel-id="locked-panel"].tilery__panel',
    )!;
    const lockedTabBar = t.host.querySelector<HTMLElement>(
      '[data-panel-id="locked-panel"].tilery__tab-bar',
    )!;
    const mixedPanel = t.host.querySelector<HTMLElement>(
      '[data-panel-id="mixed-panel"].tilery__panel',
    )!;
    const mixedTabBar = t.host.querySelector<HTMLElement>(
      '[data-panel-id="mixed-panel"].tilery__tab-bar',
    )!;
    const staticTab = t.host.querySelector<HTMLElement>(
      '[data-tab-id="static-tab"]',
    )!;

    expect(lockedPanel.dataset.resizable).toBe('false');
    expect(lockedPanel.dataset.draggable).toBe('false');
    expect(lockedPanel.dataset.droppable).toBe('false');
    expect(lockedTabBar.dataset.draggable).toBe('false');
    expect(lockedTabBar.dataset.droppable).toBe('false');
    expect(mixedPanel.dataset.draggable).toBe('true');
    expect(mixedPanel.dataset.droppable).toBe('true');
    expect(mixedTabBar.dataset.draggable).toBe('false');
    expect(staticTab.dataset.draggable).toBe('false');
    t.cleanup();
  });

  it('positions panels from the initial group tree', () => {
    const t = mount(lShapeLayout());
    const panels = Array.from(
      t.host.querySelectorAll<HTMLElement>('.tilery__panel'),
    );
    expect(panels[0]!.style.left).toBe('0%');
    expect(panels[0]!.style.right).toBe('60%');
    expect(panels[1]!.style.left).toBe('40%');
    expect(panels[2]!.style.top).toBe('50%');
    t.cleanup();
  });

  it('renders floating panels with detached bounds and z-order', () => {
    const t = mount(floatingLayout());
    const palette = t.host.querySelector<HTMLElement>(
      '.tilery__panel[data-panel-id="palette"]',
    )!;

    expect(palette.dataset.floating).toBe('true');
    expect(palette.style.left).toBe('10%');
    expect(palette.style.top).toBe('10%');
    expect(palette.style.width).toBe('32%');
    expect(palette.style.height).toBe('40%');
    expect(palette.style.zIndex).toBe('20');
    expect(
      palette.querySelectorAll('.tilery__floating-resize-handle'),
    ).toHaveLength(8);
    expect(t.handle().getLayout()).toMatchObject({
      type: 'root',
      floating: [
        {
          type: 'floatingPanel',
          id: 'palette',
          bounds: { x: 10, y: 10, width: 32, height: 40 },
        },
      ],
    });
    t.cleanup();
  });

  it('does not render floating resize handles when the panel is not resizable', () => {
    const t = mount({
      type: 'root',
      main: {
        type: 'panel',
        id: 'main',
        tabs: [{ id: 'main-tab', data: { title: 'Main' } }],
      },
      floating: [
        {
          type: 'floatingPanel',
          id: 'locked',
          resizable: false,
          tabs: [{ id: 'locked-tab', data: { title: 'Locked' } }],
        },
      ],
    });
    expect(
      t.host.querySelectorAll(
        '.tilery__panel[data-panel-id="locked"] .tilery__floating-resize-handle',
      ),
    ).toHaveLength(0);
    t.cleanup();
  });

  it('does not render resize handles when a panel is floated with resizable=false', () => {
    const t = mount(simpleLayout());

    act(() => {
      t.handle().floatPanel('left', {
        x: 8,
        y: 10,
        width: 36,
        height: 44,
        resizable: false,
      });
    });

    expect(
      t.host.querySelectorAll(
        '.tilery__panel[data-panel-id="left"] .tilery__floating-resize-handle',
      ),
    ).toHaveLength(0);
    t.cleanup();
  });

  it('focuses floating panels from panel pointerdown', () => {
    const t = mount({
      type: 'root',
      main: {
        type: 'panel',
        id: 'main',
        tabs: [{ id: 'main-tab', data: { title: 'Main' } }],
      },
      floating: [
        {
          type: 'floatingPanel',
          id: 'first',
          tabs: [{ id: 'first-tab', data: { title: 'First' } }],
        },
        {
          type: 'floatingPanel',
          id: 'second',
          tabs: [{ id: 'second-tab', data: { title: 'Second' } }],
        },
      ],
    });
    const first = t.host.querySelector<HTMLElement>(
      '.tilery__panel[data-panel-id="first"]',
    )!;

    act(() => {
      reactProps(first).onPointerDown(pointerEvent());
    });

    expect(t.handle().getPanel('first')?.floatingZIndex).toBe(21);
    expect(t.handle().getPanel('second')?.floatingZIndex).toBe(20);
    t.cleanup();
  });

  it('renders a popped-out panel into a native window portal', () => {
    const popout = createPopoutWindowMock();
    const open = vi.spyOn(window, 'open').mockReturnValue(popout);
    const style = document.createElement('style');
    style.textContent = '.copied-style { color: red; }';
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/tilery-test.css';
    const meta = document.createElement('meta');
    meta.name = 'not-copied';
    document.head.append(style, link, meta);
    const t = mount(floatingLayout());

    act(() => {
      t.handle().popoutPanel('palette', {
        windowBounds: { left: 90, top: 80, width: 760, height: 540 },
      });
    });

    expect(open).toHaveBeenCalledWith(
      '',
      'tilery-popout-palette',
      'popup=yes,left=90,top=80,width=760,height=540',
    );
    expect(t.handle().getPanel('palette')?.poppedOut).toBe(true);
    expect(t.handle().getPanel('palette')?.popoutWindowBounds).toEqual({
      left: 90,
      top: 80,
      width: 760,
      height: 540,
    });
    expect(
      t.host.querySelector('.tilery__panel[data-panel-id="palette"]'),
    ).toBeNull();
    expect(
      popout.document.querySelector('.tilery__panel[data-panel-id="palette"]'),
    ).not.toBeNull();
    expect(
      popout.document.querySelector('[data-content-of="palette-tab"]')
        ?.textContent,
    ).toBe('Palette');
    expect(popout.document.head.querySelector('style')?.textContent).toContain(
      '.copied-style',
    );
    expect(
      popout.document.head.querySelector('link[rel="stylesheet"]'),
    ).not.toBeNull();
    expect(popout.document.head.querySelector('meta[name="not-copied"]')).toBe(
      null,
    );
    t.cleanup();
    style.remove();
    link.remove();
    meta.remove();
  });

  it('opens native windows for popped-out panels from the initial layout', () => {
    const popout = createPopoutWindowMock();
    const open = vi.spyOn(window, 'open').mockReturnValue(popout);
    const t = mount({
      type: 'root',
      main: {
        type: 'panel',
        id: 'main',
        tabs: [{ id: 'main-tab', data: { title: 'Main' } }],
      },
      floating: [
        {
          type: 'floatingPanel',
          id: 'palette',
          popout: {
            windowBounds: { left: 90, top: 80, width: 760, height: 540 },
          },
          tabs: [{ id: 'palette-tab', data: { title: 'Palette' } }],
        },
      ],
    });

    expect(open).toHaveBeenCalledWith(
      '',
      'tilery-popout-palette',
      'popup=yes,left=90,top=80,width=760,height=540',
    );
    expect(t.handle().getPanel('palette')?.poppedOut).toBe(true);
    expect(
      popout.document.querySelector('.tilery__panel[data-panel-id="palette"]'),
    ).not.toBeNull();
    t.cleanup();
  });

  it('returns initial popped-out panels to floating when the native window is blocked', () => {
    vi.spyOn(window, 'open').mockReturnValue(null);
    const t = mount({
      type: 'root',
      main: {
        type: 'panel',
        id: 'main',
        tabs: [{ id: 'main-tab', data: { title: 'Main' } }],
      },
      floating: [
        {
          type: 'floatingPanel',
          id: 'palette',
          popout: {
            windowBounds: { left: 90, top: 80, width: 760, height: 540 },
          },
          tabs: [{ id: 'palette-tab', data: { title: 'Palette' } }],
        },
      ],
    });

    expect(t.handle().getPanel('palette')?.poppedOut).toBe(false);
    expect(
      t.host.querySelector('.tilery__panel[data-panel-id="palette"]'),
    ).not.toBeNull();
    t.cleanup();
  });

  it('leaves a panel floating when native popout document setup fails', () => {
    const badWindow = {
      document: null,
      closed: false,
      screenX: 0,
      screenY: 0,
      outerWidth: 760,
      outerHeight: 540,
      focus: vi.fn(),
      close: vi.fn(),
      addEventListener() {},
      removeEventListener() {},
    } as unknown as Window;
    vi.spyOn(window, 'open').mockReturnValue(badWindow);
    const t = mount(floatingLayout());

    act(() => {
      t.handle().popoutPanel('palette');
    });

    expect(
      (badWindow as unknown as { close: ReturnType<typeof vi.fn> }).close,
    ).toHaveBeenCalledTimes(1);
    expect(t.handle().getPanel('palette')?.poppedOut).toBe(false);
    t.cleanup();
  });

  it('renders a popped-out tab as a new native-window panel', () => {
    const popout = createPopoutWindowMock();
    const open = vi.spyOn(window, 'open').mockReturnValue(popout);
    const t = mount(lShapeLayout());

    act(() => {
      t.handle().popoutTab('bar', {
        panelId: 'bar-popout',
        floatingBounds: { x: 12, y: 14, width: 36, height: 38 },
        windowBounds: { left: 90, top: 80, width: 760, height: 540 },
      });
    });

    expect(open).toHaveBeenCalledWith(
      '',
      'tilery-popout-bar-popout',
      'popup=yes,left=90,top=80,width=760,height=540',
    );
    expect(t.handle().getTab('bar')?.panel.id).toBe('bar-popout');
    expect(
      t
        .handle()
        .getPanel('editor')
        ?.tabs.map((tab) => tab.id),
    ).toEqual(['foo']);
    expect(t.handle().getPanel('bar-popout')?.poppedOut).toBe(true);
    expect(
      t.host.querySelector('.tilery__panel[data-panel-id="bar-popout"]'),
    ).toBeNull();
    expect(
      popout.document.querySelector(
        '.tilery__panel[data-panel-id="bar-popout"]',
      ),
    ).not.toBeNull();
    expect(
      popout.document.querySelector('[data-content-of="bar"]')?.textContent,
    ).toBe('bar.ts');
    t.cleanup();
  });

  it('leaves a tab in place when its native popout window is blocked', () => {
    vi.spyOn(window, 'open').mockReturnValue(null);
    const t = mount(lShapeLayout());

    act(() => {
      t.handle().popoutTab('bar', { panelId: 'bar-popout' });
    });

    expect(t.handle().getPanel('bar-popout')).toBeNull();
    expect(t.handle().getTab('bar')?.panel.id).toBe('editor');
    expect(
      t.host.querySelector('.tilery__panel[data-panel-id="editor"]'),
    ).not.toBeNull();
    t.cleanup();
  });

  it('returns a popped-out panel to the in-page floating layer', () => {
    const popout = createPopoutWindowMock();
    vi.spyOn(window, 'open').mockReturnValue(popout);
    const t = mount(floatingLayout());

    act(() => {
      t.handle().popoutPanel('palette');
    });
    act(() => {
      t.handle().returnPanelToFloating('palette');
    });

    expect(popout.close).toHaveBeenCalledTimes(1);
    expect(t.handle().getPanel('palette')?.poppedOut).toBe(false);
    expect(
      t.host.querySelector('.tilery__panel[data-panel-id="palette"]'),
    ).not.toBeNull();
    t.cleanup();
  });

  it('focuses an existing native popout window when popout is requested again', () => {
    const popout = createPopoutWindowMock();
    vi.spyOn(window, 'open').mockReturnValue(popout);
    const t = mount(floatingLayout());

    act(() => {
      t.handle().popoutPanel('palette');
    });
    act(() => {
      t.handle().popoutPanel('palette');
    });

    expect(popout.focus).toHaveBeenCalledTimes(2);
    t.cleanup();
  });

  it('syncs native popout bounds on resize and focuses the panel on focus', () => {
    const popout = createPopoutWindowMock();
    vi.spyOn(window, 'open').mockReturnValue(popout);
    const t = mount(floatingLayout());

    act(() => {
      t.handle().popoutPanel('palette');
    });
    popout.screenX = 120;
    popout.screenY = 130;
    popout.outerWidth = 640;
    popout.outerHeight = 420;
    act(() => {
      popout.dispatchPopoutEvent('resize');
      popout.dispatchPopoutEvent('focus');
    });

    expect(t.handle().getPanel('palette')?.popoutWindowBounds).toEqual({
      left: 120,
      top: 130,
      width: 640,
      height: 420,
    });
    t.cleanup();
  });

  it('ignores native popout resize events after the window is already closed', () => {
    const popout = createPopoutWindowMock();
    vi.spyOn(window, 'open').mockReturnValue(popout);
    const t = mount(floatingLayout());

    act(() => {
      t.handle().popoutPanel('palette');
    });
    popout.closed = true;
    popout.screenX = 140;
    act(() => {
      popout.dispatchPopoutEvent('resize');
    });

    expect(t.handle().getPanel('palette')?.popoutWindowBounds?.left).not.toBe(
      140,
    );
    t.cleanup();
  });

  it('returns an already-closed native window record without closing it again', () => {
    const popout = createPopoutWindowMock();
    vi.spyOn(window, 'open').mockReturnValue(popout);
    const t = mount(floatingLayout());

    act(() => {
      t.handle().popoutPanel('palette');
    });
    popout.closed = true;
    act(() => {
      t.handle().returnPanelToFloating('palette');
    });

    expect(popout.close).not.toHaveBeenCalled();
    expect(t.handle().getPanel('palette')?.poppedOut).toBe(false);
    t.cleanup();
  });

  it('ignores return-to-floating window cleanup for panels without a popout record', () => {
    const t = mount(floatingLayout());

    act(() => {
      t.handle().returnPanelToFloating('palette');
    });

    expect(t.handle().getPanel('palette')?.poppedOut).toBe(false);
    t.cleanup();
  });

  it('returns a popped-out panel when the native window closes', () => {
    const popout = createPopoutWindowMock();
    vi.spyOn(window, 'open').mockReturnValue(popout);
    const t = mount(floatingLayout());

    act(() => {
      t.handle().popoutPanel('palette');
    });
    act(() => {
      popout.dispatchPopoutEvent('beforeunload');
    });

    expect(t.handle().getPanel('palette')?.poppedOut).toBe(false);
    expect(
      t.host.querySelector('.tilery__panel[data-panel-id="palette"]'),
    ).not.toBeNull();
    t.cleanup();
  });

  it('leaves the panel unchanged when the popup is blocked', () => {
    vi.spyOn(window, 'open').mockReturnValue(null);
    const t = mount(floatingLayout());

    act(() => {
      t.handle().popoutPanel('palette');
    });

    expect(t.handle().getPanel('palette')?.poppedOut).toBe(false);
    expect(
      t.host.querySelector('.tilery__panel[data-panel-id="palette"]'),
    ).not.toBeNull();
    t.cleanup();
  });

  it('exposes the TileryHandle via forwardRef', () => {
    const t = mount(lShapeLayout());
    const h = t.handle();
    expect(h.getPanels()).toHaveLength(3);
    expect(h.getTabs()).toHaveLength(4);
    expect(h.getPanel('sidebar')).not.toBeNull();
    expect(h.getTab('foo')).not.toBeNull();
    t.cleanup();
  });

  it('restores a layout snapshot through the TileryHandle', () => {
    const t = mount(simpleLayout());
    act(() => {
      t.handle().setLayout({
        type: 'panel',
        id: 'restored',
        tabs: [
          {
            id: 'restored-tab',
            data: { title: 'Restored' },
            closeable: false,
          },
        ],
      });
    });

    expect(
      t
        .handle()
        .getPanels()
        .map((panel) => panel.id),
    ).toEqual(['restored']);
    expect(t.host.querySelectorAll('.tilery__panel')).toHaveLength(1);
    expect(t.host.querySelector('.tilery__tab')?.textContent?.trim()).toBe(
      'Restored',
    );
    expect(t.handle().getLayout()).toMatchObject({
      type: 'panel',
      id: 'restored',
      tabs: [{ id: 'restored-tab', closeable: false }],
    });
    t.cleanup();
  });

  it('rerenders tab content when tab behavior changes through handles', () => {
    const t = mount(singlePanelLayout(), undefined, {
      renderTabContent: (tab) => (
        <div data-content-of={tab.id}>
          {tab.closeable ? 'close:on' : 'close:off'}{' '}
          {tab.draggable ? 'drag:on' : 'drag:off'}
        </div>
      ),
    });

    expect(t.host.querySelector('[data-content-of="only"]')?.textContent).toBe(
      'close:on drag:on',
    );

    act(() => {
      t.handle().setTabBehavior('only', { closeable: false });
    });
    expect(t.host.querySelector('[data-content-of="only"]')?.textContent).toBe(
      'close:off drag:on',
    );

    act(() => {
      t.handle().getTab('only')!.setBehavior({ locked: true });
    });
    expect(t.host.querySelector('[data-content-of="only"]')?.textContent).toBe(
      'close:off drag:off',
    );

    t.cleanup();
  });

  it('derives one-dimensional dividers and a T-junction for the L-shape', () => {
    const t = mount(lShapeLayout());
    // 2 dividers: 1 vertical between sidebar and editor/term, then 1
    // horizontal between editor and term inside the right split.
    expect(t.host.querySelectorAll('.tilery__divider')).toHaveLength(2);
    expect(t.host.querySelectorAll('.tilery__junction')).toHaveLength(1);
    t.cleanup();
  });

  it('applies the configured resize handle hit target size', () => {
    const t = mount(lShapeLayout(), undefined, { resizeHandleHitSize: 36 });
    const divider = t.host.querySelector<HTMLElement>('.tilery__divider')!;
    const junction = t.host.querySelector<HTMLElement>('.tilery__junction')!;
    expect(divider.style.width).toBe('36px');
    expect(junction.style.width).toBe('36px');
    expect(junction.style.height).toBe('36px');
    t.cleanup();
  });

  it('labels panels and exposes computed separator values for resize handles', () => {
    const t = mount(lShapeLayout());
    const panels = Array.from(
      t.host.querySelectorAll<HTMLElement>('.tilery__panel'),
    );
    expect(panels.map((panel) => panel.id)).toEqual([
      'tilery-panel-sidebar',
      'tilery-panel-editor',
      'tilery-panel-term',
    ]);

    const dividers = Array.from(
      t.host.querySelectorAll<HTMLElement>('.tilery__divider'),
    );
    const vertical = dividers.find(
      (divider) => divider.getAttribute('data-orientation') === 'vertical',
    )!;
    const horizontal = dividers.find(
      (divider) => divider.getAttribute('data-orientation') === 'horizontal',
    )!;

    expect(vertical.getAttribute('aria-controls')).toBe('tilery-panel-sidebar');
    expect(vertical.getAttribute('aria-valuenow')).toBe('40');
    expect(vertical.getAttribute('aria-valuemin')).toBe('10');
    expect(vertical.getAttribute('aria-valuemax')).toBe('90');
    expect(horizontal.getAttribute('aria-controls')).toBe(
      'tilery-panel-editor',
    );
    expect(horizontal.getAttribute('aria-valuenow')).toBe('50');
    expect(horizontal.getAttribute('aria-valuetext')).toBe('50%');
    t.cleanup();
  });

  it('renders panels in initial group tree order', () => {
    const t = mount(simpleLayout());
    expect(
      Array.from(t.host.querySelectorAll('.tilery__panel')).map((el) =>
        el.getAttribute('data-panel-id'),
      ),
    ).toEqual(['left', 'right']);
    expect(t.host.querySelectorAll('.tilery__divider')).toHaveLength(1);
    t.cleanup();
  });

  it('renders an empty layout after removing the last panel', () => {
    const t = mount(singlePanelLayout());
    act(() => {
      t.handle().getTab('only')!.remove();
    });
    expect(t.host.querySelectorAll('.tilery__panel')).toHaveLength(0);
    expect(t.handle().getPanels()).toEqual([]);
    t.cleanup();
  });
});

describe('Tilery — tab click + close', () => {
  it('clicking an inactive tab switches the panel’s active tab', () => {
    const t = mount(lShapeLayout());
    const barTab = Array.from(
      t.host.querySelectorAll<HTMLElement>('.tilery__tab'),
    ).find((el) => el.textContent?.includes('bar.ts'))!;
    // The tab is rendered with a pointerdown handler in the drag controller;
    // a sub-threshold pointerup synthesises the click in that controller's
    // logic. But Tilery also wires `onTabClick` on `<TabBar>` directly via
    // the `data-tab-id` attribute. Easiest: dispatch a real pointer flow.
    const dragDown = reactProps(barTab).onPointerDown;
    const dragUp = reactProps(barTab).onPointerUp;
    act(() => {
      dragDown(pointerEvent({ clientX: 10, clientY: 10 }));
      dragUp(pointerEvent({ clientX: 10, clientY: 10 }));
    });
    expect(t.handle().getPanel('editor')!.activeTab?.id).toBe('bar');
    t.cleanup();
  });

  it('clicking a tab close button removes the tab', () => {
    const t = mount(lShapeLayout());
    const fooTab = Array.from(
      t.host.querySelectorAll<HTMLElement>('.tilery__tab'),
    ).find((el) => el.textContent?.includes('foo.ts'))!;
    const closeBtn = fooTab.querySelector('.tilery__tab-close') as HTMLElement;
    act(() => {
      reactProps(closeBtn).onClick({
        stopPropagation() {},
      });
    });
    expect(t.handle().getTab('foo')).toBeNull();
    expect(t.handle().getPanel('editor')!.tabs).toHaveLength(1);
    t.cleanup();
  });
});

describe('Tilery — divider drag dispatch', () => {
  it('dragging the vertical divider resizes both adjacent panels', () => {
    const t = mount(lShapeLayout());
    // Find the vertical divider by its orientation attribute.
    const divider = Array.from(
      t.host.querySelectorAll<HTMLElement>('.tilery__divider'),
    ).find((el) => el.getAttribute('data-orientation') === 'vertical')!;
    const before = t.handle().getPanel('sidebar')!.inset.right;
    act(() => {
      reactProps(divider).onPointerDown(pointerEvent());
      reactProps(divider).onPointerMove(
        pointerEvent({ clientX: 500, clientY: 400 }),
      );
      reactProps(divider).onPointerUp(pointerEvent());
    });
    const after = t.handle().getPanel('sidebar')!.inset.right;
    expect(after).not.toBe(before);
    expect(after).toBe(50); // 500 / 1000 = 50%
    t.cleanup();
  });

  it('reports pointer divider resize lifecycle events with panel deltas', () => {
    const resizeEvents: TileryResizeEvent[] = [];
    const resizeEndEvents: TileryResizeEvent[] = [];
    const t = mount(lShapeLayout(), undefined, {
      onResize: (event) => resizeEvents.push(event),
      onResizeEnd: (event) => resizeEndEvents.push(event),
    });
    const divider = Array.from(
      t.host.querySelectorAll<HTMLElement>('.tilery__divider'),
    ).find((el) => el.getAttribute('data-orientation') === 'vertical')!;

    act(() => {
      reactProps(divider).onPointerDown(pointerEvent());
      reactProps(divider).onPointerMove(
        pointerEvent({ clientX: 500, clientY: 400 }),
      );
      reactProps(divider).onPointerUp(pointerEvent());
    });

    expect(resizeEvents).toHaveLength(1);
    expect(resizeEndEvents).toHaveLength(1);
    expect(resizeEndEvents[0]).toMatchObject({
      ...resizeEvents[0],
      phase: 'end',
    });
    expect(resizeEvents[0]).toMatchObject({
      phase: 'resize',
      input: 'pointer',
      source: {
        type: 'divider',
        orientation: 'vertical',
        previousPosition: 40,
        position: 50,
      },
      changes: [
        {
          panelId: 'sidebar',
          dimension: 'width',
          previousSize: 40,
          size: 50,
          previousPixelSize: 400,
          pixelSize: 500,
        },
        {
          panelId: 'editor',
          dimension: 'width',
          previousSize: 60,
          size: 50,
          previousPixelSize: 600,
          pixelSize: 500,
        },
        {
          panelId: 'term',
          dimension: 'width',
          previousSize: 60,
          size: 50,
          previousPixelSize: 600,
          pixelSize: 500,
        },
      ],
    });
    t.cleanup();
  });

  it('does not report no-op resize lifecycle events', () => {
    const resizeEvents: TileryResizeEvent[] = [];
    const resizeEndEvents: TileryResizeEvent[] = [];
    const t = mount(lShapeLayout(), undefined, {
      onResize: (event) => resizeEvents.push(event),
      onResizeEnd: (event) => resizeEndEvents.push(event),
    });
    const divider = Array.from(
      t.host.querySelectorAll<HTMLElement>('.tilery__divider'),
    ).find((el) => el.getAttribute('data-orientation') === 'vertical')!;

    act(() => {
      reactProps(divider).onPointerDown(pointerEvent());
      reactProps(divider).onPointerMove(
        pointerEvent({ clientX: 400, clientY: 400 }),
      );
      reactProps(divider).onPointerUp(pointerEvent());
    });

    expect(resizeEvents).toEqual([]);
    expect(resizeEndEvents).toEqual([]);
    t.cleanup();
  });

  it('dragging the T-junction resizes both connected split axes', () => {
    const t = mount(lShapeLayout());
    const junction = t.host.querySelector<HTMLElement>('.tilery__junction')!;
    act(() => {
      reactProps(junction).onPointerDown(pointerEvent());
      reactProps(junction).onPointerMove(
        pointerEvent({ clientX: 300, clientY: 560 }),
      );
      reactProps(junction).onPointerUp(pointerEvent());
    });
    expect(t.handle().getPanel('sidebar')!.inset.right).toBe(70);
    expect(t.handle().getPanel('editor')!.inset.bottom).toBe(30);
    expect(t.handle().getPanel('term')!.inset.top).toBe(70);
    t.cleanup();
  });

  it('reports junction resize lifecycle events across both dimensions', () => {
    const resizeEvents: TileryResizeEvent[] = [];
    const resizeEndEvents: TileryResizeEvent[] = [];
    const t = mount(lShapeLayout(), undefined, {
      onResize: (event) => resizeEvents.push(event),
      onResizeEnd: (event) => resizeEndEvents.push(event),
    });
    const junction = t.host.querySelector<HTMLElement>('.tilery__junction')!;

    act(() => {
      reactProps(junction).onPointerDown(pointerEvent());
      reactProps(junction).onPointerMove(
        pointerEvent({ clientX: 300, clientY: 560 }),
      );
      reactProps(junction).onPointerUp(pointerEvent());
    });

    expect(resizeEvents).toHaveLength(1);
    expect(resizeEndEvents).toHaveLength(1);
    expect(resizeEvents[0].source).toMatchObject({
      type: 'junction',
      previousX: 40,
      previousY: 50,
      x: 30,
      y: 70,
    });
    expect(
      resizeEvents[0].changes.map((change) => [
        change.panelId,
        change.dimension,
        change.previousSize,
        change.size,
      ]),
    ).toEqual([
      ['sidebar', 'width', 40, 30],
      ['editor', 'width', 60, 70],
      ['editor', 'height', 50, 70],
      ['term', 'width', 60, 70],
      ['term', 'height', 50, 30],
    ]);
    t.cleanup();
  });

  it('keyboard resizing moves the focused divider on its axis', () => {
    const t = mount(lShapeLayout());
    const vertical = Array.from(
      t.host.querySelectorAll<HTMLElement>('.tilery__divider'),
    ).find(
      (divider) => divider.getAttribute('data-orientation') === 'vertical',
    )!;
    const horizontal = Array.from(
      t.host.querySelectorAll<HTMLElement>('.tilery__divider'),
    ).find(
      (divider) => divider.getAttribute('data-orientation') === 'horizontal',
    )!;

    act(() => {
      reactProps(vertical).onKeyDown({
        key: 'ArrowRight',
        shiftKey: false,
        preventDefault() {},
        stopPropagation() {},
      });
    });
    expect(t.handle().getPanel('sidebar')!.inset.right).toBe(58);

    act(() => {
      reactProps(horizontal).onKeyDown({
        key: 'ArrowDown',
        shiftKey: false,
        preventDefault() {},
        stopPropagation() {},
      });
    });
    expect(t.handle().getPanel('editor')!.inset.bottom).toBe(48);
    t.cleanup();
  });

  it('reports keyboard resize as an immediate committed lifecycle', () => {
    const resizeEvents: TileryResizeEvent[] = [];
    const resizeEndEvents: TileryResizeEvent[] = [];
    const t = mount(lShapeLayout(), undefined, {
      onResize: (event) => resizeEvents.push(event),
      onResizeEnd: (event) => resizeEndEvents.push(event),
    });
    const vertical = Array.from(
      t.host.querySelectorAll<HTMLElement>('.tilery__divider'),
    ).find(
      (divider) => divider.getAttribute('data-orientation') === 'vertical',
    )!;

    act(() => {
      reactProps(vertical).onKeyDown({
        key: 'ArrowRight',
        shiftKey: false,
        preventDefault() {},
        stopPropagation() {},
      });
    });

    expect(resizeEvents).toHaveLength(1);
    expect(resizeEndEvents).toHaveLength(1);
    expect(resizeEvents[0]).toMatchObject({
      phase: 'resize',
      input: 'keyboard',
      source: {
        type: 'divider',
        orientation: 'vertical',
        previousPosition: 40,
        position: 42,
      },
    });
    expect(resizeEndEvents[0]).toMatchObject({
      ...resizeEvents[0],
      phase: 'end',
    });
    t.cleanup();
  });

  it('omits resize pixel sizes when the container has no measured size', () => {
    const resizeEvents: TileryResizeEvent[] = [];
    const t = mount(
      lShapeLayout(),
      undefined,
      {
        onResize: (event) => resizeEvents.push(event),
      },
      { stubRect: false },
    );
    const vertical = Array.from(
      t.host.querySelectorAll<HTMLElement>('.tilery__divider'),
    ).find(
      (divider) => divider.getAttribute('data-orientation') === 'vertical',
    )!;

    act(() => {
      reactProps(vertical).onKeyDown({
        key: 'ArrowRight',
        shiftKey: false,
        preventDefault() {},
        stopPropagation() {},
      });
    });

    expect(resizeEvents).toHaveLength(1);
    expect(resizeEvents[0].changes[0]).not.toHaveProperty('previousPixelSize');
    expect(resizeEvents[0].changes[0]).not.toHaveProperty('pixelSize');
    t.cleanup();
  });
});

describe('Tilery — onChange callback', () => {
  it('fires after every state-changing action', () => {
    const calls: number[] = [];
    const t = mount(lShapeLayout(), () => calls.push(Date.now()));
    const initial = calls.length;
    act(() => {
      t.handle().setActiveTab('bar');
    });
    expect(calls.length).toBeGreaterThan(initial);
    t.cleanup();
  });
});

describe('Tilery — open and close lifecycle callbacks', () => {
  it('reports opened tabs from append, insert, and split actions', () => {
    const opens: TileryTabsOpenEvent<Data>[] = [];
    const panelOpens: TileryPanelsOpenEvent<Data>[] = [];
    const panelSplits: TileryPanelSplitEvent<Data>[] = [];
    const t = mount(lShapeLayout(), undefined, {
      onTabsOpen: (event) => opens.push(event),
      onPanelsOpen: (event) => panelOpens.push(event),
      onPanelSplit: (event) => panelSplits.push(event),
    });

    act(() => {
      t.handle().appendTab(
        'sidebar',
        { id: 'side-2', data: { title: 'Side 2' }, closeable: false },
        { activate: false },
      );
      t.handle().insertTab(
        'editor',
        { id: 'readme', data: { title: 'README.md' } },
        1,
      );
      t.handle().splitPanel('term', 'right', {
        tabs: [
          { id: 'logs', data: { title: 'Logs' } },
          { id: 'problems', data: { title: 'Problems' } },
        ],
      });
    });

    expect(opens).toHaveLength(3);
    expect(opens[0]).toMatchObject({
      source: 'APPEND_TAB',
      tabs: [
        {
          id: 'side-2',
          panelId: 'sidebar',
          data: { title: 'Side 2' },
          closeable: false,
        },
      ],
    });
    expect(opens[0].previousState.tabs['side-2']).toBeUndefined();
    expect(opens[0].state.tabs['side-2']).toMatchObject({
      panelId: 'sidebar',
    });
    expect(opens[1]).toMatchObject({
      source: 'INSERT_TAB',
      tabs: [{ id: 'readme', panelId: 'editor', closeable: true }],
    });
    expect(opens[2].source).toBe('SPLIT_PANEL');
    expect(opens[2].tabs.map((tab) => tab.id)).toEqual(['logs', 'problems']);
    expect(new Set(opens[2].tabs.map((tab) => tab.panelId)).size).toBe(1);
    expect(panelOpens).toHaveLength(1);
    expect(panelOpens[0].source).toBe('SPLIT_PANEL');
    expect(panelOpens[0].tabs.map((tab) => tab.id)).toEqual([
      'logs',
      'problems',
    ]);
    expect(panelSplits).toHaveLength(1);
    expect(panelSplits[0]).toMatchObject({
      source: 'SPLIT_PANEL',
      splitPanelId: 'term',
      direction: 'right',
      size: 50,
      tabs: [{ id: 'logs' }, { id: 'problems' }],
    });
    expect(panelSplits[0].createdPanelId).toBe(panelOpens[0].panels[0].id);
    t.cleanup();
  });

  it('reports active tab changes', () => {
    const activeChanges: TileryActiveTabChangeEvent[] = [];
    const t = mount(lShapeLayout(), undefined, {
      onActiveTabChange: (event) => activeChanges.push(event),
    });

    act(() => {
      t.handle().setActiveTab('bar');
      t.handle().appendTab('editor', {
        id: 'baz',
        data: { title: 'baz.ts' },
      });
    });

    expect(activeChanges).toHaveLength(2);
    expect(activeChanges[0]).toMatchObject({
      source: 'SET_ACTIVE_TAB',
      changes: [{ panelId: 'editor', previousTabId: 'foo', tabId: 'bar' }],
    });
    expect(activeChanges[0].previousState.panels.editor!.activeTabId).toBe(
      'foo',
    );
    expect(activeChanges[0].state.panels.editor!.activeTabId).toBe('bar');
    expect(activeChanges[1]).toMatchObject({
      source: 'APPEND_TAB',
      changes: [{ panelId: 'editor', previousTabId: 'bar', tabId: 'baz' }],
    });
    t.cleanup();
  });

  it('reports moved tabs when their panel or index changes', () => {
    const moves: TileryTabsMoveEvent<Data>[] = [];
    const t = mount(lShapeLayout(), undefined, {
      onTabsMove: (event) => moves.push(event),
    });

    act(() => {
      t.handle().moveTab('bar', { beforeTab: 'foo' });
    });

    expect(moves).toHaveLength(1);
    expect(moves[0]).toMatchObject({
      source: 'MOVE_TAB',
      tabs: [
        {
          id: 'bar',
          previousPanelId: 'editor',
          panelId: 'editor',
          previousIndex: 1,
          index: 0,
          data: { title: 'bar.ts' },
          closeable: true,
        },
      ],
    });
    t.cleanup();
  });

  it('reports tab moves, panel opens, and panel splits for split drops', () => {
    const moves: TileryTabsMoveEvent<Data>[] = [];
    const panelOpens: TileryPanelsOpenEvent<Data>[] = [];
    const panelSplits: TileryPanelSplitEvent<Data>[] = [];
    const t = mount(lShapeLayout(), undefined, {
      onTabsMove: (event) => moves.push(event),
      onPanelsOpen: (event) => panelOpens.push(event),
      onPanelSplit: (event) => panelSplits.push(event),
    });

    act(() => {
      t.handle().moveTab('bar', {
        splitPanel: 'term',
        direction: 'left',
        size: 35,
      });
    });

    expect(moves).toHaveLength(1);
    expect(panelOpens).toHaveLength(1);
    expect(panelSplits).toHaveLength(1);
    const createdPanelId = panelOpens[0].panels[0].id;
    expect(moves[0]).toMatchObject({
      source: 'MOVE_TAB',
      tabs: [
        {
          id: 'bar',
          previousPanelId: 'editor',
          panelId: createdPanelId,
          previousIndex: 1,
          index: 0,
        },
      ],
    });
    expect(panelOpens[0]).toMatchObject({
      source: 'MOVE_TAB',
      panels: [{ id: createdPanelId, tabIds: ['bar'], activeTabId: 'bar' }],
      tabs: [{ id: 'bar', panelId: createdPanelId }],
    });
    expect(panelSplits[0]).toMatchObject({
      source: 'MOVE_TAB',
      splitPanelId: 'term',
      createdPanelId,
      direction: 'left',
      size: 35,
      createdPanel: { id: createdPanelId, tabIds: ['bar'] },
      tabs: [{ id: 'bar', panelId: createdPanelId }],
    });
    t.cleanup();
  });

  it('reports tab moves and panel opens when a tab is floated', () => {
    const moves: TileryTabsMoveEvent<Data>[] = [];
    const panelOpens: TileryPanelsOpenEvent<Data>[] = [];
    const t = mount(lShapeLayout(), undefined, {
      onTabsMove: (event) => moves.push(event),
      onPanelsOpen: (event) => panelOpens.push(event),
    });

    act(() => {
      t.handle().floatTab('bar', {
        panelId: 'bar-floating',
        bounds: { x: 10, y: 12, width: 32, height: 34 },
      });
    });

    expect(moves).toHaveLength(1);
    expect(panelOpens).toHaveLength(1);
    expect(moves[0]).toMatchObject({
      source: 'FLOAT_TAB',
      tabs: [
        {
          id: 'bar',
          previousPanelId: 'editor',
          panelId: 'bar-floating',
          previousIndex: 1,
          index: 0,
        },
      ],
    });
    expect(panelOpens[0]).toMatchObject({
      source: 'FLOAT_TAB',
      panels: [{ id: 'bar-floating', tabIds: ['bar'], activeTabId: 'bar' }],
      tabs: [{ id: 'bar', panelId: 'bar-floating' }],
    });
    t.cleanup();
  });

  it('reports panel closes without tab closes when a last tab is floated', () => {
    const closes: TileryTabsCloseEvent<Data>[] = [];
    const panelCloses: TileryPanelsCloseEvent<Data>[] = [];
    const t = mount(lShapeLayout(), undefined, {
      onTabsClose: (event) => closes.push(event),
      onPanelsClose: (event) => panelCloses.push(event),
    });

    act(() => {
      t.handle().floatTab('side', { panelId: 'side-floating' });
    });

    expect(closes).toEqual([]);
    expect(panelCloses).toHaveLength(1);
    expect(panelCloses[0]).toMatchObject({
      source: 'FLOAT_TAB',
      panels: [{ id: 'sidebar', tabIds: ['side'], activeTabId: 'side' }],
      tabs: [{ id: 'side', panelId: 'sidebar' }],
    });
    expect(t.handle().getTab('side')!.panel.id).toBe('side-floating');
    t.cleanup();
  });

  it('reports tab closes and the panel that disappears with the last tab', () => {
    const closes: TileryTabsCloseEvent<Data>[] = [];
    const panelCloses: TileryPanelsCloseEvent<Data>[] = [];
    const t = mount(lShapeLayout(), undefined, {
      onTabsClose: (event) => closes.push(event),
      onPanelsClose: (event) => panelCloses.push(event),
    });

    act(() => {
      t.handle().removeTab('bar');
      t.handle().removeTab('side');
    });

    expect(closes).toHaveLength(2);
    expect(closes[0]).toMatchObject({
      source: 'REMOVE_TAB',
      tabs: [{ id: 'bar', panelId: 'editor', data: { title: 'bar.ts' } }],
      panels: [],
    });
    expect(closes[1]).toMatchObject({
      source: 'REMOVE_TAB',
      tabs: [{ id: 'side', panelId: 'sidebar', data: { title: 'Side' } }],
      panels: [
        {
          id: 'sidebar',
          tabIds: ['side'],
          activeTabId: 'side',
        },
      ],
    });
    expect(panelCloses).toHaveLength(1);
    expect(panelCloses[0]).toMatchObject({
      source: 'REMOVE_TAB',
      panels: [{ id: 'sidebar', tabIds: ['side'], activeTabId: 'side' }],
      tabs: [{ id: 'side', panelId: 'sidebar' }],
    });
    expect(panelCloses[0].previousState.panels.sidebar).toBeDefined();
    expect(panelCloses[0].state.panels.sidebar).toBeUndefined();
    t.cleanup();
  });

  it('reports all panel tabs when a panel is removed directly', () => {
    const closes: TileryTabsCloseEvent<Data>[] = [];
    const panelCloses: TileryPanelsCloseEvent<Data>[] = [];
    const t = mount(lShapeLayout(), undefined, {
      onTabsClose: (event) => closes.push(event),
      onPanelsClose: (event) => panelCloses.push(event),
    });

    act(() => {
      t.handle().removePanel('editor');
    });

    expect(closes).toHaveLength(1);
    expect(closes[0].source).toBe('REMOVE_PANEL');
    expect(closes[0].tabs.map((tab) => tab.id)).toEqual(['foo', 'bar']);
    expect(closes[0].panels).toEqual([
      { id: 'editor', tabIds: ['foo', 'bar'], activeTabId: 'foo' },
    ]);
    expect(panelCloses).toHaveLength(1);
    expect(panelCloses[0].source).toBe('REMOVE_PANEL');
    expect(panelCloses[0].tabs.map((tab) => tab.id)).toEqual(['foo', 'bar']);
    expect(panelCloses[0].panels).toEqual([
      { id: 'editor', tabIds: ['foo', 'bar'], activeTabId: 'foo' },
    ]);
    t.cleanup();
  });

  it('reports panel closes without tab closes when the last tab moves out', () => {
    const closes: TileryTabsCloseEvent<Data>[] = [];
    const panelCloses: TileryPanelsCloseEvent<Data>[] = [];
    const t = mount(lShapeLayout(), undefined, {
      onTabsClose: (event) => closes.push(event),
      onPanelsClose: (event) => panelCloses.push(event),
    });

    act(() => {
      t.handle().moveTab('side', { panel: 'editor' });
    });

    expect(closes).toEqual([]);
    expect(panelCloses).toHaveLength(1);
    expect(panelCloses[0]).toMatchObject({
      source: 'MOVE_TAB',
      panels: [{ id: 'sidebar', tabIds: ['side'], activeTabId: 'side' }],
      tabs: [{ id: 'side', panelId: 'sidebar' }],
    });
    expect(t.handle().getTab('side')!.panel.id).toBe('editor');
    t.cleanup();
  });

  it('does not report lifecycle callbacks for no-op close actions', () => {
    const activeChanges: TileryActiveTabChangeEvent[] = [];
    const moves: TileryTabsMoveEvent<Data>[] = [];
    const opens: TileryTabsOpenEvent<Data>[] = [];
    const panelOpens: TileryPanelsOpenEvent<Data>[] = [];
    const panelSplits: TileryPanelSplitEvent<Data>[] = [];
    const closes: TileryTabsCloseEvent<Data>[] = [];
    const panelCloses: TileryPanelsCloseEvent<Data>[] = [];
    const t = mount(lShapeLayout(), undefined, {
      onActiveTabChange: (event) => activeChanges.push(event),
      onTabsMove: (event) => moves.push(event),
      onTabsOpen: (event) => opens.push(event),
      onPanelsOpen: (event) => panelOpens.push(event),
      onPanelSplit: (event) => panelSplits.push(event),
      onTabsClose: (event) => closes.push(event),
      onPanelsClose: (event) => panelCloses.push(event),
    });

    act(() => {
      t.handle().removeTab('missing');
      t.handle().removePanel('missing');
      t.handle().moveTab('missing', { panel: 'editor' });
      t.handle().moveTab('foo', { beforeTab: 'foo' });
      t.handle().splitPanel('missing', 'right');
    });

    expect(activeChanges).toEqual([]);
    expect(moves).toEqual([]);
    expect(opens).toEqual([]);
    expect(panelOpens).toEqual([]);
    expect(panelSplits).toEqual([]);
    expect(closes).toEqual([]);
    expect(panelCloses).toEqual([]);
    t.cleanup();
  });
});

describe('Tilery — panel modes', () => {
  it('renders only the fullscreen panel and suppresses dividers', () => {
    const t = mount(lShapeLayout({ editorFullScreen: true }));
    const panels = t.host.querySelectorAll<HTMLElement>('.tilery__panel');
    expect(panels).toHaveLength(1);
    expect(panels[0]!.getAttribute('data-panel-id')).toBe('editor');
    expect(panels[0]!.getAttribute('data-full-screen')).toBe('true');
    expect(panels[0]!.style.left).toBe('0%');
    expect(panels[0]!.style.right).toBe('0%');
    expect(t.host.querySelectorAll('.tilery__divider')).toHaveLength(0);
    expect(t.handle().getPanel('editor')!.fullScreen).toBe(true);
    t.cleanup();
  });
});

describe('Tilery — panel action UI', () => {
  it('does not render panel actions by default', () => {
    const t = mount(lShapeLayout());
    expect(t.host.querySelector('.tilery__panel-actions')).toBeNull();
    t.cleanup();
  });

  it('adds a tab through the optional new-tab button', () => {
    const t = mount(lShapeLayout(), undefined, {
      showNewTabButton: true,
      onNewTab: (panel) => ({
        id: `${panel.id}-new`,
        data: { title: 'New tab' },
      }),
    });
    const button = t.host.querySelector<HTMLElement>(
      '.tilery__panel[data-panel-id="sidebar"] .tilery__panel-action-button[aria-label="New tab"]',
    )!;
    act(() => {
      reactProps(button).onClick({});
    });
    expect(
      t
        .handle()
        .getPanel('sidebar')!
        .tabs.map((tab) => tab.id),
    ).toEqual(['side', 'sidebar-new']);
    t.cleanup();
  });

  it('leaves the new-tab button inert without a created tab', () => {
    const withoutHandler = mount(lShapeLayout(), undefined, {
      showNewTabButton: true,
    });
    const disabledButton = withoutHandler.host.querySelector<HTMLElement>(
      '.tilery__panel[data-panel-id="sidebar"] .tilery__panel-action-button[aria-label="New tab"]',
    )!;
    expect(disabledButton.hasAttribute('disabled')).toBe(true);
    act(() => {
      reactProps(disabledButton).onClick({});
    });
    expect(withoutHandler.handle().getPanel('sidebar')!.tabs).toHaveLength(1);
    withoutHandler.cleanup();

    const withoutTab = mount(lShapeLayout(), undefined, {
      showNewTabButton: true,
      onNewTab: () => undefined,
    });
    const button = withoutTab.host.querySelector<HTMLElement>(
      '.tilery__panel[data-panel-id="sidebar"] .tilery__panel-action-button[aria-label="New tab"]',
    )!;
    expect(button.hasAttribute('disabled')).toBe(false);
    act(() => {
      reactProps(button).onClick({});
    });
    expect(withoutTab.handle().getPanel('sidebar')!.tabs).toHaveLength(1);
    withoutTab.cleanup();
  });

  it('applies per-panel action visibility predicates', () => {
    const t = mount(lShapeLayout(), undefined, {
      showActionsButton: (panel) => panel.id === 'editor',
      showNewTabButton: (panel) => panel.id === 'editor',
      onNewTab: () => ({ data: { title: 'New tab' } }),
    });
    expect(
      t.host.querySelector(
        '.tilery__panel[data-panel-id="sidebar"] .tilery__panel-actions',
      ),
    ).toBeNull();
    expect(
      t.host.querySelectorAll(
        '.tilery__panel[data-panel-id="editor"] .tilery__panel-action-button',
      ),
    ).toHaveLength(2);
    t.cleanup();
  });

  it('hides new-tab-only controls while fullscreen', () => {
    const t = mount(lShapeLayout({ editorFullScreen: true }), undefined, {
      showNewTabButton: true,
      onNewTab: () => ({ data: { title: 'New tab' } }),
    });
    expect(t.host.querySelector('.tilery__panel-actions')).toBeNull();
    t.cleanup();
  });

  it('invokes built-in maximize and restores from a fullscreen minimize button', () => {
    const t = mount(lShapeLayout(), undefined, {
      showActionsButton: true,
      showNewTabButton: true,
    });
    const button = t.host.querySelector<HTMLElement>(
      '.tilery__panel[data-panel-id="editor"] .tilery__panel-action-button[aria-label="Panel actions"]',
    )!;
    expect(button.querySelector('svg')).not.toBeNull();
    act(() => {
      reactProps(button).onClick({});
    });
    const maximize = Array.from(
      t.host.querySelectorAll<HTMLElement>('.tilery__panel-menu-item'),
    ).find((el) => el.textContent === 'Maximize')!;
    act(() => {
      reactProps(maximize).onClick({});
    });
    expect(t.handle().getPanel('editor')!.fullScreen).toBe(true);
    expect(t.host.querySelectorAll('.tilery__panel')).toHaveLength(1);
    expect(t.host.querySelector('.tilery__panel-menu')).toBeNull();
    expect(
      t.host.querySelector(
        '.tilery__panel-action-button[aria-label="Panel actions"]',
      ),
    ).toBeNull();
    expect(
      t.host.querySelector(
        '.tilery__panel-action-button[aria-label="New tab"]',
      ),
    ).toBeNull();

    const fullscreenButton = t.host.querySelectorAll<HTMLElement>(
      '.tilery__panel-action-button[aria-label="Minimize panel"]',
    );
    expect(fullscreenButton).toHaveLength(1);
    expect(fullscreenButton[0]!.querySelector('svg')).not.toBeNull();
    act(() => {
      reactProps(fullscreenButton[0]!).onClick({});
    });
    expect(t.handle().getPanel('editor')!.fullScreen).toBe(false);
    expect(t.host.querySelectorAll('.tilery__panel')).toHaveLength(3);
    t.cleanup();
  });

  it('stops pointerdown propagation from normal and fullscreen panel actions', () => {
    const normal = mount(lShapeLayout(), undefined, {
      showActionsButton: true,
    });
    const normalActions = normal.host.querySelector<HTMLElement>(
      '.tilery__panel[data-panel-id="sidebar"] .tilery__panel-actions',
    )!;
    let normalStops = 0;
    act(() => {
      reactProps(normalActions).onPointerDown({
        stopPropagation() {
          normalStops++;
        },
      });
    });
    expect(normalStops).toBe(1);
    normal.cleanup();

    const fullscreen = mount(
      lShapeLayout({ editorFullScreen: true }),
      undefined,
      {
        showActionsButton: true,
      },
    );
    const fullscreenActions = fullscreen.host.querySelector<HTMLElement>(
      '.tilery__panel-actions',
    )!;
    let fullscreenStops = 0;
    act(() => {
      reactProps(fullscreenActions).onPointerDown({
        stopPropagation() {
          fullscreenStops++;
        },
      });
    });
    expect(fullscreenStops).toBe(1);
    fullscreen.cleanup();
  });

  it('keeps the action menu open for regular keys and closes it on Escape', () => {
    const t = mount(lShapeLayout(), undefined, {
      showActionsButton: true,
    });
    const button = t.host.querySelector<HTMLElement>(
      '.tilery__panel[data-panel-id="sidebar"] .tilery__panel-action-button[aria-label="Panel actions"]',
    )!;
    act(() => {
      reactProps(button).onClick({});
    });
    const menu = t.host.querySelector<HTMLElement>('.tilery__panel-menu')!;
    act(() => {
      reactProps(menu).onKeyDown({ key: 'Enter' });
    });
    expect(t.host.querySelector('.tilery__panel-menu')).not.toBeNull();
    act(() => {
      reactProps(menu).onKeyDown({ key: 'Escape' });
    });
    expect(t.host.querySelector('.tilery__panel-menu')).toBeNull();
    t.cleanup();
  });

  it('runs split actions from the built-in panel action menu', () => {
    const t = mount(lShapeLayout(), undefined, {
      showActionsButton: true,
    });
    const button = t.host.querySelector<HTMLElement>(
      '.tilery__panel[data-panel-id="sidebar"] .tilery__panel-action-button[aria-label="Panel actions"]',
    )!;
    act(() => {
      reactProps(button).onClick({});
    });
    const splitLeft = Array.from(
      t.host.querySelectorAll<HTMLElement>('.tilery__panel-menu-item'),
    ).find((el) => el.textContent === 'Split left')!;
    act(() => {
      reactProps(splitLeft).onClick({});
    });
    expect(t.handle().getPanels()).toHaveLength(4);
    expect(t.host.querySelector('.tilery__panel-menu')).toBeNull();
    t.cleanup();
  });

  it('runs float and dock actions from the built-in panel action menu', () => {
    const t = mount(lShapeLayout(), undefined, {
      showActionsButton: true,
    });
    const button = t.host.querySelector<HTMLElement>(
      '.tilery__panel[data-panel-id="sidebar"] .tilery__panel-action-button[aria-label="Panel actions"]',
    )!;
    act(() => {
      reactProps(button).onClick({});
    });
    const float = Array.from(
      t.host.querySelectorAll<HTMLElement>('.tilery__panel-menu-item'),
    ).find((el) => el.textContent === 'Float panel')!;
    act(() => {
      reactProps(float).onClick({});
    });
    expect(t.handle().getPanel('sidebar')?.floating).toBe(true);

    const floatingButton = t.host.querySelector<HTMLElement>(
      '.tilery__panel[data-panel-id="sidebar"] .tilery__panel-action-button[aria-label="Panel actions"]',
    )!;
    act(() => {
      reactProps(floatingButton).onClick({});
    });
    const dock = Array.from(
      t.host.querySelectorAll<HTMLElement>('.tilery__panel-menu-item'),
    ).find((el) => el.textContent === 'Dock panel')!;
    act(() => {
      reactProps(dock).onClick({});
    });
    expect(t.handle().getPanel('sidebar')?.floating).toBe(false);
    expect(t.host.querySelector('.tilery__panel-menu')).toBeNull();
    t.cleanup();
  });

  it('runs popout and return actions from the built-in panel action menu', () => {
    const popout = createPopoutWindowMock();
    vi.spyOn(window, 'open').mockReturnValue(popout);
    const t = mount(floatingLayout(), undefined, {
      showActionsButton: true,
    });
    const button = t.host.querySelector<HTMLElement>(
      '.tilery__panel[data-panel-id="palette"] .tilery__panel-action-button[aria-label="Panel actions"]',
    )!;
    act(() => {
      reactProps(button).onClick({});
    });
    const popoutAction = Array.from(
      t.host.querySelectorAll<HTMLElement>('.tilery__panel-menu-item'),
    ).find((el) => el.textContent === 'Pop out window')!;
    act(() => {
      reactProps(popoutAction).onClick({});
    });
    expect(t.handle().getPanel('palette')?.poppedOut).toBe(true);

    const poppedOutButton = popout.document.querySelector<HTMLElement>(
      '.tilery__panel[data-panel-id="palette"] .tilery__panel-action-button[aria-label="Panel actions"]',
    )!;
    act(() => {
      reactProps(poppedOutButton).onClick({});
    });
    const returnAction = Array.from(
      popout.document.querySelectorAll<HTMLElement>('.tilery__panel-menu-item'),
    ).find((el) => el.textContent === 'Return to floating layer')!;
    act(() => {
      reactProps(returnAction).onClick({});
    });
    expect(t.handle().getPanel('palette')?.poppedOut).toBe(false);
    expect(t.host.querySelector('.tilery__panel-menu')).toBeNull();
    t.cleanup();
  });

  it('runs close-panel actions from the built-in panel action menu', () => {
    const t = mount(lShapeLayout(), undefined, {
      showActionsButton: true,
    });
    const button = t.host.querySelector<HTMLElement>(
      '.tilery__panel[data-panel-id="term"] .tilery__panel-action-button[aria-label="Panel actions"]',
    )!;
    act(() => {
      reactProps(button).onClick({});
    });
    const close = Array.from(
      t.host.querySelectorAll<HTMLElement>('.tilery__panel-menu-item'),
    ).find((el) => el.textContent === 'Close panel')!;
    act(() => {
      reactProps(close).onClick({});
    });
    expect(t.handle().getPanel('term')).toBeNull();
    expect(t.host.querySelector('.tilery__panel-menu')).toBeNull();
    t.cleanup();
  });

  it('renders custom action content and custom action button icon', () => {
    let selected = false;
    const t = mount(lShapeLayout(), undefined, {
      showActionsButton: true,
      renderActionsButtonIcon: () => <span data-custom-icon="">••</span>,
      renderPanelActions: (_panel, ctx) => (
        <button
          type="button"
          className="tilery__panel-menu-item"
          onClick={() => {
            selected = true;
            ctx.closeMenu();
          }}>
          Custom action
        </button>
      ),
    });
    expect(t.host.querySelector('[data-custom-icon]')).not.toBeNull();
    const button = t.host.querySelector<HTMLElement>(
      '.tilery__panel[data-panel-id="sidebar"] .tilery__panel-action-button[aria-label="Panel actions"]',
    )!;
    act(() => {
      reactProps(button).onClick({});
    });
    const customAction = Array.from(
      t.host.querySelectorAll<HTMLElement>('.tilery__panel-menu-item'),
    ).find((el) => el.textContent === 'Custom action')!;
    act(() => {
      reactProps(customAction).onClick({});
    });
    expect(selected).toBe(true);
    expect(t.host.querySelector('.tilery__panel-menu')).toBeNull();
    t.cleanup();
  });
});

describe('Tilery — tab close button', () => {
  it('stops propagation on pointerdown so the underlying tab drag is not engaged', () => {
    const t = mount(lShapeLayout());
    const closeBtn = t.host.querySelector('.tilery__tab-close') as HTMLElement;
    let stopCalls = 0;
    reactProps(closeBtn).onPointerDown({
      stopPropagation() {
        stopCalls++;
      },
    });
    expect(stopCalls).toBe(1);
    t.cleanup();
  });
});

describe('Tilery — drag flow covers the drop overlay path', () => {
  it('paints the drag ghost and a drop overlay while a tab is being dragged', () => {
    const t = mount(lShapeLayout());
    const fooTab = Array.from(
      t.host.querySelectorAll<HTMLElement>('.tilery__tab'),
    ).find((el) => el.textContent?.includes('foo.ts'))!;

    // pointerdown on the tab seeds the drag pending state; pointermove
    // past the (tiny) threshold flips it to a live drag state, at which
    // point Tilery renders <DropOverlay> with the consumer's tab header
    // as the ghost label.
    act(() => {
      reactProps(fooTab).onPointerDown(
        pointerEvent({ clientX: 50, clientY: 10 }),
      );
      reactProps(fooTab).onPointerMove(
        pointerEvent({ clientX: 250, clientY: 250 }),
      );
    });
    const ghost = t.host.querySelector('.tilery__drag-ghost');
    expect(ghost).not.toBeNull();
    expect(ghost?.textContent).toBe('foo.ts');
    // pointerup releases; drop overlay disappears.
    act(() => {
      reactProps(fooTab).onPointerUp(
        pointerEvent({ clientX: 250, clientY: 250 }),
      );
    });
    expect(t.host.querySelector('.tilery__drag-ghost')).toBeNull();
    t.cleanup();
  });

  it('does not show split hover zones on floating panel edges', () => {
    const t = mount({
      type: 'root',
      main: {
        type: 'panel',
        id: 'main',
        tabs: [{ id: 'main-tab', data: { title: 'Main' } }],
      },
      floating: [
        {
          type: 'floatingPanel',
          id: 'palette',
          bounds: { x: 20, y: 20, width: 30, height: 30 },
          tabs: [{ id: 'palette-tab', data: { title: 'Palette' } }],
        },
      ],
    });
    const mainTab = t.host.querySelector<HTMLElement>(
      '.tilery__tab[data-tab-id="main-tab"]',
    )!;
    const mainPanel = t.host.querySelector<HTMLElement>(
      '.tilery__panel[data-panel-id="main"]',
    )!;
    const palettePanel = t.host.querySelector<HTMLElement>(
      '.tilery__panel[data-panel-id="palette"]',
    )!;
    mainPanel.getBoundingClientRect = () =>
      ({
        left: 0,
        top: 0,
        right: 100,
        bottom: 100,
        width: 100,
        height: 100,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect;
    palettePanel.getBoundingClientRect = () =>
      ({
        left: 200,
        top: 100,
        right: 500,
        bottom: 400,
        width: 300,
        height: 300,
        x: 200,
        y: 100,
        toJSON: () => ({}),
      }) as DOMRect;

    act(() => {
      reactProps(mainTab).onPointerDown(
        pointerEvent({ clientX: 20, clientY: 20, pointerId: 14 }),
      );
      reactProps(mainTab).onPointerMove(
        pointerEvent({ clientX: 205, clientY: 250, pointerId: 14 }),
      );
    });

    expect(t.host.querySelector('.tilery__drag-ghost')).not.toBeNull();
    expect(t.host.querySelector('.tilery__drop-overlay')).toBeNull();
    t.cleanup();
  });

  it('shows center drop feedback over a floating panel', () => {
    const t = mount({
      type: 'root',
      main: {
        type: 'panel',
        id: 'main',
        tabs: [{ id: 'main-tab', data: { title: 'Main' } }],
      },
      floating: [
        {
          type: 'floatingPanel',
          id: 'palette',
          bounds: { x: 20, y: 20, width: 30, height: 30 },
          tabs: [{ id: 'palette-tab', data: { title: 'Palette' } }],
        },
      ],
    });
    const mainTab = t.host.querySelector<HTMLElement>(
      '.tilery__tab[data-tab-id="main-tab"]',
    )!;
    const mainPanel = t.host.querySelector<HTMLElement>(
      '.tilery__panel[data-panel-id="main"]',
    )!;
    const palettePanel = t.host.querySelector<HTMLElement>(
      '.tilery__panel[data-panel-id="palette"]',
    )!;
    mainPanel.getBoundingClientRect = () =>
      ({
        left: 0,
        top: 0,
        right: 100,
        bottom: 100,
        width: 100,
        height: 100,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect;
    palettePanel.getBoundingClientRect = () =>
      ({
        left: 200,
        top: 100,
        right: 500,
        bottom: 400,
        width: 300,
        height: 300,
        x: 200,
        y: 100,
        toJSON: () => ({}),
      }) as DOMRect;

    act(() => {
      reactProps(mainTab).onPointerDown(
        pointerEvent({ clientX: 20, clientY: 20, pointerId: 15 }),
      );
      reactProps(mainTab).onPointerMove(
        pointerEvent({ clientX: 350, clientY: 250, pointerId: 15 }),
      );
    });

    const overlay = t.host.querySelector<HTMLElement>('.tilery__drop-overlay');
    expect(overlay).not.toBeNull();
    expect(overlay?.dataset.zone).toBe('center');
    expect(t.host.querySelector('.tilery__drag-ghost')).not.toBeNull();
    t.cleanup();
  });

  it('shows sibling count while panel-dragging and falls back if that tab is removed', () => {
    const t = mount(lShapeLayout());
    const editorBar = t.host.querySelector<HTMLElement>(
      '.tilery__panel[data-panel-id="editor"] .tilery__tab-bar',
    )!;
    editorBar.setPointerCapture = () => {};
    editorBar.releasePointerCapture = () => {};
    const down = pointerEvent({ clientX: 250, clientY: 10, pointerId: 12 });
    Object.assign(down as unknown as Record<string, unknown>, {
      currentTarget: editorBar,
      target: editorBar,
    });
    act(() => {
      reactProps(editorBar).onPointerDown(down);
      reactProps(editorBar).onPointerMove(
        pointerEvent({ clientX: 260, clientY: 80, pointerId: 12 }),
      );
    });
    expect(t.host.querySelector('.tilery__drag-ghost')?.textContent).toBe(
      'foo.ts+1',
    );
    act(() => {
      t.handle().getTab('foo')!.remove();
    });
    expect(t.host.querySelector('.tilery__drag-ghost')?.textContent).toBe(
      'Tab',
    );
    t.cleanup();
  });

  it('moves a floating panel by dragging empty tab-bar space', () => {
    const t = mount(floatingLayout());
    const paletteBar = t.host.querySelector<HTMLElement>(
      '.tilery__panel[data-panel-id="palette"] .tilery__tab-bar',
    )!;
    paletteBar.setPointerCapture = () => {};
    paletteBar.releasePointerCapture = () => {};
    const down = pointerEvent({ clientX: 100, clientY: 80, pointerId: 9 });
    Object.assign(down as unknown as Record<string, unknown>, {
      currentTarget: paletteBar,
      target: paletteBar,
    });

    act(() => {
      reactProps(paletteBar).onPointerDown(down);
      reactProps(paletteBar).onPointerMove(
        pointerEvent({ clientX: 200, clientY: 160, pointerId: 9 }),
      );
      reactProps(paletteBar).onPointerUp(
        pointerEvent({ clientX: 200, clientY: 160, pointerId: 9 }),
      );
    });

    expect(t.handle().getPanel('palette')?.floatingBounds).toEqual({
      x: 20,
      y: 20,
      width: 32,
      height: 40,
    });
    t.cleanup();
  });

  it('ignores non-left-button floating panel drag starts', () => {
    const t = mount(floatingLayout());
    const paletteBar = t.host.querySelector<HTMLElement>(
      '.tilery__panel[data-panel-id="palette"] .tilery__tab-bar',
    )!;
    const down = pointerEvent({
      button: 2,
      clientX: 100,
      clientY: 80,
      pointerId: 9,
    });
    Object.assign(down as unknown as Record<string, unknown>, {
      currentTarget: paletteBar,
      target: paletteBar,
    });

    act(() => {
      reactProps(paletteBar).onPointerDown(down);
      reactProps(paletteBar).onPointerMove(
        pointerEvent({ clientX: 200, clientY: 160, pointerId: 9 }),
      );
      reactProps(paletteBar).onPointerUp(
        pointerEvent({ clientX: 200, clientY: 160, pointerId: 9 }),
      );
    });

    expect(t.handle().getPanel('palette')?.floatingBounds).toEqual({
      x: 10,
      y: 10,
      width: 32,
      height: 40,
    });
    t.cleanup();
  });

  it('ignores stale floating tab-bar drags after the panel is removed', () => {
    const t = mount(floatingLayout());
    const paletteBar = t.host.querySelector<HTMLElement>(
      '.tilery__panel[data-panel-id="palette"] .tilery__tab-bar',
    )!;
    const onPointerDown = reactProps(paletteBar).onPointerDown;
    const down = pointerEvent({ clientX: 100, clientY: 80, pointerId: 9 });
    Object.assign(down as unknown as Record<string, unknown>, {
      currentTarget: paletteBar,
      target: paletteBar,
    });
    act(() => {
      t.handle().removePanel('palette');
    });

    act(() => {
      onPointerDown(down);
    });

    expect(t.handle().getPanel('palette')).toBeNull();
    t.cleanup();
  });

  it('ignores floating panel drag starts when dragging is disabled', () => {
    const t = mount({
      type: 'root',
      main: {
        type: 'panel',
        id: 'main',
        tabs: [{ id: 'main-tab', data: { title: 'Main' } }],
      },
      floating: [
        {
          type: 'floatingPanel',
          id: 'palette',
          draggable: false,
          bounds: { x: 10, y: 10, width: 32, height: 40 },
          tabs: [{ id: 'palette-tab', data: { title: 'Palette' } }],
        },
      ],
    });
    const paletteBar = t.host.querySelector<HTMLElement>(
      '.tilery__panel[data-panel-id="palette"] .tilery__tab-bar',
    )!;
    const down = pointerEvent({ clientX: 100, clientY: 80, pointerId: 9 });
    Object.assign(down as unknown as Record<string, unknown>, {
      currentTarget: paletteBar,
      target: paletteBar,
    });

    act(() => {
      reactProps(paletteBar).onPointerDown(down);
      reactProps(paletteBar).onPointerMove(
        pointerEvent({ clientX: 200, clientY: 160, pointerId: 9 }),
      );
    });

    expect(t.handle().getPanel('palette')?.floatingBounds).toEqual({
      x: 10,
      y: 10,
      width: 32,
      height: 40,
    });
    t.cleanup();
  });

  it('ignores floating panel drag starts when the container has no size', () => {
    const t = mount(floatingLayout(), undefined, {}, { stubRect: false });
    const paletteBar = t.host.querySelector<HTMLElement>(
      '.tilery__panel[data-panel-id="palette"] .tilery__tab-bar',
    )!;
    const down = pointerEvent({ clientX: 100, clientY: 80, pointerId: 9 });
    Object.assign(down as unknown as Record<string, unknown>, {
      currentTarget: paletteBar,
      target: paletteBar,
    });

    act(() => {
      reactProps(paletteBar).onPointerDown(down);
      reactProps(paletteBar).onPointerMove(
        pointerEvent({ clientX: 200, clientY: 160, pointerId: 9 }),
      );
    });

    expect(t.handle().getPanel('palette')?.floatingBounds).toEqual({
      x: 10,
      y: 10,
      width: 32,
      height: 40,
    });
    t.cleanup();
  });

  it('ignores stale floating tab-bar handlers after unmount', () => {
    const t = mount(floatingLayout());
    const paletteBar = t.host.querySelector<HTMLElement>(
      '.tilery__panel[data-panel-id="palette"] .tilery__tab-bar',
    )!;
    const onPointerDown = reactProps(paletteBar).onPointerDown;
    const down = pointerEvent({ clientX: 100, clientY: 80, pointerId: 9 });
    Object.assign(down as unknown as Record<string, unknown>, {
      currentTarget: paletteBar,
      target: paletteBar,
    });

    t.cleanup();

    act(() => {
      onPointerDown(down);
    });
  });

  it('delegates pointer cancel when no floating drag is active', () => {
    const t = mount(floatingLayout());
    const paletteBar = t.host.querySelector<HTMLElement>(
      '.tilery__panel[data-panel-id="palette"] .tilery__tab-bar',
    )!;

    act(() => {
      reactProps(paletteBar).onPointerCancel(pointerEvent({ pointerId: 99 }));
    });

    expect(t.handle().getPanel('palette')).not.toBeNull();
    t.cleanup();
  });

  it('clears floating panel drags on pointer cancel', () => {
    const t = mount(floatingLayout());
    const paletteBar = t.host.querySelector<HTMLElement>(
      '.tilery__panel[data-panel-id="palette"] .tilery__tab-bar',
    )!;
    paletteBar.setPointerCapture = () => {};
    const down = pointerEvent({ clientX: 100, clientY: 80, pointerId: 9 });
    Object.assign(down as unknown as Record<string, unknown>, {
      currentTarget: paletteBar,
      target: paletteBar,
    });

    act(() => {
      reactProps(paletteBar).onPointerDown(down);
      reactProps(paletteBar).onPointerCancel(
        pointerEvent({ clientX: 120, clientY: 120, pointerId: 9 }),
      );
      reactProps(paletteBar).onPointerMove(
        pointerEvent({ clientX: 200, clientY: 160, pointerId: 9 }),
      );
    });

    expect(t.handle().getPanel('palette')?.floatingBounds).toEqual({
      x: 10,
      y: 10,
      width: 32,
      height: 40,
    });
    t.cleanup();
  });

  it('delegates tab-bar pointerup when no floating drag is active', () => {
    const t = mount(floatingLayout());
    const paletteBar = t.host.querySelector<HTMLElement>(
      '.tilery__panel[data-panel-id="palette"] .tilery__tab-bar',
    )!;

    act(() => {
      reactProps(paletteBar).onPointerUp(pointerEvent({ pointerId: 99 }));
    });

    expect(t.handle().getPanel('palette')).not.toBeNull();
    t.cleanup();
  });

  it('resizes a floating panel by dragging a resize handle', () => {
    const t = mount(floatingLayout());
    const resizeHandle = t.host.querySelector<HTMLElement>(
      '.tilery__panel[data-panel-id="palette"] .tilery__floating-resize-handle[data-floating-resize-edge="bottom-right"]',
    )!;
    resizeHandle.setPointerCapture = () => {};
    resizeHandle.releasePointerCapture = () => {};
    const down = pointerEvent({ clientX: 420, clientY: 400, pointerId: 10 });
    Object.assign(down as unknown as Record<string, unknown>, {
      currentTarget: resizeHandle,
      target: resizeHandle,
    });

    act(() => {
      reactProps(resizeHandle).onPointerDown(down);
      reactProps(resizeHandle).onPointerMove(
        pointerEvent({ clientX: 520, clientY: 480, pointerId: 10 }),
      );
      reactProps(resizeHandle).onPointerUp(
        pointerEvent({ clientX: 520, clientY: 480, pointerId: 10 }),
      );
    });

    expect(t.handle().getPanel('palette')?.floatingBounds).toEqual({
      x: 10,
      y: 10,
      width: 42,
      height: 50,
    });
    t.cleanup();
  });

  it('resizes a floating panel from its top-left edge', () => {
    const t = mount(floatingLayout());
    const resizeHandle = t.host.querySelector<HTMLElement>(
      '.tilery__panel[data-panel-id="palette"] .tilery__floating-resize-handle[data-floating-resize-edge="top-left"]',
    )!;
    resizeHandle.setPointerCapture = () => {};
    resizeHandle.releasePointerCapture = () => {};
    const down = pointerEvent({ clientX: 100, clientY: 80, pointerId: 10 });
    Object.assign(down as unknown as Record<string, unknown>, {
      currentTarget: resizeHandle,
      target: resizeHandle,
    });

    act(() => {
      reactProps(resizeHandle).onPointerDown(down);
      reactProps(resizeHandle).onPointerMove(
        pointerEvent({ clientX: 200, clientY: 160, pointerId: 10 }),
      );
      reactProps(resizeHandle).onPointerUp(
        pointerEvent({ clientX: 200, clientY: 160, pointerId: 10 }),
      );
    });

    expect(t.handle().getPanel('palette')?.floatingBounds).toEqual({
      x: 20,
      y: 20,
      width: 22,
      height: 30,
    });
    t.cleanup();
  });

  it('ignores non-left-button floating resize starts', () => {
    const t = mount(floatingLayout());
    const resizeHandle = t.host.querySelector<HTMLElement>(
      '.tilery__panel[data-panel-id="palette"] .tilery__floating-resize-handle[data-floating-resize-edge="bottom-right"]',
    )!;
    const down = pointerEvent({
      button: 2,
      clientX: 420,
      clientY: 400,
      pointerId: 10,
    });
    Object.assign(down as unknown as Record<string, unknown>, {
      currentTarget: resizeHandle,
      target: resizeHandle,
    });

    act(() => {
      reactProps(resizeHandle).onPointerDown(down);
      reactProps(resizeHandle).onPointerMove(
        pointerEvent({ clientX: 520, clientY: 480, pointerId: 10 }),
      );
    });

    expect(t.handle().getPanel('palette')?.floatingBounds).toEqual({
      x: 10,
      y: 10,
      width: 32,
      height: 40,
    });
    t.cleanup();
  });

  it('ignores stale floating resize handles after the panel is removed', () => {
    const t = mount(floatingLayout());
    const resizeHandle = t.host.querySelector<HTMLElement>(
      '.tilery__panel[data-panel-id="palette"] .tilery__floating-resize-handle[data-floating-resize-edge="bottom-right"]',
    )!;
    const onPointerDown = reactProps(resizeHandle).onPointerDown;
    const down = pointerEvent({ clientX: 420, clientY: 400, pointerId: 10 });
    Object.assign(down as unknown as Record<string, unknown>, {
      currentTarget: resizeHandle,
      target: resizeHandle,
    });
    act(() => {
      t.handle().removePanel('palette');
    });

    act(() => {
      onPointerDown(down);
    });

    expect(t.handle().getPanel('palette')).toBeNull();
    t.cleanup();
  });

  it('ignores floating resize starts when resizing is disabled after render', () => {
    const t = mount(floatingLayout());
    const resizeHandle = t.host.querySelector<HTMLElement>(
      '.tilery__panel[data-panel-id="palette"] .tilery__floating-resize-handle[data-floating-resize-edge="bottom-right"]',
    )!;
    const onPointerDown = reactProps(resizeHandle).onPointerDown;
    const onPointerMove = reactProps(resizeHandle).onPointerMove;
    act(() => {
      t.handle().setLayout({
        type: 'root',
        main: {
          type: 'panel',
          id: 'main',
          tabs: [{ id: 'main-tab', data: { title: 'Main' } }],
        },
        floating: [
          {
            type: 'floatingPanel',
            id: 'palette',
            resizable: false,
            bounds: { x: 10, y: 10, width: 32, height: 40 },
            tabs: [{ id: 'palette-tab', data: { title: 'Palette' } }],
          },
        ],
      });
    });
    const down = pointerEvent({ clientX: 420, clientY: 400, pointerId: 10 });
    Object.assign(down as unknown as Record<string, unknown>, {
      currentTarget: resizeHandle,
      target: resizeHandle,
    });

    act(() => {
      onPointerDown(down);
      onPointerMove(
        pointerEvent({ clientX: 520, clientY: 480, pointerId: 10 }),
      );
    });

    expect(t.handle().getPanel('palette')?.floatingBounds).toEqual({
      x: 10,
      y: 10,
      width: 32,
      height: 40,
    });
    t.cleanup();
  });

  it('ignores floating resize starts when the container has no size', () => {
    const t = mount(floatingLayout(), undefined, {}, { stubRect: false });
    const resizeHandle = t.host.querySelector<HTMLElement>(
      '.tilery__panel[data-panel-id="palette"] .tilery__floating-resize-handle[data-floating-resize-edge="bottom-right"]',
    )!;
    const down = pointerEvent({ clientX: 420, clientY: 400, pointerId: 10 });
    Object.assign(down as unknown as Record<string, unknown>, {
      currentTarget: resizeHandle,
      target: resizeHandle,
    });

    act(() => {
      reactProps(resizeHandle).onPointerDown(down);
      reactProps(resizeHandle).onPointerMove(
        pointerEvent({ clientX: 520, clientY: 480, pointerId: 10 }),
      );
    });

    expect(t.handle().getPanel('palette')?.floatingBounds).toEqual({
      x: 10,
      y: 10,
      width: 32,
      height: 40,
    });
    t.cleanup();
  });
});

describe('Tilery — handle cache invalidation', () => {
  it('drops a tab handle from the cache after the tab is removed', () => {
    const t = mount(lShapeLayout());
    const h = t.handle();
    // Prime the cache: first lookup populates it.
    expect(h.getTab('foo')).not.toBeNull();
    act(() => {
      h.getTab('foo')!.remove();
    });
    // After removal, a subsequent lookup must return null AND clear the
    // cache entry (the deletion branch in tilery.tsx's getCachedTabHandle).
    expect(h.getTab('foo')).toBeNull();
    t.cleanup();
  });

  it('drops a panel handle from the cache after the panel is removed', () => {
    const t = mount(lShapeLayout());
    const h = t.handle();
    expect(h.getPanel('term')).not.toBeNull();
    act(() => {
      // Removing the only tab in `term` deletes the panel itself.
      h.getTab('sh')!.remove();
    });
    expect(h.getPanel('term')).toBeNull();
    t.cleanup();
  });

  it('drag ghost label falls back to "Tab" when the dragged tab gets removed mid-drag', () => {
    // Triggers the cache-delete branches inside getCachedTabHandle /
    // getCachedPanelHandle: a drag is in flight (so the ghost render
    // path queries the cached handles), then we remove the dragged tab
    // through the imperative API, then force a re-render — the cache
    // entries point at IDs no longer in state, so the next lookup must
    // delete them and return null. The ghost falls back to "Tab".
    const t = mount(lShapeLayout());
    const fooTab = Array.from(
      t.host.querySelectorAll<HTMLElement>('.tilery__tab'),
    ).find((el) => el.textContent?.includes('foo.ts'))!;
    act(() => {
      reactProps(fooTab).onPointerDown(
        pointerEvent({ clientX: 50, clientY: 10 }),
      );
      reactProps(fooTab).onPointerMove(
        pointerEvent({ clientX: 250, clientY: 250 }),
      );
    });
    expect(t.host.querySelector('.tilery__drag-ghost')!.textContent).toBe(
      'foo.ts',
    );
    // Remove the tab via the imperative API while the drag is still live.
    act(() => {
      t.handle().getTab('foo')!.remove();
    });
    // Tilery re-renders. The drag controller still holds tabId='foo' in
    // dragState but the tab is gone. The ghost label resolution misses
    // and falls back to 'Tab' (also exercises the cache.delete branch
    // for getCachedTabHandle).
    const ghost = t.host.querySelector('.tilery__drag-ghost');
    expect(ghost?.textContent).toBe('Tab');
    t.cleanup();
  });
});

describe('Tilery — min panel size honored by handle', () => {
  it('forwards minSize to RESIZE_DIVIDER clamps', () => {
    const t = mount(lShapeLayout());
    const divider = Array.from(
      t.host.querySelectorAll<HTMLElement>('.tilery__divider'),
    ).find((el) => el.getAttribute('data-orientation') === 'vertical')!;
    // Try to drag past the right edge — clamp should hold.
    act(() => {
      reactProps(divider).onPointerDown(pointerEvent());
      reactProps(divider).onPointerMove(
        pointerEvent({ clientX: 990, clientY: 400 }),
      );
      reactProps(divider).onPointerUp(pointerEvent());
    });
    const sidebar = t.handle().getPanel('sidebar')!;
    // Default min is 10%, so the right inset can't go below 10.
    expect(100 - sidebar.inset.right).toBeLessThanOrEqual(90 + 1e-6);
    t.cleanup();
  });

  it('lets a constrained root panel resize within its direct split bounds', () => {
    const t = mount(constrainedLayout());
    const divider = Array.from(
      t.host.querySelectorAll<HTMLElement>('.tilery__divider'),
    ).find(
      (el) => el.getAttribute('aria-controls') === 'tilery-panel-navigator',
    )!;

    expect(divider.getAttribute('aria-valuemin')).toBe('18');
    expect(divider.getAttribute('aria-valuemax')).toBe('34');

    act(() => {
      reactProps(divider).onPointerDown(pointerEvent());
      reactProps(divider).onPointerMove(
        pointerEvent({ clientX: 500, clientY: 400 }),
      );
      reactProps(divider).onPointerUp(pointerEvent());
    });
    expect(100 - t.handle().getPanel('navigator')!.inset.right).toBe(34);

    act(() => {
      reactProps(divider).onPointerDown(pointerEvent());
      reactProps(divider).onPointerMove(
        pointerEvent({ clientX: 100, clientY: 400 }),
      );
      reactProps(divider).onPointerUp(pointerEvent());
    });
    expect(100 - t.handle().getPanel('navigator')!.inset.right).toBe(18);
    t.cleanup();
  });

  it('resolves pixel minSize and maxSize against the measured container', () => {
    const t = mount(pixelConstrainedLayout());
    const divider = t.host.querySelector<HTMLElement>('.tilery__divider')!;
    expect(t.inner.getBoundingClientRect().width).toBe(1000);
    expect(t.handle().getState().panels.left!.minSize).toBe('200px');

    act(() => {
      reactProps(divider).onPointerDown(pointerEvent());
      reactProps(divider).onPointerMove(
        pointerEvent({ clientX: 50, clientY: 400 }),
      );
      reactProps(divider).onPointerUp(pointerEvent());
    });
    expect(100 - t.handle().getPanel('left')!.inset.right).toBe(20);
    expect(divider.hasAttribute('data-resize-at-min')).toBe(true);

    act(() => {
      reactProps(divider).onPointerDown(pointerEvent());
      reactProps(divider).onPointerMove(
        pointerEvent({ clientX: 900, clientY: 400 }),
      );
      reactProps(divider).onPointerUp(pointerEvent());
    });
    expect(100 - t.handle().getPanel('left')!.inset.right).toBe(40);
    expect(divider.hasAttribute('data-resize-at-max')).toBe(true);
    t.cleanup();
  });

  it('warns when measured pixel constraints cannot all be met', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const t = mount(impossiblePixelConstrainedLayout());
    const divider = t.host.querySelector<HTMLElement>('.tilery__divider')!;

    act(() => {
      reactProps(divider).onPointerDown(pointerEvent());
      reactProps(divider).onPointerMove(
        pointerEvent({ clientX: 300, clientY: 400 }),
      );
      reactProps(divider).onPointerUp(pointerEvent());
    });

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]![0]).toContain(
      'Constraints around divider "tree|initial:horizontal:left|right#0" cannot all be satisfied',
    );
    expect(100 - t.handle().getPanel('left')!.inset.right).toBe(50);
    t.cleanup();
  });

  it('does not warn when a valid resize clamps at a boundary', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const t = mount(pixelConstrainedLayout());
    const divider = t.host.querySelector<HTMLElement>('.tilery__divider')!;

    act(() => {
      reactProps(divider).onPointerDown(pointerEvent());
      reactProps(divider).onPointerMove(
        pointerEvent({ clientX: 50, clientY: 400 }),
      );
      reactProps(divider).onPointerUp(pointerEvent());
    });

    expect(warn).not.toHaveBeenCalled();
    expect(100 - t.handle().getPanel('left')!.inset.right).toBe(20);
    t.cleanup();
  });

  it('normalizes pixel constraints when ResizeObserver reports a container size', () => {
    const resizeObserver = installResizeObserverMock();
    const t = mount(containerResizeConstrainedLayout());

    expect(100 - t.handle().getPanel('left')!.inset.right).toBe(30);
    act(() => {
      resizeObserver.observers[0]!.callback(
        [],
        resizeObserver.observers[0] as never,
      );
    });

    expect(100 - t.handle().getPanel('left')!.inset.right).toBe(40);
    expect(t.handle().getPanel('right')!.inset.left).toBe(40);
    t.cleanup();
    resizeObserver.restore();
  });

  it('keeps proportions on container resize when constraints already fit', () => {
    const resizeObserver = installResizeObserverMock();
    const t = mount(pixelConstrainedLayout());

    act(() => {
      resizeObserver.observers[0]!.callback(
        [],
        resizeObserver.observers[0] as never,
      );
    });

    expect(100 - t.handle().getPanel('left')!.inset.right).toBe(30);
    t.cleanup();
    resizeObserver.restore();
  });

  it('disables all resize handles when resizable is false', () => {
    const t = mount(simpleLayout(), undefined, { resizable: false });
    const divider = t.host.querySelector<HTMLElement>('.tilery__divider')!;

    expect(divider.hasAttribute('data-resize-disabled')).toBe(true);
    expect(divider.getAttribute('aria-disabled')).toBe('true');
    expect(divider.tabIndex).toBe(-1);
    act(() => {
      reactProps(divider).onPointerDown?.(pointerEvent());
      reactProps(divider).onPointerMove?.(
        pointerEvent({ clientX: 700, clientY: 400 }),
      );
      reactProps(divider).onPointerUp?.(pointerEvent());
    });
    expect(100 - t.handle().getPanel('left')!.inset.right).toBe(60);
    t.cleanup();
  });

  it('disables a divider next to a non-resizable layout item', () => {
    const t = mount(lockedNavigatorLayout());
    const divider = t.host.querySelector<HTMLElement>('.tilery__divider')!;

    expect(divider.hasAttribute('data-resize-disabled')).toBe(true);
    expect(divider.getAttribute('aria-disabled')).toBe('true');
    act(() => {
      reactProps(divider).onPointerDown?.(pointerEvent());
      reactProps(divider).onPointerMove?.(
        pointerEvent({ clientX: 700, clientY: 400 }),
      );
      reactProps(divider).onPointerUp?.(pointerEvent());
    });
    expect(100 - t.handle().getPanel('navigator')!.inset.right).toBe(30);
    t.cleanup();
  });

  it('disables a T-junction when any connected divider is locked', () => {
    const t = mount({
      type: 'group',
      direction: 'horizontal',
      children: [
        {
          type: 'panel',
          id: 'sidebar',
          size: 40,
          resizable: false,
          tabs: [{ id: 'side', data: { title: 'Side' } }],
        },
        {
          type: 'group',
          direction: 'vertical',
          size: 60,
          children: [
            {
              type: 'panel',
              id: 'editor',
              tabs: [{ id: 'file', data: { title: 'File' } }],
            },
            {
              type: 'panel',
              id: 'term',
              tabs: [{ id: 'shell', data: { title: 'Shell' } }],
            },
          ],
        },
      ],
    });
    const junction = t.host.querySelector<HTMLElement>('.tilery__junction')!;

    expect(junction.hasAttribute('data-resize-disabled')).toBe(true);
    act(() => {
      reactProps(junction).onPointerDown?.(pointerEvent());
      reactProps(junction).onPointerMove?.(
        pointerEvent({ clientX: 300, clientY: 560 }),
      );
      reactProps(junction).onPointerUp?.(pointerEvent());
    });
    expect(t.handle().getPanel('sidebar')!.inset.right).toBe(60);
    expect(t.handle().getPanel('editor')!.inset.bottom).toBe(50);
    expect(t.handle().getPanel('term')!.inset.top).toBe(50);
    t.cleanup();
  });
});
