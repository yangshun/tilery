import { describe, expect, it } from 'vite-plus/test';

import type {
  TileryInset,
  TileryLayoutState,
  TileryLayoutTree,
  TileryPanelState,
} from '../types';
import {
  tileryApplyJunctionResize,
  tileryDeriveJunctions,
} from './layout-math';
import {
  tileryBuildLayoutTreeFromPanels,
  tileryClampLayoutDividerPosition,
  tileryDeriveLayoutDividers,
  tileryDeriveLayoutInsets,
  tileryFloatingPanelOrderFromState,
  tileryInsetToRect,
  tileryNormalizeLayoutForContainerResize,
  tileryNormalizeLayoutState,
  tileryPanelOrderFromLayout,
  tileryRectToInset,
  tileryRemovePanelFromLayout,
  tileryResetLayoutDivider,
  tileryResizeLayoutDivider,
  tilerySplitPanelInLayout,
  tilerySwapPanelsInLayout,
  tilerySyncLayoutPanels,
} from './layout-tree';
import { tileryCreateInitialState } from './reducer';

function panel(id: string, inset: TileryInset): TileryPanelState {
  return {
    id,
    kind: 'tiled',
    inset,
    tabs: [],
    activeTabId: null,
  };
}

function stateFromPanels(panels: TileryPanelState[]): TileryLayoutState {
  return {
    panels: Object.fromEntries(panels.map((p) => [p.id, p])),
    panelOrder: panels.map((p) => p.id),
    tabs: {},
    layout: tileryBuildLayoutTreeFromPanels(panels),
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
      resizable: true,
      draggable: true,
      droppable: true,
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

describe('tileryDeriveJunctions', () => {
  it('derives and resizes a T-junction from crossing divider endpoints', () => {
    const state = stateFromPanels([
      panel('sidebar', { top: 0, right: 60, bottom: 0, left: 0 }),
      panel('editor', { top: 0, right: 0, bottom: 50, left: 40 }),
      panel('terminal', { top: 50, right: 0, bottom: 0, left: 40 }),
    ]);

    const junctions = tileryDeriveJunctions(state);
    expect(junctions).toHaveLength(1);
    expect(junctions[0]).toMatchObject({
      kind: 't',
      x: 40,
      y: 50,
    });
    expect(junctions[0]!.verticalDividerId).toContain('horizontal:sidebar');
    expect(junctions[0]!.horizontalDividerId).toContain('vertical:editor');

    const resized = tileryApplyJunctionResize(
      state,
      junctions[0]!,
      { x: 30, y: 70 },
      10,
    );

    expect(resized.panels.sidebar!.inset).toEqual({
      top: 0,
      right: 70,
      bottom: 0,
      left: 0,
    });
    expect(resized.panels.editor!.inset).toEqual({
      top: 0,
      right: 0,
      bottom: 30,
      left: 30,
    });
    expect(resized.panels.terminal!.inset).toEqual({
      top: 70,
      right: 0,
      bottom: 0,
      left: 30,
    });
  });

  it('skips cross junctions and missing divider resize targets', () => {
    const panels = [
      panel('TL', { top: 0, right: 50, bottom: 50, left: 0 }),
      panel('TR', { top: 0, right: 0, bottom: 50, left: 50 }),
      panel('BL', { top: 50, right: 50, bottom: 0, left: 0 }),
      panel('BR', { top: 50, right: 0, bottom: 0, left: 50 }),
    ];
    const flatGrid: TileryLayoutState = {
      panels: Object.fromEntries(panels.map((p) => [p.id, p])),
      panelOrder: panels.map((p) => p.id),
      tabs: {},
      layout: null,
    };
    expect(tileryDeriveJunctions(flatGrid)).toEqual([]);

    const state = stateFromPanels([
      panel('sidebar', { top: 0, right: 60, bottom: 0, left: 0 }),
      panel('editor', { top: 0, right: 0, bottom: 50, left: 40 }),
      panel('terminal', { top: 50, right: 0, bottom: 0, left: 40 }),
    ]);
    const junction = tileryDeriveJunctions(state)[0]!;
    expect(
      tileryApplyJunctionResize(
        state,
        { ...junction, verticalDividerId: 'missing' },
        { x: 30, y: 70 },
      ),
    ).toBe(state);
    expect(
      tileryApplyJunctionResize(
        state,
        { ...junction, horizontalDividerId: 'missing' },
        { x: 30, y: 70 },
      ),
    ).toBe(state);
  });

  it('derives the opposite T orientation and hides junctions while fullscreen', () => {
    const state = stateFromPanels([
      panel('top', { top: 0, right: 0, bottom: 60, left: 0 }),
      panel('left', { top: 40, right: 50, bottom: 0, left: 0 }),
      panel('right', { top: 40, right: 0, bottom: 0, left: 50 }),
    ]);
    expect(tileryDeriveJunctions(state)).toMatchObject([
      { kind: 't', x: 50, y: 40 },
    ]);

    expect(
      tileryDeriveJunctions({
        ...state,
        panels: {
          ...state.panels,
          top: { ...state.panels.top!, fullScreen: true },
        },
      }),
    ).toEqual([]);
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

  it('derives missing floating panel order entries by z-index', () => {
    const state: TileryLayoutState = {
      panels: {
        A: {
          id: 'A',
          kind: 'floating',
          inset: full,
          tabs: [],
          activeTabId: null,
          behavior: { resizable: true, draggable: true, droppable: true },
          floating: {
            bounds: { x: 0, y: 0, width: 20, height: 20 },
            zIndex: 22,
          },
        },
        B: {
          id: 'B',
          kind: 'floating',
          inset: full,
          tabs: [],
          activeTabId: null,
          behavior: { resizable: true, draggable: true, droppable: true },
          floating: {
            bounds: { x: 20, y: 20, width: 20, height: 20 },
            zIndex: 21,
          },
        },
      },
      panelOrder: [],
      tabs: {},
      layout: null,
    };

    expect(tileryFloatingPanelOrderFromState(state)).toEqual(['B', 'A']);
    expect(tilerySyncLayoutPanels(state, null).floatingPanelOrder).toEqual([
      'B',
      'A',
    ]);
  });
});

describe('tileryNormalizeLayoutForContainerResize', () => {
  it('returns nullish layouts unchanged', () => {
    expect(
      tileryNormalizeLayoutForContainerResize(null, {}, 10, { width: 1000 }),
    ).toBeNull();
    expect(
      tileryNormalizeLayoutForContainerResize(undefined, {}, 10, {
        width: 1000,
      }),
    ).toBeUndefined();
  });

  it('returns panel leaves unchanged', () => {
    const layout: TileryLayoutTree = {
      kind: 'panel',
      panelId: 'P',
      resizable: true,
      draggable: true,
      droppable: true,
    };

    expect(
      tileryNormalizeLayoutForContainerResize(
        layout,
        { P: panel('P', full) },
        10,
        { width: 1000 },
      ),
    ).toBe(layout);
  });

  it('preserves proportions when the resized container still satisfies constraints', () => {
    const state = stateFromPanels([
      {
        ...panel('L', { top: 0, right: 70, bottom: 0, left: 0 }),
        minSize: '200px',
      },
      panel('R', { top: 0, right: 0, bottom: 0, left: 30 }),
    ]);

    expect(
      tileryNormalizeLayoutForContainerResize(state.layout, state.panels, 10, {
        width: 1000,
      }),
    ).toBe(state.layout);
  });

  it('expands a pixel-constrained panel after the container resizes', () => {
    const state = stateFromPanels([
      {
        ...panel('L', { top: 0, right: 70, bottom: 0, left: 0 }),
        minSize: '400px',
      },
      panel('R', { top: 0, right: 0, bottom: 0, left: 30 }),
    ]);
    const layout = tileryNormalizeLayoutForContainerResize(
      state.layout,
      state.panels,
      10,
      { width: 1000 },
    );
    const next = tilerySyncLayoutPanels({ ...state, layout }, layout);

    expect(layout).toMatchObject({
      kind: 'split',
      children: [
        { kind: 'panel', panelId: 'L', size: 40 },
        { kind: 'panel', panelId: 'R', size: 60 },
      ],
    });
    expect(next.panels.L!.inset).toEqual({
      top: 0,
      right: 60,
      bottom: 0,
      left: 0,
    });
  });

  it('normalizes nested splits against their direct measured span', () => {
    const state = stateFromPanels([
      panel('L', { top: 0, right: 50, bottom: 0, left: 0 }),
      {
        ...panel('T', { top: 0, right: 0, bottom: 80, left: 50 }),
        minSize: '200px',
      },
      panel('B', { top: 20, right: 0, bottom: 0, left: 50 }),
    ]);
    const layout = tileryNormalizeLayoutForContainerResize(
      state.layout,
      state.panels,
      10,
      { width: 1000, height: 600 },
    );
    const next = tilerySyncLayoutPanels({ ...state, layout }, layout);

    expect(next.panels.L!.inset).toEqual({
      top: 0,
      right: 50,
      bottom: 0,
      left: 0,
    });
    expect(next.panels.T!.inset.top).toBe(0);
    expect(next.panels.T!.inset.bottom).toBeCloseTo(200 / 3);
    expect(next.panels.B!.inset.top).toBeCloseTo(100 / 3);
  });

  it('uses a deterministic fallback when minimum constraints cannot all fit', () => {
    const state = stateFromPanels([
      {
        ...panel('L', { top: 0, right: 50, bottom: 0, left: 0 }),
        minSize: '700px',
      },
      {
        ...panel('R', { top: 0, right: 0, bottom: 0, left: 50 }),
        minSize: '400px',
      },
    ]);
    const layout = tileryNormalizeLayoutForContainerResize(
      state.layout,
      state.panels,
      10,
      { width: 1000 },
    );
    const next = tilerySyncLayoutPanels({ ...state, layout }, layout);

    expect(100 - next.panels.L!.inset.right).toBeCloseTo(700 / 11);
    expect(next.panels.R!.inset.left).toBeCloseTo(700 / 11);
  });

  it('shrinks unconstrained siblings when another child is raised to its minimum', () => {
    const layout: TileryLayoutTree = {
      kind: 'split',
      id: 'root',
      direction: 'horizontal',
      children: [
        { kind: 'panel', panelId: 'L', size: 30 },
        { kind: 'panel', panelId: 'M', size: 70 },
        { kind: 'panel', panelId: 'R', size: 0 },
      ],
    };
    const panels = {
      L: { ...panel('L', full), minSize: 40 },
      M: panel('M', full),
      R: panel('R', full),
    };

    expect(
      tileryNormalizeLayoutForContainerResize(layout, panels, 0, {
        width: 1000,
      }),
    ).toMatchObject({
      kind: 'split',
      children: [
        { kind: 'panel', panelId: 'L', size: 40 },
        { kind: 'panel', panelId: 'M', size: 60 },
        { kind: 'panel', panelId: 'R', size: 0 },
      ],
    });
  });

  it('grows unconstrained siblings when another child is lowered to its maximum', () => {
    const layout: TileryLayoutTree = {
      kind: 'split',
      id: 'root',
      direction: 'horizontal',
      children: [
        { kind: 'panel', panelId: 'L', size: 80 },
        { kind: 'panel', panelId: 'R', size: 20 },
      ],
    };
    const panels = {
      L: { ...panel('L', full), maxSize: 60 },
      R: panel('R', full),
    };

    expect(
      tileryNormalizeLayoutForContainerResize(layout, panels, 0, {
        width: 1000,
      }),
    ).toMatchObject({
      kind: 'split',
      children: [
        { kind: 'panel', panelId: 'L', size: 60 },
        { kind: 'panel', panelId: 'R', size: 40 },
      ],
    });
  });

  it('uses a deterministic fallback when maximum constraints cannot fill the split', () => {
    const layout: TileryLayoutTree = {
      kind: 'split',
      id: 'root',
      direction: 'horizontal',
      children: [
        { kind: 'panel', panelId: 'L', size: 50 },
        { kind: 'panel', panelId: 'R', size: 50 },
      ],
    };
    const panels = {
      L: { ...panel('L', full), maxSize: 0 },
      R: { ...panel('R', full), maxSize: 0 },
    };

    expect(
      tileryNormalizeLayoutForContainerResize(layout, panels, 0, {
        width: 1000,
      }),
    ).toMatchObject({
      kind: 'split',
      children: [
        { kind: 'panel', panelId: 'L', size: 50 },
        { kind: 'panel', panelId: 'R', size: 50 },
      ],
    });
  });

  it('falls back to percentage constraints when the measured axis is unavailable', () => {
    const state = stateFromPanels([
      {
        ...panel('L', { top: 0, right: 70, bottom: 0, left: 0 }),
        minSize: '400px',
      },
      panel('R', { top: 0, right: 0, bottom: 0, left: 30 }),
    ]);

    expect(
      tileryNormalizeLayoutForContainerResize(
        state.layout,
        state.panels,
        10,
        {},
      ),
    ).toBe(state.layout);
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
      resizable: true,
      draggable: true,
      droppable: true,
    });
    expect(tileryRemovePanelFromLayout(layout, 'R')).toEqual({
      kind: 'panel',
      panelId: 'L',
      resizable: true,
      draggable: true,
      droppable: true,
    });
  });

  it('preserves item resize locks when removal collapses a split', () => {
    const layout: TileryLayoutTree = {
      kind: 'split',
      id: 'root',
      direction: 'horizontal',
      children: [
        { kind: 'panel', panelId: 'A', size: 50 },
        { kind: 'panel', panelId: 'B', size: 50, resizable: false },
      ],
    };

    expect(tileryRemovePanelFromLayout(layout, 'A')).toMatchObject({
      kind: 'panel',
      panelId: 'B',
      resizable: false,
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

  it('resets adjacent split children to their default size ratio', () => {
    const layout: TileryLayoutTree = {
      kind: 'split',
      id: 'root',
      direction: 'horizontal',
      children: [
        { kind: 'panel', panelId: 'L', size: 50, defaultSize: 30 },
        { kind: 'panel', panelId: 'R', size: 50, defaultSize: 70 },
      ],
    };
    const resized = tileryResizeLayoutDivider(layout, 'root#0', 60);

    const reset = tileryResetLayoutDivider(resized, 'root#0', 10);

    expect(tileryDeriveLayoutInsets(reset)).toEqual({
      L: { top: 0, right: 70, bottom: 0, left: 0 },
      R: { top: 0, right: 0, bottom: 0, left: 30 },
    });
  });

  it('uses the current size as the reset fallback when defaultSize is omitted', () => {
    const layout = tileryBuildLayoutTreeFromPanels([
      panel('L', { top: 0, right: 40, bottom: 0, left: 0 }),
      panel('R', { top: 0, right: 0, bottom: 0, left: 60 }),
    ])!;
    const divider = tileryDeriveLayoutDividers(layout)[0]!;

    const reset = tileryResetLayoutDivider(layout, divider.splitId!, 10);

    expect(tileryDeriveLayoutInsets(reset)).toEqual({
      L: { top: 0, right: 40, bottom: 0, left: 0 },
      R: { top: 0, right: 0, bottom: 0, left: 60 },
    });
  });

  it('resets vertical split children to their default size ratio', () => {
    const layout: TileryLayoutTree = {
      kind: 'split',
      id: 'root',
      direction: 'vertical',
      children: [
        { kind: 'panel', panelId: 'T', size: 50, defaultSize: 20 },
        { kind: 'panel', panelId: 'B', size: 50, defaultSize: 80 },
      ],
    };

    const reset = tileryResetLayoutDivider(layout, 'root#0', 10);

    expect(tileryDeriveLayoutInsets(reset)).toEqual({
      T: { top: 0, right: 0, bottom: 80, left: 0 },
      B: { top: 20, right: 0, bottom: 0, left: 0 },
    });
  });

  it('no-ops divider reset for missing or degenerate boundaries', () => {
    const layout: TileryLayoutTree = {
      kind: 'split',
      id: 'root',
      direction: 'horizontal',
      children: [
        { kind: 'panel', panelId: 'A', size: 0, defaultSize: 50 },
        { kind: 'panel', panelId: 'B', size: 0, defaultSize: 50 },
        { kind: 'panel', panelId: 'C', size: 100, defaultSize: 100 },
      ],
    };
    const zeroDefaults: TileryLayoutTree = {
      kind: 'split',
      id: 'defaults',
      direction: 'horizontal',
      children: [
        { kind: 'panel', panelId: 'A', size: 50, defaultSize: 0 },
        { kind: 'panel', panelId: 'B', size: 50, defaultSize: 0 },
      ],
    };

    expect(tileryResetLayoutDivider(layout, 'missing', 10)).toBe(layout);
    expect(tileryResetLayoutDivider(layout, 'root#0', 10)).toBe(layout);
    expect(tileryResetLayoutDivider(zeroDefaults, 'defaults#0', 10)).toBe(
      zeroDefaults,
    );
  });

  it('clamps divider reset against panel constraints', () => {
    const layout: TileryLayoutTree = {
      kind: 'split',
      id: 'root',
      direction: 'horizontal',
      children: [
        { kind: 'panel', panelId: 'L', size: 50, defaultSize: 20 },
        { kind: 'panel', panelId: 'R', size: 50, defaultSize: 80 },
      ],
    };
    const panels: Record<string, TileryPanelState> = {
      L: { ...panel('L', full), minSize: 35 },
      R: panel('R', full),
    };

    const reset = tileryResetLayoutDivider(layout, 'root#0', 10, panels);

    expect(tileryDeriveLayoutInsets(reset)).toEqual({
      L: { top: 0, right: 65, bottom: 0, left: 0 },
      R: { top: 0, right: 0, bottom: 0, left: 35 },
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

  it('preserves scaled default sizes when splitting into a same-axis parent', () => {
    const layout: TileryLayoutTree = {
      kind: 'split',
      id: 'root',
      direction: 'horizontal',
      children: [
        { kind: 'panel', panelId: 'A', size: 40, defaultSize: 40 },
        { kind: 'panel', panelId: 'B', size: 60, defaultSize: 60 },
      ],
    };

    const next = tilerySplitPanelInLayout(layout, 'B', 'C', 'left', 25);

    expect(next).toMatchObject({
      kind: 'split',
      direction: 'horizontal',
      children: [
        { kind: 'panel', panelId: 'A', size: 40, defaultSize: 40 },
        { kind: 'panel', panelId: 'C', size: 15, defaultSize: 15 },
        { kind: 'panel', panelId: 'B', size: 45, defaultSize: 45 },
      ],
    });
  });

  it('preserves parent default size when replacing inside a nested child', () => {
    const layout: TileryLayoutTree = {
      kind: 'split',
      id: 'root',
      direction: 'vertical',
      children: [
        {
          kind: 'split',
          id: 'nested',
          direction: 'horizontal',
          size: 60,
          defaultSize: 60,
          children: [
            { kind: 'panel', panelId: 'A', size: 50 },
            { kind: 'panel', panelId: 'B', size: 50 },
          ],
        },
        { kind: 'panel', panelId: 'C', size: 40, defaultSize: 40 },
      ],
    };

    const next = tilerySplitPanelInLayout(layout, 'B', 'D', 'right', 20);

    expect(next).toMatchObject({
      kind: 'split',
      direction: 'vertical',
      children: [
        {
          kind: 'split',
          direction: 'horizontal',
          size: 60,
          defaultSize: 60,
        },
        { kind: 'panel', panelId: 'C', size: 40, defaultSize: 40 },
      ],
    });
  });

  it('leaves nested replacement default size unset when the parent has none', () => {
    const layout: TileryLayoutTree = {
      kind: 'split',
      id: 'root',
      direction: 'vertical',
      children: [
        {
          kind: 'split',
          id: 'nested',
          direction: 'horizontal',
          size: 60,
          children: [
            { kind: 'panel', panelId: 'A', size: 50 },
            { kind: 'panel', panelId: 'B', size: 50 },
          ],
        },
        { kind: 'panel', panelId: 'C', size: 40 },
      ],
    };

    const next = tilerySplitPanelInLayout(layout, 'B', 'D', 'right', 20);
    const split = next as Extract<TileryLayoutTree, { kind: 'split' }>;

    expect(split.children[0]!.defaultSize).toBeUndefined();
  });

  it('omits scaled child default sizes when split input is invalid', () => {
    const layout: TileryLayoutTree = {
      kind: 'split',
      id: 'root',
      direction: 'horizontal',
      children: [
        { kind: 'panel', panelId: 'A', size: 40 },
        { kind: 'panel', panelId: 'B', size: 60, defaultSize: Number.NaN },
      ],
    };

    const next = tilerySplitPanelInLayout(layout, 'B', 'C', 'left', Number.NaN);
    const split = next as Extract<TileryLayoutTree, { kind: 'split' }>;

    expect(split.children).toMatchObject([
      { kind: 'panel', panelId: 'A', size: 40 },
      { kind: 'panel', panelId: 'C', size: 30 },
      { kind: 'panel', panelId: 'B', size: 30 },
    ]);
    expect(split.children[1]!.defaultSize).toBeUndefined();
    expect(split.children[2]!.defaultSize).toBeUndefined();
  });

  it('does not invent a default size when removing into a single child split', () => {
    const layout: TileryLayoutTree = {
      kind: 'split',
      id: 'root',
      direction: 'horizontal',
      children: [
        { kind: 'panel', panelId: 'A', size: 50 },
        { kind: 'panel', panelId: 'B', size: 50 },
      ],
    };

    expect(tileryRemovePanelFromLayout(layout, 'B')).toEqual({
      kind: 'panel',
      panelId: 'A',
      resizable: true,
      draggable: true,
      droppable: true,
    });
  });

  it('preserves a remaining child default size when removing into one child', () => {
    const layout: TileryLayoutTree = {
      kind: 'split',
      id: 'root',
      direction: 'horizontal',
      children: [
        { kind: 'panel', panelId: 'A', size: 50, defaultSize: 30 },
        { kind: 'panel', panelId: 'B', size: 50 },
      ],
    };

    expect(tileryRemovePanelFromLayout(layout, 'B')).toEqual({
      kind: 'panel',
      panelId: 'A',
      defaultSize: 30,
      resizable: true,
      draggable: true,
      droppable: true,
    });
  });

  it('omits scaled default size when a flattened child default is invalid', () => {
    const layout: TileryLayoutTree = {
      kind: 'split',
      id: 'root',
      direction: 'horizontal',
      children: [
        {
          kind: 'split',
          id: 'inner',
          direction: 'horizontal',
          size: 50,
          defaultSize: 50,
          children: [
            {
              kind: 'panel',
              panelId: 'A',
              size: 50,
              defaultSize: Number.NaN,
            },
            { kind: 'panel', panelId: 'B', size: 50 },
          ],
        },
        { kind: 'panel', panelId: 'C', size: 50 },
      ],
    };
    const panels: Record<string, TileryPanelState> = {
      A: panel('A', full),
      B: panel('B', full),
      C: panel('C', full),
    };

    const state = tilerySyncLayoutPanels(
      { panels, panelOrder: [], tabs: {}, layout },
      layout,
    );

    expect(state.layout).toMatchObject({
      kind: 'split',
      direction: 'horizontal',
      children: [
        { kind: 'panel', panelId: 'A', size: 25 },
        { kind: 'panel', panelId: 'B', size: 25, defaultSize: 25 },
        { kind: 'panel', panelId: 'C', size: 50 },
      ],
    });
    const normalized = state.layout as Extract<
      TileryLayoutTree,
      { kind: 'split' }
    >;
    expect(normalized.children[0]!.defaultSize).toBeUndefined();
  });
});

describe('tilerySyncLayoutPanels edge ordering without a tiled layout', () => {
  it('resyncs a stale edge order while the floating order is unchanged', () => {
    const base = tileryCreateInitialState({
      type: 'root',
      main: { type: 'empty' },
      edges: {
        left: {
          type: 'edgePanel',
          id: 'E',
          size: 20,
          tabs: [{ id: 'e', data: {} }],
        },
      },
    });
    expect(base.layout).toBeNull();

    // Corrupt only the edge order; the floating order ([]) already matches.
    const stale = { ...base, edgePanelOrder: [] };
    const synced = tilerySyncLayoutPanels(stale, null);
    expect(synced.edgePanelOrder).toEqual(['E']);
  });
});
