import { describe, expect, it } from 'vite-plus/test';

import type {
  TileryInset,
  TileryLayoutState,
  TileryLayoutTree,
  TileryPanelState,
} from '../types';
import {
  tileryBuildLayoutTreeFromPanels,
  tileryClampLayoutDividerPosition,
  tileryDeriveLayoutDividers,
  tileryDeriveLayoutInsets,
  tileryInsetToRect,
  tileryPanelOrderFromLayout,
  tileryRectToInset,
  tileryRemovePanelFromLayout,
  tileryResizeLayoutDivider,
  tilerySplitPanelInLayout,
  tilerySwapPanelsInLayout,
  tilerySyncLayoutPanels,
} from './layout-tree';

function panel(id: string, inset: TileryInset): TileryPanelState {
  return {
    id,
    kind: 'tiled',
    inset,
    tabs: [],
    activeTabId: null,
  };
}

const full = { top: 0, right: 0, bottom: 0, left: 0 };

describe('layout-tree geometry conversion', () => {
  it('converts between public insets and internal rects', () => {
    const inset = { top: 5, right: 10, bottom: 15, left: 20 };
    const rect = tileryInsetToRect(inset);
    expect(rect).toEqual({ top: 5, right: 90, bottom: 85, left: 20 });
    expect(tileryRectToInset(rect)).toEqual(inset);
  });
});

describe('tileryBuildLayoutTreeFromPanels', () => {
  it('returns null for empty or non-tiling inputs', () => {
    expect(tileryBuildLayoutTreeFromPanels([])).toBeNull();
    expect(tileryPanelOrderFromLayout(null)).toEqual([]);
    expect(tileryDeriveLayoutInsets(null)).toEqual({});
    expect(
      tileryBuildLayoutTreeFromPanels([
        panel('A', { top: 0, right: 50, bottom: 50, left: 0 }),
      ]),
    ).toBeNull();
    expect(
      tileryBuildLayoutTreeFromPanels([
        panel('A', { top: 0, right: 60, bottom: 0, left: 0 }),
        panel('B', { top: 0, right: 0, bottom: 0, left: 50 }),
      ]),
    ).toBeNull();
  });

  it('builds a leaf for a full-size single panel', () => {
    expect(tileryBuildLayoutTreeFromPanels([panel('A', full)])).toEqual({
      kind: 'panel',
      panelId: 'A',
    });
  });

  it('builds a horizontal split for side-by-side panels', () => {
    const layout = tileryBuildLayoutTreeFromPanels([
      panel('A', { top: 0, right: 60, bottom: 0, left: 0 }),
      panel('B', { top: 0, right: 0, bottom: 0, left: 40 }),
    ]);
    expect(layout).toMatchObject({
      kind: 'split',
      direction: 'horizontal',
      sizePercent: 40,
      first: { kind: 'panel', panelId: 'A' },
      second: { kind: 'panel', panelId: 'B' },
    });
  });

  it('builds a vertical split for stacked panels', () => {
    const layout = tileryBuildLayoutTreeFromPanels([
      panel('T', { top: 0, right: 0, bottom: 70, left: 0 }),
      panel('B', { top: 30, right: 0, bottom: 0, left: 0 }),
    ]);
    expect(layout).toMatchObject({
      kind: 'split',
      direction: 'vertical',
      sizePercent: 30,
      first: { kind: 'panel', panelId: 'T' },
      second: { kind: 'panel', panelId: 'B' },
    });
  });

  it('round-trips an L-shape as a nested tree and flat public insets', () => {
    const panels = [
      panel('sidebar', { top: 0, right: 60, bottom: 0, left: 0 }),
      panel('editor', { top: 0, right: 0, bottom: 50, left: 40 }),
      panel('terminal', { top: 50, right: 0, bottom: 0, left: 40 }),
    ];
    const layout = tileryBuildLayoutTreeFromPanels(panels);

    expect(layout).toMatchObject({
      kind: 'split',
      direction: 'horizontal',
      sizePercent: 40,
      first: { kind: 'panel', panelId: 'sidebar' },
      second: {
        kind: 'split',
        direction: 'vertical',
        sizePercent: 50,
      },
    });
    expect(tileryPanelOrderFromLayout(layout)).toEqual([
      'sidebar',
      'editor',
      'terminal',
    ]);
    expect(tileryDeriveLayoutInsets(layout)).toEqual({
      sidebar: { top: 0, right: 60, bottom: 0, left: 0 },
      editor: { top: 0, right: 0, bottom: 50, left: 40 },
      terminal: { top: 50, right: 0, bottom: 0, left: 40 },
    });
  });
});

describe('tileryDeriveLayoutDividers', () => {
  it('derives tree dividers for a 2x2 grid without 2D junction handles', () => {
    const layout = tileryBuildLayoutTreeFromPanels([
      panel('TL', { top: 0, right: 50, bottom: 50, left: 0 }),
      panel('TR', { top: 0, right: 0, bottom: 50, left: 50 }),
      panel('BL', { top: 50, right: 50, bottom: 0, left: 0 }),
      panel('BR', { top: 50, right: 0, bottom: 0, left: 50 }),
    ]);
    const dividers = tileryDeriveLayoutDividers(layout);

    expect(tileryDeriveLayoutDividers(null)).toEqual([]);
    expect(dividers).toHaveLength(3);
    expect(dividers.map((divider) => divider.splitId)).toEqual([
      'horizontal:BL,TL|BR,TR',
      'vertical:TL|BL',
      'vertical:TR|BR',
    ]);
    expect(dividers.map((divider) => divider.orientation)).toEqual([
      'vertical',
      'horizontal',
      'horizontal',
    ]);
    expect(dividers.map((divider) => [divider.start, divider.end])).toEqual([
      [0, 100],
      [0, 50],
      [50, 100],
    ]);
  });
});

describe('tilerySyncLayoutPanels', () => {
  it('syncs flat panel state and panel order from the tree', () => {
    const layout = tileryBuildLayoutTreeFromPanels([
      panel('A', { top: 0, right: 50, bottom: 0, left: 0 }),
      panel('B', { top: 0, right: 0, bottom: 0, left: 50 }),
    ]);
    const state: TileryLayoutState = {
      panels: {
        B: panel('B', full),
        A: panel('A', full),
        ghost: panel('ghost', full),
      },
      panelOrder: ['ghost', 'B', 'A'],
      tabs: {},
      layout,
    };

    const next = tilerySyncLayoutPanels(state);
    expect(next.panelOrder).toEqual(['A', 'B']);
    expect(next.panels.A!.inset).toEqual({
      top: 0,
      right: 50,
      bottom: 0,
      left: 0,
    });
    expect(next.panels.B!.inset).toEqual({
      top: 0,
      right: 0,
      bottom: 0,
      left: 50,
    });
    expect(next.panels.ghost!.inset).toEqual(full);
  });

  it('stores null when syncing without a layout', () => {
    const state: TileryLayoutState = {
      panels: { A: panel('A', full) },
      panelOrder: ['A'],
      tabs: {},
    };
    expect(tilerySyncLayoutPanels(state).layout).toBeNull();
  });

  it('drops missing layout leaves from the derived panel order', () => {
    const state: TileryLayoutState = {
      panels: { A: panel('A', full) },
      panelOrder: ['A'],
      tabs: {},
      layout: { kind: 'panel', panelId: 'missing' },
    };
    const next = tilerySyncLayoutPanels(state);
    expect(next.panelOrder).toEqual([]);
    expect(next.panels.A!.inset).toEqual(full);
  });
});

describe('tree panel mutations', () => {
  it('splits a leaf in all four directions', () => {
    const root: TileryLayoutTree = { kind: 'panel', panelId: 'A' };

    expect(
      tileryDeriveLayoutInsets(
        tilerySplitPanelInLayout(root, 'A', 'L', 'left', 30),
      ),
    ).toEqual({
      L: { top: 0, right: 70, bottom: 0, left: 0 },
      A: { top: 0, right: 0, bottom: 0, left: 30 },
    });
    expect(
      tileryDeriveLayoutInsets(
        tilerySplitPanelInLayout(root, 'A', 'R', 'right', 25),
      ),
    ).toEqual({
      A: { top: 0, right: 25, bottom: 0, left: 0 },
      R: { top: 0, right: 0, bottom: 0, left: 75 },
    });
    expect(
      tileryDeriveLayoutInsets(
        tilerySplitPanelInLayout(root, 'A', 'T', 'top', 40),
      ),
    ).toEqual({
      T: { top: 0, right: 0, bottom: 60, left: 0 },
      A: { top: 40, right: 0, bottom: 0, left: 0 },
    });
    expect(
      tileryDeriveLayoutInsets(
        tilerySplitPanelInLayout(root, 'A', 'B', 'bottom', 35),
      ),
    ).toEqual({
      A: { top: 0, right: 0, bottom: 35, left: 0 },
      B: { top: 65, right: 0, bottom: 0, left: 0 },
    });
  });

  it('returns null when splitting a missing panel or missing layout', () => {
    const root: TileryLayoutTree = { kind: 'panel', panelId: 'A' };
    expect(tilerySplitPanelInLayout(null, 'A', 'B', 'right', 50)).toBeNull();
    expect(
      tilerySplitPanelInLayout(root, 'missing', 'B', 'right', 50),
    ).toBeNull();
  });

  it('collapses the opposite sibling when removing a panel leaf', () => {
    const layout = tileryBuildLayoutTreeFromPanels([
      panel('L', { top: 0, right: 50, bottom: 0, left: 0 }),
      panel('R', { top: 0, right: 0, bottom: 0, left: 50 }),
    ])!;

    expect(tileryRemovePanelFromLayout(null, 'L')).toBeNull();
    expect(tileryRemovePanelFromLayout(layout, 'missing')).toBe(layout);
    expect(
      tileryRemovePanelFromLayout({ kind: 'panel', panelId: 'L' }, 'L'),
    ).toBeNull();
    expect(tileryRemovePanelFromLayout(layout, 'L')).toEqual({
      kind: 'panel',
      panelId: 'R',
    });
    expect(tileryRemovePanelFromLayout(layout, 'R')).toEqual({
      kind: 'panel',
      panelId: 'L',
    });
  });

  it('preserves an ancestor split when removing inside a nested child split', () => {
    const layout = tileryBuildLayoutTreeFromPanels([
      panel('TL', { top: 0, right: 50, bottom: 50, left: 0 }),
      panel('TR', { top: 0, right: 0, bottom: 50, left: 50 }),
      panel('BL', { top: 50, right: 50, bottom: 0, left: 0 }),
      panel('BR', { top: 50, right: 0, bottom: 0, left: 50 }),
    ])!;

    expect(
      tileryPanelOrderFromLayout(tileryRemovePanelFromLayout(layout, 'TL')),
    ).toEqual(['BL', 'TR', 'BR']);
  });

  it('swaps panel leaves while preserving split geometry', () => {
    const layout = tileryBuildLayoutTreeFromPanels([
      panel('L', { top: 0, right: 50, bottom: 0, left: 0 }),
      panel('R', { top: 0, right: 0, bottom: 0, left: 50 }),
    ])!;

    expect(tilerySwapPanelsInLayout(null, 'L', 'R')).toBeNull();
    expect(
      tileryPanelOrderFromLayout(tilerySwapPanelsInLayout(layout, 'L', 'R')),
    ).toEqual(['R', 'L']);
    expect(
      tileryPanelOrderFromLayout(
        tilerySwapPanelsInLayout(layout, 'L', 'missing'),
      ),
    ).toEqual(['missing', 'R']);
  });
});

describe('tree divider resize', () => {
  it('clamps and resizes a root split', () => {
    const layout = tileryBuildLayoutTreeFromPanels([
      panel('L', { top: 0, right: 60, bottom: 0, left: 0 }),
      panel('R', { top: 0, right: 0, bottom: 0, left: 40 }),
    ])!;
    const divider = tileryDeriveLayoutDividers(layout)[0]!;

    expect(
      tileryClampLayoutDividerPosition(layout, divider.splitId!, 5, 10),
    ).toBe(10);
    expect(
      tileryClampLayoutDividerPosition(layout, divider.splitId!, 95, 10),
    ).toBe(90);
    expect(
      tileryClampLayoutDividerPosition(layout, divider.splitId!, 45, 10),
    ).toBe(45);
    expect(
      tileryClampLayoutDividerPosition(layout, 'missing', 45, 10),
    ).toBeNull();
    expect(
      tileryClampLayoutDividerPosition(null, divider.splitId!, 45, 10),
    ).toBeNull();

    const resized = tileryResizeLayoutDivider(layout, divider.splitId!, 55);
    const insets = tileryDeriveLayoutInsets(resized);
    expect(insets.L!.right).toBeCloseTo(45);
    expect(insets.R!.left).toBeCloseTo(55);
    expect(tileryResizeLayoutDivider(layout, 'missing', 55)).toBe(layout);
  });

  it('resizes a nested split in its local coordinate space', () => {
    const layout = tileryBuildLayoutTreeFromPanels([
      panel('sidebar', { top: 0, right: 60, bottom: 0, left: 0 }),
      panel('editor', { top: 0, right: 0, bottom: 50, left: 40 }),
      panel('terminal', { top: 50, right: 0, bottom: 0, left: 40 }),
    ])!;
    const horizontal = tileryDeriveLayoutDividers(layout).find(
      (divider) => divider.orientation === 'horizontal',
    )!;

    const resized = tileryResizeLayoutDivider(layout, horizontal.splitId!, 75);
    expect(tileryDeriveLayoutInsets(resized)).toEqual({
      sidebar: { top: 0, right: 60, bottom: 0, left: 0 },
      editor: { top: 0, right: 0, bottom: 25, left: 40 },
      terminal: { top: 75, right: 0, bottom: 0, left: 40 },
    });
  });

  it('keeps the current position when the min size cannot fit', () => {
    const layout = tileryBuildLayoutTreeFromPanels([
      panel('T', { top: 0, right: 0, bottom: 50, left: 0 }),
      panel('B', { top: 50, right: 0, bottom: 0, left: 0 }),
    ])!;
    const divider = tileryDeriveLayoutDividers(layout)[0]!;

    expect(
      tileryClampLayoutDividerPosition(layout, divider.splitId!, 80, 60),
    ).toBe(50);
  });

  it('does not change a zero-span split when calculating a local size', () => {
    const layout: TileryLayoutTree = {
      kind: 'split',
      id: 'root',
      direction: 'horizontal',
      sizePercent: 0,
      first: {
        kind: 'split',
        id: 'zero',
        direction: 'horizontal',
        sizePercent: 25,
        first: { kind: 'panel', panelId: 'A' },
        second: { kind: 'panel', panelId: 'B' },
      },
      second: { kind: 'panel', panelId: 'C' },
    };

    const resized = tileryResizeLayoutDivider(layout, 'zero', 10);
    const nested = (resized as Extract<TileryLayoutTree, { kind: 'split' }>)
      .first as Extract<TileryLayoutTree, { kind: 'split' }>;
    expect(nested.sizePercent).toBe(25);
  });
});
