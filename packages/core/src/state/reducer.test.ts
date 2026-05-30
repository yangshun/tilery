import { describe, expect, it } from 'vite-plus/test';
import {
  createInitialState,
  nextId,
  panelInitToReducerInit,
  reducer,
  tabInitToReducerInit,
} from './reducer';
import { deriveDividers } from './layout-math';
import type { LayoutState } from '../types';

const twoSideBySide = (): LayoutState =>
  createInitialState({
    panels: [
      {
        id: 'L',
        inset: { top: 0, right: 50, bottom: 0, left: 0 },
        tabs: [
          { id: 'L1', data: { title: 'l1' } },
          { id: 'L2', data: { title: 'l2' } },
        ],
      },
      {
        id: 'R',
        inset: { top: 0, right: 0, bottom: 0, left: 50 },
        tabs: [{ id: 'R1', data: { title: 'r1' } }],
      },
    ],
  });

describe('createInitialState', () => {
  it('assigns auto ids when not provided and treats invalid activeTabId as fallback', () => {
    const state = createInitialState({
      panels: [
        {
          inset: { top: 0, right: 0, bottom: 0, left: 0 },
          tabs: [{ data: { title: 'auto' } }, { data: { title: 'auto2' } }],
          activeTabId: 'not-a-real-id',
        },
      ],
    });
    const panelIds = Object.keys(state.panels);
    expect(panelIds[0]).toMatch(/^p_/);
    const panel = state.panels[panelIds[0]!]!;
    expect(panel.tabs).toHaveLength(2);
    expect(panel.tabs.every((t) => t.startsWith('t_'))).toBe(true);
    // Invalid activeTabId falls back to first tab
    expect(panel.activeTabId).toBe(panel.tabs[0]);
  });
  it('honors a valid activeTabId', () => {
    const state = createInitialState({
      panels: [
        {
          id: 'P',
          inset: { top: 0, right: 0, bottom: 0, left: 0 },
          tabs: [
            { id: 'A', data: {} },
            { id: 'B', data: {} },
          ],
          activeTabId: 'B',
        },
      ],
    });
    expect(state.panels.P!.activeTabId).toBe('B');
  });
  it('sets activeTabId to null when the panel has no tabs', () => {
    const state = createInitialState({
      panels: [
        { id: 'P', inset: { top: 0, right: 0, bottom: 0, left: 0 }, tabs: [] },
      ],
    });
    expect(state.panels.P!.activeTabId).toBeNull();
  });
});

describe('reducer dispatch matrix', () => {
  it('REPLACE_STATE swaps state wholesale', () => {
    const a = twoSideBySide();
    const b = createInitialState({
      panels: [
        { id: 'X', inset: { top: 0, right: 0, bottom: 0, left: 0 }, tabs: [] },
      ],
    });
    expect(reducer(a, { type: 'REPLACE_STATE', state: b })).toBe(b);
  });

  it('SPLIT_PANEL is a no-op if the source panel is missing', () => {
    const state = twoSideBySide();
    const next = reducer(state, {
      type: 'SPLIT_PANEL',
      panelId: 'phantom',
      direction: 'right',
      sizePercent: 50,
      newPanelId: 'new',
      tabs: [],
      activate: true,
    });
    expect(next).toBe(state);
  });
  it('SPLIT_PANEL with no tabs creates an empty new panel', () => {
    const state = twoSideBySide();
    const next = reducer(state, {
      type: 'SPLIT_PANEL',
      panelId: 'L',
      direction: 'right',
      sizePercent: 50,
      newPanelId: 'NEW',
      tabs: [],
      activate: true,
    });
    expect(next.panels.NEW!.tabs).toEqual([]);
    expect(next.panels.NEW!.activeTabId).toBeNull();
    expect(next.panelOrder).toEqual(['L', 'NEW', 'R']);
  });
  it('SPLIT_PANEL appends to the end of panelOrder when source is somehow not in order', () => {
    const state: LayoutState = twoSideBySide();
    const broken: LayoutState = {
      ...state,
      panelOrder: state.panelOrder.filter((p) => p !== 'L'),
    };
    const next = reducer(broken, {
      type: 'SPLIT_PANEL',
      panelId: 'L',
      direction: 'right',
      sizePercent: 50,
      newPanelId: 'NEW',
      tabs: [],
      activate: true,
    });
    expect(next.panelOrder[next.panelOrder.length - 1]).toBe('NEW');
  });

  it('REMOVE_PANEL is a no-op if the panel is missing', () => {
    const state = twoSideBySide();
    const next = reducer(state, { type: 'REMOVE_PANEL', panelId: 'phantom' });
    expect(next).toBe(state);
  });
  it('REMOVE_PANEL with only one panel left drops both panel and its tabs', () => {
    const state = createInitialState({
      panels: [
        {
          id: 'only',
          inset: { top: 0, right: 0, bottom: 0, left: 0 },
          tabs: [{ id: 'T', data: {} }],
        },
      ],
    });
    const next = reducer(state, { type: 'REMOVE_PANEL', panelId: 'only' });
    expect(next.panels.only).toBeUndefined();
    expect(next.tabs.T).toBeUndefined();
    expect(next.panelOrder).toEqual([]);
  });

  it('APPEND_TAB is a no-op if the panel is missing', () => {
    const state = twoSideBySide();
    const next = reducer(state, {
      type: 'APPEND_TAB',
      panelId: 'phantom',
      tab: { id: 'X', data: {} },
      activate: true,
    });
    expect(next).toBe(state);
  });
  it('APPEND_TAB with activate=false keeps existing active tab', () => {
    const state = twoSideBySide();
    const next = reducer(state, {
      type: 'APPEND_TAB',
      panelId: 'L',
      tab: { id: 'NEW', data: {} },
      activate: false,
    });
    expect(next.panels.L!.tabs).toEqual(['L1', 'L2', 'NEW']);
    expect(next.panels.L!.activeTabId).toBe('L1');
  });
  it('APPEND_TAB activates the new tab when panel had no active', () => {
    let state = twoSideBySide();
    state = {
      ...state,
      panels: { ...state.panels, R: { ...state.panels.R!, activeTabId: null } },
    };
    const next = reducer(state, {
      type: 'APPEND_TAB',
      panelId: 'R',
      tab: { id: 'NEW', data: {} },
      activate: false,
    });
    expect(next.panels.R!.activeTabId).toBe('NEW');
  });

  it('INSERT_TAB is a no-op if panel missing', () => {
    const state = twoSideBySide();
    const next = reducer(state, {
      type: 'INSERT_TAB',
      panelId: 'phantom',
      tab: { id: 'X', data: {} },
      index: 0,
      activate: true,
    });
    expect(next).toBe(state);
  });
  it('INSERT_TAB clamps index above tabs length to end', () => {
    const state = twoSideBySide();
    const next = reducer(state, {
      type: 'INSERT_TAB',
      panelId: 'L',
      tab: { id: 'X', data: {} },
      index: 999,
      activate: true,
    });
    expect(next.panels.L!.tabs).toEqual(['L1', 'L2', 'X']);
  });
  it('INSERT_TAB clamps negative index to 0', () => {
    const state = twoSideBySide();
    const next = reducer(state, {
      type: 'INSERT_TAB',
      panelId: 'L',
      tab: { id: 'X', data: {} },
      index: -10,
      activate: true,
    });
    expect(next.panels.L!.tabs).toEqual(['X', 'L1', 'L2']);
  });
  it('INSERT_TAB activate=false keeps current activeTabId', () => {
    const state = twoSideBySide();
    const next = reducer(state, {
      type: 'INSERT_TAB',
      panelId: 'L',
      tab: { id: 'X', data: {} },
      index: 0,
      activate: false,
    });
    expect(next.panels.L!.activeTabId).toBe('L1');
  });
  it('INSERT_TAB activates new tab when panel had no active', () => {
    let state = twoSideBySide();
    state = {
      ...state,
      panels: { ...state.panels, R: { ...state.panels.R!, activeTabId: null } },
    };
    const next = reducer(state, {
      type: 'INSERT_TAB',
      panelId: 'R',
      tab: { id: 'X', data: {} },
      index: 0,
      activate: false,
    });
    expect(next.panels.R!.activeTabId).toBe('X');
  });

  it('REMOVE_TAB is a no-op if tab missing', () => {
    const state = twoSideBySide();
    const next = reducer(state, { type: 'REMOVE_TAB', tabId: 'phantom' });
    expect(next).toBe(state);
  });
  it('REMOVE_TAB is a no-op if the back-reference panel is missing', () => {
    let state = twoSideBySide();
    state = {
      ...state,
      tabs: { ...state.tabs, L1: { ...state.tabs.L1!, panelId: 'phantom' } },
    };
    const next = reducer(state, { type: 'REMOVE_TAB', tabId: 'L1' });
    expect(next).toBe(state);
  });
  it('REMOVE_TAB picks the next tab as active when active was removed', () => {
    const state = twoSideBySide();
    const next = reducer(state, { type: 'REMOVE_TAB', tabId: 'L1' });
    expect(next.panels.L!.tabs).toEqual(['L2']);
    expect(next.panels.L!.activeTabId).toBe('L2');
  });
  it('REMOVE_TAB keeps existing active when removing a non-active tab', () => {
    const state = twoSideBySide();
    const next = reducer(state, { type: 'REMOVE_TAB', tabId: 'L2' });
    expect(next.panels.L!.activeTabId).toBe('L1');
  });

  it('MOVE_TAB is a no-op if the tab does not exist', () => {
    const state = twoSideBySide();
    const next = reducer(state, {
      type: 'MOVE_TAB',
      tabId: 'phantom',
      to: { panelId: 'R', index: 0 },
    });
    expect(next).toBe(state);
  });
  it('MOVE_TAB is a no-op if the source panel is broken', () => {
    let state = twoSideBySide();
    state = {
      ...state,
      tabs: { ...state.tabs, L1: { ...state.tabs.L1!, panelId: 'phantom' } },
    };
    const next = reducer(state, {
      type: 'MOVE_TAB',
      tabId: 'L1',
      to: { panelId: 'R', index: 0 },
    });
    expect(next).toBe(state);
  });
  it('MOVE_TAB beforeTab is a no-op if ref tab is missing', () => {
    const state = twoSideBySide();
    const next = reducer(state, {
      type: 'MOVE_TAB',
      tabId: 'L1',
      to: { beforeTabId: 'phantom' },
    });
    expect(next).toBe(state);
  });
  it('MOVE_TAB beforeTab is a no-op if ref equals the tab being moved', () => {
    const state = twoSideBySide();
    const next = reducer(state, {
      type: 'MOVE_TAB',
      tabId: 'L1',
      to: { beforeTabId: 'L1' },
    });
    expect(next).toBe(state);
  });
  it('MOVE_TAB beforeTab returns state when the ref tab panel is missing', () => {
    let state = twoSideBySide();
    state = {
      ...state,
      tabs: { ...state.tabs, R1: { ...state.tabs.R1!, panelId: 'phantom' } },
    };
    const next = reducer(state, {
      type: 'MOVE_TAB',
      tabId: 'L1',
      to: { beforeTabId: 'R1' },
    });
    expect(next).toBe(state);
  });
  it('MOVE_TAB beforeTab within the same panel reorders', () => {
    const state = twoSideBySide();
    const next = reducer(state, {
      type: 'MOVE_TAB',
      tabId: 'L2',
      to: { beforeTabId: 'L1' },
    });
    expect(next.panels.L!.tabs).toEqual(['L2', 'L1']);
  });
  it('MOVE_TAB afterTab inserts after the ref', () => {
    const state = twoSideBySide();
    const next = reducer(state, {
      type: 'MOVE_TAB',
      tabId: 'L1',
      to: { afterTabId: 'R1' },
    });
    expect(next.panels.R!.tabs).toEqual(['R1', 'L1']);
  });
  it('MOVE_TAB target by panel index defaults to append when index too large', () => {
    const state = twoSideBySide();
    const next = reducer(state, {
      type: 'MOVE_TAB',
      tabId: 'L1',
      to: { panelId: 'R', index: 999 },
    });
    expect(next.panels.R!.tabs).toEqual(['R1', 'L1']);
  });
  it('MOVE_TAB target by panel index with negative clamps to 0', () => {
    const state = twoSideBySide();
    const next = reducer(state, {
      type: 'MOVE_TAB',
      tabId: 'L1',
      to: { panelId: 'R', index: -5 },
    });
    expect(next.panels.R!.tabs).toEqual(['L1', 'R1']);
  });
  it('MOVE_TAB target by panel reorders within same panel', () => {
    const state = twoSideBySide();
    const next = reducer(state, {
      type: 'MOVE_TAB',
      tabId: 'L1',
      to: { panelId: 'L', index: 2 },
    });
    expect(next.panels.L!.tabs).toEqual(['L2', 'L1']);
  });
  it('MOVE_TAB target panel missing → no-op', () => {
    const state = twoSideBySide();
    const next = reducer(state, {
      type: 'MOVE_TAB',
      tabId: 'L1',
      to: { panelId: 'phantom', index: 0 },
    });
    expect(next).toBe(state);
  });
  it('MOVE_TAB splitPanel: wasActive=false branch (moving a non-active tab keeps source active)', () => {
    // Source has two tabs and the moved one is NOT active.
    const state = twoSideBySide();
    const next = reducer(state, {
      type: 'MOVE_TAB',
      tabId: 'L2', // L's active is L1; L2 is not active
      to: {
        splitPanelId: 'R',
        direction: 'right',
        sizePercent: 50,
        newPanelId: 'NEWP',
      },
    });
    // Source kept active tab unchanged
    expect(next.panels.L!.activeTabId).toBe('L1');
    expect(next.panels.L!.tabs).toEqual(['L1']);
  });

  it('MOVE_TAB to another panel with non-active source tab keeps the original active', () => {
    const state = twoSideBySide();
    // L's tabs: [L1, L2], active = L1. Move L2 (non-active) to R.
    const next = reducer(state, {
      type: 'MOVE_TAB',
      tabId: 'L2',
      to: { panelId: 'R', index: 0 },
    });
    expect(next.panels.L!.activeTabId).toBe('L1');
    expect(next.panels.L!.tabs).toEqual(['L1']);
    expect(next.panels.R!.tabs).toEqual(['L2', 'R1']);
  });

  it('MOVE_TAB splitPanel target adds a new panel and moves the tab there', () => {
    const state = twoSideBySide();
    const next = reducer(state, {
      type: 'MOVE_TAB',
      tabId: 'L1',
      to: {
        splitPanelId: 'L',
        direction: 'right',
        sizePercent: 50,
        newPanelId: 'NEWP',
      },
    });
    expect(next.panels.NEWP!.tabs).toEqual(['L1']);
    expect(next.panels.L!.tabs).toEqual(['L2']);
    expect(next.tabs.L1!.panelId).toBe('NEWP');
  });

  it('MOVE_TAB splitPanel is a no-op when source is the same panel and has only this tab', () => {
    // A single-tab panel cannot be split by its own only tab — there would
    // be nothing to leave behind, and the result would be empty space.
    const state = createInitialState({
      panels: [
        {
          id: 'P',
          inset: { top: 0, right: 0, bottom: 0, left: 0 },
          tabs: [{ id: 'A', data: {} }],
        },
      ],
    });
    const next = reducer(state, {
      type: 'MOVE_TAB',
      tabId: 'A',
      to: {
        splitPanelId: 'P',
        direction: 'right',
        sizePercent: 50,
        newPanelId: 'NEW',
      },
    });
    expect(next).toBe(state);
  });

  it('MOVE_TAB splitPanel where source IS the split target shrinks the source inset', () => {
    // Single panel covering the full area, with two tabs.
    // Dragging one tab to the right zone of the SAME panel should:
    //   - shrink the source to the left half
    //   - create a new panel in the right half holding the moved tab
    const state = createInitialState({
      panels: [
        {
          id: 'P',
          inset: { top: 0, right: 0, bottom: 0, left: 0 },
          tabs: [
            { id: 'A', data: {} },
            { id: 'B', data: {} },
          ],
        },
      ],
    });
    const next = reducer(state, {
      type: 'MOVE_TAB',
      tabId: 'B',
      to: {
        splitPanelId: 'P',
        direction: 'right',
        sizePercent: 50,
        newPanelId: 'NEW',
      },
    });
    expect(next.panels.P!.inset).toEqual({
      top: 0,
      right: 50,
      bottom: 0,
      left: 0,
    });
    expect(next.panels.NEW!.inset).toEqual({
      top: 0,
      right: 0,
      bottom: 0,
      left: 50,
    });
    expect(next.panels.P!.tabs).toEqual(['A']);
    expect(next.panels.NEW!.tabs).toEqual(['B']);
  });
  it('MOVE_TAB splitPanel with active source picks next active', () => {
    const state = twoSideBySide();
    const next = reducer(state, {
      type: 'MOVE_TAB',
      tabId: 'L1',
      to: {
        splitPanelId: 'L',
        direction: 'right',
        sizePercent: 50,
        newPanelId: 'NEWP',
      },
    });
    expect(next.panels.L!.activeTabId).toBe('L2');
  });
  it('MOVE_TAB splitPanel auto-collapses source when source loses its last tab', () => {
    const state = createInitialState({
      panels: [
        {
          id: 'A',
          inset: { top: 0, right: 50, bottom: 0, left: 0 },
          tabs: [{ id: 'TA', data: {} }],
        },
        {
          id: 'B',
          inset: { top: 0, right: 0, bottom: 0, left: 50 },
          tabs: [{ id: 'TB', data: {} }],
        },
      ],
    });
    const next = reducer(state, {
      type: 'MOVE_TAB',
      tabId: 'TA',
      to: {
        splitPanelId: 'B',
        direction: 'right',
        sizePercent: 50,
        newPanelId: 'NEW',
      },
    });
    expect(next.panels.A).toBeUndefined();
  });
  it('MOVE_TAB splitPanel missing target → no-op', () => {
    const state = twoSideBySide();
    const next = reducer(state, {
      type: 'MOVE_TAB',
      tabId: 'L1',
      to: {
        splitPanelId: 'phantom',
        direction: 'right',
        sizePercent: 50,
        newPanelId: 'X',
      },
    });
    expect(next).toBe(state);
  });

  it('MOVE_TAB splitPanel target no-ops when split would violate min size', () => {
    // Target panel is only 18% wide. A 50% split would leave each half
    // at 9% — below the 10% default min — so splitFitsMin refuses the
    // action and the reducer returns the original state. (This is the
    // counterpart guard to the one on plain SPLIT_PANEL.)
    const state = createInitialState({
      panels: [
        {
          id: 'L',
          inset: { top: 0, right: 18, bottom: 0, left: 0 },
          tabs: [{ id: 'l1', data: {} }],
        },
        {
          id: 'R',
          inset: { top: 0, right: 0, bottom: 0, left: 82 },
          tabs: [{ id: 'r1', data: {} }],
        },
      ],
    });
    const next = reducer(state, {
      type: 'MOVE_TAB',
      tabId: 'l1',
      to: {
        splitPanelId: 'R',
        direction: 'right',
        sizePercent: 50,
        newPanelId: 'NEW',
      },
    });
    expect(next).toBe(state);
  });

  it('SET_ACTIVE_TAB is a no-op when tab missing', () => {
    const state = twoSideBySide();
    const next = reducer(state, { type: 'SET_ACTIVE_TAB', tabId: 'phantom' });
    expect(next).toBe(state);
  });
  it('SET_ACTIVE_TAB is a no-op when panel back-ref is broken', () => {
    let state = twoSideBySide();
    state = {
      ...state,
      tabs: { ...state.tabs, L1: { ...state.tabs.L1!, panelId: 'phantom' } },
    };
    const next = reducer(state, { type: 'SET_ACTIVE_TAB', tabId: 'L1' });
    expect(next).toBe(state);
  });
  it('SET_ACTIVE_TAB is a no-op when the tab is already active', () => {
    const state = twoSideBySide();
    const next = reducer(state, { type: 'SET_ACTIVE_TAB', tabId: 'L1' });
    expect(next).toBe(state);
  });
  it('SET_ACTIVE_TAB updates active tab', () => {
    const state = twoSideBySide();
    const next = reducer(state, { type: 'SET_ACTIVE_TAB', tabId: 'L2' });
    expect(next.panels.L!.activeTabId).toBe('L2');
  });

  it('SET_PANEL_DATA is a no-op when tab missing', () => {
    const state = twoSideBySide();
    const next = reducer(state, {
      type: 'SET_PANEL_DATA',
      tabId: 'phantom',
      data: { x: 1 },
    });
    expect(next).toBe(state);
  });
  it('SET_PANEL_DATA updates the tab data', () => {
    const state = twoSideBySide();
    const next = reducer(state, {
      type: 'SET_PANEL_DATA',
      tabId: 'L1',
      data: { renamed: true },
    });
    expect(next.tabs.L1!.data).toEqual({ renamed: true });
  });

  it('RESIZE_DIVIDER updates panel insets', () => {
    const state = twoSideBySide();
    const div = deriveDividers(state)[0]!;
    const next = reducer(state, {
      type: 'RESIZE_DIVIDER',
      dividerId: div.id,
      newPosition: 70,
    });
    expect(next.panels.L!.inset.right).toBe(30);
    expect(next.panels.R!.inset.left).toBe(70);
  });
  it('RESIZE_DIVIDER honors min size (defaults to DEFAULT_MIN_PANEL_SIZE = 10)', () => {
    const state = twoSideBySide();
    const div = deriveDividers(state)[0]!;
    const next = reducer(state, {
      type: 'RESIZE_DIVIDER',
      dividerId: div.id,
      newPosition: 2,
    });
    expect(next.panels.L!.inset.right).toBe(90);
  });
  it('RESIZE_DIVIDER honors caller-provided minSizePercent', () => {
    const state = twoSideBySide();
    const div = deriveDividers(state)[0]!;
    const next = reducer(state, {
      type: 'RESIZE_DIVIDER',
      dividerId: div.id,
      newPosition: 2,
      minSizePercent: 25,
    });
    expect(next.panels.L!.inset.right).toBe(75);
  });
  it('RESIZE_DIVIDER is a no-op for an unknown divider id', () => {
    const state = twoSideBySide();
    const next = reducer(state, {
      type: 'RESIZE_DIVIDER',
      dividerId: 'phantom',
      newPosition: 50,
    });
    expect(next).toBe(state);
  });

  it('SWAP_PANELS swaps the insets of two existing panels (content stays put)', () => {
    const state = twoSideBySide();
    const beforeL = state.panels.L!.inset;
    const beforeR = state.panels.R!.inset;
    const next = reducer(state, {
      type: 'SWAP_PANELS',
      panelA: 'L',
      panelB: 'R',
    });
    expect(next.panels.L!.inset).toEqual(beforeR);
    expect(next.panels.R!.inset).toEqual(beforeL);
    // Tabs and ids unchanged
    expect(next.panels.L!.tabs).toEqual(state.panels.L!.tabs);
    expect(next.panels.R!.tabs).toEqual(state.panels.R!.tabs);
  });
  it('SWAP_PANELS is a no-op when either panel is missing', () => {
    const state = twoSideBySide();
    expect(
      reducer(state, { type: 'SWAP_PANELS', panelA: 'phantom', panelB: 'R' }),
    ).toBe(state);
    expect(
      reducer(state, { type: 'SWAP_PANELS', panelA: 'L', panelB: 'phantom' }),
    ).toBe(state);
  });
  it('SWAP_PANELS is a no-op when given the same panel twice', () => {
    const state = twoSideBySide();
    expect(
      reducer(state, { type: 'SWAP_PANELS', panelA: 'L', panelB: 'L' }),
    ).toBe(state);
  });

  it('unknown action returns the same state (default case)', () => {
    const state = twoSideBySide();
    // intentionally wrong shape to exercise the default branch
    const next = reducer(state, { type: 'NOT_AN_ACTION' } as never);
    expect(next).toBe(state);
  });

  it('MOVE_TAB splitPanel: defensive fallback to null when active tab is missing from source.tabs', () => {
    // Construct a malformed state: tab T1 points to panel A, but A.tabs does NOT contain T1.
    // This violates the invariant; the reducer should still survive and pick null activeTabId
    // for the source via the `?? null` fallback path.
    const state: LayoutState = {
      panels: {
        A: {
          id: 'A',
          kind: 'tiled',
          inset: { top: 0, right: 50, bottom: 0, left: 0 },
          tabs: ['T_DUMMY'],
          activeTabId: 'T1',
        },
        B: {
          id: 'B',
          kind: 'tiled',
          inset: { top: 0, right: 0, bottom: 0, left: 50 },
          tabs: ['TB'],
          activeTabId: 'TB',
        },
      },
      panelOrder: ['A', 'B'],
      tabs: {
        T1: { id: 'T1', panelId: 'A', data: {} },
        T_DUMMY: { id: 'T_DUMMY', panelId: 'A', data: {} },
        TB: { id: 'TB', panelId: 'B', data: {} },
      },
    };
    const next = reducer(state, {
      type: 'MOVE_TAB',
      tabId: 'T1',
      to: {
        splitPanelId: 'B',
        direction: 'right',
        sizePercent: 50,
        newPanelId: 'NEW',
      },
    });
    // Reducer didn't crash; A still has T_DUMMY because the filter removed T1 (which wasn't there)
    expect(next.panels.A!.tabs).toEqual(['T_DUMMY']);
  });

  it('REMOVE_TAB: defensive ?? null when active tab is not in panel.tabs', () => {
    const state: LayoutState = {
      panels: {
        P: {
          id: 'P',
          kind: 'tiled',
          inset: { top: 0, right: 0, bottom: 0, left: 0 },
          tabs: ['T_OTHER'],
          activeTabId: 'T1', // refers to a tab not in tabs[]
        },
      },
      panelOrder: ['P'],
      tabs: {
        T1: { id: 'T1', panelId: 'P', data: {} },
        T_OTHER: { id: 'T_OTHER', panelId: 'P', data: {} },
      },
    };
    const next = reducer(state, { type: 'REMOVE_TAB', tabId: 'T1' });
    // The fallback returned null for activeTabId; nextTabs filter leaves T_OTHER
    expect(next.panels.P!.tabs).toEqual(['T_OTHER']);
    expect(next.panels.P!.activeTabId).toBeNull();
  });

  it('finishTabMove: defensive ?? null in same-panel move when tab id not in source.tabs', () => {
    // Trigger finishTabMove's wasActiveInSource branch via panel target (regular move)
    // where action.tabId isn't actually in source's tabs list.
    const state: LayoutState = {
      panels: {
        A: {
          id: 'A',
          kind: 'tiled',
          inset: { top: 0, right: 50, bottom: 0, left: 0 },
          tabs: ['T_DUMMY'],
          activeTabId: 'T1',
        },
        B: {
          id: 'B',
          kind: 'tiled',
          inset: { top: 0, right: 0, bottom: 0, left: 50 },
          tabs: ['TB'],
          activeTabId: 'TB',
        },
      },
      panelOrder: ['A', 'B'],
      tabs: {
        T1: { id: 'T1', panelId: 'A', data: {} },
        T_DUMMY: { id: 'T_DUMMY', panelId: 'A', data: {} },
        TB: { id: 'TB', panelId: 'B', data: {} },
      },
    };
    const next = reducer(state, {
      type: 'MOVE_TAB',
      tabId: 'T1',
      to: { panelId: 'B', index: 0 },
    });
    // A panel exists with T_DUMMY (T1 was filtered out which wasn't present anyway)
    expect(next.panels.A!.tabs).toEqual(['T_DUMMY']);
    // wasActiveInSource branched, the ?? null produced null since indexOf('T1')=-1
    expect(next.panels.A!.activeTabId).toBeNull();
  });

  it('MOVE_TAB panel target: defensive fallback when active tab missing from source.tabs', () => {
    const state: LayoutState = {
      panels: {
        A: {
          id: 'A',
          kind: 'tiled',
          inset: { top: 0, right: 50, bottom: 0, left: 0 },
          tabs: ['T_DUMMY'],
          activeTabId: 'T1',
        },
        B: {
          id: 'B',
          kind: 'tiled',
          inset: { top: 0, right: 0, bottom: 0, left: 50 },
          tabs: ['TB'],
          activeTabId: 'TB',
        },
      },
      panelOrder: ['A', 'B'],
      tabs: {
        T1: { id: 'T1', panelId: 'A', data: {} },
        T_DUMMY: { id: 'T_DUMMY', panelId: 'A', data: {} },
        TB: { id: 'TB', panelId: 'B', data: {} },
      },
    };
    const next = reducer(state, {
      type: 'MOVE_TAB',
      tabId: 'T1',
      to: { panelId: 'B', index: 0 },
    });
    // A still exists with T_DUMMY; activeTabId fell back via the ?? null branch (then back to existing)
    expect(next.panels.A).toBeDefined();
  });
});

describe('helpers', () => {
  it('nextId increments and includes the prefix', () => {
    const a = nextId('z');
    const b = nextId('z');
    expect(a).not.toBe(b);
    expect(a.startsWith('z_')).toBe(true);
  });
  it('panelInitToReducerInit auto-assigns missing ids', () => {
    const r = panelInitToReducerInit({
      inset: { top: 0, right: 0, bottom: 0, left: 0 },
      tabs: [{ data: {} }],
    });
    expect(r.id).toMatch(/^p_/);
    expect(r.tabs[0]!.id).toMatch(/^t_/);
  });
  it('panelInitToReducerInit preserves provided ids', () => {
    const r = panelInitToReducerInit({
      id: 'mine',
      inset: { top: 0, right: 0, bottom: 0, left: 0 },
      tabs: [{ id: 'tt', data: {} }],
    });
    expect(r.id).toBe('mine');
    expect(r.tabs[0]!.id).toBe('tt');
  });
  it('tabInitToReducerInit auto-assigns missing id', () => {
    const r = tabInitToReducerInit({ data: { x: 1 } });
    expect(r.id).toMatch(/^t_/);
    expect(r.data).toEqual({ x: 1 });
  });
  it('tabInitToReducerInit preserves provided id', () => {
    expect(tabInitToReducerInit({ id: 'mine', data: {} }).id).toBe('mine');
  });
});

// Cross-panel beforeTab / afterTab is what drag-onto-a-tab-in-another-panel
// dispatches at the end of a drop. Same-panel beforeTab/afterTab is already
// covered above; this pins the cross-panel behavior — the tab must land in
// the ref tab's panel, the source panel must be updated, and active-tab
// selection in the source must fall over to a sibling.
describe('MOVE_TAB — cross-panel beforeTab / afterTab', () => {
  const twoPanels = (): LayoutState =>
    createInitialState({
      panels: [
        {
          id: 'L',
          inset: { top: 0, right: 50, bottom: 0, left: 0 },
          tabs: [
            { id: 'L1', data: { n: 1 } },
            { id: 'L2', data: { n: 2 } },
          ],
          activeTabId: 'L1',
        },
        {
          id: 'R',
          inset: { top: 0, right: 0, bottom: 0, left: 50 },
          tabs: [
            { id: 'R1', data: { n: 3 } },
            { id: 'R2', data: { n: 4 } },
          ],
          activeTabId: 'R1',
        },
      ],
    });

  it('moves the tab to the ref-tab’s panel and inserts BEFORE the ref', () => {
    const next = reducer(twoPanels(), {
      type: 'MOVE_TAB',
      tabId: 'L1',
      to: { beforeTabId: 'R2' },
    });
    expect(next.panels.L!.tabs).toEqual(['L2']);
    expect(next.panels.R!.tabs).toEqual(['R1', 'L1', 'R2']);
    expect(next.tabs.L1!.panelId).toBe('R');
  });

  it('moves the tab to the ref-tab’s panel and inserts AFTER the ref', () => {
    const next = reducer(twoPanels(), {
      type: 'MOVE_TAB',
      tabId: 'L1',
      to: { afterTabId: 'R1' },
    });
    expect(next.panels.L!.tabs).toEqual(['L2']);
    expect(next.panels.R!.tabs).toEqual(['R1', 'L1', 'R2']);
    expect(next.tabs.L1!.panelId).toBe('R');
  });

  it('picks a sibling as the source panel’s new active when active is moved', () => {
    const next = reducer(twoPanels(), {
      type: 'MOVE_TAB',
      tabId: 'L1', // active in L
      to: { beforeTabId: 'R1' },
    });
    expect(next.panels.L!.activeTabId).toBe('L2');
  });

  it('activates the moved tab in the destination panel (drag-to-foreground)', () => {
    const next = reducer(twoPanels(), {
      type: 'MOVE_TAB',
      tabId: 'L2', // not active in L
      to: { beforeTabId: 'R2' },
    });
    // Dropping a tab into another panel makes that tab active there — this
    // is the natural drop-then-focus UX. Pins finishTabMove's intent so a
    // future refactor doesn't silently regress to "preserve old active".
    expect(next.panels.R!.activeTabId).toBe('L2');
  });

  it('auto-collapses the source panel when its last tab moves out via beforeTab', () => {
    const state = createInitialState({
      panels: [
        {
          id: 'L',
          inset: { top: 0, right: 50, bottom: 0, left: 0 },
          tabs: [{ id: 'only', data: {} }],
        },
        {
          id: 'R',
          inset: { top: 0, right: 0, bottom: 0, left: 50 },
          tabs: [{ id: 'R1', data: {} }],
        },
      ],
    });
    const next = reducer(state, {
      type: 'MOVE_TAB',
      tabId: 'only',
      to: { beforeTabId: 'R1' },
    });
    // L disappears; R expands to fill the freed space.
    expect(next.panels.L).toBeUndefined();
    expect(next.panels.R!.inset.left).toBe(0);
    expect(next.panels.R!.tabs).toEqual(['only', 'R1']);
  });
});
