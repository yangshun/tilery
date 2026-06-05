// @vitest-environment jsdom

import '../test-dom-setup';

import { describe, expect, it } from 'vite-plus/test';
import React, { act, useRef } from 'react';
import { createRoot } from 'react-dom/client';

import { DropOverlay } from './drop-overlay';
import type { TileryDragState } from 'tilery/internal';

// DropOverlay is rendered only while a tab drag is in flight. The Tilery
// integration test exercises the "no zone / no panel" path; this file
// drives the remaining branches by mounting <DropOverlay> directly with
// hand-built drag states for each kind of hit.

function stubRect(
  el: HTMLElement,
  rect: {
    left: number;
    top: number;
    width: number;
    height: number;
  },
) {
  const r = {
    left: rect.left,
    top: rect.top,
    right: rect.left + rect.width,
    bottom: rect.top + rect.height,
    width: rect.width,
    height: rect.height,
    x: rect.left,
    y: rect.top,
    toJSON: () => ({}),
  } as DOMRect;
  el.getBoundingClientRect = () => r;
}

// Builds a Tilery-like DOM tree with one panel and an N-tab tab bar so
// the DropOverlay can query elements by their data-attribute selectors.
function buildContainer({
  panelId,
  tabIds,
}: {
  panelId: string;
  tabIds: string[];
}) {
  const container = document.createElement('div');
  container.className = 'tilery__inner';
  document.body.appendChild(container);
  stubRect(container, { left: 0, top: 0, width: 1000, height: 800 });

  const panel = document.createElement('div');
  panel.className = 'tilery__panel';
  panel.setAttribute('data-panel-id', panelId);
  // Panel occupies the right half of the container.
  stubRect(panel, { left: 500, top: 0, width: 500, height: 800 });
  container.appendChild(panel);

  const tabBar = document.createElement('div');
  tabBar.className = 'tilery__tab-bar';
  stubRect(tabBar, { left: 500, top: 0, width: 500, height: 32 });
  panel.appendChild(tabBar);

  // Tabs laid out left-to-right inside the bar, each 100px wide.
  tabIds.forEach((tabId, i) => {
    const tab = document.createElement('div');
    tab.className = 'tilery__tab';
    tab.setAttribute('data-tab-id', tabId);
    stubRect(tab, { left: 500 + i * 100, top: 0, width: 100, height: 32 });
    tabBar.appendChild(tab);
  });

  return { container, panel, tabBar };
}

function buildRootContainer() {
  const container = document.createElement('div');
  container.className = 'tilery__inner';
  document.body.appendChild(container);
  stubRect(container, { left: 0, top: 0, width: 1000, height: 800 });

  const mainLayer = document.createElement('div');
  mainLayer.className = 'tilery__main-layer';
  stubRect(mainLayer, { left: 100, top: 50, width: 600, height: 300 });
  container.appendChild(mainLayer);

  return { container, mainLayer };
}

function dragWith(overrides: Partial<TileryDragState>): TileryDragState {
  return {
    tabId: 'foo',
    pointerId: 1,
    startX: 0,
    startY: 0,
    x: 100,
    y: 100,
    hoverPanelId: null,
    hoverZone: null,
    hoverTabBar: null,
    ...overrides,
  };
}

function mount(
  drag: TileryDragState,
  containerEl: HTMLElement,
  panelEls: Map<string, HTMLElement>,
  ghostLabel?: React.ReactNode,
) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  function App() {
    const ref = useRef<HTMLDivElement | null>(null);
    ref.current = containerEl as HTMLDivElement;
    return React.createElement(DropOverlay, {
      drag,
      containerRef: ref,
      panelEls,
      ghostLabel,
    });
  }
  act(() => {
    root.render(React.createElement(App));
  });
  return {
    host,
    cleanup() {
      act(() => {
        root.unmount();
      });
      host.remove();
      containerEl.remove();
    },
  };
}

describe('DropOverlay — null container ref', () => {
  it('returns null when the container ref is not yet populated', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    function App() {
      const ref = useRef<HTMLDivElement | null>(null);
      return React.createElement(DropOverlay, {
        drag: dragWith({}),
        containerRef: ref,
        panelEls: new Map(),
      });
    }
    act(() => {
      root.render(React.createElement(App));
    });
    expect(host.querySelector('.tilery__drag-ghost')).toBeNull();
    act(() => {
      root.unmount();
    });
    host.remove();
  });
});

describe('DropOverlay — drag ghost', () => {
  it('renders the ghost positioned relative to the container with the label', () => {
    const { container } = buildContainer({ panelId: 'P', tabIds: [] });
    const t = mount(
      dragWith({ x: 200, y: 300 }),
      container,
      new Map(),
      'foo.ts',
    );
    const ghost = t.host.querySelector<HTMLElement>('.tilery__drag-ghost')!;
    expect(ghost).not.toBeNull();
    expect(ghost.textContent).toBe('foo.ts');
    expect(ghost.style.left).toBe('212px'); // 200 - 0 (container left) + 12
    expect(ghost.style.top).toBe('312px');
    t.cleanup();
  });

  it('falls back to "Tab" when no ghostLabel is provided', () => {
    const { container } = buildContainer({ panelId: 'P', tabIds: [] });
    const t = mount(dragWith({}), container, new Map());
    expect(t.host.querySelector('.tilery__drag-ghost')!.textContent).toBe(
      'Tab',
    );
    t.cleanup();
  });
});

describe('DropOverlay — root zones', () => {
  it('uses hoverRootSize for a bottom root drop preview', () => {
    const { container } = buildRootContainer();
    const t = mount(
      dragWith({ hoverRootZone: 'bottom', hoverRootSize: 100 / 3 }),
      container,
      new Map(),
    );
    const overlay = t.host.querySelector<HTMLElement>('.tilery__drop-overlay')!;
    expect(overlay.getAttribute('data-root-zone')).toBe('true');
    expect(overlay.getAttribute('data-zone')).toBe('bottom');
    expect(parseFloat(overlay.style.top)).toBeCloseTo(250);
    expect(parseFloat(overlay.style.height)).toBeCloseTo(100);
    t.cleanup();
  });

  it('uses hoverRootSize for a right root drop preview', () => {
    const { container } = buildRootContainer();
    const t = mount(
      dragWith({ hoverRootZone: 'right', hoverRootSize: 25 }),
      container,
      new Map(),
    );
    const overlay = t.host.querySelector<HTMLElement>('.tilery__drop-overlay')!;
    expect(overlay.getAttribute('data-zone')).toBe('right');
    expect(overlay.style.left).toBe('550px');
    expect(overlay.style.width).toBe('150px');
    t.cleanup();
  });

  it('falls back to half-size when the root hover has no preview size', () => {
    const { container } = buildRootContainer();
    const t = mount(dragWith({ hoverRootZone: 'top' }), container, new Map());
    const overlay = t.host.querySelector<HTMLElement>('.tilery__drop-overlay')!;
    expect(overlay.style.top).toBe('50px');
    expect(overlay.style.height).toBe('150px');
    t.cleanup();
  });

  it('does not render a root drop preview without the main layer', () => {
    const { container } = buildContainer({ panelId: 'P', tabIds: ['T'] });
    const t = mount(
      dragWith({ hoverRootZone: 'bottom', hoverRootSize: 100 / 3 }),
      container,
      new Map(),
    );
    expect(t.host.querySelector('.tilery__drop-overlay')).toBeNull();
    t.cleanup();
  });
});

describe('DropOverlay — panel zones', () => {
  function setupHover(zone: NonNullable<TileryDragState['hoverZone']>) {
    const { container, panel } = buildContainer({
      panelId: 'P',
      tabIds: ['T'],
    });
    return {
      drag: dragWith({ hoverPanelId: 'P', hoverZone: zone }),
      container,
      panel,
    };
  }

  it('paints the left half for a left-zone hover', () => {
    const s = setupHover('left');
    const t = mount(s.drag, s.container, new Map([['P', s.panel]]));
    const overlay = t.host.querySelector<HTMLElement>('.tilery__drop-overlay')!;
    expect(overlay.getAttribute('data-zone')).toBe('left');
    // Content area shaves the 0px gap; with tab bar 32px tall, content top
    // is at y=32, height=768. Left zone covers width/2=250.
    expect(overlay.style.width).toBe('250px');
    expect(overlay.style.left).toBe('500px');
    t.cleanup();
  });

  it('paints the right half for a right-zone hover', () => {
    const s = setupHover('right');
    const t = mount(s.drag, s.container, new Map([['P', s.panel]]));
    const overlay = t.host.querySelector<HTMLElement>('.tilery__drop-overlay')!;
    expect(overlay.style.left).toBe('750px');
    expect(overlay.style.width).toBe('250px');
    t.cleanup();
  });

  it('paints the top half (under the tab bar) for a top-zone hover', () => {
    const s = setupHover('top');
    const t = mount(s.drag, s.container, new Map([['P', s.panel]]));
    const overlay = t.host.querySelector<HTMLElement>('.tilery__drop-overlay')!;
    expect(overlay.style.top).toBe('32px');
    expect(overlay.style.height).toBe('384px'); // 768 / 2
    t.cleanup();
  });

  it('paints the bottom half for a bottom-zone hover', () => {
    const s = setupHover('bottom');
    const t = mount(s.drag, s.container, new Map([['P', s.panel]]));
    const overlay = t.host.querySelector<HTMLElement>('.tilery__drop-overlay')!;
    expect(overlay.style.top).toBe('416px'); // tab bar bottom + content/2
    expect(overlay.style.height).toBe('384px');
    t.cleanup();
  });

  it('paints the full content rect for a center-zone hover', () => {
    const s = setupHover('center');
    const t = mount(s.drag, s.container, new Map([['P', s.panel]]));
    const overlay = t.host.querySelector<HTMLElement>('.tilery__drop-overlay')!;
    expect(overlay.getAttribute('data-zone')).toBe('center');
    expect(overlay.style.width).toBe('500px');
    expect(overlay.style.height).toBe('768px');
    t.cleanup();
  });

  it('no panel element → no overlay (panelEls map miss)', () => {
    const { container } = buildContainer({ panelId: 'P', tabIds: ['T'] });
    const t = mount(
      dragWith({ hoverPanelId: 'P', hoverZone: 'center' }),
      container,
      new Map(), // empty — Tilery hasn't registered the panel yet
    );
    expect(t.host.querySelector('.tilery__drop-overlay')).toBeNull();
    // The ghost still renders though.
    expect(t.host.querySelector('.tilery__drag-ghost')).not.toBeNull();
    t.cleanup();
  });

  it('uses panelRect.top + gap as the content-top when the panel has no tab bar', () => {
    // Construct a panel that doesn't contain a tab bar — exercises the
    // `tabBar ? ... : panelRect.top + gap` false branch.
    const container = document.createElement('div');
    container.className = 'tilery__inner';
    document.body.appendChild(container);
    stubRect(container, { left: 0, top: 0, width: 1000, height: 800 });
    const panel = document.createElement('div');
    panel.className = 'tilery__panel';
    panel.setAttribute('data-panel-id', 'P');
    stubRect(panel, { left: 0, top: 0, width: 500, height: 400 });
    container.appendChild(panel);
    const t = mount(
      dragWith({ hoverPanelId: 'P', hoverZone: 'center' }),
      container,
      new Map([['P', panel]]),
    );
    const overlay = t.host.querySelector<HTMLElement>('.tilery__drop-overlay')!;
    // No tab bar → content top = panelRect.top + gap = 0 + 0 = 0.
    expect(overlay.style.top).toBe('0px');
    t.cleanup();
  });

  it('treats a non-finite border width as a zero gap', () => {
    // Stub getComputedStyle so .borderTopWidth returns something that
    // parseFloat can't parse — exercises the `Number.isFinite(n) ? n : 0`
    // fallback in readPanelGap.
    const { container, panel } = buildContainer({
      panelId: 'P',
      tabIds: ['T1'],
    });
    const originalGCS = globalThis.getComputedStyle;
    globalThis.getComputedStyle = ((el: Element) => {
      if (el === panel) {
        return { borderTopWidth: 'auto' } as CSSStyleDeclaration;
      }
      return originalGCS(el);
    }) as typeof getComputedStyle;
    try {
      const t = mount(
        dragWith({ hoverPanelId: 'P', hoverZone: 'center' }),
        container,
        new Map([['P', panel]]),
      );
      expect(
        t.host.querySelector<HTMLElement>('.tilery__drop-overlay'),
      ).not.toBeNull();
      t.cleanup();
    } finally {
      globalThis.getComputedStyle = originalGCS;
    }
  });

  it('honors a finite border width as the panel gap', () => {
    // The other branch: borderTopWidth resolves to a finite number, so
    // readPanelGap returns it as-is.
    const { container, panel } = buildContainer({
      panelId: 'P',
      tabIds: ['T1'],
    });
    const originalGCS = globalThis.getComputedStyle;
    globalThis.getComputedStyle = ((el: Element) => {
      if (el === panel) {
        return { borderTopWidth: '4px' } as CSSStyleDeclaration;
      }
      return originalGCS(el);
    }) as typeof getComputedStyle;
    try {
      const t = mount(
        dragWith({ hoverPanelId: 'P', hoverZone: 'left' }),
        container,
        new Map([['P', panel]]),
      );
      const overlay = t.host.querySelector<HTMLElement>(
        '.tilery__drop-overlay',
      )!;
      // The 4px gap shaves both sides; content area starts at left+4.
      expect(overlay.style.left).toBe('504px');
      t.cleanup();
    } finally {
      globalThis.getComputedStyle = originalGCS;
    }
  });
});

describe('DropOverlay — tab bar insertion bar', () => {
  it('renders an insertion bar BEFORE a given tab', () => {
    const { container, panel } = buildContainer({
      panelId: 'P',
      tabIds: ['T1', 'T2', 'T3'],
    });
    const t = mount(
      dragWith({
        hoverTabBar: {
          panelId: 'P',
          hit: { kind: 'before', tabId: 'T2' },
        },
      }),
      container,
      new Map([['P', panel]]),
    );
    const bar = t.host.querySelector<HTMLElement>('.tilery__drop-insertion');
    expect(bar).not.toBeNull();
    // T2 starts at x=600. CSS translates the bar by half its own width.
    expect(bar!.style.left).toBe('600px');
    t.cleanup();
  });

  it('renders an insertion bar AFTER a given tab', () => {
    const { container, panel } = buildContainer({
      panelId: 'P',
      tabIds: ['T1', 'T2', 'T3'],
    });
    const t = mount(
      dragWith({
        hoverTabBar: { panelId: 'P', hit: { kind: 'after', tabId: 'T2' } },
      }),
      container,
      new Map([['P', panel]]),
    );
    const bar = t.host.querySelector<HTMLElement>('.tilery__drop-insertion')!;
    // T2 ends at x=700.
    expect(bar.style.left).toBe('700px');
    t.cleanup();
  });

  it('renders an append bar at the right edge of the last tab', () => {
    const { container, panel } = buildContainer({
      panelId: 'P',
      tabIds: ['T1', 'T2'],
    });
    const t = mount(
      dragWith({
        hoverTabBar: {
          panelId: 'P',
          hit: { kind: 'append' },
        },
      }),
      container,
      new Map([['P', panel]]),
    );
    const bar = t.host.querySelector<HTMLElement>('.tilery__drop-insertion')!;
    // Last tab T2 ends at x=700.
    expect(bar.style.left).toBe('700px');
    t.cleanup();
  });

  it('renders an append bar near the bar start when the bar is empty', () => {
    const { container, panel } = buildContainer({ panelId: 'P', tabIds: [] });
    const t = mount(
      dragWith({
        hoverTabBar: {
          panelId: 'P',
          hit: { kind: 'append' },
        },
      }),
      container,
      new Map([['P', panel]]),
    );
    const bar = t.host.querySelector<HTMLElement>('.tilery__drop-insertion')!;
    // barRect.left (500) + 2 = 502.
    expect(bar.style.left).toBe('502px');
    t.cleanup();
  });

  it('falls back to the bar left when the targeted tab element is missing (before)', () => {
    // hit references a tabId that doesn't exist in the DOM (e.g. the tab
    // was removed between drag math and overlay render). The bar should
    // still render, but at the bar's left edge.
    const { container, panel } = buildContainer({
      panelId: 'P',
      tabIds: ['T1'],
    });
    const t = mount(
      dragWith({
        hoverTabBar: {
          panelId: 'P',
          hit: { kind: 'before', tabId: 'GONE' },
        },
      }),
      container,
      new Map([['P', panel]]),
    );
    const bar = t.host.querySelector<HTMLElement>('.tilery__drop-insertion')!;
    // barRect.left = 500.
    expect(bar.style.left).toBe('500px');
    t.cleanup();
  });

  it('falls back to the bar left when the targeted tab element is missing (after)', () => {
    const { container, panel } = buildContainer({
      panelId: 'P',
      tabIds: ['T1'],
    });
    const t = mount(
      dragWith({
        hoverTabBar: {
          panelId: 'P',
          hit: { kind: 'after', tabId: 'GONE' },
        },
      }),
      container,
      new Map([['P', panel]]),
    );
    const bar = t.host.querySelector<HTMLElement>('.tilery__drop-insertion')!;
    expect(bar.style.left).toBe('500px');
    t.cleanup();
  });

  it('returns null when the targeted panel element is not in the DOM', () => {
    const { container } = buildContainer({ panelId: 'P', tabIds: ['T1'] });
    // The container's panel matches but our hover targets a different id.
    const t = mount(
      dragWith({
        hoverTabBar: {
          panelId: 'OTHER',
          hit: { kind: 'append' },
        },
      }),
      container,
      new Map(),
    );
    expect(t.host.querySelector('.tilery__drop-insertion')).toBeNull();
    t.cleanup();
  });

  it('uses cssEscape for ids that contain regex-meta characters', () => {
    // A panel id with characters that would otherwise break a CSS selector.
    const { container, panel } = buildContainer({
      panelId: 'p.with:special',
      tabIds: ['T1'],
    });
    const t = mount(
      dragWith({
        hoverTabBar: {
          panelId: 'p.with:special',
          hit: { kind: 'before', tabId: 'T1' },
        },
      }),
      container,
      new Map([['p.with:special', panel]]),
    );
    expect(
      t.host.querySelector<HTMLElement>('.tilery__drop-insertion'),
    ).not.toBeNull();
    t.cleanup();
  });

  it('falls back to a manual regex when CSS.escape is unavailable', () => {
    // Older runtimes (and a handful of jsdom builds) don't expose
    // CSS.escape. The component should still work — this fully removes
    // the global so `typeof CSS !== 'undefined'` evaluates false and the
    // regex fallback runs.
    const g = globalThis as unknown as {
      CSS?: { escape?: (s: string) => string };
    };
    const original = g.CSS;
    delete g.CSS;
    try {
      const { container, panel } = buildContainer({
        panelId: 'p.with:special',
        tabIds: ['T1'],
      });
      const t = mount(
        dragWith({
          hoverTabBar: {
            panelId: 'p.with:special',
            hit: { kind: 'before', tabId: 'T1' },
          },
        }),
        container,
        new Map([['p.with:special', panel]]),
      );
      expect(
        t.host.querySelector<HTMLElement>('.tilery__drop-insertion'),
      ).not.toBeNull();
      t.cleanup();
    } finally {
      g.CSS = original;
    }
  });
});
