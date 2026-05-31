// @vitest-environment jsdom

import { describe, expect, it } from 'vite-plus/test';
import React, { act, createRef } from 'react';
import { createRoot } from 'react-dom/client';

import { Tilery } from './tilery';
import type { TileryInitialLayout, TileryHandle } from 'tilery/internal';

// Integration tests for the Tilery component itself. They exercise the
// JSX tree that the per-piece unit tests don't reach: panel-chrome, tab,
// tab-bar, divider, drop-overlay, and the wiring in tilery.tsx itself
// (handle caches, the tab portal effect, junction-drag dispatch). Each
// test mounts a small layout, performs a single interaction, and asserts
// the resulting DOM and the imperative-handle state.

type Data = { title: string };

function lShapeLayout(): TileryInitialLayout<Data> {
  // Sidebar + (editor / terminal) = exactly one junction at (40, 50).
  return {
    panels: [
      {
        id: 'sidebar',
        inset: { top: 0, right: 60, bottom: 0, left: 0 },
        tabs: [{ id: 'side', data: { title: 'Side' } }],
      },
      {
        id: 'editor',
        inset: { top: 0, right: 0, bottom: 50, left: 40 },
        tabs: [
          { id: 'foo', data: { title: 'foo.ts' } },
          { id: 'bar', data: { title: 'bar.ts' } },
        ],
      },
      {
        id: 'term',
        inset: { top: 50, right: 0, bottom: 0, left: 40 },
        tabs: [{ id: 'sh', data: { title: 'bash' } }],
      },
    ],
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
  it('renders one panel per initialLayout entry with the right tab strip', () => {
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

  it('positions panels via inset percentages from the initialLayout', () => {
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

  it('derives both a divider and a junction handle for the L-shape', () => {
    const t = mount(lShapeLayout());
    // 2 dividers (1 vertical between sidebar and editor/term, 1 horizontal
    // between editor and term) plus 1 junction handle at their crossing.
    expect(t.host.querySelectorAll('.tilery__divider')).toHaveLength(2);
    expect(t.host.querySelectorAll('.tilery__junction')).toHaveLength(1);
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

describe('Tilery — divider + junction drag dispatch', () => {
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

  it('dragging the junction handle resizes both axes in one gesture', () => {
    const t = mount(lShapeLayout());
    const junction = t.host.querySelector('.tilery__junction') as HTMLElement;
    act(() => {
      reactProps(junction).onPointerDown(pointerEvent());
      reactProps(junction).onPointerMove(
        pointerEvent({ clientX: 600, clientY: 600 }),
      );
      reactProps(junction).onPointerUp(pointerEvent());
    });
    const sidebar = t.handle().getPanel('sidebar')!.inset;
    const term = t.handle().getPanel('term')!.inset;
    // 600 / 1000 = 60% vertical, 600 / 800 = 75% horizontal.
    expect(sidebar.right).toBe(40);
    expect(term.top).toBe(75);
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
    const layout = lShapeLayout();
    layout.panels[1] = { ...layout.panels[1]!, fullScreen: true };
    const t = mount(layout);
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

  it('hides collapsed panel content and expands from a collapsed title', () => {
    const layout = lShapeLayout();
    layout.panels[0] = {
      ...layout.panels[0]!,
      collapsed: true,
      collapsedTitle: 'Sidebar',
      collapsible: true,
    };
    const t = mount(layout);
    const sidebar = t.host.querySelector<HTMLElement>(
      '.tilery__panel[data-panel-id="sidebar"]',
    )!;
    expect(sidebar.getAttribute('data-collapsed')).toBe('true');
    expect(
      sidebar
        .querySelector<HTMLElement>('.tilery__panel-content')!
        .hasAttribute('hidden'),
    ).toBe(true);
    const title = sidebar.querySelector<HTMLElement>(
      '.tilery__collapsed-title',
    )!;
    expect(title.textContent).toBe('Sidebar');
    act(() => {
      reactProps(title).onClick({});
    });
    expect(t.handle().getPanel('sidebar')!.collapsed).toBe(false);
    expect(
      t.host
        .querySelector('.tilery__panel[data-panel-id="sidebar"]')
        ?.getAttribute('data-collapsed'),
    ).toBe('false');
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

  it('drops a panel handle from the cache after the panel is removed via auto-collapse', () => {
    const t = mount(lShapeLayout());
    const h = t.handle();
    expect(h.getPanel('term')).not.toBeNull();
    act(() => {
      // Removing the only tab in `term` triggers an auto-collapse that
      // deletes the panel itself.
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
