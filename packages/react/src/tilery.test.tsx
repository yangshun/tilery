// @vitest-environment jsdom

import { describe, expect, it } from 'vite-plus/test';
import React, { act, createRef } from 'react';
import { createRoot } from 'react-dom/client';

import { Tilery, type TileryProps } from './tilery';
import type { TileryInitialLayout, TileryHandle } from 'tilery/internal';

// Integration tests for the Tilery component itself. They exercise the
// JSX tree that the per-piece unit tests don't reach: panel-chrome, tab,
// tab-bar, divider, drop-overlay, and the wiring in tilery.tsx itself
// (handle caches, the tab portal effect, divider-drag dispatch). Each
// test mounts a small layout, performs a single interaction, and asserts
// the resulting DOM and the imperative-handle state.

type Data = { title: string };

function lShapeLayout(
  opts: { editorFullScreen?: boolean } = {},
): TileryInitialLayout<Data> {
  // Sidebar + (editor / terminal) = two nested one-dimensional splits.
  return {
    type: 'split',
    direction: 'horizontal',
    children: [
      {
        type: 'panel',
        id: 'sidebar',
        size: 40,
        tabs: [{ id: 'side', data: { title: 'Side' } }],
      },
      {
        type: 'split',
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
    type: 'split',
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
  stubContainerRect(inner);

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

  it('positions panels from the initial split tree', () => {
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

  it('exposes the TileryHandle via forwardRef', () => {
    const t = mount(lShapeLayout());
    const h = t.handle();
    expect(h.getPanels()).toHaveLength(3);
    expect(h.getTabs()).toHaveLength(4);
    expect(h.getPanel('sidebar')).not.toBeNull();
    expect(h.getTab('foo')).not.toBeNull();
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

  it('renders panels in initial split tree order', () => {
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
  it('forwards minPanelSizePercent to RESIZE_DIVIDER clamps', () => {
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
});
