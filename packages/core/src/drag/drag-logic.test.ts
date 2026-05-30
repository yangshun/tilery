import { describe, expect, it } from 'vite-plus/test';
import {
  tileryAdjacencySide,
  tileryClassifyByZoneAndSide,
  tileryCommitDrag,
  type TileryDragState,
} from './drag-logic';
import type { TileryHandle, TileryTabId } from '../types';

describe('tileryCommitDrag — every branch', () => {
  function mockHandle() {
    const calls: { tabId: TileryTabId; target: unknown }[] = [];
    const swapCalls: { a: string; b: string }[] = [];
    const handle = {
      getPanel(id: string) {
        return id === 'PEMPTY'
          ? { id, tabs: [] }
          : id === 'PMISS'
            ? null
            : { id, tabs: [{}, {}] };
      },
      getTab(_id: TileryTabId) {
        // Default: dragged tab's panel has 2 tabs → shouldSwapForSplit returns false.
        return {
          id: _id,
          panel: {
            id: 'SOURCE',
            tabs: [{}, {}],
            inset: { top: 0, right: 0, bottom: 0, left: 0 },
          },
        };
      },
      moveTab(tabId: TileryTabId, target: unknown) {
        calls.push({ tabId, target });
      },
      swapPanels(a: string, b: string) {
        swapCalls.push({ a, b });
      },
      setActiveTab() {},
    } as unknown as TileryHandle;
    return { handle, calls, swapCalls };
  }
  const baseDrag: Omit<
    TileryDragState,
    'hoverTabBar' | 'hoverPanelId' | 'hoverZone'
  > = {
    tabId: 'T1',
    pointerId: 1,
    startX: 0,
    startY: 0,
    x: 0,
    y: 0,
  };
  it('no-op when tilery is null', () => {
    expect(() =>
      tileryCommitDrag(
        null,
        { ...baseDrag, hoverTabBar: null, hoverPanelId: null, hoverZone: null },
        'T1',
      ),
    ).not.toThrow();
  });
  it('tab-bar append calls moveTab to end of target panel', () => {
    const { handle, calls } = mockHandle();
    tileryCommitDrag(
      handle,
      {
        ...baseDrag,
        hoverTabBar: { panelId: 'P', hit: { kind: 'append' } },
        hoverPanelId: null,
        hoverZone: null,
      },
      'TX',
    );
    expect(calls[0]).toEqual({ tabId: 'TX', target: { panel: 'P', index: 2 } });
  });
  it('tab-bar append when target panel missing is a no-op', () => {
    const { handle, calls } = mockHandle();
    tileryCommitDrag(
      handle,
      {
        ...baseDrag,
        hoverTabBar: { panelId: 'PMISS', hit: { kind: 'append' } },
        hoverPanelId: null,
        hoverZone: null,
      },
      'TX',
    );
    expect(calls).toEqual([]);
  });
  it('tab-bar before/after maps to moveTab', () => {
    const { handle, calls } = mockHandle();
    tileryCommitDrag(
      handle,
      {
        ...baseDrag,
        hoverTabBar: { panelId: 'P', hit: { kind: 'before', tabId: 'OTHER' } },
        hoverPanelId: null,
        hoverZone: null,
      },
      'TX',
    );
    tileryCommitDrag(
      handle,
      {
        ...baseDrag,
        hoverTabBar: { panelId: 'P', hit: { kind: 'after', tabId: 'OTHER' } },
        hoverPanelId: null,
        hoverZone: null,
      },
      'TX',
    );
    expect(calls).toEqual([
      { tabId: 'TX', target: { beforeTab: 'OTHER' } },
      { tabId: 'TX', target: { afterTab: 'OTHER' } },
    ]);
  });
  it('tab-bar drop on the same tab is a no-op', () => {
    const { handle, calls } = mockHandle();
    tileryCommitDrag(
      handle,
      {
        ...baseDrag,
        hoverTabBar: { panelId: 'P', hit: { kind: 'before', tabId: 'TX' } },
        hoverPanelId: null,
        hoverZone: null,
      },
      'TX',
    );
    expect(calls).toEqual([]);
  });
  it('center zone maps to append in the hovered panel', () => {
    const { handle, calls } = mockHandle();
    tileryCommitDrag(
      handle,
      {
        ...baseDrag,
        hoverTabBar: null,
        hoverPanelId: 'P',
        hoverZone: 'center',
      },
      'TX',
    );
    expect(calls[0]).toEqual({ tabId: 'TX', target: { panel: 'P', index: 2 } });
  });
  it('center zone with missing panel is a no-op', () => {
    const { handle, calls } = mockHandle();
    tileryCommitDrag(
      handle,
      {
        ...baseDrag,
        hoverTabBar: null,
        hoverPanelId: 'PMISS',
        hoverZone: 'center',
      },
      'TX',
    );
    expect(calls).toEqual([]);
  });
  it('directional zone maps to splitPanel moveTab', () => {
    const { handle, calls } = mockHandle();
    tileryCommitDrag(
      handle,
      { ...baseDrag, hoverTabBar: null, hoverPanelId: 'P', hoverZone: 'right' },
      'TX',
    );
    expect(calls[0]).toEqual({
      tabId: 'TX',
      target: { splitPanel: 'P', direction: 'right', sizePercent: 50 },
    });
  });
  it('no hoverPanel and no tabBar is a no-op', () => {
    const { handle, calls } = mockHandle();
    tileryCommitDrag(
      handle,
      { ...baseDrag, hoverTabBar: null, hoverPanelId: null, hoverZone: null },
      'TX',
    );
    expect(calls).toEqual([]);
  });

  function swapHandle(
    sourceInset: { top: number; right: number; bottom: number; left: number },
    targetInset: { top: number; right: number; bottom: number; left: number },
  ) {
    const calls: { tabId: TileryTabId; target: unknown }[] = [];
    const swapCalls: { a: string; b: string }[] = [];
    const handle = {
      getPanel(id: string) {
        if (id === 'TGT') {
          return { id, tabs: [{ id: 'TGT-TAB' }], inset: targetInset };
        }
        return null;
      },
      getTab(_id: TileryTabId) {
        return {
          id: _id,
          panel: { id: 'SRC', tabs: [{ id: _id }], inset: sourceInset },
        };
      },
      moveTab(tabId: TileryTabId, target: unknown) {
        calls.push({ tabId, target });
      },
      swapPanels(a: string, b: string) {
        swapCalls.push({ a, b });
      },
      setActiveTab() {},
    } as unknown as TileryHandle;
    return { handle, calls, swapCalls };
  }
  it('left zone routes to swap when source is right of target', () => {
    const { handle, calls, swapCalls } = swapHandle(
      { top: 0, right: 0, bottom: 0, left: 50 },
      { top: 0, right: 50, bottom: 0, left: 0 },
    );
    tileryCommitDrag(
      handle,
      {
        ...baseDrag,
        hoverTabBar: null,
        hoverPanelId: 'TGT',
        hoverZone: 'left',
      },
      'TX',
    );
    expect(swapCalls).toEqual([{ a: 'SRC', b: 'TGT' }]);
    expect(calls).toEqual([]);
  });
  it('right zone routes to swap when source is left of target', () => {
    const { handle, calls, swapCalls } = swapHandle(
      { top: 0, right: 50, bottom: 0, left: 0 },
      { top: 0, right: 0, bottom: 0, left: 50 },
    );
    tileryCommitDrag(
      handle,
      {
        ...baseDrag,
        hoverTabBar: null,
        hoverPanelId: 'TGT',
        hoverZone: 'right',
      },
      'TX',
    );
    expect(swapCalls).toEqual([{ a: 'SRC', b: 'TGT' }]);
    expect(calls).toEqual([]);
  });
  it('top zone routes to swap when source is below target', () => {
    const { handle, calls, swapCalls } = swapHandle(
      { top: 50, right: 0, bottom: 0, left: 0 },
      { top: 0, right: 0, bottom: 50, left: 0 },
    );
    tileryCommitDrag(
      handle,
      { ...baseDrag, hoverTabBar: null, hoverPanelId: 'TGT', hoverZone: 'top' },
      'TX',
    );
    expect(swapCalls).toEqual([{ a: 'SRC', b: 'TGT' }]);
    expect(calls).toEqual([]);
  });
  it('bottom zone routes to swap when source is above target', () => {
    const { handle, calls, swapCalls } = swapHandle(
      { top: 0, right: 0, bottom: 50, left: 0 },
      { top: 50, right: 0, bottom: 0, left: 0 },
    );
    tileryCommitDrag(
      handle,
      {
        ...baseDrag,
        hoverTabBar: null,
        hoverPanelId: 'TGT',
        hoverZone: 'bottom',
      },
      'TX',
    );
    expect(swapCalls).toEqual([{ a: 'SRC', b: 'TGT' }]);
    expect(calls).toEqual([]);
  });
  it('directional zone splits when source == target (same-panel split, multi-tab)', () => {
    // hover on source's own panel (multi-tab) — shouldSwapForSplit short-circuits on source.id === target.id
    const calls: { tabId: TileryTabId; target: unknown }[] = [];
    const swapCalls: { a: string; b: string }[] = [];
    const handle = {
      getPanel(_id: string) {
        return {
          id: 'SELF',
          tabs: [{ id: 'T1' }, { id: 'T2' }],
          inset: { top: 0, right: 0, bottom: 0, left: 0 },
        };
      },
      getTab(_id: TileryTabId) {
        return {
          id: _id,
          panel: {
            id: 'SELF',
            tabs: [{ id: 'T1' }, { id: 'T2' }],
            inset: { top: 0, right: 0, bottom: 0, left: 0 },
          },
        };
      },
      moveTab(tabId: TileryTabId, target: unknown) {
        calls.push({ tabId, target });
      },
      swapPanels(a: string, b: string) {
        swapCalls.push({ a, b });
      },
      setActiveTab() {},
    } as unknown as TileryHandle;
    tileryCommitDrag(
      handle,
      {
        ...baseDrag,
        hoverTabBar: null,
        hoverPanelId: 'SELF',
        hoverZone: 'left',
      },
      'T1',
    );
    expect(swapCalls).toEqual([]);
    expect(calls[0]).toEqual({
      tabId: 'T1',
      target: { splitPanel: 'SELF', direction: 'left', sizePercent: 50 },
    });
  });
  it('directional zone splits when target has 2+ tabs even with single-tab source', () => {
    // target.tabs.length !== 1 short-circuit in shouldSwapForSplit
    const calls: { tabId: TileryTabId; target: unknown }[] = [];
    const handle = {
      getPanel(id: string) {
        if (id === 'TGT') {
          return {
            id,
            tabs: [{ id: 'A' }, { id: 'B' }],
            inset: { top: 0, right: 50, bottom: 0, left: 0 },
          };
        }
        return null;
      },
      getTab(_id: TileryTabId) {
        return {
          id: _id,
          panel: {
            id: 'SRC',
            tabs: [{ id: _id }],
            inset: { top: 0, right: 0, bottom: 0, left: 50 },
          },
        };
      },
      moveTab(tabId: TileryTabId, target: unknown) {
        calls.push({ tabId, target });
      },
      swapPanels() {},
      setActiveTab() {},
    } as unknown as TileryHandle;
    tileryCommitDrag(
      handle,
      {
        ...baseDrag,
        hoverTabBar: null,
        hoverPanelId: 'TGT',
        hoverZone: 'left',
      },
      'TX',
    );
    expect(calls[0]).toEqual({
      tabId: 'TX',
      target: { splitPanel: 'TGT', direction: 'left', sizePercent: 50 },
    });
  });
  it('directional zone splits when source and target are not adjacent', () => {
    // tileryAdjacencySide returns null → shouldSwapForSplit short-circuits on !side
    const { handle, calls, swapCalls } = swapHandle(
      { top: 0, right: 80, bottom: 0, left: 0 },
      { top: 0, right: 0, bottom: 0, left: 80 },
    );
    tileryCommitDrag(
      handle,
      {
        ...baseDrag,
        hoverTabBar: null,
        hoverPanelId: 'TGT',
        hoverZone: 'left',
      },
      'TX',
    );
    expect(swapCalls).toEqual([]);
    expect(calls[0]).toEqual({
      tabId: 'TX',
      target: { splitPanel: 'TGT', direction: 'left', sizePercent: 50 },
    });
  });
  it('directional zone splits when adjacent panels do not share a full edge', () => {
    // Terminal (bottom-right half) dragged to left zone of explorer (full left column).
    // They share a vertical edge at x=40 but terminal is only half-height → not a full edge → split, not swap.
    const { handle, calls, swapCalls } = swapHandle(
      { top: 60, right: 0, bottom: 0, left: 40 }, // source: terminal (half height right)
      { top: 0, right: 60, bottom: 0, left: 0 }, // target: explorer (full height left)
    );
    tileryCommitDrag(
      handle,
      {
        ...baseDrag,
        hoverTabBar: null,
        hoverPanelId: 'TGT',
        hoverZone: 'left',
      },
      'TX',
    );
    expect(swapCalls).toEqual([]);
    expect(calls[0]).toEqual({
      tabId: 'TX',
      target: { splitPanel: 'TGT', direction: 'left', sizePercent: 50 },
    });
  });
  it('directional zone falls through to splitPanel moveTab when not a swap candidate (same side)', () => {
    // Source is right of target, drop on target's RIGHT (same side as source) → not a swap.
    // tileryCommitDrag falls through to default split.
    const { handle, calls, swapCalls } = swapHandle(
      { top: 0, right: 0, bottom: 0, left: 50 },
      { top: 0, right: 50, bottom: 0, left: 0 },
    );
    tileryCommitDrag(
      handle,
      {
        ...baseDrag,
        hoverTabBar: null,
        hoverPanelId: 'TGT',
        hoverZone: 'right',
      },
      'TX',
    );
    expect(swapCalls).toEqual([]);
    expect(calls[0]).toEqual({
      tabId: 'TX',
      target: { splitPanel: 'TGT', direction: 'right', sizePercent: 50 },
    });
  });
});

describe('tileryClassifyByZoneAndSide', () => {
  it('suppresses when zone matches the side source is already on', () => {
    expect(tileryClassifyByZoneAndSide('left', 'left')).toBe('suppress');
    expect(tileryClassifyByZoneAndSide('right', 'right')).toBe('suppress');
    expect(tileryClassifyByZoneAndSide('top', 'above')).toBe('suppress');
    expect(tileryClassifyByZoneAndSide('bottom', 'below')).toBe('suppress');
  });
  it('swaps when zone is opposite source side', () => {
    expect(tileryClassifyByZoneAndSide('left', 'right')).toBe('swap');
    expect(tileryClassifyByZoneAndSide('right', 'left')).toBe('swap');
    expect(tileryClassifyByZoneAndSide('top', 'below')).toBe('swap');
    expect(tileryClassifyByZoneAndSide('bottom', 'above')).toBe('swap');
  });
  it('splits when zone is perpendicular to source-target adjacency', () => {
    expect(tileryClassifyByZoneAndSide('left', 'above')).toBe('split');
    expect(tileryClassifyByZoneAndSide('left', 'below')).toBe('split');
    expect(tileryClassifyByZoneAndSide('right', 'above')).toBe('split');
    expect(tileryClassifyByZoneAndSide('right', 'below')).toBe('split');
    expect(tileryClassifyByZoneAndSide('top', 'left')).toBe('split');
    expect(tileryClassifyByZoneAndSide('top', 'right')).toBe('split');
    expect(tileryClassifyByZoneAndSide('bottom', 'left')).toBe('split');
    expect(tileryClassifyByZoneAndSide('bottom', 'right')).toBe('split');
  });
});

describe('tileryAdjacencySide', () => {
  const mk = (inset: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  }) => ({ inset });
  it('returns left when source right-edge meets target left-edge with y overlap', () => {
    const src = mk({ top: 0, right: 50, bottom: 0, left: 0 });
    const tgt = mk({ top: 0, right: 0, bottom: 0, left: 50 });
    expect(tileryAdjacencySide(src, tgt)).toBe('left');
  });
  it('returns right when source left-edge meets target right-edge', () => {
    const src = mk({ top: 0, right: 0, bottom: 0, left: 50 });
    const tgt = mk({ top: 0, right: 50, bottom: 0, left: 0 });
    expect(tileryAdjacencySide(src, tgt)).toBe('right');
  });
  it('returns above when source bottom meets target top', () => {
    const src = mk({ top: 0, right: 0, bottom: 50, left: 0 });
    const tgt = mk({ top: 50, right: 0, bottom: 0, left: 0 });
    expect(tileryAdjacencySide(src, tgt)).toBe('above');
  });
  it('returns below when source top meets target bottom', () => {
    const src = mk({ top: 50, right: 0, bottom: 0, left: 0 });
    const tgt = mk({ top: 0, right: 0, bottom: 50, left: 0 });
    expect(tileryAdjacencySide(src, tgt)).toBe('below');
  });
  it('returns null for non-adjacent rects', () => {
    const src = mk({ top: 0, right: 70, bottom: 70, left: 0 });
    const tgt = mk({ top: 70, right: 0, bottom: 0, left: 70 });
    expect(tileryAdjacencySide(src, tgt)).toBeNull();
  });
  it('returns null when y-overlap exists but no shared vertical edge (x-gap)', () => {
    const src = mk({ top: 0, right: 80, bottom: 0, left: 0 });
    const tgt = mk({ top: 0, right: 0, bottom: 0, left: 80 });
    expect(tileryAdjacencySide(src, tgt)).toBeNull();
  });
  it('returns null when x-overlap exists but no shared horizontal edge (y-gap)', () => {
    const src = mk({ top: 0, right: 0, bottom: 80, left: 0 });
    const tgt = mk({ top: 80, right: 0, bottom: 0, left: 0 });
    expect(tileryAdjacencySide(src, tgt)).toBeNull();
  });
});

describe('tileryCommitDrag — panelDrag=true (moves all tabs)', () => {
  const baseDrag: Omit<
    TileryDragState,
    'hoverTabBar' | 'hoverPanelId' | 'hoverZone'
  > = {
    tabId: 'T1',
    pointerId: 1,
    startX: 0,
    startY: 0,
    x: 0,
    y: 0,
  };

  function panelDragHandle() {
    const calls: { tabId: TileryTabId; target: unknown }[] = [];
    const swapCalls: { a: string; b: string }[] = [];
    const activeCalls: TileryTabId[] = [];
    const handle = {
      getPanel(id: string) {
        if (id === 'TGT')
          return {
            id,
            tabs: [{ id: 'TGT-T1' }],
            inset: { top: 0, right: 0, bottom: 0, left: 50 },
          };
        return null;
      },
      getTab(_id: TileryTabId) {
        return {
          id: _id,
          panel: {
            id: 'SRC',
            tabs: [{ id: 'T1' }, { id: 'T2' }, { id: 'T3' }],
            inset: { top: 0, right: 50, bottom: 0, left: 0 },
          },
        };
      },
      moveTab(tabId: TileryTabId, target: unknown) {
        calls.push({ tabId, target });
      },
      swapPanels(a: string, b: string) {
        swapCalls.push({ a, b });
      },
      setActiveTab(tabId: TileryTabId) {
        activeCalls.push(tabId);
      },
    } as unknown as TileryHandle;
    return { handle, calls, swapCalls, activeCalls };
  }

  it('tab-bar append moves all tabs from source panel', () => {
    const { handle, calls, activeCalls } = panelDragHandle();
    tileryCommitDrag(
      handle,
      {
        ...baseDrag,
        hoverTabBar: { panelId: 'TGT', hit: { kind: 'append' } },
        hoverPanelId: null,
        hoverZone: null,
      },
      'T1',
      true,
    );
    expect(calls).toEqual([
      { tabId: 'T1', target: { panel: 'TGT', index: 1 } },
      { tabId: 'T2', target: { afterTab: 'T1' } },
      { tabId: 'T3', target: { afterTab: 'T2' } },
    ]);
  });

  it('preserves original tab order when active tab is not the first tab', () => {
    const { handle, calls, activeCalls } = panelDragHandle();
    // T2 is the active/lead tab (middle position in [T1, T2, T3])
    tileryCommitDrag(
      handle,
      {
        ...baseDrag,
        hoverTabBar: { panelId: 'TGT', hit: { kind: 'append' } },
        hoverPanelId: null,
        hoverZone: null,
      },
      'T2',
      true,
    );
    // Move T2 first, then T3 after T2, then T1 before T2 → [T1, T2, T3]
    expect(calls).toEqual([
      { tabId: 'T2', target: { panel: 'TGT', index: 1 } },
      { tabId: 'T3', target: { afterTab: 'T2' } },
      { tabId: 'T1', target: { beforeTab: 'T2' } },
    ]);
  });

  it('tab-bar before moves all tabs from source panel', () => {
    const { handle, calls, activeCalls } = panelDragHandle();
    tileryCommitDrag(
      handle,
      {
        ...baseDrag,
        hoverTabBar: {
          panelId: 'TGT',
          hit: { kind: 'before', tabId: 'TGT-T1' },
        },
        hoverPanelId: null,
        hoverZone: null,
      },
      'T1',
      true,
    );
    expect(calls).toEqual([
      { tabId: 'T1', target: { beforeTab: 'TGT-T1' } },
      { tabId: 'T2', target: { afterTab: 'T1' } },
      { tabId: 'T3', target: { afterTab: 'T2' } },
    ]);
  });

  it('tab-bar after moves all tabs from source panel', () => {
    const { handle, calls, activeCalls } = panelDragHandle();
    tileryCommitDrag(
      handle,
      {
        ...baseDrag,
        hoverTabBar: {
          panelId: 'TGT',
          hit: { kind: 'after', tabId: 'TGT-T1' },
        },
        hoverPanelId: null,
        hoverZone: null,
      },
      'T1',
      true,
    );
    expect(calls).toEqual([
      { tabId: 'T1', target: { afterTab: 'TGT-T1' } },
      { tabId: 'T2', target: { afterTab: 'T1' } },
      { tabId: 'T3', target: { afterTab: 'T2' } },
    ]);
  });

  it('center zone moves all tabs to target panel', () => {
    const { handle, calls, activeCalls } = panelDragHandle();
    tileryCommitDrag(
      handle,
      {
        ...baseDrag,
        hoverTabBar: null,
        hoverPanelId: 'TGT',
        hoverZone: 'center',
      },
      'T1',
      true,
    );
    expect(calls).toEqual([
      { tabId: 'T1', target: { panel: 'TGT', index: 1 } },
      { tabId: 'T2', target: { afterTab: 'T1' } },
      { tabId: 'T3', target: { afterTab: 'T2' } },
    ]);
  });

  it('directional zone splits and moves all tabs when panelDrag=true', () => {
    const { handle, calls, swapCalls, activeCalls } = panelDragHandle();
    tileryCommitDrag(
      handle,
      {
        ...baseDrag,
        hoverTabBar: null,
        hoverPanelId: 'TGT',
        hoverZone: 'right',
      },
      'T1',
      true,
    );
    expect(swapCalls).toEqual([]);
    expect(calls).toEqual([
      {
        tabId: 'T1',
        target: { splitPanel: 'TGT', direction: 'right', sizePercent: 50 },
      },
      { tabId: 'T2', target: { afterTab: 'T1' } },
      { tabId: 'T3', target: { afterTab: 'T2' } },
    ]);
  });

  it('directional zone on own panel splits and moves siblings', () => {
    const calls: { tabId: TileryTabId; target: unknown }[] = [];
    const swapCalls: { a: string; b: string }[] = [];
    const handle = {
      getPanel(_id: string) {
        return {
          id: 'SRC',
          tabs: [{ id: 'T1' }, { id: 'T2' }],
          inset: { top: 0, right: 0, bottom: 0, left: 0 },
        };
      },
      getTab(_id: TileryTabId) {
        return {
          id: _id,
          panel: {
            id: 'SRC',
            tabs: [{ id: 'T1' }, { id: 'T2' }],
            inset: { top: 0, right: 0, bottom: 0, left: 0 },
          },
        };
      },
      moveTab(tabId: TileryTabId, target: unknown) {
        calls.push({ tabId, target });
      },
      swapPanels(a: string, b: string) {
        swapCalls.push({ a, b });
      },
      setActiveTab() {},
    } as unknown as TileryHandle;
    tileryCommitDrag(
      handle,
      {
        ...baseDrag,
        hoverTabBar: null,
        hoverPanelId: 'SRC',
        hoverZone: 'left',
      },
      'T1',
      true,
    );
    expect(swapCalls).toEqual([]);
    expect(calls).toEqual([
      {
        tabId: 'T1',
        target: { splitPanel: 'SRC', direction: 'left', sizePercent: 50 },
      },
      { tabId: 'T2', target: { afterTab: 'T1' } },
    ]);
  });

  it('no-op when dragged tab is not found', () => {
    const calls: unknown[] = [];
    const handle = {
      getPanel() {
        return { id: 'P', tabs: [] };
      },
      getTab() {
        return null;
      },
      moveTab(...args: unknown[]) {
        calls.push(args);
      },
      swapPanels() {},
      setActiveTab() {},
    } as unknown as TileryHandle;
    tileryCommitDrag(
      handle,
      {
        ...baseDrag,
        hoverTabBar: null,
        hoverPanelId: 'P',
        hoverZone: 'center',
      },
      'MISSING',
      true,
    );
    expect(calls).toEqual([]);
  });
});
