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
  tileryNormalizeLayoutState,
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
      children: [
        { kind: 'panel', panelId: 'A', size: 40 },
        { kind: 'panel', panelId: 'B', size: 60 },
      ],
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
      children: [
        { kind: 'panel', panelId: 'T', size: 30 },
        { kind: 'panel', panelId: 'B', size: 70 },
      ],
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
      children: [
        { kind: 'panel', panelId: 'sidebar', size: 40 },
        {
          kind: 'split',
          direction: 'vertical',
          size: 60,
          children: [
            { kind: 'panel', panelId: 'editor', size: 50 },
            { kind: 'panel', panelId: 'terminal', size: 50 },
          ],
        },
      ],
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
      'horizontal:BL,TL|BR,TR#0',
      'vertical:TL|BL#0',
      'vertical:TR|BR#0',
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

describe('tileryDeriveLayoutInsets', () => {
  it('normalizes over-allocated and zero-sized child items', () => {
    const overallocated = tileryDeriveLayoutInsets({
      kind: 'split',
      id: 'overallocated',
      direction: 'horizontal',
      children: [
        { kind: 'panel', panelId: 'A', size: 100 },
        { kind: 'panel', panelId: 'B' },
      ],
    });
    expect(overallocated.A).toMatchObject({ top: 0, bottom: 0, left: 0 });
    expect(overallocated.A!.right).toBeCloseTo(100 / 101);
    expect(overallocated.B).toMatchObject({ top: 0, right: 0, bottom: 0 });
    expect(overallocated.B!.left).toBeCloseTo(10000 / 101);

    expect(
      tileryDeriveLayoutInsets({
        kind: 'split',
        id: 'zeroes',
        direction: 'horizontal',
        children: [
          { kind: 'panel', panelId: 'A', size: 0 },
          { kind: 'panel', panelId: 'B', size: 0 },
        ],
      }),
    ).toEqual({
      A: { top: 0, right: 50, bottom: 0, left: 0 },
      B: { top: 0, right: 0, bottom: 0, left: 50 },
    });
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

  it('normalizes missing child sizes and flattens same-direction splits', () => {
    const state: TileryLayoutState = {
      panels: {
        A: panel('A', full),
        B: panel('B', full),
        C: panel('C', full),
      },
      panelOrder: ['A', 'B', 'C'],
      tabs: {},
      layout: {
        kind: 'split',
        id: 'root',
        direction: 'horizontal',
        children: [
          { kind: 'panel', panelId: 'A', size: 50 },
          {
            kind: 'split',
            id: 'nested',
            direction: 'horizontal',
            size: 50,
            children: [
              { kind: 'panel', panelId: 'B' },
              { kind: 'panel', panelId: 'C' },
            ],
          },
        ],
      },
    };

    const next = tilerySyncLayoutPanels(state);

    expect(next.layout).toMatchObject({
      kind: 'split',
      children: [
        { kind: 'panel', panelId: 'A', size: 50 },
        { kind: 'panel', panelId: 'B', size: 25 },
        { kind: 'panel', panelId: 'C', size: 25 },
      ],
    });
    expect(next.panels).toMatchObject({
      A: { inset: { top: 0, right: 50, bottom: 0, left: 0 } },
      B: { inset: { top: 0, right: 25, bottom: 0, left: 50 } },
      C: { inset: { top: 0, right: 0, bottom: 0, left: 75 } },
    });
  });

  it('keeps an empty persisted split stable while deriving no panels', () => {
    const state: TileryLayoutState = {
      panels: { A: panel('A', full) },
      panelOrder: ['A'],
      tabs: {},
      layout: {
        kind: 'split',
        id: 'empty',
        direction: 'horizontal',
        children: [],
      },
    };

    const next = tilerySyncLayoutPanels(state);

    expect(next.layout).toEqual(state.layout);
    expect(next.panelOrder).toEqual([]);
    expect(next.panels.A!.inset).toEqual(full);
  });

  it('normalizes non-tiling legacy state to an explicit null layout', () => {
    const state: TileryLayoutState = {
      panels: {
        A: panel('A', { top: 0, right: 60, bottom: 0, left: 0 }),
        B: panel('B', { top: 0, right: 0, bottom: 0, left: 60 }),
      },
      panelOrder: ['A', 'B'],
      tabs: {},
    };

    const next = tileryNormalizeLayoutState(state);
    expect(next).not.toBe(state);
    expect(next.layout).toBeNull();
    expect(next.panelOrder).toEqual(['A', 'B']);
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

  it('resizes a nested split using the split axis even when the other axis is zero', () => {
    const layout: TileryLayoutTree = {
      kind: 'split',
      id: 'root',
      direction: 'horizontal',
      children: [
        {
          kind: 'split',
          id: 'zero',
          direction: 'vertical',
          size: 0,
          children: [
            { kind: 'panel', panelId: 'A', size: 25 },
            { kind: 'panel', panelId: 'B', size: 75 },
          ],
        },
        { kind: 'panel', panelId: 'C', size: 100 },
      ],
    };

    const resized = tileryResizeLayoutDivider(layout, 'zero#0', 10);
    const nested = (resized as Extract<TileryLayoutTree, { kind: 'split' }>)
      .children[0] as Extract<TileryLayoutTree, { kind: 'split' }>;
    expect(nested.children[0]!.size).toBe(10);
  });
});
