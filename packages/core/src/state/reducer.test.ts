import { describe, expect, it } from 'vite-plus/test';
import {
  tileryCreateInitialState,
  tileryNextId,
  tileryPanelInitToReducerInit,
  tileryReducer,
  tileryTabInitToReducerInit,
} from './reducer';
import { tileryDeriveDividers, tileryDeriveJunctions } from './layout-math';
import { createStateFromPanels } from './test-helpers';
import type { TileryLayoutState } from '../types';

const twoSideBySide = (): TileryLayoutState =>
  createStateFromPanels({
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

const nonTilingSideBySide = (): TileryLayoutState =>
  createStateFromPanels({
    panels: [
      {
        id: 'L',
        inset: { top: 0, right: 60, bottom: 0, left: 0 },
        tabs: [
          { id: 'L1', data: { title: 'l1' } },
          { id: 'L2', data: { title: 'l2' } },
        ],
      },
      {
        id: 'R',
        inset: { top: 0, right: 0, bottom: 0, left: 60 },
        tabs: [{ id: 'R1', data: { title: 'r1' } }],
      },
    ],
  });

const tJunctionLayout = (): TileryLayoutState =>
  createStateFromPanels({
    panels: [
      {
        id: 'sidebar',
        inset: { top: 0, right: 60, bottom: 0, left: 0 },
        tabs: [{ id: 'side', data: {} }],
      },
      {
        id: 'editor',
        inset: { top: 0, right: 0, bottom: 50, left: 40 },
        tabs: [{ id: 'file', data: {} }],
      },
      {
        id: 'terminal',
        inset: { top: 50, right: 0, bottom: 0, left: 40 },
        tabs: [{ id: 'shell', data: {} }],
      },
    ],
  });

const sideBySideWithThreeLeftTabs = (activeTabId = 'L1'): TileryLayoutState =>
  createStateFromPanels({
    panels: [
      {
        id: 'L',
        inset: { top: 0, right: 50, bottom: 0, left: 0 },
        tabs: [
          { id: 'L1', data: { title: 'left 1' } },
          { id: 'L2', data: { title: 'left 2' } },
          { id: 'L3', data: { title: 'left 3' } },
        ],
        activeTabId,
      },
      {
        id: 'R',
        inset: { top: 0, right: 0, bottom: 0, left: 50 },
        tabs: [{ id: 'R1', data: { title: 'right 1' } }],
      },
    ],
  });

describe('tileryCreateInitialState', () => {
  it('assigns auto ids when not provided and treats invalid activeTabId as fallback', () => {
    const state = tileryCreateInitialState({
      type: 'panel',
      tabs: [{ data: { title: 'auto' } }, { data: { title: 'auto2' } }],
      activeTabId: 'not-a-real-id',
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
    const state = tileryCreateInitialState({
      type: 'panel',
      id: 'P',
      tabs: [
        { id: 'A', data: {} },
        { id: 'B', data: {} },
      ],
      activeTabId: 'B',
    });
    expect(state.panels.P!.activeTabId).toBe('B');
  });
  it('sets activeTabId to null when the panel has no tabs', () => {
    const state = tileryCreateInitialState({
      type: 'panel',
      id: 'P',
      tabs: [],
    });
    expect(state.panels.P!.activeTabId).toBeNull();
  });
  it('hydrates panel mode metadata and keeps only the first fullscreen panel active', () => {
    const state = tileryCreateInitialState({
      type: 'split',
      direction: 'horizontal',
      children: [
        {
          type: 'panel',
          id: 'P1',
          size: 50,
          tabs: [{ id: 'T1', data: {} }],
          fullScreen: true,
        },
        {
          type: 'panel',
          id: 'P2',
          size: 50,
          tabs: [{ id: 'T2', data: {} }],
          fullScreen: true,
        },
      ],
    });
    expect(state.panels.P1).toMatchObject({
      fullScreen: true,
    });
    expect(state.panels.P2).toMatchObject({
      fullScreen: false,
    });
  });

  it('derives insets and panel order from the initial split tree', () => {
    const state = tileryCreateInitialState({
      type: 'split',
      direction: 'horizontal',
      children: [
        {
          type: 'panel',
          id: 'sidebar',
          size: 40,
          tabs: [{ id: 'explorer', data: {} }],
        },
        {
          type: 'split',
          direction: 'vertical',
          size: 60,
          children: [
            {
              type: 'panel',
              id: 'editor',
              size: 60,
              tabs: [{ id: 'file', data: {} }],
            },
            {
              type: 'panel',
              id: 'terminal',
              size: 40,
              tabs: [{ id: 'shell', data: {} }],
            },
          ],
        },
      ],
    });

    expect(state.panelOrder).toEqual(['sidebar', 'editor', 'terminal']);
    expect(state.panels.sidebar!.inset).toEqual({
      top: 0,
      right: 60,
      bottom: 0,
      left: 0,
    });
    expect(state.panels.editor!.inset).toEqual({
      top: 0,
      right: 0,
      bottom: 40,
      left: 40,
    });
    expect(state.panels.terminal!.inset).toEqual({
      top: 60,
      right: 0,
      bottom: 0,
      left: 40,
    });
  });
});

describe('tileryReducer dispatch matrix', () => {
  it('REPLACE_STATE swaps state wholesale', () => {
    const a = twoSideBySide();
    const b = createStateFromPanels({
      panels: [
        { id: 'X', inset: { top: 0, right: 0, bottom: 0, left: 0 }, tabs: [] },
      ],
    });
    expect(tileryReducer(a, { type: 'REPLACE_STATE', state: b })).toBe(b);
  });

  it('SPLIT_PANEL is a no-op if the source panel is missing', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
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
    const next = tileryReducer(state, {
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
  it('SPLIT_PANEL falls back to flat insets when no layout tree exists', () => {
    const state = nonTilingSideBySide();
    const next = tileryReducer(state, {
      type: 'SPLIT_PANEL',
      panelId: 'L',
      direction: 'right',
      sizePercent: 50,
      newPanelId: 'NEW',
      tabs: [],
      activate: true,
    });
    expect(next.layout).toBeNull();
    expect(next.panels.L!.inset).toEqual({
      top: 0,
      right: 80,
      bottom: 0,
      left: 0,
    });
    expect(next.panels.NEW!.inset).toEqual({
      top: 0,
      right: 60,
      bottom: 0,
      left: 20,
    });
  });
  it('SPLIT_PANEL keeps flat fallback behavior when the layout tree misses the source', () => {
    const state: TileryLayoutState = {
      ...twoSideBySide(),
      layout: { kind: 'panel', panelId: 'R' },
    };
    const next = tileryReducer(state, {
      type: 'SPLIT_PANEL',
      panelId: 'L',
      direction: 'right',
      sizePercent: 50,
      newPanelId: 'NEW',
      tabs: [],
      activate: true,
    });
    expect(next.layout).toBeNull();
    expect(next.panels.L!.inset.right).toBe(75);
    expect(next.panels.NEW!.inset.left).toBe(25);
  });
  it('SPLIT_PANEL repairs panelOrder from the canonical layout tree', () => {
    const state: TileryLayoutState = twoSideBySide();
    const broken: TileryLayoutState = {
      ...state,
      panelOrder: state.panelOrder.filter((p) => p !== 'L'),
    };
    const next = tileryReducer(broken, {
      type: 'SPLIT_PANEL',
      panelId: 'L',
      direction: 'right',
      sizePercent: 50,
      newPanelId: 'NEW',
      tabs: [],
      activate: true,
    });
    expect(next.panelOrder).toEqual(['L', 'NEW', 'R']);
  });

  it('REMOVE_PANEL is a no-op if the panel is missing', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
      type: 'REMOVE_PANEL',
      panelId: 'phantom',
    });
    expect(next).toBe(state);
  });
  it('REMOVE_PANEL with only one panel left drops both panel and its tabs', () => {
    const state = createStateFromPanels({
      panels: [
        {
          id: 'only',
          inset: { top: 0, right: 0, bottom: 0, left: 0 },
          tabs: [{ id: 'T', data: {} }],
        },
      ],
    });
    const next = tileryReducer(state, {
      type: 'REMOVE_PANEL',
      panelId: 'only',
    });
    expect(next.panels.only).toBeUndefined();
    expect(next.tabs.T).toBeUndefined();
    expect(next.panelOrder).toEqual([]);
  });
  it('REMOVE_PANEL uses the flat fallback when no layout tree exists', () => {
    const state = nonTilingSideBySide();
    const next = tileryReducer(state, {
      type: 'REMOVE_PANEL',
      panelId: 'R',
    });
    expect(next.layout).toBeNull();
    expect(next.panels.R).toBeUndefined();
    expect(next.panels.L!.inset).toEqual({
      top: 0,
      right: 60,
      bottom: 0,
      left: 0,
    });
    expect(next.tabs.R1).toBeUndefined();
  });

  it('REMOVE_PANEL flat fallback expands matching fillers', () => {
    const state = createStateFromPanels({
      panels: [
        {
          id: 'L',
          inset: { top: 0, right: 50, bottom: 0, left: 0 },
          tabs: [{ id: 'L1', data: {} }],
        },
        {
          id: 'R',
          inset: { top: 0, right: 0, bottom: 0, left: 50 },
          tabs: [{ id: 'R1', data: {} }],
        },
        {
          id: 'overlap',
          inset: { top: 80, right: 80, bottom: 0, left: 0 },
          tabs: [{ id: 'O1', data: {} }],
        },
      ],
    });
    const next = tileryReducer(state, {
      type: 'REMOVE_PANEL',
      panelId: 'R',
    });
    expect(next.layout).toBeNull();
    expect(next.panels.L!.inset).toEqual({
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    });
    expect(next.panels.overlap).toBeDefined();
  });

  it('REMOVE_PANEL flat fallback handles the final remaining panel', () => {
    const state = createStateFromPanels({
      panels: [
        {
          id: 'only',
          inset: { top: 0, right: 50, bottom: 50, left: 0 },
          tabs: [{ id: 'T', data: {} }],
        },
      ],
    });
    const next = tileryReducer(state, {
      type: 'REMOVE_PANEL',
      panelId: 'only',
    });
    expect(next.panels.only).toBeUndefined();
    expect(next.tabs.T).toBeUndefined();
    expect(next.panelOrder).toEqual([]);
    expect(next.layout).toBeNull();
  });

  it('APPEND_TAB is a no-op if the panel is missing', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
      type: 'APPEND_TAB',
      panelId: 'phantom',
      tab: { id: 'X', data: {} },
      activate: true,
    });
    expect(next).toBe(state);
  });
  it('APPEND_TAB with activate=false keeps existing active tab', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
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
    const next = tileryReducer(state, {
      type: 'APPEND_TAB',
      panelId: 'R',
      tab: { id: 'NEW', data: {} },
      activate: false,
    });
    expect(next.panels.R!.activeTabId).toBe('NEW');
  });

  it('INSERT_TAB is a no-op if panel missing', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
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
    const next = tileryReducer(state, {
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
    const next = tileryReducer(state, {
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
    const next = tileryReducer(state, {
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
    const next = tileryReducer(state, {
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
    const next = tileryReducer(state, { type: 'REMOVE_TAB', tabId: 'phantom' });
    expect(next).toBe(state);
  });
  it('REMOVE_TAB is a no-op if the back-reference panel is missing', () => {
    let state = twoSideBySide();
    state = {
      ...state,
      tabs: { ...state.tabs, L1: { ...state.tabs.L1!, panelId: 'phantom' } },
    };
    const next = tileryReducer(state, { type: 'REMOVE_TAB', tabId: 'L1' });
    expect(next).toBe(state);
  });
  it('REMOVE_TAB picks the next tab as active when active was removed', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, { type: 'REMOVE_TAB', tabId: 'L1' });
    expect(next.panels.L!.tabs).toEqual(['L2']);
    expect(next.panels.L!.activeTabId).toBe('L2');
  });
  it('REMOVE_TAB keeps existing active when removing a non-active tab', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, { type: 'REMOVE_TAB', tabId: 'L2' });
    expect(next.panels.L!.activeTabId).toBe('L1');
  });

  it('REMOVE_TAB picks the previous tab when the active last tab is removed', () => {
    const state = sideBySideWithThreeLeftTabs('L3');
    const next = tileryReducer(state, { type: 'REMOVE_TAB', tabId: 'L3' });
    expect(next.panels.L!.tabs).toEqual(['L1', 'L2']);
    expect(next.panels.L!.activeTabId).toBe('L2');
  });

  it('REMOVE_TAB prunes a last-tab panel and collapses the remaining layout branch', () => {
    const state = createStateFromPanels({
      panels: [
        {
          id: 'L',
          inset: { top: 0, right: 50, bottom: 0, left: 0 },
          tabs: [{ id: 'L1', data: { title: 'left' } }],
        },
        {
          id: 'R',
          inset: { top: 0, right: 0, bottom: 0, left: 50 },
          tabs: [{ id: 'R1', data: { title: 'right' } }],
        },
      ],
    });

    const next = tileryReducer(state, { type: 'REMOVE_TAB', tabId: 'R1' });
    expect(next.panels.R).toBeUndefined();
    expect(next.panels.L!.inset).toEqual({
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    });
    expect(next.panelOrder).toEqual(['L']);
    expect(next.layout).toEqual({ kind: 'panel', panelId: 'L' });
  });

  it('MOVE_TAB is a no-op if the tab does not exist', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
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
    const next = tileryReducer(state, {
      type: 'MOVE_TAB',
      tabId: 'L1',
      to: { panelId: 'R', index: 0 },
    });
    expect(next).toBe(state);
  });
  it('MOVE_TAB beforeTab is a no-op if ref tab is missing', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
      type: 'MOVE_TAB',
      tabId: 'L1',
      to: { beforeTabId: 'phantom' },
    });
    expect(next).toBe(state);
  });
  it('MOVE_TAB beforeTab is a no-op if ref equals the tab being moved', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
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
    const next = tileryReducer(state, {
      type: 'MOVE_TAB',
      tabId: 'L1',
      to: { beforeTabId: 'R1' },
    });
    expect(next).toBe(state);
  });
  it('MOVE_TAB beforeTab within the same panel reorders', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
      type: 'MOVE_TAB',
      tabId: 'L2',
      to: { beforeTabId: 'L1' },
    });
    expect(next.panels.L!.tabs).toEqual(['L2', 'L1']);
  });
  it('MOVE_TAB afterTab inserts after the ref', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
      type: 'MOVE_TAB',
      tabId: 'L1',
      to: { afterTabId: 'R1' },
    });
    expect(next.panels.R!.tabs).toEqual(['R1', 'L1']);
  });
  it('MOVE_TAB target by panel index defaults to append when index too large', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
      type: 'MOVE_TAB',
      tabId: 'L1',
      to: { panelId: 'R', index: 999 },
    });
    expect(next.panels.R!.tabs).toEqual(['R1', 'L1']);
  });
  it('MOVE_TAB target by panel index with negative clamps to 0', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
      type: 'MOVE_TAB',
      tabId: 'L1',
      to: { panelId: 'R', index: -5 },
    });
    expect(next.panels.R!.tabs).toEqual(['L1', 'R1']);
  });
  it('MOVE_TAB target by panel reorders within same panel', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
      type: 'MOVE_TAB',
      tabId: 'L1',
      to: { panelId: 'L', index: 2 },
    });
    expect(next.panels.L!.tabs).toEqual(['L2', 'L1']);
  });
  it('MOVE_TAB target panel missing → no-op', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
      type: 'MOVE_TAB',
      tabId: 'L1',
      to: { panelId: 'phantom', index: 0 },
    });
    expect(next).toBe(state);
  });
  it('MOVE_TAB splitPanel: wasActive=false branch (moving a non-active tab keeps source active)', () => {
    // Source has two tabs and the moved one is NOT active.
    const state = twoSideBySide();
    const next = tileryReducer(state, {
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
    const next = tileryReducer(state, {
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
    const next = tileryReducer(state, {
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

  it('MOVE_TAB splitPanel uses flat fallback when no layout tree exists', () => {
    const state = nonTilingSideBySide();
    const next = tileryReducer(state, {
      type: 'MOVE_TAB',
      tabId: 'L1',
      to: {
        splitPanelId: 'R',
        direction: 'right',
        sizePercent: 50,
        newPanelId: 'NEWP',
      },
    });
    expect(next.layout).toBeNull();
    expect(next.panels.R!.inset.right).toBe(20);
    expect(next.panels.NEWP!.inset.left).toBe(80);
    expect(next.tabs.L1!.panelId).toBe('NEWP');
  });

  it('MOVE_TAB splitPanel keeps flat fallback behavior when the layout tree misses the target', () => {
    const state: TileryLayoutState = {
      ...twoSideBySide(),
      layout: { kind: 'panel', panelId: 'phantom' },
    };
    const next = tileryReducer(state, {
      type: 'MOVE_TAB',
      tabId: 'L1',
      to: {
        splitPanelId: 'R',
        direction: 'right',
        sizePercent: 50,
        newPanelId: 'NEWP',
      },
    });
    expect(next.layout).toBeNull();
    expect(next.panels.R!.inset.right).toBe(25);
    expect(next.panels.NEWP!.inset.left).toBe(75);
    expect(next.tabs.L1!.panelId).toBe('NEWP');
  });

  it('MOVE_TAB splitPanel is a no-op when source is the same panel and has only this tab', () => {
    // A single-tab panel cannot be split by its own only tab — there would
    // be nothing to leave behind, and the result would be empty space.
    const state = createStateFromPanels({
      panels: [
        {
          id: 'P',
          inset: { top: 0, right: 0, bottom: 0, left: 0 },
          tabs: [{ id: 'A', data: {} }],
        },
      ],
    });
    const next = tileryReducer(state, {
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
    const state = createStateFromPanels({
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
    const next = tileryReducer(state, {
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
    const next = tileryReducer(state, {
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
  it('MOVE_TAB splitPanel removes source when source loses its last tab', () => {
    const state = createStateFromPanels({
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
    const next = tileryReducer(state, {
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
    const next = tileryReducer(state, {
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
    // at 9% — below the 10% default min — so tilerySplitFitsMin refuses the
    // action and the tileryReducer returns the original state. (This is the
    // counterpart guard to the one on plain SPLIT_PANEL.)
    const state = createStateFromPanels({
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
    const next = tileryReducer(state, {
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
    const next = tileryReducer(state, {
      type: 'SET_ACTIVE_TAB',
      tabId: 'phantom',
    });
    expect(next).toBe(state);
  });
  it('SET_ACTIVE_TAB is a no-op when panel back-ref is broken', () => {
    let state = twoSideBySide();
    state = {
      ...state,
      tabs: { ...state.tabs, L1: { ...state.tabs.L1!, panelId: 'phantom' } },
    };
    const next = tileryReducer(state, { type: 'SET_ACTIVE_TAB', tabId: 'L1' });
    expect(next).toBe(state);
  });
  it('SET_ACTIVE_TAB is a no-op when the tab is already active', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, { type: 'SET_ACTIVE_TAB', tabId: 'L1' });
    expect(next).toBe(state);
  });
  it('SET_ACTIVE_TAB updates active tab', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, { type: 'SET_ACTIVE_TAB', tabId: 'L2' });
    expect(next.panels.L!.activeTabId).toBe('L2');
  });

  it('APPEND_TAB and INSERT_TAB open tabs at the requested location and activate them', () => {
    const appended = tileryReducer(sideBySideWithThreeLeftTabs(), {
      type: 'APPEND_TAB',
      panelId: 'L',
      tab: { id: 'L4', data: { title: 'left 4' } },
      activate: true,
    });
    expect(appended.panels.L!.tabs).toEqual(['L1', 'L2', 'L3', 'L4']);
    expect(appended.panels.L!.activeTabId).toBe('L4');
    expect(appended.panels.R!.tabs).toEqual(['R1']);
    expect(appended.panels.R!.activeTabId).toBe('R1');

    const insertedAtStart = tileryReducer(appended, {
      type: 'INSERT_TAB',
      panelId: 'L',
      tab: { id: 'L0', data: { title: 'left 0' } },
      index: 0,
      activate: true,
    });
    expect(insertedAtStart.panels.L!.tabs).toEqual([
      'L0',
      'L1',
      'L2',
      'L3',
      'L4',
    ]);
    expect(insertedAtStart.panels.L!.activeTabId).toBe('L0');

    const insertedInMiddle = tileryReducer(insertedAtStart, {
      type: 'INSERT_TAB',
      panelId: 'L',
      tab: { id: 'LM', data: { title: 'left middle' } },
      index: 2,
      activate: true,
    });
    expect(insertedInMiddle.panels.L!.tabs).toEqual([
      'L0',
      'L1',
      'LM',
      'L2',
      'L3',
      'L4',
    ]);
    expect(insertedInMiddle.panels.L!.activeTabId).toBe('LM');
  });

  it('SPLIT_PANEL inserts before and after the target in a same-axis layout', () => {
    const after = tileryReducer(sideBySideWithThreeLeftTabs(), {
      type: 'SPLIT_PANEL',
      panelId: 'L',
      direction: 'right',
      sizePercent: 50,
      newPanelId: 'NEW',
      tabs: [{ id: 'N1', data: { title: 'new' } }],
      activate: true,
    });
    expect(after.panelOrder).toEqual(['L', 'NEW', 'R']);
    expect(after.panels.L!.inset).toEqual({
      top: 0,
      right: 75,
      bottom: 0,
      left: 0,
    });
    expect(after.panels.NEW!.inset).toEqual({
      top: 0,
      right: 50,
      bottom: 0,
      left: 25,
    });

    const before = tileryReducer(sideBySideWithThreeLeftTabs(), {
      type: 'SPLIT_PANEL',
      panelId: 'L',
      direction: 'left',
      sizePercent: 50,
      newPanelId: 'NEW',
      tabs: [{ id: 'N1', data: { title: 'new' } }],
      activate: true,
    });
    expect(before.panelOrder).toEqual(['NEW', 'L', 'R']);
    expect(before.panels.NEW!.inset).toEqual({
      top: 0,
      right: 75,
      bottom: 0,
      left: 0,
    });
    expect(before.panels.L!.inset).toEqual({
      top: 0,
      right: 50,
      bottom: 0,
      left: 25,
    });
  });

  it('SPLIT_PANEL inserts before and after the target on an orthogonal axis without moving siblings', () => {
    const below = tileryReducer(sideBySideWithThreeLeftTabs(), {
      type: 'SPLIT_PANEL',
      panelId: 'L',
      direction: 'bottom',
      sizePercent: 50,
      newPanelId: 'NEW',
      tabs: [{ id: 'N1', data: { title: 'new' } }],
      activate: true,
    });
    expect(below.panelOrder).toEqual(['L', 'NEW', 'R']);
    expect(below.panels.L!.inset).toEqual({
      top: 0,
      right: 50,
      bottom: 50,
      left: 0,
    });
    expect(below.panels.NEW!.inset).toEqual({
      top: 50,
      right: 50,
      bottom: 0,
      left: 0,
    });
    expect(below.panels.R!.inset).toEqual({
      top: 0,
      right: 0,
      bottom: 0,
      left: 50,
    });

    const above = tileryReducer(sideBySideWithThreeLeftTabs(), {
      type: 'SPLIT_PANEL',
      panelId: 'L',
      direction: 'top',
      sizePercent: 50,
      newPanelId: 'NEW',
      tabs: [{ id: 'N1', data: { title: 'new' } }],
      activate: true,
    });
    expect(above.panelOrder).toEqual(['NEW', 'L', 'R']);
    expect(above.panels.NEW!.inset).toEqual({
      top: 0,
      right: 50,
      bottom: 50,
      left: 0,
    });
    expect(above.panels.L!.inset).toEqual({
      top: 50,
      right: 50,
      bottom: 0,
      left: 0,
    });
  });

  it('SET_PANEL_DATA is a no-op when tab missing', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
      type: 'SET_PANEL_DATA',
      tabId: 'phantom',
      data: { x: 1 },
    });
    expect(next).toBe(state);
  });
  it('SET_PANEL_DATA updates the tab data', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
      type: 'SET_PANEL_DATA',
      tabId: 'L1',
      data: { renamed: true },
    });
    expect(next.tabs.L1!.data).toEqual({ renamed: true });
  });

  it('RESIZE_DIVIDER updates panel insets', () => {
    const state = twoSideBySide();
    const div = tileryDeriveDividers(state)[0]!;
    const next = tileryReducer(state, {
      type: 'RESIZE_DIVIDER',
      dividerId: div.id,
      newPosition: 70,
    });
    expect(next.panels.L!.inset.right).toBe(30);
    expect(next.panels.R!.inset.left).toBe(70);
  });
  it('RESIZE_DIVIDER honors min size (defaults to TILERY_DEFAULT_MIN_PANEL_SIZE = 10)', () => {
    const state = twoSideBySide();
    const div = tileryDeriveDividers(state)[0]!;
    const next = tileryReducer(state, {
      type: 'RESIZE_DIVIDER',
      dividerId: div.id,
      newPosition: 2,
    });
    expect(next.panels.L!.inset.right).toBe(90);
  });
  it('RESIZE_DIVIDER honors caller-provided minSizePercent', () => {
    const state = twoSideBySide();
    const div = tileryDeriveDividers(state)[0]!;
    const next = tileryReducer(state, {
      type: 'RESIZE_DIVIDER',
      dividerId: div.id,
      newPosition: 2,
      minSizePercent: 25,
    });
    expect(next.panels.L!.inset.right).toBe(75);
  });
  it('RESIZE_DIVIDER is a no-op for an unknown divider id', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
      type: 'RESIZE_DIVIDER',
      dividerId: 'phantom',
      newPosition: 50,
    });
    expect(next).toBe(state);
  });

  it('RESIZE_JUNCTION updates both divider axes for a T-junction', () => {
    const state = tJunctionLayout();
    const junction = tileryDeriveJunctions(state)[0]!;
    const next = tileryReducer(state, {
      type: 'RESIZE_JUNCTION',
      junctionId: junction.id,
      x: 30,
      y: 70,
    });
    expect(next.panels.sidebar!.inset.right).toBe(70);
    expect(next.panels.editor!.inset).toEqual({
      top: 0,
      right: 0,
      bottom: 30,
      left: 30,
    });
    expect(next.panels.terminal!.inset.top).toBe(70);
  });

  it('RESIZE_JUNCTION is a no-op for an unknown junction id', () => {
    const state = tJunctionLayout();
    const next = tileryReducer(state, {
      type: 'RESIZE_JUNCTION',
      junctionId: 'phantom',
      x: 30,
      y: 70,
    });
    expect(next).toBe(state);
  });

  it('SWAP_PANELS swaps the insets of two existing panels (content stays put)', () => {
    const state = twoSideBySide();
    const beforeL = state.panels.L!.inset;
    const beforeR = state.panels.R!.inset;
    const next = tileryReducer(state, {
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
  it('SWAP_PANELS swaps flat insets when no layout tree exists', () => {
    const state = nonTilingSideBySide();
    const beforeL = state.panels.L!.inset;
    const beforeR = state.panels.R!.inset;
    const next = tileryReducer(state, {
      type: 'SWAP_PANELS',
      panelA: 'L',
      panelB: 'R',
    });
    expect(next.layout).toBeNull();
    expect(next.panels.L!.inset).toEqual(beforeR);
    expect(next.panels.R!.inset).toEqual(beforeL);
  });
  it('SWAP_PANELS is a no-op when either panel is missing', () => {
    const state = twoSideBySide();
    expect(
      tileryReducer(state, {
        type: 'SWAP_PANELS',
        panelA: 'phantom',
        panelB: 'R',
      }),
    ).toBe(state);
    expect(
      tileryReducer(state, {
        type: 'SWAP_PANELS',
        panelA: 'L',
        panelB: 'phantom',
      }),
    ).toBe(state);
  });
  it('SWAP_PANELS is a no-op when given the same panel twice', () => {
    const state = twoSideBySide();
    expect(
      tileryReducer(state, { type: 'SWAP_PANELS', panelA: 'L', panelB: 'L' }),
    ).toBe(state);
  });

  it('unknown action returns the same state (default case)', () => {
    const state = twoSideBySide();
    // intentionally wrong shape to exercise the default branch
    const next = tileryReducer(state, { type: 'NOT_AN_ACTION' } as never);
    expect(next).toBe(state);
  });

  it('MOVE_TAB splitPanel: defensive fallback to null when active tab is missing from source.tabs', () => {
    // Construct a malformed state: tab T1 points to panel A, but A.tabs does NOT contain T1.
    // This violates the invariant; the tileryReducer should still survive and pick null activeTabId
    // for the source via the `?? null` fallback path.
    const state: TileryLayoutState = {
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
    const next = tileryReducer(state, {
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
    const state: TileryLayoutState = {
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
    const next = tileryReducer(state, { type: 'REMOVE_TAB', tabId: 'T1' });
    // The fallback returned null for activeTabId; nextTabs filter leaves T_OTHER
    expect(next.panels.P!.tabs).toEqual(['T_OTHER']);
    expect(next.panels.P!.activeTabId).toBeNull();
  });

  it('finishTabMove: defensive ?? null in same-panel move when tab id not in source.tabs', () => {
    // Trigger finishTabMove's wasActiveInSource branch via panel target (regular move)
    // where action.tabId isn't actually in source's tabs list.
    const state: TileryLayoutState = {
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
    const next = tileryReducer(state, {
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
    const state: TileryLayoutState = {
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
    const next = tileryReducer(state, {
      type: 'MOVE_TAB',
      tabId: 'T1',
      to: { panelId: 'B', index: 0 },
    });
    // A still exists with T_DUMMY; activeTabId fell back via the ?? null branch (then back to existing)
    expect(next.panels.A).toBeDefined();
  });
});

describe('helpers', () => {
  it('tileryNextId increments and includes the prefix', () => {
    const a = tileryNextId('z');
    const b = tileryNextId('z');
    expect(a).not.toBe(b);
    expect(a.startsWith('z_')).toBe(true);
  });
  it('tileryPanelInitToReducerInit auto-assigns missing ids', () => {
    const r = tileryPanelInitToReducerInit({
      type: 'panel',
      tabs: [{ data: {} }],
    });
    expect(r.id).toMatch(/^p_/);
    expect(r.tabs[0]!.id).toMatch(/^t_/);
  });
  it('tileryPanelInitToReducerInit preserves provided ids', () => {
    const r = tileryPanelInitToReducerInit({
      type: 'panel',
      id: 'mine',
      tabs: [{ id: 'tt', data: {} }],
    });
    expect(r.id).toBe('mine');
    expect(r.tabs[0]!.id).toBe('tt');
  });
  it('tileryTabInitToReducerInit auto-assigns missing id', () => {
    const r = tileryTabInitToReducerInit({ data: { x: 1 } });
    expect(r.id).toMatch(/^t_/);
    expect(r.data).toEqual({ x: 1 });
  });
  it('tileryTabInitToReducerInit preserves provided id', () => {
    expect(tileryTabInitToReducerInit({ id: 'mine', data: {} }).id).toBe(
      'mine',
    );
  });
});

// Cross-panel beforeTab / afterTab is what drag-onto-a-tab-in-another-panel
// dispatches at the end of a drop. Same-panel beforeTab/afterTab is already
// covered above; this pins the cross-panel behavior — the tab must land in
// the ref tab's panel, the source panel must be updated, and active-tab
// selection in the source must fall over to a sibling.
describe('MOVE_TAB — cross-panel beforeTab / afterTab', () => {
  const twoPanels = (): TileryLayoutState =>
    createStateFromPanels({
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
    const next = tileryReducer(twoPanels(), {
      type: 'MOVE_TAB',
      tabId: 'L1',
      to: { beforeTabId: 'R2' },
    });
    expect(next.panels.L!.tabs).toEqual(['L2']);
    expect(next.panels.R!.tabs).toEqual(['R1', 'L1', 'R2']);
    expect(next.tabs.L1!.panelId).toBe('R');
  });

  it('moves the tab to the ref-tab’s panel and inserts AFTER the ref', () => {
    const next = tileryReducer(twoPanels(), {
      type: 'MOVE_TAB',
      tabId: 'L1',
      to: { afterTabId: 'R1' },
    });
    expect(next.panels.L!.tabs).toEqual(['L2']);
    expect(next.panels.R!.tabs).toEqual(['R1', 'L1', 'R2']);
    expect(next.tabs.L1!.panelId).toBe('R');
  });

  it('picks a sibling as the source panel’s new active when active is moved', () => {
    const next = tileryReducer(twoPanels(), {
      type: 'MOVE_TAB',
      tabId: 'L1', // active in L
      to: { beforeTabId: 'R1' },
    });
    expect(next.panels.L!.activeTabId).toBe('L2');
  });

  it('activates the moved tab in the destination panel (drag-to-foreground)', () => {
    const next = tileryReducer(twoPanels(), {
      type: 'MOVE_TAB',
      tabId: 'L2', // not active in L
      to: { beforeTabId: 'R2' },
    });
    // Dropping a tab into another panel makes that tab active there — this
    // is the natural drop-then-focus UX. Pins finishTabMove's intent so a
    // future refactor doesn't silently regress to "preserve old active".
    expect(next.panels.R!.activeTabId).toBe('L2');
  });

  it('removes the source panel when its last tab moves out via beforeTab', () => {
    const state = createStateFromPanels({
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
    const next = tileryReducer(state, {
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

describe('tileryReducer — panel mode state', () => {
  it('SET_PANEL_FULLSCREEN is a no-op for missing or already-restored panels', () => {
    const state = twoSideBySide();
    expect(
      tileryReducer(state, {
        type: 'SET_PANEL_FULLSCREEN',
        panelId: 'phantom',
        fullScreen: true,
      }),
    ).toBe(state);
    expect(
      tileryReducer(state, {
        type: 'SET_PANEL_FULLSCREEN',
        panelId: 'L',
        fullScreen: false,
      }),
    ).toBe(state);
  });

  it('SET_PANEL_FULLSCREEN makes one panel fullscreen at a time', () => {
    const base = twoSideBySide();
    const state: TileryLayoutState = {
      ...base,
      panels: {
        ...base.panels,
        R: { ...base.panels.R!, fullScreen: true },
      },
    };
    const next = tileryReducer(state, {
      type: 'SET_PANEL_FULLSCREEN',
      panelId: 'L',
      fullScreen: true,
    });
    expect(next.panels.L!.fullScreen).toBe(true);
    expect(next.panels.R!.fullScreen).toBe(false);
  });

  it('SET_PANEL_FULLSCREEN true is a no-op when the panel is already fullscreen', () => {
    const state = tileryReducer(twoSideBySide(), {
      type: 'SET_PANEL_FULLSCREEN',
      panelId: 'L',
      fullScreen: true,
    });
    expect(
      tileryReducer(state, {
        type: 'SET_PANEL_FULLSCREEN',
        panelId: 'L',
        fullScreen: true,
      }),
    ).toBe(state);
  });

  it('SET_PANEL_FULLSCREEN false restores a fullscreen panel', () => {
    const state = tileryReducer(twoSideBySide(), {
      type: 'SET_PANEL_FULLSCREEN',
      panelId: 'L',
      fullScreen: true,
    });
    const next = tileryReducer(state, {
      type: 'SET_PANEL_FULLSCREEN',
      panelId: 'L',
      fullScreen: false,
    });
    expect(next.panels.L!.fullScreen).toBe(false);
  });

  it('suppresses dividers and fullscreen-target splits while a panel is fullscreen', () => {
    const state = tileryReducer(twoSideBySide(), {
      type: 'SET_PANEL_FULLSCREEN',
      panelId: 'L',
      fullScreen: true,
    });
    expect(tileryDeriveDividers(state)).toEqual([]);
    expect(
      tileryReducer(state, {
        type: 'SPLIT_PANEL',
        panelId: 'L',
        direction: 'right',
        sizePercent: 50,
        newPanelId: 'NEW',
        tabs: [],
        activate: true,
      }),
    ).toBe(state);
    expect(
      tileryReducer(state, {
        type: 'MOVE_TAB',
        tabId: 'R1',
        to: {
          splitPanelId: 'L',
          direction: 'right',
          sizePercent: 50,
          newPanelId: 'NEW',
        },
      }),
    ).toBe(state);
  });
});
