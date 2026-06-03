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
  it('normalizes tab locked=true to explicit close and drag locks', () => {
    const state = tileryCreateInitialState({
      type: 'panel',
      id: 'P',
      tabs: [{ id: 'A', data: {}, locked: true }],
    });

    expect(state.tabs.A).toMatchObject({
      id: 'A',
      panelId: 'P',
      closeable: false,
      draggable: false,
    });
  });
  it('builds root layouts with detached floating panels', () => {
    const state = tileryCreateInitialState({
      type: 'root',
      main: {
        type: 'panel',
        id: 'main',
        tabs: [{ id: 'main-tab', data: {} }],
      },
      floating: [
        {
          type: 'floatingPanel',
          id: 'palette',
          bounds: { x: 12, y: 8, width: 36, height: 44 },
          locked: true,
          tabs: [{ id: 'palette-tab', data: {}, locked: true }],
        },
      ],
    });

    expect(state.panelOrder).toEqual(['main']);
    expect(state.floatingPanelOrder).toEqual(['palette']);
    expect(state.layout).toMatchObject({ kind: 'panel', panelId: 'main' });
    expect(state.panels.palette).toMatchObject({
      kind: 'floating',
      floating: {
        bounds: { x: 12, y: 8, width: 36, height: 44 },
        zIndex: 20,
      },
      behavior: {
        resizable: false,
        draggable: false,
        droppable: false,
      },
    });
    expect(state.tabs['palette-tab']).toMatchObject({
      panelId: 'palette',
      closeable: false,
      draggable: false,
    });
  });

  it('builds floating panels with generated ids, generated tabs, and no active tab fallback', () => {
    const state = tileryCreateInitialState({
      type: 'root',
      main: { type: 'empty' },
      floating: [
        {
          type: 'floatingPanel',
          tabs: [{ data: { title: 'generated' } }],
        },
        {
          type: 'floatingPanel',
          tabs: [],
        },
      ],
    });

    const [withTabId, emptyId] = state.floatingPanelOrder!;
    const withTab = state.panels[withTabId!]!;
    const empty = state.panels[emptyId!]!;

    expect(withTabId).toMatch(/^p_/);
    expect(withTab.tabs[0]).toMatch(/^t_/);
    expect(state.tabs[withTab.tabs[0]!]!.panelId).toBe(withTabId);
    expect(empty.activeTabId).toBeNull();
  });

  it('honors fullscreen on only the first floating panel that requests it', () => {
    const state = tileryCreateInitialState({
      type: 'root',
      main: { type: 'empty' },
      floating: [
        {
          type: 'floatingPanel',
          id: 'first',
          fullScreen: true,
          tabs: [{ id: 'first-tab', data: {} }],
        },
        {
          type: 'floatingPanel',
          id: 'second',
          fullScreen: true,
          tabs: [{ id: 'second-tab', data: {} }],
        },
      ],
    });

    expect(state.panels.first!.fullScreen).toBe(true);
    expect(state.panels.second!.fullScreen).toBe(false);
  });

  it('builds root layouts with native popout metadata', () => {
    const state = tileryCreateInitialState({
      type: 'root',
      main: { type: 'empty' },
      floating: [
        {
          type: 'floatingPanel',
          id: 'preview',
          popout: {
            windowBounds: { left: 24, top: 32, width: 640, height: 420 },
          },
          tabs: [{ id: 'preview-tab', data: {} }],
        },
      ],
    });

    expect(state.floatingPanelOrder).toEqual(['preview']);
    expect(state.panels.preview).toMatchObject({
      kind: 'floating',
      floating: {
        popout: {
          windowBounds: { left: 24, top: 32, width: 640, height: 420 },
        },
      },
    });
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
      type: 'group',
      direction: 'horizontal',
      children: [
        {
          type: 'panel',
          id: 'P1',
          size: 50,
          resizable: false,
          tabs: [{ id: 'T1', data: {} }],
          fullScreen: true,
          minSize: 20,
          maxSize: 70,
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
      minSize: 20,
      maxSize: 70,
    });
    expect(state.panels.P2).toMatchObject({
      fullScreen: false,
    });
    expect(state.layout).toMatchObject({
      kind: 'split',
      children: [
        { kind: 'panel', panelId: 'P1', resizable: false },
        { kind: 'panel', panelId: 'P2' },
      ],
    });
  });

  it('preserves item resize locks when a single-child initial group collapses', () => {
    const state = tileryCreateInitialState({
      type: 'group',
      direction: 'horizontal',
      children: [
        {
          type: 'panel',
          id: 'Only',
          resizable: false,
          tabs: [{ id: 'T', data: {} }],
        },
      ],
    });

    expect(state.layout).toMatchObject({
      kind: 'panel',
      panelId: 'Only',
      resizable: false,
    });
  });

  it('preserves item movement locks when a single-child initial group collapses', () => {
    const state = tileryCreateInitialState({
      type: 'group',
      direction: 'horizontal',
      children: [
        {
          type: 'panel',
          id: 'Only',
          locked: true,
          tabs: [{ id: 'T', data: {} }],
        },
      ],
    });

    expect(state.layout).toMatchObject({
      kind: 'panel',
      panelId: 'Only',
      resizable: false,
      draggable: false,
      droppable: false,
    });
  });

  it('normalizes locked layout items to explicit behavior booleans', () => {
    const state = tileryCreateInitialState({
      type: 'group',
      direction: 'horizontal',
      children: [
        {
          type: 'panel',
          id: 'Locked',
          locked: true,
          tabs: [{ id: 'A', data: {} }],
        },
        {
          type: 'panel',
          id: 'Open',
          tabs: [{ id: 'B', data: {} }],
        },
      ],
    });

    expect(state.layout).toMatchObject({
      kind: 'split',
      resizable: true,
      draggable: true,
      droppable: true,
      children: [
        {
          kind: 'panel',
          panelId: 'Locked',
          resizable: false,
          draggable: false,
          droppable: false,
        },
        {
          kind: 'panel',
          panelId: 'Open',
          resizable: true,
          draggable: true,
          droppable: true,
        },
      ],
    });
  });

  it('keeps resize locking independent from drag and drop behavior', () => {
    const state = tileryCreateInitialState({
      type: 'panel',
      id: 'P',
      resizable: false,
      tabs: [{ id: 'T', data: {} }],
    });

    expect(state.layout).toMatchObject({
      kind: 'panel',
      panelId: 'P',
      resizable: false,
      draggable: true,
      droppable: true,
    });
  });

  it('derives insets and panel order from the initial group tree', () => {
    const state = tileryCreateInitialState({
      type: 'group',
      direction: 'horizontal',
      children: [
        {
          type: 'panel',
          id: 'sidebar',
          size: 40,
          tabs: [{ id: 'explorer', data: {} }],
        },
        {
          type: 'group',
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

  it('normalizes empty and single-child initial groups', () => {
    const empty = tileryCreateInitialState({
      type: 'group',
      direction: 'horizontal',
      children: [],
    });
    expect(empty).toEqual({
      panels: {},
      panelOrder: [],
      floatingPanelOrder: [],
      tabs: {},
      layout: null,
    });

    const single = tileryCreateInitialState({
      type: 'group',
      direction: 'vertical',
      size: 75,
      children: [
        {
          type: 'panel',
          id: 'Only',
          size: 25,
          tabs: [{ id: 'T', data: {} }],
        },
      ],
    });
    expect(single.layout).toEqual({
      kind: 'panel',
      panelId: 'Only',
      size: 75,
      defaultSize: 75,
      resizable: true,
      draggable: true,
      droppable: true,
    });
    expect(single.panelOrder).toEqual(['Only']);
    expect(single.panels.Only!.inset).toEqual({
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    });
  });

  it('rejects legacy split initial layout nodes', () => {
    expect(() =>
      tileryCreateInitialState({
        type: 'split',
        direction: 'horizontal',
        children: [],
      } as never),
    ).toThrow('Unsupported Tilery layout type: split');
  });
});

describe('tileryReducer dispatch matrix', () => {
  it('STATE_REPLACE swaps state wholesale', () => {
    const a = twoSideBySide();
    const b = createStateFromPanels({
      panels: [
        { id: 'X', inset: { top: 0, right: 0, bottom: 0, left: 0 }, tabs: [] },
      ],
    });
    expect(tileryReducer(a, { type: 'STATE_REPLACE', state: b })).toBe(b);
  });

  it('PANEL_SPLIT is a no-op if the source panel is missing', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
      type: 'PANEL_SPLIT',
      panelId: 'phantom',
      direction: 'right',
      sizePercent: 50,
      newPanelId: 'new',
      tabs: [],
      activate: true,
    });
    expect(next).toBe(state);
  });
  it('PANEL_SPLIT with no tabs creates an empty new panel', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
      type: 'PANEL_SPLIT',
      panelId: 'L',
      direction: 'right',
      sizePercent: 50,
      newPanelId: 'NEW',
      minSize: 15,
      maxSize: 55,
      tabs: [],
      activate: true,
    });
    expect(next.panels.NEW!.tabs).toEqual([]);
    expect(next.panels.NEW!.activeTabId).toBeNull();
    expect(next.panels.NEW!.minSize).toBe(15);
    expect(next.panels.NEW!.maxSize).toBe(55);
    expect(next.panelOrder).toEqual(['L', 'NEW', 'R']);
  });
  it('PANEL_SPLIT falls back to flat insets when no layout tree exists', () => {
    const state = nonTilingSideBySide();
    const next = tileryReducer(state, {
      type: 'PANEL_SPLIT',
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
  it('PANEL_SPLIT keeps flat fallback behavior when the layout tree misses the source', () => {
    const state: TileryLayoutState = {
      ...twoSideBySide(),
      layout: { kind: 'panel', panelId: 'R' },
    };
    const next = tileryReducer(state, {
      type: 'PANEL_SPLIT',
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
  it('PANEL_SPLIT repairs panelOrder from the canonical layout tree', () => {
    const state: TileryLayoutState = twoSideBySide();
    const broken: TileryLayoutState = {
      ...state,
      panelOrder: state.panelOrder.filter((p) => p !== 'L'),
    };
    const next = tileryReducer(broken, {
      type: 'PANEL_SPLIT',
      panelId: 'L',
      direction: 'right',
      sizePercent: 50,
      newPanelId: 'NEW',
      tabs: [],
      activate: true,
    });
    expect(next.panelOrder).toEqual(['L', 'NEW', 'R']);
  });

  it('PANEL_SPLIT is a no-op when the target panel is not droppable', () => {
    const state = tileryCreateInitialState({
      type: 'group',
      direction: 'horizontal',
      children: [
        {
          type: 'panel',
          id: 'L',
          droppable: false,
          tabs: [{ id: 'L1', data: {} }],
        },
        {
          type: 'panel',
          id: 'R',
          tabs: [{ id: 'R1', data: {} }],
        },
      ],
    });
    const next = tileryReducer(state, {
      type: 'PANEL_SPLIT',
      panelId: 'L',
      direction: 'right',
      sizePercent: 50,
      newPanelId: 'NEW',
      tabs: [],
      activate: true,
    });

    expect(next).toBe(state);
  });

  it('PANEL_SPLIT is a no-op when the target panel is floating', () => {
    const state = tileryReducer(twoSideBySide(), {
      type: 'PANEL_FLOAT',
      panelId: 'L',
    });

    const next = tileryReducer(state, {
      type: 'PANEL_SPLIT',
      panelId: 'L',
      direction: 'right',
      sizePercent: 50,
      newPanelId: 'NEW',
      tabs: [],
      activate: true,
    });

    expect(next).toBe(state);
  });

  it('PANEL_REMOVE is a no-op if the panel is missing', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
      type: 'PANEL_REMOVE',
      panelId: 'phantom',
    });
    expect(next).toBe(state);
  });
  it('PANEL_FLOAT detaches a tiled panel without deleting its tabs', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
      type: 'PANEL_FLOAT',
      panelId: 'L',
      bounds: { x: 8, y: 10, width: 40, height: 42 },
    });

    expect(next.panelOrder).toEqual(['R']);
    expect(next.floatingPanelOrder).toEqual(['L']);
    expect(next.layout).toMatchObject({ kind: 'panel', panelId: 'R' });
    expect(next.panels.L).toMatchObject({
      kind: 'floating',
      inset: { top: 10, right: 52, bottom: 48, left: 8 },
      floating: {
        bounds: { x: 8, y: 10, width: 40, height: 42 },
        zIndex: 20,
      },
    });
    expect(next.tabs.L1).toMatchObject({ panelId: 'L' });
    expect(next.tabs.L2).toMatchObject({ panelId: 'L' });
  });

  it('PANEL_FLOAT applies runtime behavior options', () => {
    const next = tileryReducer(twoSideBySide(), {
      type: 'PANEL_FLOAT',
      panelId: 'L',
      bounds: { x: 8, y: 10, width: 40, height: 42 },
      behavior: { resizable: false },
    });

    expect(next.panels.L).toMatchObject({
      kind: 'floating',
      behavior: { resizable: false, draggable: true, droppable: true },
      floating: { bounds: { x: 8, y: 10, width: 40, height: 42 } },
    });
  });

  it('PANEL_FLOAT merges partial behavior options with the source panel behavior', () => {
    const state = tileryCreateInitialState({
      type: 'group',
      direction: 'horizontal',
      children: [
        {
          type: 'panel',
          id: 'L',
          draggable: false,
          droppable: false,
          tabs: [{ id: 'L1', data: {} }],
        },
        {
          type: 'panel',
          id: 'R',
          tabs: [{ id: 'R1', data: {} }],
        },
      ],
    });

    const next = tileryReducer(state, {
      type: 'PANEL_FLOAT',
      panelId: 'L',
      behavior: { resizable: false },
    });

    expect(next.panels.L).toMatchObject({
      kind: 'floating',
      behavior: { resizable: false, draggable: false, droppable: false },
    });
  });

  it('PANEL_FLOAT is a no-op if the panel is missing', () => {
    const state = twoSideBySide();

    expect(
      tileryReducer(state, {
        type: 'PANEL_FLOAT',
        panelId: 'missing',
      }),
    ).toBe(state);
  });

  it('PANEL_FLOAT focuses an already-floating panel without changing bounds', () => {
    const state = tileryReducer(twoSideBySide(), {
      type: 'PANEL_FLOAT',
      panelId: 'L',
      bounds: { x: 8, y: 10, width: 40, height: 42 },
    });

    const next = tileryReducer(state, {
      type: 'PANEL_FLOAT',
      panelId: 'L',
    });

    expect(next).toBe(state);
  });

  it('PANEL_FLOAT updates existing floating bounds and clears popout metadata', () => {
    const popped = tileryReducer(twoSideBySide(), {
      type: 'PANEL_POPOUT',
      panelId: 'L',
      opts: { floatingBounds: { x: 8, y: 10, width: 40, height: 42 } },
    });

    const next = tileryReducer(popped, {
      type: 'PANEL_FLOAT',
      panelId: 'L',
      bounds: { x: 20 },
    });

    expect(next.panels.L).toMatchObject({
      kind: 'floating',
      floating: { bounds: { x: 20, y: 10, width: 40, height: 42 } },
    });
    expect(
      next.panels.L?.kind === 'floating' && next.panels.L.floating.popout,
    ).toBeUndefined();
  });

  it('PANEL_FLOAT updates existing floating behavior', () => {
    const state = tileryReducer(twoSideBySide(), {
      type: 'PANEL_FLOAT',
      panelId: 'L',
      bounds: { x: 8, y: 10, width: 40, height: 42 },
    });

    const next = tileryReducer(state, {
      type: 'PANEL_FLOAT',
      panelId: 'L',
      behavior: { locked: true },
    });

    expect(next.panels.L).toMatchObject({
      kind: 'floating',
      behavior: { resizable: false, draggable: false, droppable: false },
      floating: { bounds: { x: 8, y: 10, width: 40, height: 42 } },
    });
  });

  it('PANEL_FLOAT detaches a tiled panel from legacy flat state', () => {
    const state = nonTilingSideBySide();
    expect(state.layout).toBeNull();

    const next = tileryReducer(state, {
      type: 'PANEL_FLOAT',
      panelId: 'L',
      bounds: { x: 5, y: 6, width: 30, height: 40 },
    });

    expect(next.layout).toBeNull();
    expect(next.panelOrder).toEqual(['R']);
    expect(next.floatingPanelOrder).toEqual(['L']);
    expect(next.panels.L).toMatchObject({
      kind: 'floating',
      floating: { bounds: { x: 5, y: 6, width: 30, height: 40 } },
    });
  });

  it('PANEL_POPOUT detaches a panel into a native window placement', () => {
    const next = tileryReducer(twoSideBySide(), {
      type: 'PANEL_POPOUT',
      panelId: 'L',
      opts: {
        floatingBounds: { x: 8, y: 10, width: 40, height: 42 },
        windowBounds: { left: 10, top: 20, width: 200, height: 120 },
        resizable: false,
      },
    });

    expect(next.panelOrder).toEqual(['R']);
    expect(next.floatingPanelOrder).toEqual(['L']);
    expect(next.panels.L).toMatchObject({
      kind: 'floating',
      behavior: { resizable: false, draggable: true, droppable: true },
      floating: {
        bounds: { x: 8, y: 10, width: 40, height: 42 },
        popout: {
          windowBounds: { left: 10, top: 20, width: 240, height: 160 },
        },
      },
    });
  });

  it('PANEL_POPOUT returns the floated state when the panel cannot be floated', () => {
    const state = twoSideBySide();

    expect(
      tileryReducer(state, {
        type: 'PANEL_POPOUT',
        panelId: 'missing',
      }),
    ).toBe(state);
  });

  it('TAB_FLOAT extracts one tab into a new floating panel', () => {
    const next = tileryReducer(twoSideBySide(), {
      type: 'TAB_FLOAT',
      tabId: 'L2',
      newPanelId: 'FLOATED',
      bounds: { x: 12, y: 14, width: 34, height: 36 },
    });

    expect(next.panelOrder).toEqual(['L', 'R']);
    expect(next.floatingPanelOrder).toEqual(['FLOATED']);
    expect(next.panels.L!.tabs).toEqual(['L1']);
    expect(next.panels.L!.activeTabId).toBe('L1');
    expect(next.panels.FLOATED).toMatchObject({
      id: 'FLOATED',
      kind: 'floating',
      tabs: ['L2'],
      activeTabId: 'L2',
      floating: {
        bounds: { x: 12, y: 14, width: 34, height: 36 },
        zIndex: 20,
      },
    });
    expect(next.tabs.L2).toMatchObject({ panelId: 'FLOATED' });
    expect(next.tabs.L2).toMatchObject({
      closeable: true,
      draggable: true,
    });
  });

  it('TAB_FLOAT applies behavior options to the created floating panel', () => {
    const next = tileryReducer(twoSideBySide(), {
      type: 'TAB_FLOAT',
      tabId: 'L2',
      newPanelId: 'FLOATED',
      behavior: { resizable: false },
    });

    expect(next.panels.FLOATED).toMatchObject({
      kind: 'floating',
      behavior: { resizable: false, draggable: true, droppable: true },
    });
  });

  it('TAB_FLOAT removes the source panel when extracting its last tab', () => {
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
      ],
    });
    const next = tileryReducer(state, {
      type: 'TAB_FLOAT',
      tabId: 'L1',
      newPanelId: 'FLOATED',
      bounds: { x: 20, y: 22, width: 30, height: 32 },
    });

    expect(next.panels.L).toBeUndefined();
    expect(next.panels.FLOATED).toMatchObject({
      kind: 'floating',
      tabs: ['L1'],
    });
    expect(next.tabs.L1).toMatchObject({ panelId: 'FLOATED' });
    expect(next.panelOrder).toEqual(['R']);
    expect(next.floatingPanelOrder).toEqual(['FLOATED']);
    expect(next.layout).toMatchObject({ kind: 'panel', panelId: 'R' });
  });

  it('TAB_FLOAT selects the next source tab when floating the active tab', () => {
    const next = tileryReducer(sideBySideWithThreeLeftTabs('L2'), {
      type: 'TAB_FLOAT',
      tabId: 'L2',
      newPanelId: 'FLOATED',
    });

    expect(next.panels.L!.tabs).toEqual(['L1', 'L3']);
    expect(next.panels.L!.activeTabId).toBe('L3');
  });

  it('TAB_FLOAT defensively clears active source tab when source tabs omit it', () => {
    const state: TileryLayoutState = {
      panels: {
        L: {
          id: 'L',
          kind: 'tiled',
          inset: { top: 0, right: 0, bottom: 0, left: 0 },
          tabs: ['DUMMY'],
          activeTabId: 'L1',
        },
      },
      panelOrder: ['L'],
      tabs: {
        L1: {
          id: 'L1',
          panelId: 'L',
          data: {},
          closeable: true,
          draggable: true,
        },
        DUMMY: {
          id: 'DUMMY',
          panelId: 'L',
          data: {},
          closeable: true,
          draggable: true,
        },
      },
      layout: null,
    };
    const next = tileryReducer(state, {
      type: 'TAB_FLOAT',
      tabId: 'L1',
      newPanelId: 'FLOATED',
    });

    expect(next.panels.L!.activeTabId).toBeNull();
  });

  it('TAB_FLOAT defaults to the source bounds when extracting from a floating panel', () => {
    const floating = tileryReducer(twoSideBySide(), {
      type: 'PANEL_FLOAT',
      panelId: 'L',
      bounds: { x: 9, y: 11, width: 35, height: 37 },
    });
    const next = tileryReducer(floating, {
      type: 'TAB_FLOAT',
      tabId: 'L2',
      newPanelId: 'FLOATED',
    });

    expect(next.panels.L).toMatchObject({
      kind: 'floating',
      tabs: ['L1'],
      floating: { bounds: { x: 9, y: 11, width: 35, height: 37 } },
    });
    expect(next.panels.FLOATED).toMatchObject({
      kind: 'floating',
      tabs: ['L2'],
      floating: { bounds: { x: 9, y: 11, width: 35, height: 37 } },
    });
    expect(next.floatingPanelOrder).toEqual(['L', 'FLOATED']);
  });

  it('TAB_FLOAT is a no-op when the tab is not draggable', () => {
    const state = createStateFromPanels({
      panels: [
        {
          id: 'L',
          inset: { top: 0, right: 0, bottom: 0, left: 0 },
          tabs: [{ id: 'L1', data: {}, draggable: false }],
        },
      ],
    });

    const next = tileryReducer(state, {
      type: 'TAB_FLOAT',
      tabId: 'L1',
      newPanelId: 'FLOATED',
    });

    expect(next).toBe(state);
  });

  it('TAB_FLOAT is a no-op when the tab is missing', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
      type: 'TAB_FLOAT',
      tabId: 'missing',
      newPanelId: 'FLOATED',
    });

    expect(next).toBe(state);
  });

  it('TAB_FLOAT is a no-op when the new panel id already exists', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
      type: 'TAB_FLOAT',
      tabId: 'L2',
      newPanelId: 'R',
    });

    expect(next).toBe(state);
  });

  it('TAB_FLOAT is a no-op when the tab source panel is missing', () => {
    const state = twoSideBySide();
    const broken = {
      ...state,
      tabs: {
        ...state.tabs,
        L2: { ...state.tabs.L2!, panelId: 'missing' },
      },
    };
    const next = tileryReducer(broken, {
      type: 'TAB_FLOAT',
      tabId: 'L2',
      newPanelId: 'FLOATED',
    });

    expect(next).toBe(broken);
  });

  it('TAB_FLOAT is a no-op when the source panel is not draggable', () => {
    const state = tileryCreateInitialState({
      type: 'group',
      direction: 'horizontal',
      children: [
        {
          type: 'panel',
          id: 'L',
          draggable: false,
          tabs: [{ id: 'L1', data: {} }],
        },
        {
          type: 'panel',
          id: 'R',
          tabs: [{ id: 'R1', data: {} }],
        },
      ],
    });

    const next = tileryReducer(state, {
      type: 'TAB_FLOAT',
      tabId: 'L1',
      newPanelId: 'FLOATED',
    });

    expect(next).toBe(state);
  });

  it('TAB_POPOUT extracts one tab into a native window placement', () => {
    const next = tileryReducer(twoSideBySide(), {
      type: 'TAB_POPOUT',
      tabId: 'L2',
      newPanelId: 'FLOATED',
      opts: {
        floatingBounds: { x: 8, y: 10, width: 40, height: 42 },
        windowBounds: { left: 10, top: 20, width: 200, height: 120 },
      },
    });

    expect(next.panels.L!.tabs).toEqual(['L1']);
    expect(next.panels.FLOATED).toMatchObject({
      kind: 'floating',
      tabs: ['L2'],
      floating: {
        bounds: { x: 8, y: 10, width: 40, height: 42 },
        popout: {
          windowBounds: { left: 10, top: 20, width: 240, height: 160 },
        },
      },
    });
    expect(next.tabs.L2).toMatchObject({ panelId: 'FLOATED' });
  });

  it('TAB_POPOUT is a no-op when the tab cannot be floated', () => {
    const state = createStateFromPanels({
      panels: [
        {
          id: 'L',
          inset: { top: 0, right: 0, bottom: 0, left: 0 },
          tabs: [{ id: 'L1', data: {}, draggable: false }],
        },
      ],
    });

    const next = tileryReducer(state, {
      type: 'TAB_POPOUT',
      tabId: 'L1',
      newPanelId: 'FLOATED',
    });

    expect(next).toBe(state);
  });

  it('PANEL_RETURN_TO_FLOATING removes native window metadata', () => {
    const poppedOut = tileryReducer(twoSideBySide(), {
      type: 'PANEL_POPOUT',
      panelId: 'L',
      opts: {
        floatingBounds: { x: 8, y: 10, width: 40, height: 42 },
      },
    });
    const next = tileryReducer(poppedOut, {
      type: 'PANEL_RETURN_TO_FLOATING',
      panelId: 'L',
      bounds: { x: 20 },
    });

    expect(next.panels.L).toMatchObject({
      kind: 'floating',
      inset: { top: 10, right: 40, bottom: 48, left: 20 },
      floating: {
        bounds: { x: 20, y: 10, width: 40, height: 42 },
      },
    });
    expect(
      next.panels.L?.kind === 'floating' && next.panels.L.floating.popout,
    ).toBeUndefined();
  });

  it('PANEL_RETURN_TO_FLOATING is a no-op for missing or ordinary floating panels', () => {
    const state = tileryReducer(twoSideBySide(), {
      type: 'PANEL_FLOAT',
      panelId: 'L',
    });

    expect(
      tileryReducer(state, {
        type: 'PANEL_RETURN_TO_FLOATING',
        panelId: 'missing',
      }),
    ).toBe(state);
    expect(
      tileryReducer(state, {
        type: 'PANEL_RETURN_TO_FLOATING',
        panelId: 'L',
      }),
    ).toBe(state);
  });

  it('PANEL_DOCK moves a floating panel back into the tiled tree', () => {
    const floating = tileryReducer(twoSideBySide(), {
      type: 'PANEL_FLOAT',
      panelId: 'L',
      bounds: { width: 30 },
    });
    const next = tileryReducer(floating, {
      type: 'PANEL_DOCK',
      panelId: 'L',
      target: { splitPanel: 'R', direction: 'left', size: 30 },
    });

    expect(next.floatingPanelOrder).toEqual([]);
    expect(next.panelOrder).toEqual(['L', 'R']);
    expect(next.panels.L).toMatchObject({
      kind: 'tiled',
      inset: { top: 0, right: 70, bottom: 0, left: 0 },
    });
    expect(next.layout).toMatchObject({
      kind: 'split',
      direction: 'horizontal',
      children: [
        { kind: 'panel', panelId: 'L', size: 30 },
        { kind: 'panel', panelId: 'R', size: 70 },
      ],
    });
  });

  it('PANEL_DOCK applies explicit layout behavior from the dock target', () => {
    const floating = tileryReducer(twoSideBySide(), {
      type: 'PANEL_FLOAT',
      panelId: 'L',
    });
    const next = tileryReducer(floating, {
      type: 'PANEL_DOCK',
      panelId: 'L',
      target: { splitPanel: 'R', direction: 'left', locked: true },
    });

    expect(next.layout).toMatchObject({
      kind: 'split',
      children: [
        {
          kind: 'panel',
          panelId: 'L',
          resizable: false,
          draggable: false,
          droppable: false,
        },
        { kind: 'panel', panelId: 'R' },
      ],
    });
  });

  it('PANEL_DOCK creates the tiled root when no tiled panels remain', () => {
    const floating = tileryReducer(
      createStateFromPanels({
        panels: [
          {
            id: 'L',
            inset: { top: 0, right: 0, bottom: 0, left: 0 },
            tabs: [{ id: 'L1', data: {} }],
          },
        ],
      }),
      { type: 'PANEL_FLOAT', panelId: 'L' },
    );

    const next = tileryReducer(floating, {
      type: 'PANEL_DOCK',
      panelId: 'L',
    });

    expect(next.panels.L).toMatchObject({ kind: 'tiled' });
    expect(next.panelOrder).toEqual(['L']);
    expect(next.floatingPanelOrder).toEqual([]);
    expect(next.layout).toMatchObject({ kind: 'panel', panelId: 'L' });
  });

  it('PANEL_DOCK is a no-op for missing, tiled, and locked floating panels', () => {
    const state = twoSideBySide();
    const floating = tileryCreateInitialState({
      type: 'root',
      main: {
        type: 'panel',
        id: 'main',
        tabs: [{ id: 'main-tab', data: {} }],
      },
      floating: [
        {
          type: 'floatingPanel',
          id: 'locked',
          draggable: false,
          tabs: [{ id: 'locked-tab', data: {} }],
        },
      ],
    });

    expect(
      tileryReducer(state, { type: 'PANEL_DOCK', panelId: 'missing' }),
    ).toBe(state);
    expect(tileryReducer(state, { type: 'PANEL_DOCK', panelId: 'L' })).toBe(
      state,
    );
    expect(
      tileryReducer(floating, { type: 'PANEL_DOCK', panelId: 'locked' }),
    ).toBe(floating);
  });

  it('PANEL_DOCK is a no-op when the target cannot receive the docked panel', () => {
    const base = tileryCreateInitialState({
      type: 'root',
      main: {
        type: 'group',
        direction: 'horizontal',
        children: [
          {
            type: 'panel',
            id: 'target',
            droppable: false,
            tabs: [{ id: 'target-tab', data: {} }],
          },
          {
            type: 'panel',
            id: 'fullscreen-target',
            fullScreen: true,
            tabs: [{ id: 'fullscreen-tab', data: {} }],
          },
        ],
      },
      floating: [
        {
          type: 'floatingPanel',
          id: 'floating',
          tabs: [{ id: 'floating-tab', data: {} }],
        },
      ],
    });

    expect(
      tileryReducer(base, {
        type: 'PANEL_DOCK',
        panelId: 'floating',
        target: { splitPanel: 'target' },
      }),
    ).toBe(base);
    expect(
      tileryReducer(base, {
        type: 'PANEL_DOCK',
        panelId: 'floating',
        target: { splitPanel: 'fullscreen-target' },
      }),
    ).toBe(base);
    expect(
      tileryReducer(base, {
        type: 'PANEL_DOCK',
        panelId: 'floating',
        target: { splitPanel: 'missing' },
      }),
    ).toBe(base);
  });

  it('PANEL_DOCK is a no-op when the split would violate constraints', () => {
    const floating = tileryReducer(twoSideBySide(), {
      type: 'PANEL_FLOAT',
      panelId: 'L',
    });

    const next = tileryReducer(floating, {
      type: 'PANEL_DOCK',
      panelId: 'L',
      target: { splitPanel: 'R', minSize: '90%', size: 50 },
      sizeContext: { width: 1000, height: 800 },
    });

    expect(next).toBe(floating);
  });

  it('PANEL_DOCK falls back to flat state when no layout tree exists', () => {
    const floating = tileryReducer(nonTilingSideBySide(), {
      type: 'PANEL_FLOAT',
      panelId: 'L',
    });

    const next = tileryReducer(floating, {
      type: 'PANEL_DOCK',
      panelId: 'L',
      target: { splitPanel: 'R', direction: 'right', size: 30 },
    });

    expect(next.layout).toBeNull();
    expect(next.panelOrder).toEqual(['R', 'L']);
    expect(next.floatingPanelOrder).toEqual([]);
    expect(next.panels.L).toMatchObject({ kind: 'tiled' });
  });

  it('PANEL_FOCUS raises a floating panel above other floating panels', () => {
    const withLeft = tileryReducer(twoSideBySide(), {
      type: 'PANEL_FLOAT',
      panelId: 'L',
    });
    const withBoth = tileryReducer(withLeft, {
      type: 'PANEL_FLOAT',
      panelId: 'R',
    });
    const next = tileryReducer(withBoth, {
      type: 'PANEL_FOCUS',
      panelId: 'L',
    });

    expect(next.floatingPanelOrder).toEqual(['R', 'L']);
    expect(
      next.panels.R?.kind === 'floating' && next.panels.R.floating.zIndex,
    ).toBe(20);
    expect(
      next.panels.L?.kind === 'floating' && next.panels.L.floating.zIndex,
    ).toBe(21);
  });

  it('PANEL_FOCUS is a no-op for missing or tiled panels', () => {
    const state = twoSideBySide();

    expect(
      tileryReducer(state, { type: 'PANEL_FOCUS', panelId: 'missing' }),
    ).toBe(state);
    expect(tileryReducer(state, { type: 'PANEL_FOCUS', panelId: 'L' })).toBe(
      state,
    );
  });

  it('PANEL_FOCUS derives floating order when the state has no explicit order', () => {
    const floating = tileryReducer(twoSideBySide(), {
      type: 'PANEL_FLOAT',
      panelId: 'L',
    });
    const { floatingPanelOrder: _drop, ...withoutOrder } = floating;
    const next = tileryReducer(withoutOrder, {
      type: 'PANEL_FOCUS',
      panelId: 'L',
    });

    expect(next.floatingPanelOrder).toEqual(['L']);
  });

  it('PANEL_FLOATING_BOUNDS_SET clamps detached panel bounds', () => {
    const floating = tileryReducer(twoSideBySide(), {
      type: 'PANEL_FLOAT',
      panelId: 'L',
    });
    const next = tileryReducer(floating, {
      type: 'PANEL_FLOATING_BOUNDS_SET',
      panelId: 'L',
      bounds: { x: 90, y: 95, width: 30, height: 20 },
    });

    expect(next.panels.L).toMatchObject({
      kind: 'floating',
      floating: {
        bounds: { x: 70, y: 80, width: 30, height: 20 },
      },
    });
  });

  it('PANEL_FLOATING_BOUNDS_SET is a no-op for missing, tiled, or unchanged panels', () => {
    const state = twoSideBySide();
    const floating = tileryReducer(state, {
      type: 'PANEL_FLOAT',
      panelId: 'L',
      bounds: { x: 18, y: 12, width: 46, height: 48 },
    });

    expect(
      tileryReducer(state, {
        type: 'PANEL_FLOATING_BOUNDS_SET',
        panelId: 'missing',
        bounds: { x: 1, y: 2, width: 30, height: 40 },
      }),
    ).toBe(state);
    expect(
      tileryReducer(state, {
        type: 'PANEL_FLOATING_BOUNDS_SET',
        panelId: 'L',
        bounds: { x: 1, y: 2, width: 30, height: 40 },
      }),
    ).toBe(state);
    expect(
      tileryReducer(floating, {
        type: 'PANEL_FLOATING_BOUNDS_SET',
        panelId: 'L',
        bounds: { x: 18, y: 12, width: 46, height: 48 },
      }),
    ).toBe(floating);
  });

  it('PANEL_FLOATING_BOUNDS_SET clamps non-finite values to the minimum range', () => {
    const floating = tileryReducer(twoSideBySide(), {
      type: 'PANEL_FLOAT',
      panelId: 'L',
    });

    const next = tileryReducer(floating, {
      type: 'PANEL_FLOATING_BOUNDS_SET',
      panelId: 'L',
      bounds: {
        x: Number.NaN,
        y: Number.POSITIVE_INFINITY,
        width: Number.NaN,
        height: Number.NaN,
      },
    });

    expect(next.panels.L).toMatchObject({
      kind: 'floating',
      floating: {
        bounds: { x: 0, y: 0, width: 12, height: 12 },
      },
    });
  });

  it('PANEL_POPOUT_WINDOW_BOUNDS_SET stores normalized native window bounds', () => {
    const poppedOut = tileryReducer(twoSideBySide(), {
      type: 'PANEL_POPOUT',
      panelId: 'L',
    });
    const next = tileryReducer(poppedOut, {
      type: 'PANEL_POPOUT_WINDOW_BOUNDS_SET',
      panelId: 'L',
      bounds: { left: 30.4, top: 40.6, width: 100, height: 80 },
    });

    expect(next.panels.L).toMatchObject({
      kind: 'floating',
      floating: {
        popout: {
          windowBounds: { left: 30, top: 41, width: 240, height: 160 },
        },
      },
    });
  });

  it('PANEL_POPOUT_WINDOW_BOUNDS_SET is a no-op without popout metadata or changes', () => {
    const floating = tileryReducer(twoSideBySide(), {
      type: 'PANEL_FLOAT',
      panelId: 'L',
    });
    const poppedOut = tileryReducer(twoSideBySide(), {
      type: 'PANEL_POPOUT',
      panelId: 'L',
      opts: { windowBounds: { left: 80, top: 80, width: 720, height: 520 } },
    });

    expect(
      tileryReducer(floating, {
        type: 'PANEL_POPOUT_WINDOW_BOUNDS_SET',
        panelId: 'L',
        bounds: { left: 80, top: 80, width: 720, height: 520 },
      }),
    ).toBe(floating);
    expect(
      tileryReducer(poppedOut, {
        type: 'PANEL_POPOUT_WINDOW_BOUNDS_SET',
        panelId: 'L',
        bounds: { left: 80, top: 80, width: 720, height: 520 },
      }),
    ).toBe(poppedOut);
  });

  it('PANEL_POPOUT_WINDOW_BOUNDS_SET detects top, width, and height-only changes', () => {
    const base = tileryReducer(twoSideBySide(), {
      type: 'PANEL_POPOUT',
      panelId: 'L',
      opts: { windowBounds: { left: 80, top: 80, width: 720, height: 520 } },
    });
    const topChanged = tileryReducer(base, {
      type: 'PANEL_POPOUT_WINDOW_BOUNDS_SET',
      panelId: 'L',
      bounds: { left: 80, top: 90, width: 720, height: 520 },
    });
    const widthChanged = tileryReducer(base, {
      type: 'PANEL_POPOUT_WINDOW_BOUNDS_SET',
      panelId: 'L',
      bounds: { left: 80, top: 80, width: 740, height: 520 },
    });
    const heightChanged = tileryReducer(base, {
      type: 'PANEL_POPOUT_WINDOW_BOUNDS_SET',
      panelId: 'L',
      bounds: { left: 80, top: 80, width: 720, height: 540 },
    });

    expect(topChanged).not.toBe(base);
    expect(widthChanged).not.toBe(base);
    expect(heightChanged).not.toBe(base);
  });

  it('PANEL_REMOVE removes floating panels and their tabs', () => {
    const floating = tileryReducer(twoSideBySide(), {
      type: 'PANEL_FLOAT',
      panelId: 'L',
    });
    const next = tileryReducer(floating, {
      type: 'PANEL_REMOVE',
      panelId: 'L',
    });

    expect(next.panels.L).toBeUndefined();
    expect(next.floatingPanelOrder).toEqual([]);
    expect(next.tabs.L1).toBeUndefined();
    expect(next.tabs.L2).toBeUndefined();
    expect(next.panels.R).toBeDefined();
  });
  it('PANEL_REMOVE with only one panel left drops both panel and its tabs', () => {
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
      type: 'PANEL_REMOVE',
      panelId: 'only',
    });
    expect(next.panels.only).toBeUndefined();
    expect(next.tabs.T).toBeUndefined();
    expect(next.panelOrder).toEqual([]);
  });
  it('PANEL_REMOVE uses the flat fallback when no layout tree exists', () => {
    const state = nonTilingSideBySide();
    const next = tileryReducer(state, {
      type: 'PANEL_REMOVE',
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

  it('PANEL_REMOVE flat fallback expands matching fillers', () => {
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
      type: 'PANEL_REMOVE',
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

  it('PANEL_REMOVE flat fallback handles the final remaining panel', () => {
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
      type: 'PANEL_REMOVE',
      panelId: 'only',
    });
    expect(next.panels.only).toBeUndefined();
    expect(next.tabs.T).toBeUndefined();
    expect(next.panelOrder).toEqual([]);
    expect(next.layout).toBeNull();
  });

  it('TAB_APPEND is a no-op if the panel is missing', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
      type: 'TAB_APPEND',
      panelId: 'phantom',
      tab: { id: 'X', data: {} },
      activate: true,
    });
    expect(next).toBe(state);
  });
  it('TAB_APPEND with activate=false keeps existing active tab', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
      type: 'TAB_APPEND',
      panelId: 'L',
      tab: { id: 'NEW', data: {} },
      activate: false,
    });
    expect(next.panels.L!.tabs).toEqual(['L1', 'L2', 'NEW']);
    expect(next.panels.L!.activeTabId).toBe('L1');
  });
  it('TAB_APPEND activates the new tab when panel had no active', () => {
    let state = twoSideBySide();
    state = {
      ...state,
      panels: { ...state.panels, R: { ...state.panels.R!, activeTabId: null } },
    };
    const next = tileryReducer(state, {
      type: 'TAB_APPEND',
      panelId: 'R',
      tab: { id: 'NEW', data: {} },
      activate: false,
    });
    expect(next.panels.R!.activeTabId).toBe('NEW');
  });

  it('TAB_INSERT is a no-op if panel missing', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
      type: 'TAB_INSERT',
      panelId: 'phantom',
      tab: { id: 'X', data: {} },
      index: 0,
      activate: true,
    });
    expect(next).toBe(state);
  });
  it('TAB_INSERT clamps index above tabs length to end', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
      type: 'TAB_INSERT',
      panelId: 'L',
      tab: { id: 'X', data: {} },
      index: 999,
      activate: true,
    });
    expect(next.panels.L!.tabs).toEqual(['L1', 'L2', 'X']);
  });
  it('TAB_INSERT clamps negative index to 0', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
      type: 'TAB_INSERT',
      panelId: 'L',
      tab: { id: 'X', data: {} },
      index: -10,
      activate: true,
    });
    expect(next.panels.L!.tabs).toEqual(['X', 'L1', 'L2']);
  });
  it('TAB_INSERT activate=false keeps current activeTabId', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
      type: 'TAB_INSERT',
      panelId: 'L',
      tab: { id: 'X', data: {} },
      index: 0,
      activate: false,
    });
    expect(next.panels.L!.activeTabId).toBe('L1');
  });
  it('TAB_INSERT activates new tab when panel had no active', () => {
    let state = twoSideBySide();
    state = {
      ...state,
      panels: { ...state.panels, R: { ...state.panels.R!, activeTabId: null } },
    };
    const next = tileryReducer(state, {
      type: 'TAB_INSERT',
      panelId: 'R',
      tab: { id: 'X', data: {} },
      index: 0,
      activate: false,
    });
    expect(next.panels.R!.activeTabId).toBe('X');
  });

  it('TAB_ID_CHANGE updates tabs, panel order, and active tab references', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
      type: 'TAB_ID_CHANGE',
      oldTabId: 'L1',
      newTabId: 'L1_RENAMED',
    });

    expect(next.tabs.L1).toBeUndefined();
    expect(next.tabs.L1_RENAMED).toMatchObject({
      id: 'L1_RENAMED',
      data: { title: 'l1' },
      panelId: 'L',
    });
    expect(next.panels.L!.tabs).toEqual(['L1_RENAMED', 'L2']);
    expect(next.panels.L!.activeTabId).toBe('L1_RENAMED');
  });

  it('TAB_ID_CHANGE keeps active tab references when renaming a non-active tab', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
      type: 'TAB_ID_CHANGE',
      oldTabId: 'L2',
      newTabId: 'L2_RENAMED',
    });

    expect(next.panels.L!.tabs).toEqual(['L1', 'L2_RENAMED']);
    expect(next.panels.L!.activeTabId).toBe('L1');
  });

  it('TAB_ID_CHANGE is a no-op for unchanged, missing, duplicate, or stale ids', () => {
    const state = twoSideBySide();

    expect(
      tileryReducer(state, {
        type: 'TAB_ID_CHANGE',
        oldTabId: 'L1',
        newTabId: 'L1',
      }),
    ).toBe(state);
    expect(
      tileryReducer(state, {
        type: 'TAB_ID_CHANGE',
        oldTabId: 'missing',
        newTabId: 'NEW',
      }),
    ).toBe(state);
    expect(
      tileryReducer(state, {
        type: 'TAB_ID_CHANGE',
        oldTabId: 'L1',
        newTabId: 'L2',
      }),
    ).toBe(state);

    const broken = {
      ...state,
      tabs: { ...state.tabs, L1: { ...state.tabs.L1!, panelId: 'missing' } },
    };
    expect(
      tileryReducer(broken, {
        type: 'TAB_ID_CHANGE',
        oldTabId: 'L1',
        newTabId: 'NEW',
      }),
    ).toBe(broken);
  });

  it('TAB_REMOVE is a no-op if tab missing', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, { type: 'TAB_REMOVE', tabId: 'phantom' });
    expect(next).toBe(state);
  });
  it('TAB_REMOVE is a no-op when the tab is not closeable', () => {
    const state = createStateFromPanels({
      panels: [
        {
          id: 'P',
          inset: { top: 0, right: 0, bottom: 0, left: 0 },
          tabs: [{ id: 'T1', data: {}, closeable: false }],
        },
      ],
    });

    const next = tileryReducer(state, { type: 'TAB_REMOVE', tabId: 'T1' });

    expect(next).toBe(state);
  });
  it('TAB_REMOVE is a no-op if the back-reference panel is missing', () => {
    let state = twoSideBySide();
    state = {
      ...state,
      tabs: { ...state.tabs, L1: { ...state.tabs.L1!, panelId: 'phantom' } },
    };
    const next = tileryReducer(state, { type: 'TAB_REMOVE', tabId: 'L1' });
    expect(next).toBe(state);
  });
  it('TAB_REMOVE picks the next tab as active when active was removed', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, { type: 'TAB_REMOVE', tabId: 'L1' });
    expect(next.panels.L!.tabs).toEqual(['L2']);
    expect(next.panels.L!.activeTabId).toBe('L2');
  });
  it('TAB_REMOVE keeps existing active when removing a non-active tab', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, { type: 'TAB_REMOVE', tabId: 'L2' });
    expect(next.panels.L!.activeTabId).toBe('L1');
  });

  it('TAB_REMOVE picks the previous tab when the active last tab is removed', () => {
    const state = sideBySideWithThreeLeftTabs('L3');
    const next = tileryReducer(state, { type: 'TAB_REMOVE', tabId: 'L3' });
    expect(next.panels.L!.tabs).toEqual(['L1', 'L2']);
    expect(next.panels.L!.activeTabId).toBe('L2');
  });

  it('TAB_REMOVE prunes a last-tab panel and collapses the remaining layout branch', () => {
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

    const next = tileryReducer(state, { type: 'TAB_REMOVE', tabId: 'R1' });
    expect(next.panels.R).toBeUndefined();
    expect(next.panels.L!.inset).toEqual({
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    });
    expect(next.panelOrder).toEqual(['L']);
    expect(next.layout).toEqual({
      kind: 'panel',
      panelId: 'L',
      resizable: true,
      draggable: true,
      droppable: true,
    });
  });
  it('PANEL_REMOVE is a no-op when the panel contains a non-closeable tab', () => {
    const state = createStateFromPanels({
      panels: [
        {
          id: 'L',
          inset: { top: 0, right: 50, bottom: 0, left: 0 },
          tabs: [{ id: 'L1', data: {}, closeable: false }],
        },
        {
          id: 'R',
          inset: { top: 0, right: 0, bottom: 0, left: 50 },
          tabs: [{ id: 'R1', data: {} }],
        },
      ],
    });

    const next = tileryReducer(state, { type: 'PANEL_REMOVE', panelId: 'L' });

    expect(next).toBe(state);
  });

  it('TAB_MOVE is a no-op if the tab does not exist', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
      type: 'TAB_MOVE',
      tabId: 'phantom',
      to: { panelId: 'R', index: 0 },
    });
    expect(next).toBe(state);
  });
  it('TAB_MOVE is a no-op when the tab is not draggable', () => {
    const state = createStateFromPanels({
      panels: [
        {
          id: 'L',
          inset: { top: 0, right: 50, bottom: 0, left: 0 },
          tabs: [{ id: 'L1', data: {}, draggable: false }],
        },
        {
          id: 'R',
          inset: { top: 0, right: 0, bottom: 0, left: 50 },
          tabs: [{ id: 'R1', data: {} }],
        },
      ],
    });

    const next = tileryReducer(state, {
      type: 'TAB_MOVE',
      tabId: 'L1',
      to: { panelId: 'R', index: 0 },
    });

    expect(next).toBe(state);
  });
  it('TAB_MOVE is a no-op if the source panel is broken', () => {
    let state = twoSideBySide();
    state = {
      ...state,
      tabs: { ...state.tabs, L1: { ...state.tabs.L1!, panelId: 'phantom' } },
    };
    const next = tileryReducer(state, {
      type: 'TAB_MOVE',
      tabId: 'L1',
      to: { panelId: 'R', index: 0 },
    });
    expect(next).toBe(state);
  });
  it('TAB_MOVE beforeTab is a no-op if ref tab is missing', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
      type: 'TAB_MOVE',
      tabId: 'L1',
      to: { beforeTabId: 'phantom' },
    });
    expect(next).toBe(state);
  });
  it('TAB_MOVE beforeTab is a no-op if ref equals the tab being moved', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
      type: 'TAB_MOVE',
      tabId: 'L1',
      to: { beforeTabId: 'L1' },
    });
    expect(next).toBe(state);
  });
  it('TAB_MOVE beforeTab returns state when the ref tab panel is missing', () => {
    let state = twoSideBySide();
    state = {
      ...state,
      tabs: { ...state.tabs, R1: { ...state.tabs.R1!, panelId: 'phantom' } },
    };
    const next = tileryReducer(state, {
      type: 'TAB_MOVE',
      tabId: 'L1',
      to: { beforeTabId: 'R1' },
    });
    expect(next).toBe(state);
  });
  it('TAB_MOVE beforeTab within the same panel reorders', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
      type: 'TAB_MOVE',
      tabId: 'L2',
      to: { beforeTabId: 'L1' },
    });
    expect(next.panels.L!.tabs).toEqual(['L2', 'L1']);
  });
  it('TAB_MOVE afterTab inserts after the ref', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
      type: 'TAB_MOVE',
      tabId: 'L1',
      to: { afterTabId: 'R1' },
    });
    expect(next.panels.R!.tabs).toEqual(['R1', 'L1']);
  });
  it('TAB_MOVE beforeTab is a no-op when same-panel drops are disabled', () => {
    const state = tileryCreateInitialState({
      type: 'panel',
      id: 'L',
      droppable: false,
      tabs: [
        { id: 'L1', data: {} },
        { id: 'L2', data: {} },
      ],
    });
    const next = tileryReducer(state, {
      type: 'TAB_MOVE',
      tabId: 'L2',
      to: { beforeTabId: 'L1' },
    });

    expect(next).toBe(state);
  });
  it('TAB_MOVE target by panel index defaults to append when index too large', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
      type: 'TAB_MOVE',
      tabId: 'L1',
      to: { panelId: 'R', index: 999 },
    });
    expect(next.panels.R!.tabs).toEqual(['R1', 'L1']);
  });
  it('TAB_MOVE target by panel index with negative clamps to 0', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
      type: 'TAB_MOVE',
      tabId: 'L1',
      to: { panelId: 'R', index: -5 },
    });
    expect(next.panels.R!.tabs).toEqual(['L1', 'R1']);
  });
  it('TAB_MOVE target by panel reorders within same panel', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
      type: 'TAB_MOVE',
      tabId: 'L1',
      to: { panelId: 'L', index: 2 },
    });
    expect(next.panels.L!.tabs).toEqual(['L2', 'L1']);
  });
  it('TAB_MOVE target panel missing → no-op', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
      type: 'TAB_MOVE',
      tabId: 'L1',
      to: { panelId: 'phantom', index: 0 },
    });
    expect(next).toBe(state);
  });
  it('TAB_MOVE is a no-op when the source panel is not draggable', () => {
    const state = tileryCreateInitialState({
      type: 'group',
      direction: 'horizontal',
      children: [
        {
          type: 'panel',
          id: 'L',
          draggable: false,
          tabs: [{ id: 'L1', data: {} }],
        },
        {
          type: 'panel',
          id: 'R',
          tabs: [{ id: 'R1', data: {} }],
        },
      ],
    });
    const next = tileryReducer(state, {
      type: 'TAB_MOVE',
      tabId: 'L1',
      to: { panelId: 'R', index: 0 },
    });

    expect(next).toBe(state);
  });
  it('TAB_MOVE is a no-op when the target panel is not droppable', () => {
    const state = tileryCreateInitialState({
      type: 'group',
      direction: 'horizontal',
      children: [
        {
          type: 'panel',
          id: 'L',
          tabs: [{ id: 'L1', data: {} }],
        },
        {
          type: 'panel',
          id: 'R',
          droppable: false,
          tabs: [{ id: 'R1', data: {} }],
        },
      ],
    });
    const next = tileryReducer(state, {
      type: 'TAB_MOVE',
      tabId: 'L1',
      to: { panelId: 'R', index: 0 },
    });

    expect(next).toBe(state);
  });
  it('TAB_MOVE splitPanel: wasActive=false branch (moving a non-active tab keeps source active)', () => {
    // Source has two tabs and the moved one is NOT active.
    const state = twoSideBySide();
    const next = tileryReducer(state, {
      type: 'TAB_MOVE',
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

  it('TAB_MOVE to another panel with non-active source tab keeps the original active', () => {
    const state = twoSideBySide();
    // L's tabs: [L1, L2], active = L1. Move L2 (non-active) to R.
    const next = tileryReducer(state, {
      type: 'TAB_MOVE',
      tabId: 'L2',
      to: { panelId: 'R', index: 0 },
    });
    expect(next.panels.L!.activeTabId).toBe('L1');
    expect(next.panels.L!.tabs).toEqual(['L1']);
    expect(next.panels.R!.tabs).toEqual(['L2', 'R1']);
  });

  it('TAB_MOVE splitPanel target adds a new panel and moves the tab there', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
      type: 'TAB_MOVE',
      tabId: 'L1',
      to: {
        splitPanelId: 'L',
        direction: 'right',
        sizePercent: 50,
        newPanelId: 'NEWP',
        minSize: 12,
        maxSize: 45,
      },
    });
    expect(next.panels.NEWP!.tabs).toEqual(['L1']);
    expect(next.panels.L!.tabs).toEqual(['L2']);
    expect(next.tabs.L1!.panelId).toBe('NEWP');
    expect(next.panels.NEWP!.minSize).toBe(12);
    expect(next.panels.NEWP!.maxSize).toBe(45);
  });

  it('TAB_MOVE splitPanel uses flat fallback when no layout tree exists', () => {
    const state = nonTilingSideBySide();
    const next = tileryReducer(state, {
      type: 'TAB_MOVE',
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

  it('TAB_MOVE splitPanel keeps flat fallback behavior when the layout tree misses the target', () => {
    const state: TileryLayoutState = {
      ...twoSideBySide(),
      layout: { kind: 'panel', panelId: 'phantom' },
    };
    const next = tileryReducer(state, {
      type: 'TAB_MOVE',
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

  it('TAB_MOVE splitPanel is a no-op when source is the same panel and has only this tab', () => {
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
      type: 'TAB_MOVE',
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

  it('TAB_MOVE splitPanel where source IS the split target shrinks the source inset', () => {
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
      type: 'TAB_MOVE',
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
  it('TAB_MOVE splitPanel with active source picks next active', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
      type: 'TAB_MOVE',
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
  it('TAB_MOVE splitPanel removes source when source loses its last tab', () => {
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
      type: 'TAB_MOVE',
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
  it('TAB_MOVE splitPanel missing target → no-op', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
      type: 'TAB_MOVE',
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

  it('TAB_MOVE splitPanel is a no-op when the split target is floating', () => {
    const state = tileryReducer(twoSideBySide(), {
      type: 'PANEL_FLOAT',
      panelId: 'R',
    });
    const next = tileryReducer(state, {
      type: 'TAB_MOVE',
      tabId: 'L1',
      to: {
        splitPanelId: 'R',
        direction: 'right',
        sizePercent: 50,
        newPanelId: 'NEW',
      },
    });

    expect(next).toBe(state);
  });

  it('TAB_MOVE splitPanel is a no-op when the split target is not droppable', () => {
    const state = tileryCreateInitialState({
      type: 'group',
      direction: 'horizontal',
      children: [
        {
          type: 'panel',
          id: 'L',
          tabs: [{ id: 'L1', data: {} }],
        },
        {
          type: 'panel',
          id: 'R',
          droppable: false,
          tabs: [{ id: 'R1', data: {} }],
        },
      ],
    });
    const next = tileryReducer(state, {
      type: 'TAB_MOVE',
      tabId: 'L1',
      to: {
        splitPanelId: 'R',
        direction: 'right',
        sizePercent: 50,
        newPanelId: 'NEW',
      },
    });

    expect(next).toBe(state);
  });

  it('TAB_MOVE splitPanel target no-ops when split would violate min size', () => {
    // Target panel is only 18% wide. A 50% split would leave each half
    // at 9% — below the 10% default min — so tilerySplitFitsMin refuses the
    // action and the tileryReducer returns the original state. (This is the
    // counterpart guard to the one on plain PANEL_SPLIT.)
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
      type: 'TAB_MOVE',
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

  it('TAB_ACTIVE_SET is a no-op when tab missing', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
      type: 'TAB_ACTIVE_SET',
      tabId: 'phantom',
    });
    expect(next).toBe(state);
  });
  it('TAB_ACTIVE_SET is a no-op when panel back-ref is broken', () => {
    let state = twoSideBySide();
    state = {
      ...state,
      tabs: { ...state.tabs, L1: { ...state.tabs.L1!, panelId: 'phantom' } },
    };
    const next = tileryReducer(state, { type: 'TAB_ACTIVE_SET', tabId: 'L1' });
    expect(next).toBe(state);
  });
  it('TAB_ACTIVE_SET is a no-op when the tab is already active', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, { type: 'TAB_ACTIVE_SET', tabId: 'L1' });
    expect(next).toBe(state);
  });
  it('TAB_ACTIVE_SET updates active tab', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, { type: 'TAB_ACTIVE_SET', tabId: 'L2' });
    expect(next.panels.L!.activeTabId).toBe('L2');
  });

  it('TAB_APPEND and TAB_INSERT open tabs at the requested location and activate them', () => {
    const appended = tileryReducer(sideBySideWithThreeLeftTabs(), {
      type: 'TAB_APPEND',
      panelId: 'L',
      tab: { id: 'L4', data: { title: 'left 4' } },
      activate: true,
    });
    expect(appended.panels.L!.tabs).toEqual(['L1', 'L2', 'L3', 'L4']);
    expect(appended.panels.L!.activeTabId).toBe('L4');
    expect(appended.panels.R!.tabs).toEqual(['R1']);
    expect(appended.panels.R!.activeTabId).toBe('R1');

    const insertedAtStart = tileryReducer(appended, {
      type: 'TAB_INSERT',
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
      type: 'TAB_INSERT',
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

  it('PANEL_SPLIT inserts before and after the target in a same-axis layout', () => {
    const after = tileryReducer(sideBySideWithThreeLeftTabs(), {
      type: 'PANEL_SPLIT',
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
      type: 'PANEL_SPLIT',
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

  it('PANEL_SPLIT inserts before and after the target on an orthogonal axis without moving siblings', () => {
    const below = tileryReducer(sideBySideWithThreeLeftTabs(), {
      type: 'PANEL_SPLIT',
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
      type: 'PANEL_SPLIT',
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

  it('TAB_DATA_SET is a no-op when tab missing', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
      type: 'TAB_DATA_SET',
      tabId: 'phantom',
      data: { x: 1 },
    });
    expect(next).toBe(state);
  });
  it('TAB_DATA_SET updates the tab data', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
      type: 'TAB_DATA_SET',
      tabId: 'L1',
      data: { renamed: true },
    });
    expect(next.tabs.L1!.data).toEqual({ renamed: true });
  });

  it('TAB_BEHAVIOR_SET is a no-op when tab missing', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
      type: 'TAB_BEHAVIOR_SET',
      tabId: 'phantom',
      behavior: { closeable: false },
    });
    expect(next).toBe(state);
  });

  it('TAB_BEHAVIOR_SET updates one behavior field without changing the other', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
      type: 'TAB_BEHAVIOR_SET',
      tabId: 'L1',
      behavior: { closeable: false },
    });

    expect(next.tabs.L1).toMatchObject({
      closeable: false,
      draggable: true,
    });
  });

  it('TAB_BEHAVIOR_SET normalizes locked shorthand', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
      type: 'TAB_BEHAVIOR_SET',
      tabId: 'L1',
      behavior: { locked: true },
    });

    expect(next.tabs.L1).toMatchObject({
      closeable: false,
      draggable: false,
    });
  });

  it('TAB_BEHAVIOR_SET is a no-op when behavior does not change', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
      type: 'TAB_BEHAVIOR_SET',
      tabId: 'L1',
      behavior: { closeable: true },
    });

    expect(next).toBe(state);
  });

  it('DIVIDER_RESIZE updates panel insets', () => {
    const state = twoSideBySide();
    const div = tileryDeriveDividers(state)[0]!;
    const next = tileryReducer(state, {
      type: 'DIVIDER_RESIZE',
      dividerId: div.id,
      newPosition: 70,
    });
    expect(next.panels.L!.inset.right).toBe(30);
    expect(next.panels.R!.inset.left).toBe(70);
  });
  it('DIVIDER_RESIZE honors min size (defaults to TILERY_DEFAULT_MIN_SIZE = 10)', () => {
    const state = twoSideBySide();
    const div = tileryDeriveDividers(state)[0]!;
    const next = tileryReducer(state, {
      type: 'DIVIDER_RESIZE',
      dividerId: div.id,
      newPosition: 2,
    });
    expect(next.panels.L!.inset.right).toBe(90);
  });
  it('DIVIDER_RESIZE honors caller-provided minSize', () => {
    const state = twoSideBySide();
    const div = tileryDeriveDividers(state)[0]!;
    const next = tileryReducer(state, {
      type: 'DIVIDER_RESIZE',
      dividerId: div.id,
      newPosition: 2,
      minSize: 25,
    });
    expect(next.panels.L!.inset.right).toBe(75);
  });
  it('DIVIDER_RESIZE resolves caller-provided pixel minSize', () => {
    const state = twoSideBySide();
    const div = tileryDeriveDividers(state)[0]!;
    const next = tileryReducer(state, {
      type: 'DIVIDER_RESIZE',
      dividerId: div.id,
      newPosition: 2,
      minSize: '250px',
      sizeContext: { width: 1000 },
    });
    expect(next.panels.L!.inset.right).toBe(75);
  });
  it('DIVIDER_RESIZE resolves per-panel pixel minSize', () => {
    const state = tileryCreateInitialState({
      type: 'group',
      direction: 'horizontal',
      children: [
        {
          type: 'panel',
          id: 'L',
          size: 30,
          minSize: '200px',
          tabs: [{ id: 'left', data: {} }],
        },
        {
          type: 'panel',
          id: 'R',
          size: 70,
          tabs: [{ id: 'right', data: {} }],
        },
      ],
    });
    const div = tileryDeriveDividers(state)[0]!;
    const next = tileryReducer(state, {
      type: 'DIVIDER_RESIZE',
      dividerId: div.id,
      newPosition: 5,
      sizeContext: { width: 1000 },
    });
    expect(100 - next.panels.L!.inset.right).toBe(20);
  });
  it('DIVIDER_RESIZE is a no-op for an unknown divider id', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
      type: 'DIVIDER_RESIZE',
      dividerId: 'phantom',
      newPosition: 50,
    });
    expect(next).toBe(state);
  });
  it('DIVIDER_RESIZE is a no-op for a disabled divider', () => {
    const state = tileryCreateInitialState({
      type: 'group',
      direction: 'horizontal',
      children: [
        {
          type: 'panel',
          id: 'L',
          resizable: false,
          tabs: [{ id: 'L1', data: {} }],
        },
        {
          type: 'panel',
          id: 'R',
          tabs: [{ id: 'R1', data: {} }],
        },
      ],
    });
    const div = tileryDeriveDividers(state)[0]!;
    expect(div.disabled).toBe(true);

    const next = tileryReducer(state, {
      type: 'DIVIDER_RESIZE',
      dividerId: div.id,
      newPosition: 70,
    });
    expect(next).toBe(state);
  });

  it('DIVIDER_RESET restores the initial size ratio', () => {
    const state = tileryCreateInitialState({
      type: 'group',
      direction: 'horizontal',
      children: [
        {
          type: 'panel',
          id: 'L',
          size: 30,
          tabs: [{ id: 'left', data: {} }],
        },
        {
          type: 'panel',
          id: 'R',
          size: 70,
          tabs: [{ id: 'right', data: {} }],
        },
      ],
    });
    const div = tileryDeriveDividers(state)[0]!;
    const resized = tileryReducer(state, {
      type: 'DIVIDER_RESIZE',
      dividerId: div.id,
      newPosition: 55,
    });

    const reset = tileryReducer(resized, {
      type: 'DIVIDER_RESET',
      dividerId: div.id,
    });

    expect(reset.panels.L!.inset.right).toBe(70);
    expect(reset.panels.R!.inset.left).toBe(30);
  });

  it('DIVIDER_RESET uses explicit defaultSize values', () => {
    const state = tileryCreateInitialState({
      type: 'group',
      direction: 'horizontal',
      children: [
        {
          type: 'panel',
          id: 'L',
          size: 50,
          defaultSize: 25,
          tabs: [{ id: 'left', data: {} }],
        },
        {
          type: 'panel',
          id: 'R',
          size: 50,
          defaultSize: 75,
          tabs: [{ id: 'right', data: {} }],
        },
      ],
    });
    const div = tileryDeriveDividers(state)[0]!;

    const reset = tileryReducer(state, {
      type: 'DIVIDER_RESET',
      dividerId: div.id,
    });

    expect(reset.panels.L!.inset.right).toBe(75);
    expect(reset.panels.R!.inset.left).toBe(25);
  });

  it('DIVIDER_RESET is a no-op for an unknown divider id', () => {
    const state = twoSideBySide();
    const next = tileryReducer(state, {
      type: 'DIVIDER_RESET',
      dividerId: 'phantom',
    });
    expect(next).toBe(state);
  });

  it('CONTAINER_SIZE_NORMALIZE adjusts layout for measured pixel constraints', () => {
    const state = tileryCreateInitialState({
      type: 'group',
      direction: 'horizontal',
      children: [
        {
          type: 'panel',
          id: 'L',
          size: 30,
          minSize: '400px',
          tabs: [{ id: 'left', data: {} }],
        },
        {
          type: 'panel',
          id: 'R',
          size: 70,
          tabs: [{ id: 'right', data: {} }],
        },
      ],
    });

    const next = tileryReducer(state, {
      type: 'CONTAINER_SIZE_NORMALIZE',
      sizeContext: { width: 1000 },
    });

    expect(100 - next.panels.L!.inset.right).toBe(40);
    expect(next.panels.R!.inset.left).toBe(40);
  });

  it('CONTAINER_SIZE_NORMALIZE no-ops when constraints already fit', () => {
    const state = tileryCreateInitialState({
      type: 'group',
      direction: 'horizontal',
      children: [
        {
          type: 'panel',
          id: 'L',
          size: 30,
          minSize: '200px',
          tabs: [{ id: 'left', data: {} }],
        },
        {
          type: 'panel',
          id: 'R',
          size: 70,
          tabs: [{ id: 'right', data: {} }],
        },
      ],
    });

    expect(
      tileryReducer(state, {
        type: 'CONTAINER_SIZE_NORMALIZE',
        sizeContext: { width: 1000 },
      }),
    ).toBe(state);
  });

  it('CONTAINER_SIZE_NORMALIZE no-ops without a layout tree', () => {
    const state = {
      ...twoSideBySide(),
      layout: null,
      panels: {
        L: {
          ...twoSideBySide().panels.L!,
          inset: { top: 0, right: 60, bottom: 0, left: 0 },
        },
        R: {
          ...twoSideBySide().panels.R!,
          inset: { top: 0, right: 0, bottom: 0, left: 70 },
        },
      },
    };

    const next = tileryReducer(state, {
      type: 'CONTAINER_SIZE_NORMALIZE',
      sizeContext: { width: 1000 },
    });

    expect(next.layout).toBeNull();
    expect(next.panelOrder).toEqual(['L', 'R']);
  });

  it('CONTAINER_SIZE_NORMALIZE normalizes legacy tiling state first', () => {
    const state = { ...twoSideBySide(), layout: null };

    const next = tileryReducer(state, {
      type: 'CONTAINER_SIZE_NORMALIZE',
      sizeContext: { width: 1000 },
    });

    expect(next.layout).toMatchObject({
      kind: 'split',
      direction: 'horizontal',
    });
    expect(next.panelOrder).toEqual(['L', 'R']);
  });

  it('JUNCTION_RESIZE updates both divider axes for a T-junction', () => {
    const state = tJunctionLayout();
    const junction = tileryDeriveJunctions(state)[0]!;
    const next = tileryReducer(state, {
      type: 'JUNCTION_RESIZE',
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

  it('JUNCTION_RESIZE is a no-op for an unknown junction id', () => {
    const state = tJunctionLayout();
    const next = tileryReducer(state, {
      type: 'JUNCTION_RESIZE',
      junctionId: 'phantom',
      x: 30,
      y: 70,
    });
    expect(next).toBe(state);
  });

  it('JUNCTION_RESIZE is a no-op for a disabled junction', () => {
    const state = tileryCreateInitialState({
      type: 'group',
      direction: 'horizontal',
      children: [
        {
          type: 'panel',
          id: 'sidebar',
          size: 40,
          resizable: false,
          tabs: [{ id: 'side', data: {} }],
        },
        {
          type: 'group',
          direction: 'vertical',
          size: 60,
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

    const next = tileryReducer(state, {
      type: 'JUNCTION_RESIZE',
      junctionId: junction.id,
      x: 30,
      y: 70,
    });
    expect(next).toBe(state);
  });

  it('PANEL_SWAP swaps the insets of two existing panels (content stays put)', () => {
    const state = twoSideBySide();
    const beforeL = state.panels.L!.inset;
    const beforeR = state.panels.R!.inset;
    const next = tileryReducer(state, {
      type: 'PANEL_SWAP',
      panelA: 'L',
      panelB: 'R',
    });
    expect(next.panels.L!.inset).toEqual(beforeR);
    expect(next.panels.R!.inset).toEqual(beforeL);
    // Tabs and ids unchanged
    expect(next.panels.L!.tabs).toEqual(state.panels.L!.tabs);
    expect(next.panels.R!.tabs).toEqual(state.panels.R!.tabs);
  });
  it('PANEL_SWAP swaps flat insets when no layout tree exists', () => {
    const state = nonTilingSideBySide();
    const beforeL = state.panels.L!.inset;
    const beforeR = state.panels.R!.inset;
    const next = tileryReducer(state, {
      type: 'PANEL_SWAP',
      panelA: 'L',
      panelB: 'R',
    });
    expect(next.layout).toBeNull();
    expect(next.panels.L!.inset).toEqual(beforeR);
    expect(next.panels.R!.inset).toEqual(beforeL);
  });
  it('PANEL_SWAP is a no-op when either panel is missing', () => {
    const state = twoSideBySide();
    expect(
      tileryReducer(state, {
        type: 'PANEL_SWAP',
        panelA: 'phantom',
        panelB: 'R',
      }),
    ).toBe(state);
    expect(
      tileryReducer(state, {
        type: 'PANEL_SWAP',
        panelA: 'L',
        panelB: 'phantom',
      }),
    ).toBe(state);
  });

  it('PANEL_SWAP is a no-op when either panel is floating', () => {
    const state = tileryReducer(twoSideBySide(), {
      type: 'PANEL_FLOAT',
      panelId: 'L',
    });

    expect(
      tileryReducer(state, { type: 'PANEL_SWAP', panelA: 'L', panelB: 'R' }),
    ).toBe(state);
  });

  it('PANEL_SWAP is a no-op when given the same panel twice', () => {
    const state = twoSideBySide();
    expect(
      tileryReducer(state, { type: 'PANEL_SWAP', panelA: 'L', panelB: 'L' }),
    ).toBe(state);
  });

  it('PANEL_SWAP is a no-op when either panel is locked against movement', () => {
    const state = tileryCreateInitialState({
      type: 'group',
      direction: 'horizontal',
      children: [
        {
          type: 'panel',
          id: 'L',
          locked: true,
          tabs: [{ id: 'L1', data: {} }],
        },
        {
          type: 'panel',
          id: 'R',
          tabs: [{ id: 'R1', data: {} }],
        },
      ],
    });

    expect(
      tileryReducer(state, { type: 'PANEL_SWAP', panelA: 'L', panelB: 'R' }),
    ).toBe(state);
  });

  it('unknown action returns the same state (default case)', () => {
    const state = twoSideBySide();
    // intentionally wrong shape to exercise the default branch
    const next = tileryReducer(state, { type: 'NOT_AN_ACTION' } as never);
    expect(next).toBe(state);
  });

  it('TAB_MOVE splitPanel: defensive fallback to null when active tab is missing from source.tabs', () => {
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
        T1: {
          id: 'T1',
          panelId: 'A',
          data: {},
          closeable: true,
          draggable: true,
        },
        T_DUMMY: {
          id: 'T_DUMMY',
          panelId: 'A',
          data: {},
          closeable: true,
          draggable: true,
        },
        TB: {
          id: 'TB',
          panelId: 'B',
          data: {},
          closeable: true,
          draggable: true,
        },
      },
    };
    const next = tileryReducer(state, {
      type: 'TAB_MOVE',
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

  it('TAB_REMOVE: defensive ?? null when active tab is not in panel.tabs', () => {
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
        T1: {
          id: 'T1',
          panelId: 'P',
          data: {},
          closeable: true,
          draggable: true,
        },
        T_OTHER: {
          id: 'T_OTHER',
          panelId: 'P',
          data: {},
          closeable: true,
          draggable: true,
        },
      },
    };
    const next = tileryReducer(state, { type: 'TAB_REMOVE', tabId: 'T1' });
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
        T1: {
          id: 'T1',
          panelId: 'A',
          data: {},
          closeable: true,
          draggable: true,
        },
        T_DUMMY: {
          id: 'T_DUMMY',
          panelId: 'A',
          data: {},
          closeable: true,
          draggable: true,
        },
        TB: {
          id: 'TB',
          panelId: 'B',
          data: {},
          closeable: true,
          draggable: true,
        },
      },
    };
    const next = tileryReducer(state, {
      type: 'TAB_MOVE',
      tabId: 'T1',
      to: { panelId: 'B', index: 0 },
    });
    // A panel exists with T_DUMMY (T1 was filtered out which wasn't present anyway)
    expect(next.panels.A!.tabs).toEqual(['T_DUMMY']);
    // wasActiveInSource branched, the ?? null produced null since indexOf('T1')=-1
    expect(next.panels.A!.activeTabId).toBeNull();
  });

  it('TAB_MOVE panel target: defensive fallback when active tab missing from source.tabs', () => {
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
        T1: {
          id: 'T1',
          panelId: 'A',
          data: {},
          closeable: true,
          draggable: true,
        },
        T_DUMMY: {
          id: 'T_DUMMY',
          panelId: 'A',
          data: {},
          closeable: true,
          draggable: true,
        },
        TB: {
          id: 'TB',
          panelId: 'B',
          data: {},
          closeable: true,
          draggable: true,
        },
      },
    };
    const next = tileryReducer(state, {
      type: 'TAB_MOVE',
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
    expect(r.tabs[0]).toMatchObject({ closeable: true, draggable: true });
  });
  it('tileryPanelInitToReducerInit preserves provided ids', () => {
    const r = tileryPanelInitToReducerInit({
      type: 'panel',
      id: 'mine',
      tabs: [{ id: 'tt', data: {} }],
    });
    expect(r.id).toBe('mine');
    expect(r.tabs[0]!.id).toBe('tt');
    expect(r.tabs[0]).toMatchObject({ closeable: true, draggable: true });
  });
  it('tileryTabInitToReducerInit auto-assigns missing id', () => {
    const r = tileryTabInitToReducerInit({ data: { x: 1 } });
    expect(r.id).toMatch(/^t_/);
    expect(r.data).toEqual({ x: 1 });
    expect(r.closeable).toBe(true);
    expect(r.draggable).toBe(true);
  });
  it('tileryTabInitToReducerInit preserves provided id', () => {
    expect(tileryTabInitToReducerInit({ id: 'mine', data: {} }).id).toBe(
      'mine',
    );
  });
  it('tileryTabInitToReducerInit normalizes locked tabs', () => {
    expect(
      tileryTabInitToReducerInit({ id: 'mine', data: {}, locked: true }),
    ).toMatchObject({
      id: 'mine',
      closeable: false,
      draggable: false,
    });
  });
});

// Cross-panel beforeTab / afterTab is what drag-onto-a-tab-in-another-panel
// dispatches at the end of a drop. Same-panel beforeTab/afterTab is already
// covered above; this pins the cross-panel behavior — the tab must land in
// the ref tab's panel, the source panel must be updated, and active-tab
// selection in the source must fall over to a sibling.
describe('TAB_MOVE — cross-panel beforeTab / afterTab', () => {
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
      type: 'TAB_MOVE',
      tabId: 'L1',
      to: { beforeTabId: 'R2' },
    });
    expect(next.panels.L!.tabs).toEqual(['L2']);
    expect(next.panels.R!.tabs).toEqual(['R1', 'L1', 'R2']);
    expect(next.tabs.L1!.panelId).toBe('R');
  });

  it('moves the tab to the ref-tab’s panel and inserts AFTER the ref', () => {
    const next = tileryReducer(twoPanels(), {
      type: 'TAB_MOVE',
      tabId: 'L1',
      to: { afterTabId: 'R1' },
    });
    expect(next.panels.L!.tabs).toEqual(['L2']);
    expect(next.panels.R!.tabs).toEqual(['R1', 'L1', 'R2']);
    expect(next.tabs.L1!.panelId).toBe('R');
  });

  it('picks a sibling as the source panel’s new active when active is moved', () => {
    const next = tileryReducer(twoPanels(), {
      type: 'TAB_MOVE',
      tabId: 'L1', // active in L
      to: { beforeTabId: 'R1' },
    });
    expect(next.panels.L!.activeTabId).toBe('L2');
  });

  it('activates the moved tab in the destination panel (drag-to-foreground)', () => {
    const next = tileryReducer(twoPanels(), {
      type: 'TAB_MOVE',
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
      type: 'TAB_MOVE',
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
  it('PANEL_FULLSCREEN_SET is a no-op for missing or already-restored panels', () => {
    const state = twoSideBySide();
    expect(
      tileryReducer(state, {
        type: 'PANEL_FULLSCREEN_SET',
        panelId: 'phantom',
        fullScreen: true,
      }),
    ).toBe(state);
    expect(
      tileryReducer(state, {
        type: 'PANEL_FULLSCREEN_SET',
        panelId: 'L',
        fullScreen: false,
      }),
    ).toBe(state);
  });

  it('PANEL_FULLSCREEN_SET makes one panel fullscreen at a time', () => {
    const base = twoSideBySide();
    const state: TileryLayoutState = {
      ...base,
      panels: {
        ...base.panels,
        R: { ...base.panels.R!, fullScreen: true },
      },
    };
    const next = tileryReducer(state, {
      type: 'PANEL_FULLSCREEN_SET',
      panelId: 'L',
      fullScreen: true,
    });
    expect(next.panels.L!.fullScreen).toBe(true);
    expect(next.panels.R!.fullScreen).toBe(false);
  });

  it('PANEL_FULLSCREEN_SET true is a no-op when the panel is already fullscreen', () => {
    const state = tileryReducer(twoSideBySide(), {
      type: 'PANEL_FULLSCREEN_SET',
      panelId: 'L',
      fullScreen: true,
    });
    expect(
      tileryReducer(state, {
        type: 'PANEL_FULLSCREEN_SET',
        panelId: 'L',
        fullScreen: true,
      }),
    ).toBe(state);
  });

  it('PANEL_FULLSCREEN_SET false restores a fullscreen panel', () => {
    const state = tileryReducer(twoSideBySide(), {
      type: 'PANEL_FULLSCREEN_SET',
      panelId: 'L',
      fullScreen: true,
    });
    const next = tileryReducer(state, {
      type: 'PANEL_FULLSCREEN_SET',
      panelId: 'L',
      fullScreen: false,
    });
    expect(next.panels.L!.fullScreen).toBe(false);
  });

  it('suppresses dividers and fullscreen-target splits while a panel is fullscreen', () => {
    const state = tileryReducer(twoSideBySide(), {
      type: 'PANEL_FULLSCREEN_SET',
      panelId: 'L',
      fullScreen: true,
    });
    expect(tileryDeriveDividers(state)).toEqual([]);
    expect(
      tileryReducer(state, {
        type: 'PANEL_SPLIT',
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
        type: 'TAB_MOVE',
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
