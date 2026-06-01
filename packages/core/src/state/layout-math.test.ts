import { describe, expect, it } from 'vite-plus/test';
import {
  tileryApplyDividerResize,
  tileryApplyJunctionResize,
  tileryClampDividerPosition,
  tileryDeriveDividers,
  tileryDeriveJunctions,
  tileryFindRemovalFillers,
  tileryPanelBottom,
  tileryPanelHeight,
  tileryPanelLeft,
  tileryPanelRight,
  tileryPanelTop,
  tileryPanelWidth,
  tileryRectsOverlap,
  tilerySplitFitsPanelConstraints,
  tilerySplitFitsMin,
  tilerySplitInset,
} from './layout-math';
import { tileryCreateInitialState, tileryReducer } from './reducer';
import { createStateFromPanels } from './test-helpers';
import type {
  TileryDirection,
  TileryLayoutState,
  TileryPanelState,
} from '../types';

const fullInset = { top: 0, right: 0, bottom: 0, left: 0 };

describe('tilerySplitInset', () => {
  it('splits to the right with 50%', () => {
    const { source, created } = tilerySplitInset(fullInset, 'right', 50);
    expect(source).toEqual({ top: 0, right: 50, bottom: 0, left: 0 });
    expect(created).toEqual({ top: 0, right: 0, bottom: 0, left: 50 });
  });
  it('splits to the left with 30%', () => {
    const { source, created } = tilerySplitInset(fullInset, 'left', 30);
    expect(source).toEqual({ top: 0, right: 0, bottom: 0, left: 30 });
    expect(created).toEqual({ top: 0, right: 70, bottom: 0, left: 0 });
  });
  it('splits to the bottom with 25%', () => {
    const { source, created } = tilerySplitInset(fullInset, 'bottom', 25);
    expect(source).toEqual({ top: 0, right: 0, bottom: 25, left: 0 });
    expect(created).toEqual({ top: 75, right: 0, bottom: 0, left: 0 });
  });
  it('splits to the top with 40%', () => {
    const { source, created } = tilerySplitInset(fullInset, 'top', 40);
    expect(source).toEqual({ top: 40, right: 0, bottom: 0, left: 0 });
    expect(created).toEqual({ top: 0, right: 0, bottom: 60, left: 0 });
  });
  it('splits a non-full inset proportionally', () => {
    // Source: x ∈ [40, 100], width = 60. Split right 50% → new width 30.
    const { source, created } = tilerySplitInset(
      { top: 0, right: 0, bottom: 0, left: 40 },
      'right',
      50,
    );
    expect(source).toEqual({ top: 0, right: 30, bottom: 0, left: 40 });
    expect(created).toEqual({ top: 0, right: 0, bottom: 0, left: 70 });
  });
});

describe('tileryDeriveDividers', () => {
  it('produces a single vertical divider for two side-by-side panels', () => {
    const state = createStateFromPanels({
      panels: [
        {
          id: 'A',
          inset: { top: 0, right: 50, bottom: 0, left: 0 },
          tabs: [{ id: 'ta', data: {} }],
        },
        {
          id: 'B',
          inset: { top: 0, right: 0, bottom: 0, left: 50 },
          tabs: [{ id: 'tb', data: {} }],
        },
      ],
    });
    const dividers = tileryDeriveDividers(state);
    expect(dividers).toHaveLength(1);
    expect(dividers[0]!.orientation).toBe('vertical');
    expect(dividers[0]!.position).toBe(50);
    expect(dividers[0]!.beforePanels).toEqual(['A']);
    expect(dividers[0]!.afterPanels).toEqual(['B']);
  });

  it('produces two dividers for a 3-panel L-shape (sidebar + editor + terminal)', () => {
    const state = createStateFromPanels({
      panels: [
        {
          id: 'sidebar',
          inset: { top: 0, right: 60, bottom: 0, left: 0 },
          tabs: [{ id: 'ts', data: {} }],
        },
        {
          id: 'editor',
          inset: { top: 0, right: 0, bottom: 50, left: 40 },
          tabs: [{ id: 'te', data: {} }],
        },
        {
          id: 'terminal',
          inset: { top: 50, right: 0, bottom: 0, left: 40 },
          tabs: [{ id: 'tt', data: {} }],
        },
      ],
    });
    const dividers = tileryDeriveDividers(state);
    const vertical = dividers.filter((d) => d.orientation === 'vertical');
    const horizontal = dividers.filter((d) => d.orientation === 'horizontal');
    expect(vertical).toHaveLength(1);
    expect(vertical[0]!.position).toBe(40);
    expect(vertical[0]!.beforePanels).toEqual(['sidebar']);
    expect(vertical[0]!.afterPanels.sort()).toEqual(['editor', 'terminal']);
    expect(horizontal).toHaveLength(1);
    expect(horizontal[0]!.position).toBe(50);
    expect(horizontal[0]!.start).toBe(40);
    expect(horizontal[0]!.end).toBe(100);
    expect(horizontal[0]!.beforePanels).toEqual(['editor']);
    expect(horizontal[0]!.afterPanels).toEqual(['terminal']);
  });

  it('produces the right dividers for a 2x2 grid', () => {
    const state = createStateFromPanels({
      panels: [
        {
          id: 'TL',
          inset: { top: 0, right: 50, bottom: 50, left: 0 },
          tabs: [{ id: 'tl', data: {} }],
        },
        {
          id: 'TR',
          inset: { top: 0, right: 0, bottom: 50, left: 50 },
          tabs: [{ id: 'tr', data: {} }],
        },
        {
          id: 'BL',
          inset: { top: 50, right: 50, bottom: 0, left: 0 },
          tabs: [{ id: 'bl', data: {} }],
        },
        {
          id: 'BR',
          inset: { top: 50, right: 0, bottom: 0, left: 50 },
          tabs: [{ id: 'br', data: {} }],
        },
      ],
    });
    const dividers = tileryDeriveDividers(state);
    const v = dividers.filter((d) => d.orientation === 'vertical');
    const h = dividers.filter((d) => d.orientation === 'horizontal');
    expect(v).toHaveLength(1);
    expect(h).toHaveLength(2);
    expect(v[0]!.beforePanels.sort()).toEqual(['BL', 'TL']);
    expect(v[0]!.afterPanels.sort()).toEqual(['BR', 'TR']);
    expect(h.map((divider) => divider.beforePanels)).toEqual([['TL'], ['TR']]);
    expect(h.map((divider) => divider.afterPanels)).toEqual([['BL'], ['BR']]);
  });

  it('merges touching ranges in the flat divider fallback', () => {
    const state = {
      ...createStateFromPanels({
        panels: [
          {
            id: 'T',
            inset: { top: 0, right: 50, bottom: 50, left: 0 },
            tabs: [{ id: 't', data: {} }],
          },
          {
            id: 'B',
            inset: { top: 50, right: 50, bottom: 0, left: 0 },
            tabs: [{ id: 'b', data: {} }],
          },
          {
            id: 'R',
            inset: { top: 0, right: 0, bottom: 0, left: 50 },
            tabs: [{ id: 'r', data: {} }],
          },
        ],
      }),
      layout: null,
    };

    const divider = tileryDeriveDividers(state).find(
      (d) => d.orientation === 'vertical' && d.position === 50,
    )!;
    expect(divider.start).toBe(0);
    expect(divider.end).toBe(100);
    expect(divider.beforePanels).toEqual(['T', 'B']);
    expect(divider.afterPanels).toEqual(['R']);
  });
});

describe('tileryClampDividerPosition + tileryApplyDividerResize', () => {
  it('clamps the divider to respect min size on both sides', () => {
    const state = createStateFromPanels({
      panels: [
        {
          id: 'A',
          inset: { top: 0, right: 50, bottom: 0, left: 0 },
          tabs: [{ id: 'ta', data: {} }],
        },
        {
          id: 'B',
          inset: { top: 0, right: 0, bottom: 0, left: 50 },
          tabs: [{ id: 'tb', data: {} }],
        },
      ],
    });
    const div = tileryDeriveDividers(state)[0]!;
    // Try to push divider to 5% — A would be 5% wide. Should clamp to min (10%).
    expect(tileryClampDividerPosition(state, div, 5, 10)).toBe(10);
    // Try to push to 98% — B would be 2% wide. Should clamp to 90%.
    expect(tileryClampDividerPosition(state, div, 98, 10)).toBe(90);
    // Within bounds, no clamp.
    expect(tileryClampDividerPosition(state, div, 30, 10)).toBe(30);
    expect(
      tileryClampDividerPosition(state, { ...div, splitId: 'missing' }, 30, 10),
    ).toBe(div.position);
  });

  it('applies a resize correctly to both adjacent panels', () => {
    const state = createStateFromPanels({
      panels: [
        {
          id: 'A',
          inset: { top: 0, right: 50, bottom: 0, left: 0 },
          tabs: [{ id: 'ta', data: {} }],
        },
        {
          id: 'B',
          inset: { top: 0, right: 0, bottom: 0, left: 50 },
          tabs: [{ id: 'tb', data: {} }],
        },
      ],
    });
    const div = tileryDeriveDividers(state)[0]!;
    const next = tileryApplyDividerResize(state, div, 70);
    expect(next.panels.A!.inset).toEqual({
      top: 0,
      right: 30,
      bottom: 0,
      left: 0,
    });
    expect(next.panels.B!.inset).toEqual({
      top: 0,
      right: 0,
      bottom: 0,
      left: 70,
    });
  });

  it('clamps and applies vertical resize through the flat fallback path', () => {
    const state = {
      ...createStateFromPanels({
        panels: [
          {
            id: 'A',
            inset: { top: 0, right: 50, bottom: 0, left: 0 },
            tabs: [{ id: 'ta', data: {} }],
          },
          {
            id: 'B',
            inset: { top: 0, right: 0, bottom: 0, left: 50 },
            tabs: [{ id: 'tb', data: {} }],
          },
        ],
      }),
      layout: null,
    };
    const div = { ...tileryDeriveDividers(state)[0]!, splitId: undefined };
    expect(tileryClampDividerPosition(state, div, 5, 10)).toBe(10);
    expect(tileryClampDividerPosition(state, div, 95, 10)).toBe(90);
    expect(tileryClampDividerPosition(state, div, 30, 10)).toBe(30);

    const next = tileryApplyDividerResize(state, div, 70);
    expect(next.panels.A!.inset.right).toBe(30);
    expect(next.panels.B!.inset.left).toBe(70);
  });
});

describe('tileryReducer — split, move-tab, auto-remove', () => {
  const baseLayout = () =>
    createStateFromPanels({
      panels: [
        {
          id: 'sidebar',
          inset: { top: 0, right: 60, bottom: 0, left: 0 },
          tabs: [{ id: 'ts', data: { title: 'Explorer' } }],
        },
        {
          id: 'editor',
          inset: { top: 0, right: 0, bottom: 50, left: 40 },
          tabs: [
            { id: 'te1', data: { title: 'foo' } },
            { id: 'te2', data: { title: 'bar' } },
          ],
        },
        {
          id: 'terminal',
          inset: { top: 50, right: 0, bottom: 0, left: 40 },
          tabs: [{ id: 'tt', data: { title: 'bash' } }],
        },
      ],
    });

  it('SPLIT_PANEL shrinks source and creates new panel with correct inset', () => {
    const state = baseLayout();
    const next = tileryReducer(state, {
      type: 'SPLIT_PANEL',
      panelId: 'sidebar',
      direction: 'right',
      sizePercent: 50,
      newPanelId: 'sidebar-2',
      tabs: [{ id: 't-new', data: { title: 'New' } }],
      activate: true,
    });
    // sidebar was x:[0,40], split right 50% → sidebar now x:[0,20], new at x:[20,40]
    expect(next.panels.sidebar!.inset).toEqual({
      top: 0,
      right: 80,
      bottom: 0,
      left: 0,
    });
    expect(next.panels['sidebar-2']!.inset).toEqual({
      top: 0,
      right: 60,
      bottom: 0,
      left: 20,
    });
    expect(next.panels['sidebar-2']!.tabs).toEqual(['t-new']);
    expect(next.tabs['t-new']!.panelId).toBe('sidebar-2');
  });

  it('MOVE_TAB into another panel preserves source if it still has tabs', () => {
    const state = baseLayout();
    const next = tileryReducer(state, {
      type: 'MOVE_TAB',
      tabId: 'te1',
      to: { panelId: 'terminal', index: 1 },
    });
    expect(next.panels.editor!.tabs).toEqual(['te2']);
    expect(next.panels.terminal!.tabs).toEqual(['tt', 'te1']);
    expect(next.tabs.te1!.panelId).toBe('terminal');
  });

  it('REMOVE_TAB removes a panel when last tab is removed (vertical neighbor reflows)', () => {
    const state = baseLayout();
    // Remove sidebar's only tab; editor + terminal both extend left.
    const next = tileryReducer(state, { type: 'REMOVE_TAB', tabId: 'ts' });
    expect(next.panels.sidebar).toBeUndefined();
    expect(next.panelOrder).not.toContain('sidebar');
    expect(next.panels.editor!.inset).toEqual({
      top: 0,
      right: 0,
      bottom: 50,
      left: 0,
    });
    expect(next.panels.terminal!.inset).toEqual({
      top: 50,
      right: 0,
      bottom: 0,
      left: 0,
    });
    expect(next.tabs.ts).toBeUndefined();
  });

  it('REMOVE_TAB removes an empty panel with horizontal neighbor reflow', () => {
    const state = baseLayout();
    const next = tileryReducer(state, { type: 'REMOVE_TAB', tabId: 'tt' });
    // Terminal is removed; editor extends down to fill the bottom half.
    expect(next.panels.terminal).toBeUndefined();
    expect(next.panels.editor!.inset).toEqual({
      top: 0,
      right: 0,
      bottom: 0,
      left: 40,
    });
  });

  it('REMOVE_TAB without panel removal selects a neighbor as active when the active is removed', () => {
    const state = baseLayout();
    const next = tileryReducer(state, { type: 'REMOVE_TAB', tabId: 'te1' });
    expect(next.panels.editor!.tabs).toEqual(['te2']);
    expect(next.panels.editor!.activeTabId).toBe('te2');
  });

  it('MOVE_TAB out of last-tab panel removes the source panel', () => {
    const state: TileryLayoutState = createStateFromPanels({
      panels: [
        {
          id: 'A',
          inset: { top: 0, right: 50, bottom: 0, left: 0 },
          tabs: [{ id: 'ta', data: {} }],
        },
        {
          id: 'B',
          inset: { top: 0, right: 0, bottom: 0, left: 50 },
          tabs: [{ id: 'tb', data: {} }],
        },
      ],
    });
    const next = tileryReducer(state, {
      type: 'MOVE_TAB',
      tabId: 'ta',
      to: { panelId: 'B', index: 0 },
    });
    expect(next.panels.A).toBeUndefined();
    expect(next.panels.B!.inset).toEqual({
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    });
    expect(next.panels.B!.tabs).toEqual(['ta', 'tb']);
  });
});

describe('tileryFindRemovalFillers — edge cases', () => {
  it('expands a right neighbor over a removed left panel of equal height', () => {
    const state = createStateFromPanels({
      panels: [
        {
          id: 'L',
          inset: { top: 0, right: 50, bottom: 0, left: 0 },
          tabs: [{ id: 'l', data: {} }],
        },
        {
          id: 'R',
          inset: { top: 0, right: 0, bottom: 0, left: 50 },
          tabs: [{ id: 'r', data: {} }],
        },
      ],
    });
    const fillers = tileryFindRemovalFillers(
      Object.values(state.panels),
      state.panels.L!,
    );
    expect(fillers).toHaveLength(1);
    expect(fillers[0]!.id).toBe('R');
    expect(fillers[0]!.inset).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
  });

  it('expands a left neighbor over a removed right panel of equal height', () => {
    const state = createStateFromPanels({
      panels: [
        {
          id: 'L',
          inset: { top: 0, right: 50, bottom: 0, left: 0 },
          tabs: [{ id: 'l', data: {} }],
        },
        {
          id: 'R',
          inset: { top: 0, right: 0, bottom: 0, left: 50 },
          tabs: [{ id: 'r', data: {} }],
        },
      ],
    });
    const fillers = tileryFindRemovalFillers(
      Object.values(state.panels),
      state.panels.R!,
    );
    expect(fillers).toHaveLength(1);
    expect(fillers[0]!.id).toBe('L');
    expect(fillers[0]!.inset).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
  });

  it('expands a top neighbor downward into a removed panel', () => {
    // Top: x=[0,100], y=[0,50]. Bottom: x=[0,100], y=[50,100]. Remove bottom.
    const state = createStateFromPanels({
      panels: [
        {
          id: 'T',
          inset: { top: 0, right: 0, bottom: 50, left: 0 },
          tabs: [{ id: 't', data: {} }],
        },
        {
          id: 'B',
          inset: { top: 50, right: 0, bottom: 0, left: 0 },
          tabs: [{ id: 'b', data: {} }],
        },
      ],
    });
    const fillers = tileryFindRemovalFillers(
      Object.values(state.panels),
      state.panels.B!,
    );
    expect(fillers).toHaveLength(1);
    expect(fillers[0]!.id).toBe('T');
    expect(fillers[0]!.inset).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
  });

  it('expands a bottom neighbor upward when the removed panel is on top', () => {
    const state = createStateFromPanels({
      panels: [
        {
          id: 'T',
          inset: { top: 0, right: 0, bottom: 50, left: 0 },
          tabs: [{ id: 't', data: {} }],
        },
        {
          id: 'B',
          inset: { top: 50, right: 0, bottom: 0, left: 0 },
          tabs: [{ id: 'b', data: {} }],
        },
      ],
    });
    const fillers = tileryFindRemovalFillers(
      Object.values(state.panels),
      state.panels.T!,
    );
    expect(fillers).toHaveLength(1);
    expect(fillers[0]!.id).toBe('B');
    expect(fillers[0]!.inset).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
  });

  it('returns no fillers when no adjacent side tiles the removed region', () => {
    const state = createStateFromPanels({
      panels: [
        // Two non-adjacent panels (gap between them)
        {
          id: 'A',
          inset: { top: 0, right: 80, bottom: 80, left: 0 },
          tabs: [{ id: 'a', data: {} }],
        },
        {
          id: 'B',
          inset: { top: 80, right: 0, bottom: 0, left: 80 },
          tabs: [{ id: 'b', data: {} }],
        },
      ],
    });
    expect(
      tileryFindRemovalFillers(Object.values(state.panels), state.panels.A!),
    ).toEqual([]);
  });

  it('returns no fillers when neighbors do not fully cover the removed range', () => {
    // Two left neighbors stacked but their union doesn't reach the removed's top
    const state = createStateFromPanels({
      panels: [
        {
          id: 'L',
          inset: { top: 50, right: 50, bottom: 0, left: 0 },
          tabs: [{ id: 'l', data: {} }],
        },
        {
          id: 'R',
          inset: { top: 0, right: 0, bottom: 0, left: 50 },
          tabs: [{ id: 'r', data: {} }],
        },
      ],
    });
    expect(
      tileryFindRemovalFillers(Object.values(state.panels), state.panels.R!),
    ).toEqual([]);
  });
});

describe('helper readers', () => {
  const p = (inset: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  }): TileryPanelState => ({
    id: 'x',
    kind: 'tiled',
    inset,
    tabs: [],
    activeTabId: null,
  });
  it('tileryPanelLeft / tileryPanelRight / tileryPanelTop / tileryPanelBottom', () => {
    const r = p({ top: 5, right: 10, bottom: 15, left: 20 });
    expect(tileryPanelLeft(r)).toBe(20);
    expect(tileryPanelRight(r)).toBe(90);
    expect(tileryPanelTop(r)).toBe(5);
    expect(tileryPanelBottom(r)).toBe(85);
  });
  it('tileryPanelWidth / tileryPanelHeight', () => {
    const r = p({ top: 5, right: 10, bottom: 15, left: 20 });
    expect(tileryPanelWidth(r)).toBe(70);
    expect(tileryPanelHeight(r)).toBe(80);
  });
});

describe('tileryRectsOverlap', () => {
  it('returns true for clearly overlapping rects', () => {
    expect(
      tileryRectsOverlap(
        { top: 0, right: 50, bottom: 0, left: 0 },
        { top: 0, right: 0, bottom: 0, left: 40 },
      ),
    ).toBe(true);
  });
  it('returns false for side-by-side non-overlapping rects', () => {
    expect(
      tileryRectsOverlap(
        { top: 0, right: 50, bottom: 0, left: 0 },
        { top: 0, right: 0, bottom: 0, left: 50 },
      ),
    ).toBe(false);
  });
  it('returns false for stacked non-overlapping rects', () => {
    expect(
      tileryRectsOverlap(
        { top: 0, right: 0, bottom: 50, left: 0 },
        { top: 50, right: 0, bottom: 0, left: 0 },
      ),
    ).toBe(false);
  });
});

describe('horizontal dividers — resize math', () => {
  const stacked = () =>
    createStateFromPanels({
      panels: [
        {
          id: 'T',
          inset: { top: 0, right: 0, bottom: 50, left: 0 },
          tabs: [{ id: 'tt', data: {} }],
        },
        {
          id: 'B',
          inset: { top: 50, right: 0, bottom: 0, left: 0 },
          tabs: [{ id: 'tb', data: {} }],
        },
      ],
    });
  it('clamps min for horizontal divider', () => {
    const state = stacked();
    const div = tileryDeriveDividers(state)[0]!;
    expect(tileryClampDividerPosition(state, div, 1, 10)).toBe(10);
  });
  it('clamps max for horizontal divider', () => {
    const state = stacked();
    const div = tileryDeriveDividers(state)[0]!;
    expect(tileryClampDividerPosition(state, div, 99, 10)).toBe(90);
  });
  it('clamps horizontal resize through the flat fallback path', () => {
    const state = { ...stacked(), layout: null };
    const div = { ...tileryDeriveDividers(state)[0]!, splitId: undefined };
    expect(tileryClampDividerPosition(state, div, 1, 10)).toBe(10);
    expect(tileryClampDividerPosition(state, div, 99, 10)).toBe(90);
    expect(tileryClampDividerPosition(state, div, 60, 10)).toBe(60);
  });
  it('applies horizontal resize correctly', () => {
    const state = stacked();
    const div = tileryDeriveDividers(state)[0]!;
    const next = tileryApplyDividerResize(state, div, 70);
    expect(next.panels.T!.inset.bottom).toBe(30);
    expect(next.panels.B!.inset.top).toBe(70);
  });
  it('applies horizontal resize through the flat fallback path', () => {
    const state = { ...stacked(), layout: null };
    const div = { ...tileryDeriveDividers(state)[0]!, splitId: undefined };
    const next = tileryApplyDividerResize(state, div, 70);
    expect(next.panels.T!.inset.bottom).toBe(30);
    expect(next.panels.B!.inset.top).toBe(70);
  });
});

describe('divider edge guards — horizontal', () => {
  it('tileryClampDividerPosition skips missing panels on horizontal divider both sides', () => {
    const state = createStateFromPanels({
      panels: [
        {
          id: 'T',
          inset: { top: 0, right: 0, bottom: 50, left: 0 },
          tabs: [{ id: 'a', data: {} }],
        },
        {
          id: 'B',
          inset: { top: 50, right: 0, bottom: 0, left: 0 },
          tabs: [{ id: 'b', data: {} }],
        },
      ],
    });
    const div = tileryDeriveDividers(state)[0]!;
    const phantomDivider = {
      ...div,
      splitId: undefined,
      beforePanels: ['phantom-top'],
      afterPanels: ['phantom-bottom'],
    };
    expect(tileryClampDividerPosition(state, phantomDivider, 60, 10)).toBe(60);
  });
});

describe('divider edge guards', () => {
  it('tileryClampDividerPosition skips missing panels', () => {
    const state = createStateFromPanels({
      panels: [
        {
          id: 'L',
          inset: { top: 0, right: 50, bottom: 0, left: 0 },
          tabs: [{ id: 'l', data: {} }],
        },
        {
          id: 'R',
          inset: { top: 0, right: 0, bottom: 0, left: 50 },
          tabs: [{ id: 'r', data: {} }],
        },
      ],
    });
    const div = tileryDeriveDividers(state)[0]!;
    const phantomDivider = {
      ...div,
      splitId: undefined,
      beforePanels: ['phantom'],
      afterPanels: ['phantom2'],
    };
    expect(tileryClampDividerPosition(state, phantomDivider, 60, 10)).toBe(60);
  });
  it('tileryApplyDividerResize skips missing panels on both sides', () => {
    const state = createStateFromPanels({
      panels: [
        {
          id: 'L',
          inset: { top: 0, right: 50, bottom: 0, left: 0 },
          tabs: [{ id: 'l', data: {} }],
        },
        {
          id: 'R',
          inset: { top: 0, right: 0, bottom: 0, left: 50 },
          tabs: [{ id: 'r', data: {} }],
        },
      ],
    });
    const div = tileryDeriveDividers(state)[0]!;
    const phantomDivider = {
      ...div,
      splitId: undefined,
      beforePanels: ['phantom'],
      afterPanels: ['phantom2'],
    };
    const next = tileryApplyDividerResize(state, phantomDivider, 60);
    expect(next.panels.L!.inset).toEqual({
      top: 0,
      right: 50,
      bottom: 0,
      left: 0,
    });
    expect(next.panels.R!.inset).toEqual({
      top: 0,
      right: 0,
      bottom: 0,
      left: 50,
    });
  });
  it('tileryApplyDividerResize horizontal skips missing panels', () => {
    const state = createStateFromPanels({
      panels: [
        {
          id: 'T',
          inset: { top: 0, right: 0, bottom: 50, left: 0 },
          tabs: [{ id: 'tt', data: {} }],
        },
        {
          id: 'B',
          inset: { top: 50, right: 0, bottom: 0, left: 0 },
          tabs: [{ id: 'tb', data: {} }],
        },
      ],
    });
    const div = tileryDeriveDividers(state)[0]!;
    const phantomDivider = {
      ...div,
      splitId: undefined,
      beforePanels: ['phantom'],
      afterPanels: ['phantom2'],
    };
    const next = tileryApplyDividerResize(state, phantomDivider, 60);
    expect(next.panels.T!.inset.bottom).toBe(50);
    expect(next.panels.B!.inset.top).toBe(50);
  });
});

describe('tileryDeriveDividers — disjoint adjacency', () => {
  it('produces no divider when before and after sides share an x but their y-ranges do not overlap', () => {
    // Three panels sharing x=50 edge but with no y overlap between the sides:
    //   A1: x=[0,50], y=[0,30]   (left, top)
    //   A2: x=[0,50], y=[70,100] (left, bottom)
    //   B:  x=[50,100], y=[40,60] (right, middle)
    // intersectRanges([[0,30],[70,100]], [[40,60]]) → all pairs non-overlapping
    const state = createStateFromPanels({
      panels: [
        {
          id: 'A1',
          inset: { top: 0, right: 50, bottom: 70, left: 0 },
          tabs: [{ id: 'a1', data: {} }],
        },
        {
          id: 'A2',
          inset: { top: 70, right: 50, bottom: 0, left: 0 },
          tabs: [{ id: 'a2', data: {} }],
        },
        {
          id: 'B',
          inset: { top: 40, right: 0, bottom: 40, left: 50 },
          tabs: [{ id: 'b', data: {} }],
        },
      ],
    });
    const dividers = tileryDeriveDividers(state);
    // No vertical divider at x=50 because the disjoint y-ranges produce no intersection
    expect(
      dividers.filter((d) => d.position === 50 && d.orientation === 'vertical'),
    ).toEqual([]);
  });
});

describe('tileryDeriveDividers — gap branches', () => {
  it('skips an x-coord that only has panels on one side (no opposing panel)', () => {
    // Single panel covers full width on top, plus a smaller panel on bottom only
    // x-coord at the inner edge of the bottom panel has no opposing side.
    const state = createStateFromPanels({
      panels: [
        {
          id: 'top',
          inset: { top: 0, right: 0, bottom: 60, left: 0 },
          tabs: [{ id: 't', data: {} }],
        },
        {
          id: 'b',
          inset: { top: 40, right: 70, bottom: 0, left: 0 },
          tabs: [{ id: 'b1', data: {} }],
        },
      ],
    });
    const dividers = tileryDeriveDividers(state);
    expect(
      dividers.every(
        (d) => d.beforePanels.length > 0 && d.afterPanels.length > 0,
      ),
    ).toBe(true);
  });
  it('skips a y-coord that only has panels on one side', () => {
    const state = createStateFromPanels({
      panels: [
        {
          id: 'l',
          inset: { top: 0, right: 60, bottom: 0, left: 0 },
          tabs: [{ id: 'a', data: {} }],
        },
        {
          id: 'r',
          inset: { top: 0, right: 0, bottom: 70, left: 40 },
          tabs: [{ id: 'b', data: {} }],
        },
      ],
    });
    const dividers = tileryDeriveDividers(state);
    expect(
      dividers.every(
        (d) => d.beforePanels.length > 0 && d.afterPanels.length > 0,
      ),
    ).toBe(true);
  });
});

// Workspace shape: one panel on one side of a divider, multiple stacked
// panels on the other side. This is the canonical "sidebar | (editor /
// terminal)" layout and the place where naive 2-panel divider math breaks
// — the clamp has to respect *every* panel sharing the edge, not just the
// immediate neighbour. Equivalent to VS Code's splitview "constraints from
// all views in the chain" test and dockview's multi-view-sash test.
describe('tileryClampDividerPosition — multi-panel side (workspace shape)', () => {
  const workspace = (): TileryLayoutState =>
    createStateFromPanels({
      panels: [
        {
          id: 'sidebar',
          inset: { top: 0, right: 60, bottom: 0, left: 0 },
          tabs: [{ id: 's', data: {} }],
        },
        {
          id: 'editor',
          inset: { top: 0, right: 0, bottom: 50, left: 40 },
          tabs: [{ id: 'e', data: {} }],
        },
        {
          id: 'terminal',
          inset: { top: 50, right: 0, bottom: 0, left: 40 },
          tabs: [{ id: 't', data: {} }],
        },
      ],
    });

  it('clamps low so the single before-side panel (sidebar) keeps its min', () => {
    const state = workspace();
    const div = tileryDeriveDividers(state).find(
      (d) => d.orientation === 'vertical',
    )!;
    // Drag toward x=5 would leave sidebar 5% wide — below the 10% min.
    expect(tileryClampDividerPosition(state, div, 5, 10)).toBe(10);
  });

  it('clamps high so editor AND terminal both keep their min', () => {
    const state = workspace();
    const div = tileryDeriveDividers(state).find(
      (d) => d.orientation === 'vertical',
    )!;
    // Drag toward x=95 would leave the right column 5% wide, breaking the
    // min for BOTH editor and terminal. Clamp must hit 90, not e.g. 95.
    expect(tileryClampDividerPosition(state, div, 95, 10)).toBe(90);
  });

  it('respects a stricter custom minSize across all afterPanels', () => {
    const state = workspace();
    const div = tileryDeriveDividers(state).find(
      (d) => d.orientation === 'vertical',
    )!;
    // minSize=20 → divider can go no higher than 80.
    expect(tileryClampDividerPosition(state, div, 95, 20)).toBe(80);
  });

  it('uses per-panel minSize and maxSize constraints when clamping', () => {
    const state = createStateFromPanels({
      panels: [
        {
          id: 'L',
          inset: { top: 0, right: 50, bottom: 0, left: 0 },
          tabs: [{ id: 'left', data: {} }],
          minSize: 30,
          maxSize: 65,
        },
        {
          id: 'R',
          inset: { top: 0, right: 0, bottom: 0, left: 50 },
          tabs: [{ id: 'right', data: {} }],
          minSize: 20,
          maxSize: 40,
        },
      ],
    });
    const div = tileryDeriveDividers(state)[0]!;

    expect(tileryClampDividerPosition(state, div, 5, 10)).toBe(60);
    expect(tileryClampDividerPosition(state, div, 95, 10)).toBe(65);
  });

  it('does not apply descendant constraints to an ancestor split divider', () => {
    const state = tileryCreateInitialState({
      type: 'split',
      direction: 'horizontal',
      children: [
        {
          type: 'panel',
          id: 'navigator',
          size: 24,
          minSize: 18,
          maxSize: 34,
          tabs: [{ id: 'navigator-tab', data: {} }],
        },
        {
          type: 'split',
          direction: 'vertical',
          size: 76,
          children: [
            {
              type: 'panel',
              id: 'editor',
              size: 68,
              minSize: 36,
              tabs: [{ id: 'editor-tab', data: {} }],
            },
            {
              type: 'panel',
              id: 'console',
              size: 32,
              minSize: 18,
              maxSize: 42,
              tabs: [{ id: 'console-tab', data: {} }],
            },
          ],
        },
      ],
    });
    const div = tileryDeriveDividers(state).find(
      (d) =>
        d.orientation === 'vertical' && d.beforePanels.includes('navigator'),
    )!;

    expect(tileryClampDividerPosition(state, div, 5, 10)).toBe(18);
    expect(tileryClampDividerPosition(state, div, 40, 10)).toBe(34);
  });

  it('disables a divider when either adjacent direct child is not resizable', () => {
    const state = tileryCreateInitialState({
      type: 'split',
      direction: 'horizontal',
      children: [
        {
          type: 'panel',
          id: 'L',
          resizable: false,
          tabs: [{ id: 'left', data: {} }],
        },
        {
          type: 'panel',
          id: 'R',
          tabs: [{ id: 'right', data: {} }],
        },
      ],
    });
    const div = tileryDeriveDividers(state)[0]!;

    expect(div.disabled).toBe(true);
    expect(tileryClampDividerPosition(state, div, 70, 10)).toBe(div.position);
    expect(tileryApplyDividerResize(state, div, 70)).toBe(state);
  });

  it('does not disable an ancestor divider for a locked descendant item', () => {
    const state = tileryCreateInitialState({
      type: 'split',
      direction: 'horizontal',
      children: [
        {
          type: 'panel',
          id: 'sidebar',
          tabs: [{ id: 'side', data: {} }],
        },
        {
          type: 'split',
          direction: 'vertical',
          children: [
            {
              type: 'panel',
              id: 'editor',
              resizable: false,
              tabs: [{ id: 'file', data: {} }],
            },
            {
              type: 'panel',
              id: 'terminal',
              tabs: [{ id: 'shell', data: {} }],
            },
          ],
        },
      ],
    });
    const rootDivider = tileryDeriveDividers(state).find(
      (d) => d.orientation === 'vertical',
    )!;
    const nestedDivider = tileryDeriveDividers(state).find(
      (d) => d.orientation === 'horizontal',
    )!;

    expect(rootDivider.disabled).toBeUndefined();
    expect(nestedDivider.disabled).toBe(true);
  });

  it('does not resize a junction when a resolved divider is disabled', () => {
    const state = tileryCreateInitialState({
      type: 'split',
      direction: 'horizontal',
      children: [
        {
          type: 'panel',
          id: 'sidebar',
          size: 30,
          resizable: false,
          tabs: [{ id: 'side', data: {} }],
        },
        {
          type: 'split',
          direction: 'vertical',
          size: 70,
          children: [
            {
              type: 'panel',
              id: 'editor',
              tabs: [{ id: 'file', data: {} }],
            },
            {
              type: 'panel',
              id: 'terminal',
              tabs: [{ id: 'shell', data: {} }],
            },
          ],
        },
      ],
    });
    const junction = tileryDeriveJunctions(state)[0]!;
    expect(junction.disabled).toBe(true);

    expect(
      tileryApplyJunctionResize(
        state,
        { ...junction, disabled: undefined },
        { x: 60, y: 60 },
      ),
    ).toBe(state);
  });

  it('keeps position when per-panel min and max constraints cannot fit', () => {
    const state = createStateFromPanels({
      panels: [
        {
          id: 'L',
          inset: { top: 0, right: 50, bottom: 0, left: 0 },
          tabs: [{ id: 'left', data: {} }],
          minSize: 70,
        },
        {
          id: 'R',
          inset: { top: 0, right: 0, bottom: 0, left: 50 },
          tabs: [{ id: 'right', data: {} }],
          minSize: 40,
        },
      ],
    });
    const div = tileryDeriveDividers(state)[0]!;

    expect(tileryClampDividerPosition(state, div, 20, 10)).toBe(div.position);
  });

  it('tileryApplyDividerResize updates EVERY panel sharing the after edge', () => {
    const state = workspace();
    const div = tileryDeriveDividers(state).find(
      (d) => d.orientation === 'vertical',
    )!;
    const next = tileryApplyDividerResize(state, div, 30);
    // sidebar's right edge moves: was right=60 → now right=70.
    expect(next.panels.sidebar!.inset.right).toBe(70);
    // both editor and terminal lose left inset.
    expect(next.panels.editor!.inset.left).toBe(30);
    expect(next.panels.terminal!.inset.left).toBe(30);
  });
});

// Over-determined constraints: a divider sandwiched between panels that are
// ALREADY below the minimum size has no movement that satisfies every
// minimum. The clamp must report "no movement" (return the divider's
// current position), not pick `min` and produce a position outside [0,100].
describe('tileryClampDividerPosition — over-determined constraints', () => {
  it('returns the divider’s current position when min > max (no legal move)', () => {
    // Both panels are 5% tall — well below the 10% min. Could only have
    // been produced by an out-of-band setup like REPLACE_STATE; we still
    // must not crash on it. The two panels share the edge at y=10, so
    // tileryDeriveDividers returns one horizontal divider with both T and B as
    // its only constraint sources.
    const state = createStateFromPanels({
      panels: [
        {
          id: 'T',
          inset: { top: 5, right: 0, bottom: 90, left: 0 },
          tabs: [{ id: 'tt', data: {} }],
        },
        {
          id: 'B',
          inset: { top: 10, right: 0, bottom: 85, left: 0 },
          tabs: [{ id: 'tb', data: {} }],
        },
      ],
    });
    const div = tileryDeriveDividers(state)[0]!;
    // Target at the divider's current position triggers both constraints:
    // T would shrink below min (min becomes 15) AND B would shrink below
    // min (max becomes 5). Since min > max, no movement is legal; return
    // the divider's current position rather than a nonsense out-of-range
    // value like `Math.max(15, Math.min(5, 10)) = 15`.
    expect(tileryClampDividerPosition(state, div, div.position, 10)).toBe(
      div.position,
    );
  });
});

// Split-fit checks refuse SPLIT_PANEL actions that would shrink either half
// below the minimum. Without this, repeated splits of a small panel produced
// sub-min panels, which in turn broke divider math (see fuzz regression test
// above).
describe('tilerySplitFitsMin', () => {
  it('accepts a 50/50 split of a full-bleed panel', () => {
    expect(tilerySplitFitsMin(fullInset, 'right', 50, 10)).toBe(true);
  });
  it('rejects a split where the resulting source half would be below min', () => {
    // 50% wide source; split right 95% → source ends at 2.5% width.
    expect(
      tilerySplitFitsMin(
        { top: 0, right: 50, bottom: 0, left: 0 },
        'right',
        95,
        10,
      ),
    ).toBe(false);
  });
  it('rejects a split where the resulting created half would be below min', () => {
    expect(
      tilerySplitFitsMin(
        { top: 0, right: 50, bottom: 0, left: 0 },
        'right',
        5,
        10,
      ),
    ).toBe(false);
  });
  it('rejects when the panel is too narrow to split horizontally at all', () => {
    // Width = 5%, less than 2 × minSize.
    expect(
      tilerySplitFitsMin(
        { top: 0, right: 95, bottom: 0, left: 0 },
        'left',
        50,
        10,
      ),
    ).toBe(false);
  });

  it('checks per-panel split constraints for the source and created panel', () => {
    const panel: TileryPanelState = {
      id: 'P',
      kind: 'tiled',
      inset: fullInset,
      tabs: [],
      activeTabId: null,
      minSize: 30,
      maxSize: 80,
    };

    expect(
      tilerySplitFitsPanelConstraints(
        panel,
        'right',
        40,
        { minSize: 20, maxSize: 45 },
        10,
      ),
    ).toBe(true);
    expect(
      tilerySplitFitsPanelConstraints(panel, 'right', 80, { minSize: 30 }, 10),
    ).toBe(false);
    expect(
      tilerySplitFitsPanelConstraints(panel, 'right', 10, { maxSize: 5 }, 10),
    ).toBe(false);
  });
});

// Property tests: pairwise no-overlap and full coverage are tileryReducer
// invariants. Verify they survive a deterministic-random sequence of
// mutations starting from a single full-bleed panel. Catches the kind of
// off-by-EPSILON bug that wouldn't show up in any hand-written scenario.
describe('layout invariants — deterministic random fuzz', () => {
  function lcg(seed: number) {
    let s = seed >>> 0;
    return () => {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return s / 0x1_0000_0000;
    };
  }

  function pairwiseNoOverlap(state: TileryLayoutState): boolean {
    const panels = Object.values(state.panels);
    for (let i = 0; i < panels.length; i++) {
      for (let j = i + 1; j < panels.length; j++) {
        if (tileryRectsOverlap(panels[i]!.inset, panels[j]!.inset))
          return false;
      }
    }
    return true;
  }

  function totalArea(state: TileryLayoutState): number {
    return Object.values(state.panels).reduce(
      (sum, p) => sum + tileryPanelWidth(p) * tileryPanelHeight(p),
      0,
    );
  }

  it('200 random splits + resizes preserve no-overlap AND full coverage', () => {
    const rand = lcg(42);
    let state = createStateFromPanels({
      panels: [
        {
          id: 'P0',
          inset: { top: 0, right: 0, bottom: 0, left: 0 },
          tabs: [{ id: 't0', data: {} }],
        },
      ],
    });
    let nextSeq = 1;
    for (let i = 0; i < 200; i++) {
      const op = rand() < 0.5 ? 'split' : 'resize';
      if (op === 'split') {
        const ids = state.panelOrder;
        const sourceId = ids[Math.floor(rand() * ids.length)]!;
        const dirs: TileryDirection[] = ['left', 'right', 'top', 'bottom'];
        const dir = dirs[Math.floor(rand() * dirs.length)]!;
        const size = 20 + Math.floor(rand() * 60); // 20–79%
        state = tileryReducer(state, {
          type: 'SPLIT_PANEL',
          panelId: sourceId,
          direction: dir,
          sizePercent: size,
          newPanelId: `P${nextSeq}`,
          tabs: [{ id: `t${nextSeq}`, data: {} }],
          activate: true,
        });
        nextSeq++;
      } else {
        const dividers = tileryDeriveDividers(state);
        if (dividers.length === 0) continue;
        const div = dividers[Math.floor(rand() * dividers.length)]!;
        const target = 5 + rand() * 90; // 5–95, will be clamped by tileryReducer
        state = tileryReducer(state, {
          type: 'RESIZE_DIVIDER',
          dividerId: div.id,
          newPosition: target,
        });
      }
      // After every mutation: panels never overlap, and they continue to
      // tile [0,100]² exactly. Coverage holds here because we only split
      // and resize — never remove. Removal can intentionally leave a hole
      // if neighbours can't fill the freed rect; that's tested separately.
      expect(pairwiseNoOverlap(state)).toBe(true);
      expect(totalArea(state)).toBeCloseTo(10000, 4);
      // No panel ever inverts (negative width/height) — the new min-size
      // guards in SPLIT_PANEL and tileryClampDividerPosition prevent it.
      for (const p of Object.values(state.panels)) {
        expect(tileryPanelWidth(p)).toBeGreaterThanOrEqual(-0.001);
        expect(tileryPanelHeight(p)).toBeGreaterThanOrEqual(-0.001);
      }
    }
  });
});
