import { describe, expect, it } from 'vite-plus/test';
import { makeTileryHandle } from './handles';
import { tileryReducer, type TileryReducerAction } from './reducer';
import { createStateFromPanels } from './test-helpers';
import type { TileryLayoutState, TilerySizeResolutionContext } from '../types';

function makeStore(
  initial?: TileryLayoutState,
  getSizeContext?: () => TilerySizeResolutionContext | undefined,
) {
  let state =
    initial ??
    createStateFromPanels({
      panels: [
        {
          id: 'P1',
          inset: { top: 0, right: 50, bottom: 0, left: 0 },
          tabs: [
            { id: 'T1', data: { title: 'one' } },
            { id: 'T2', data: { title: 'two' } },
          ],
          activeTabId: 'T1',
        },
        {
          id: 'P2',
          inset: { top: 0, right: 0, bottom: 0, left: 50 },
          tabs: [{ id: 'T3', data: { title: 'three' } }],
        },
      ],
    });
  const dispatched: TileryReducerAction[] = [];
  const dispatch = (action: TileryReducerAction) => {
    dispatched.push(action);
    state = tileryReducer(state, action);
  };
  const getState = () => state;
  const handle = makeTileryHandle(getState, dispatch, getSizeContext);
  return { handle, getState, dispatched };
}

describe('TileryHandle lookups', () => {
  it('getPanel returns a handle for an existing panel and null otherwise', () => {
    const { handle } = makeStore();
    expect(handle.getPanel('P1')?.id).toBe('P1');
    expect(handle.getPanel('does-not-exist')).toBeNull();
  });
  it('getTab returns a handle for an existing tab and null otherwise', () => {
    const { handle } = makeStore();
    expect(handle.getTab('T1')?.id).toBe('T1');
    expect(handle.getTab('does-not-exist')).toBeNull();
  });
  it('getPanels returns handles in panelOrder', () => {
    const { handle } = makeStore();
    expect(handle.getPanels().map((p) => p.id)).toEqual(['P1', 'P2']);
  });
  it('getTabs returns handles for every tab', () => {
    const { handle } = makeStore();
    const ids = handle
      .getTabs()
      .map((t) => t.id)
      .sort();
    expect(ids).toEqual(['T1', 'T2', 'T3']);
  });
  it('exposes getState() returning the live state', () => {
    const { handle, getState } = makeStore();
    expect(handle.getState()).toBe(getState());
  });
  it('returns a serializable layout snapshot', () => {
    const { handle } = makeStore(
      createStateFromPanels({
        panels: [
          {
            id: 'P1',
            inset: { top: 0, right: 50, bottom: 0, left: 0 },
            tabs: [
              { id: 'T1', data: { title: 'one' }, closeable: false },
              { id: 'T2', data: { title: 'two' } },
            ],
            activeTabId: 'T2',
            fullScreen: true,
            minSize: '160px',
            maxSize: '80%',
          },
          {
            id: 'P2',
            inset: { top: 0, right: 0, bottom: 0, left: 50 },
            tabs: [{ id: 'T3', data: { title: 'three' } }],
          },
        ],
      }),
    );

    expect(handle.getLayout()).toMatchObject({
      type: 'split',
      direction: 'horizontal',
      children: [
        {
          type: 'panel',
          id: 'P1',
          size: 50,
          activeTabId: 'T2',
          fullScreen: true,
          minSize: '160px',
          maxSize: '80%',
          tabs: [
            {
              id: 'T1',
              data: { title: 'one' },
              closeable: false,
              draggable: true,
            },
            {
              id: 'T2',
              data: { title: 'two' },
              closeable: true,
              draggable: true,
            },
          ],
        },
        {
          type: 'panel',
          id: 'P2',
          size: 50,
          tabs: [
            {
              id: 'T3',
              data: { title: 'three' },
              closeable: true,
              draggable: true,
            },
          ],
        },
      ],
    });
  });
  it('returns an empty layout snapshot when no panels remain', () => {
    const { handle } = makeStore(
      createStateFromPanels({
        panels: [],
      }),
    );

    expect(handle.getLayout()).toEqual({ type: 'empty' });
  });
  it('round-trips explicit tab behavior through setLayout', () => {
    const { handle, getState } = makeStore(
      createStateFromPanels({
        panels: [
          {
            id: 'P',
            inset: { top: 0, right: 0, bottom: 0, left: 0 },
            tabs: [
              {
                id: 'T',
                data: { title: 'locked' },
                closeable: false,
                draggable: false,
              },
            ],
          },
        ],
      }),
    );
    const snapshot = handle.getLayout<{ title: string }>();

    expect(snapshot).toMatchObject({
      type: 'panel',
      tabs: [
        {
          id: 'T',
          data: { title: 'locked' },
          closeable: false,
          draggable: false,
        },
      ],
    });

    handle.setLayout(snapshot);

    expect(getState().tabs.T).toMatchObject({
      closeable: false,
      draggable: false,
    });
  });
  it('serializes a transient single-child split as its remaining child', () => {
    const { handle } = makeStore({
      panels: {
        P: {
          id: 'P',
          kind: 'tiled',
          inset: { top: 0, right: 0, bottom: 0, left: 0 },
          tabs: ['T'],
          activeTabId: null,
        },
      },
      panelOrder: ['P'],
      tabs: {
        T: {
          id: 'T',
          panelId: 'P',
          data: { title: 'one' },
          closeable: true,
          draggable: true,
        },
      },
      layout: {
        kind: 'split',
        id: 'transient',
        direction: 'horizontal',
        size: 75,
        children: [{ kind: 'panel', panelId: 'P', size: 25, resizable: false }],
      },
    });

    const snapshot = handle.getLayout();
    expect(snapshot).toMatchObject({
      type: 'panel',
      id: 'P',
      size: 75,
      resizable: false,
      tabs: [
        {
          id: 'T',
          data: { title: 'one' },
          closeable: true,
          draggable: true,
        },
      ],
    });
    expect(snapshot).toHaveProperty('activeTabId', undefined);
  });

  it('serializes parent resize metadata from a transient single-child split', () => {
    const { handle } = makeStore({
      panels: {
        P: {
          id: 'P',
          kind: 'tiled',
          inset: { top: 0, right: 0, bottom: 0, left: 0 },
          tabs: ['T'],
          activeTabId: 'T',
        },
      },
      panelOrder: ['P'],
      tabs: {
        T: {
          id: 'T',
          panelId: 'P',
          data: { title: 'one' },
          closeable: true,
          draggable: true,
        },
      },
      layout: {
        kind: 'split',
        id: 'transient',
        direction: 'horizontal',
        size: 75,
        resizable: true,
        children: [{ kind: 'panel', panelId: 'P', size: 25 }],
      },
    });

    expect(handle.getLayout()).toMatchObject({
      type: 'panel',
      id: 'P',
      size: 75,
      resizable: true,
    });
  });
});

describe('TileryHandle mutations', () => {
  it('splitPanel dispatches SPLIT_PANEL with defaults and returns a handle to the new panel', () => {
    const { handle, dispatched } = makeStore();
    const newPanel = handle.splitPanel('P1', 'right');
    expect(dispatched).toHaveLength(1);
    const action = dispatched[0]!;
    if (action.type !== 'SPLIT_PANEL') throw new Error('expected SPLIT_PANEL');
    expect(action.panelId).toBe('P1');
    expect(action.direction).toBe('right');
    expect(action.sizePercent).toBe(50);
    expect(action.activate).toBe(true);
    expect(newPanel.id).toBe(action.newPanelId);
  });
  it('splitPanel forwards opts (size, activate, tabs)', () => {
    const { handle, dispatched } = makeStore();
    handle.splitPanel('P1', 'bottom', {
      size: 30,
      minSize: 20,
      maxSize: 80,
      resizable: false,
      activate: false,
      tabs: [{ id: 'NEW', data: { title: 'new' } }],
    });
    const action = dispatched[0]!;
    if (action.type !== 'SPLIT_PANEL') throw new Error('expected SPLIT_PANEL');
    expect(action.sizePercent).toBe(30);
    expect(action.minSize).toBe(20);
    expect(action.maxSize).toBe(80);
    expect(action.resizable).toBe(false);
    expect(action.activate).toBe(false);
    expect(action.tabs).toEqual([
      { id: 'NEW', data: { title: 'new' }, closeable: true, draggable: true },
    ]);
  });
  it('splitPanel forwards measured size context for unit constraints', () => {
    const { handle, dispatched } = makeStore(undefined, () => ({
      width: 1000,
      height: 800,
    }));
    handle.splitPanel('P1', 'bottom', {
      minSize: '240px',
      maxSize: '50%',
    });
    const action = dispatched[0]!;
    if (action.type !== 'SPLIT_PANEL') throw new Error('expected SPLIT_PANEL');
    expect(action.minSize).toBe('240px');
    expect(action.maxSize).toBe('50%');
    expect(action.sizeContext).toEqual({ width: 1000, height: 800 });
  });
  it('splitPanel normalizes locked tabs to explicit behavior booleans', () => {
    const { handle, dispatched } = makeStore();
    handle.splitPanel('P1', 'bottom', {
      tabs: [{ id: 'LOCKED', data: {}, locked: true }],
    });
    const action = dispatched[0]!;
    if (action.type !== 'SPLIT_PANEL') throw new Error('expected SPLIT_PANEL');
    expect(action.tabs).toEqual([
      { id: 'LOCKED', data: {}, closeable: false, draggable: false },
    ]);
  });
  it('splitPanel normalizes locked options to explicit behavior booleans', () => {
    const { handle, dispatched } = makeStore();
    handle.splitPanel('P1', 'right', { locked: true });
    const action = dispatched[0]!;
    if (action.type !== 'SPLIT_PANEL') throw new Error('expected SPLIT_PANEL');
    expect(action.resizable).toBe(false);
    expect(action.draggable).toBe(false);
    expect(action.droppable).toBe(false);
  });
  it('removePanel dispatches REMOVE_PANEL', () => {
    const { handle, dispatched } = makeStore();
    handle.removePanel('P1');
    expect(dispatched[0]).toEqual({ type: 'REMOVE_PANEL', panelId: 'P1' });
  });
  it('dispatches fullscreen panel mode actions', () => {
    const { handle, dispatched } = makeStore();
    handle.maximizePanel('P1');
    handle.restorePanel('P1');
    expect(dispatched).toEqual([
      { type: 'SET_PANEL_FULLSCREEN', panelId: 'P1', fullScreen: true },
      { type: 'SET_PANEL_FULLSCREEN', panelId: 'P1', fullScreen: false },
    ]);
  });
  it('appendTab dispatches APPEND_TAB and returns a handle', () => {
    const { handle, dispatched } = makeStore();
    const t = handle.appendTab('P1', { id: 'TX', data: { title: 'x' } });
    expect(t.id).toBe('TX');
    expect(dispatched[0]).toEqual({
      type: 'APPEND_TAB',
      panelId: 'P1',
      tab: { id: 'TX', data: { title: 'x' }, closeable: true, draggable: true },
      activate: true,
    });
  });
  it('appendTab normalizes explicit tab behavior', () => {
    const { handle, dispatched } = makeStore();
    const tab = handle.appendTab('P1', {
      id: 'LOCKED',
      data: {},
      locked: true,
    });
    expect(tab.closeable).toBe(false);
    expect(tab.draggable).toBe(false);
    expect(dispatched[0]).toMatchObject({
      type: 'APPEND_TAB',
      tab: { id: 'LOCKED', data: {}, closeable: false, draggable: false },
    });
  });
  it('appendTab honors activate=false and auto-id when none provided', () => {
    const { handle, dispatched } = makeStore();
    handle.appendTab('P1', { data: { title: 'auto' } }, { activate: false });
    const action = dispatched[0]!;
    if (action.type !== 'APPEND_TAB') throw new Error('expected APPEND_TAB');
    expect(action.activate).toBe(false);
    expect(action.tab.id).toMatch(/^t_/);
  });
  it('insertTab dispatches INSERT_TAB at the given index', () => {
    const { handle, dispatched } = makeStore();
    handle.insertTab('P1', { id: 'TI', data: {} }, 1, { activate: false });
    expect(dispatched[0]).toEqual({
      type: 'INSERT_TAB',
      panelId: 'P1',
      tab: { id: 'TI', data: {}, closeable: true, draggable: true },
      index: 1,
      activate: false,
    });
  });
  it('insertTab activates by default', () => {
    const { handle, dispatched } = makeStore();
    handle.insertTab('P1', { id: 'TI2', data: {} }, 0);
    const action = dispatched[0]!;
    if (action.type !== 'INSERT_TAB') throw new Error('expected INSERT_TAB');
    expect(action.activate).toBe(true);
  });
  it('removeTab dispatches REMOVE_TAB', () => {
    const { handle, dispatched } = makeStore();
    handle.removeTab('T1');
    expect(dispatched[0]).toEqual({ type: 'REMOVE_TAB', tabId: 'T1' });
  });
  it('setTabBehavior dispatches SET_TAB_BEHAVIOR', () => {
    const { handle, dispatched, getState } = makeStore();
    handle.setTabBehavior('T1', { draggable: false });
    expect(dispatched[0]).toEqual({
      type: 'SET_TAB_BEHAVIOR',
      tabId: 'T1',
      behavior: { draggable: false },
    });
    expect(getState().tabs.T1).toMatchObject({
      closeable: true,
      draggable: false,
    });
  });
  it('setActiveTab dispatches SET_ACTIVE_TAB', () => {
    const { handle, dispatched } = makeStore();
    handle.setActiveTab('T2');
    expect(dispatched[0]).toEqual({ type: 'SET_ACTIVE_TAB', tabId: 'T2' });
  });
  it('swapPanels dispatches SWAP_PANELS with both ids', () => {
    const { handle, dispatched } = makeStore();
    handle.swapPanels('P1', 'P2');
    expect(dispatched[0]).toEqual({
      type: 'SWAP_PANELS',
      panelA: 'P1',
      panelB: 'P2',
    });
  });
  it('setLayout replaces the current state from a layout snapshot', () => {
    const { handle, dispatched, getState } = makeStore();
    handle.setLayout({
      type: 'split',
      direction: 'vertical',
      resizable: false,
      children: [
        {
          type: 'panel',
          id: 'Top',
          size: 25,
          resizable: false,
          tabs: [{ id: 'A', data: { title: 'top' } }],
        },
        {
          type: 'panel',
          id: 'Bottom',
          size: 75,
          tabs: [{ id: 'B', data: { title: 'bottom' } }],
        },
      ],
    });

    expect(dispatched[0]?.type).toBe('REPLACE_STATE');
    expect(getState().panelOrder).toEqual(['Top', 'Bottom']);
    expect(getState().panels.Top!.inset).toEqual({
      top: 0,
      right: 0,
      bottom: 75,
      left: 0,
    });
    expect(handle.getLayout()).toMatchObject({
      type: 'split',
      direction: 'vertical',
      resizable: false,
      children: [
        { type: 'panel', id: 'Top', size: 25, resizable: false },
        { type: 'panel', id: 'Bottom', size: 75 },
      ],
    });
  });
  it('setLayout supports an empty snapshot', () => {
    const { handle, getState } = makeStore();
    handle.setLayout({ type: 'empty' });

    expect(getState()).toEqual({
      panels: {},
      panelOrder: [],
      tabs: {},
      layout: null,
    });
    expect(handle.getLayout()).toEqual({ type: 'empty' });
  });
  it('setLayout replaces current locked tabs explicitly', () => {
    const { handle, getState } = makeStore(
      createStateFromPanels({
        panels: [
          {
            id: 'P',
            inset: { top: 0, right: 0, bottom: 0, left: 0 },
            tabs: [
              { id: 'LOCKED', data: {}, closeable: false, draggable: false },
            ],
          },
        ],
      }),
    );

    handle.setLayout({
      type: 'panel',
      id: 'P',
      tabs: [{ id: 'OPEN', data: {} }],
    });

    expect(getState().tabs.LOCKED).toBeUndefined();
    expect(getState().tabs.OPEN).toMatchObject({
      closeable: true,
      draggable: true,
    });
  });
});

describe('TileryHandle.moveTab — every TileryMoveTarget shape', () => {
  it('panel target without index uses MAX_SAFE_INTEGER (append)', () => {
    const { handle, dispatched } = makeStore();
    handle.moveTab('T1', { panel: 'P2' });
    const action = dispatched[0]!;
    if (action.type !== 'MOVE_TAB') throw new Error('expected MOVE_TAB');
    expect(action.to).toEqual({
      panelId: 'P2',
      index: Number.MAX_SAFE_INTEGER,
    });
  });
  it('panel target with index passes it through', () => {
    const { handle, dispatched } = makeStore();
    handle.moveTab('T1', { panel: 'P2', index: 0 });
    const action = dispatched[0]!;
    if (action.type !== 'MOVE_TAB') throw new Error('expected MOVE_TAB');
    expect(action.to).toEqual({ panelId: 'P2', index: 0 });
  });
  it('beforeTab target maps to beforeTabId', () => {
    const { handle, dispatched } = makeStore();
    handle.moveTab('T1', { beforeTab: 'T3' });
    const action = dispatched[0]!;
    if (action.type !== 'MOVE_TAB') throw new Error('expected MOVE_TAB');
    expect(action.to).toEqual({ beforeTabId: 'T3' });
  });
  it('afterTab target maps to afterTabId', () => {
    const { handle, dispatched } = makeStore();
    handle.moveTab('T1', { afterTab: 'T3' });
    const action = dispatched[0]!;
    if (action.type !== 'MOVE_TAB') throw new Error('expected MOVE_TAB');
    expect(action.to).toEqual({ afterTabId: 'T3' });
  });
  it('splitPanel target maps size to reducer sizePercent', () => {
    const { handle, dispatched } = makeStore();
    handle.moveTab('T1', {
      splitPanel: 'P2',
      direction: 'top',
      size: 25,
      minSize: 15,
      maxSize: 65,
      resizable: false,
    });
    const action = dispatched[0]!;
    if (action.type !== 'MOVE_TAB') throw new Error('expected MOVE_TAB');
    if (!('splitPanelId' in action.to))
      throw new Error('expected splitPanelId target');
    expect(action.to.splitPanelId).toBe('P2');
    expect(action.to.direction).toBe('top');
    expect(action.to.sizePercent).toBe(25);
    expect(action.to.minSize).toBe(15);
    expect(action.to.maxSize).toBe(65);
    expect(action.to.resizable).toBe(false);
    expect(action.to.newPanelId).toMatch(/^p_/);
  });
  it('splitPanel move target normalizes locked to explicit behavior booleans', () => {
    const { handle, dispatched } = makeStore();
    handle.moveTab('T1', {
      splitPanel: 'P2',
      direction: 'top',
      locked: true,
    });
    const action = dispatched[0]!;
    if (action.type !== 'MOVE_TAB') throw new Error('expected MOVE_TAB');
    if (!('splitPanelId' in action.to))
      throw new Error('expected splitPanelId target');
    expect(action.to.resizable).toBe(false);
    expect(action.to.draggable).toBe(false);
    expect(action.to.droppable).toBe(false);
  });
  it('splitPanel target defaults size to 50', () => {
    const { handle, dispatched } = makeStore();
    handle.moveTab('T1', { splitPanel: 'P2', direction: 'left' });
    const action = dispatched[0]!;
    if (action.type !== 'MOVE_TAB') throw new Error('expected MOVE_TAB');
    if (!('splitPanelId' in action.to))
      throw new Error('expected splitPanelId target');
    expect(action.to.sizePercent).toBe(50);
  });
});

describe('TileryPanelHandle', () => {
  it('reads inset live from state', () => {
    const { handle } = makeStore();
    const panel = handle.getPanel('P1')!;
    expect(panel.inset).toEqual({ top: 0, right: 50, bottom: 0, left: 0 });
  });
  it('returns the default zero-inset when the panel no longer exists', () => {
    const { handle } = makeStore();
    const panel = handle.getPanel('P1')!;
    handle.removePanel('P1');
    expect(panel.inset).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
  });
  it('returns empty tabs list when the panel no longer exists', () => {
    const { handle } = makeStore();
    const panel = handle.getPanel('P1')!;
    handle.removePanel('P1');
    expect(panel.tabs).toEqual([]);
  });
  it('returns the live tabs list', () => {
    const { handle } = makeStore();
    const panel = handle.getPanel('P1')!;
    expect(panel.tabs.map((t) => t.id)).toEqual(['T1', 'T2']);
  });
  it('returns the active tab handle, or null when missing', () => {
    const { handle } = makeStore();
    const panel = handle.getPanel('P1')!;
    expect(panel.activeTab?.id).toBe('T1');
    handle.removePanel('P1');
    expect(panel.activeTab).toBeNull();
  });
  it('reads fullscreen panel mode metadata live from state', () => {
    let state = createStateFromPanels({
      panels: [
        {
          id: 'P',
          inset: { top: 0, right: 0, bottom: 0, left: 0 },
          tabs: [{ id: 'T', data: {} }],
          fullScreen: false,
          minSize: 20,
          maxSize: 80,
        },
      ],
    });
    const handle = makeTileryHandle(
      () => state,
      (action) => {
        state = tileryReducer(state, action);
      },
    );
    const panel = handle.getPanel('P')!;
    expect(panel.fullScreen).toBe(false);
    expect(panel.minSize).toBe(20);
    expect(panel.maxSize).toBe(80);
    panel.maximize();
    expect(panel.fullScreen).toBe(true);
  });
  it('returns false for fullscreen when the panel no longer exists', () => {
    const { handle } = makeStore();
    const panel = handle.getPanel('P1')!;
    handle.removePanel('P1');
    expect(panel.fullScreen).toBe(false);
    expect(panel.minSize).toBeUndefined();
    expect(panel.maxSize).toBeUndefined();
  });
  it('returns null activeTab when the panel exists but activeTabId is null', () => {
    let state = createStateFromPanels({
      panels: [
        { id: 'P', inset: { top: 0, right: 0, bottom: 0, left: 0 }, tabs: [] },
      ],
    });
    state = {
      ...state,
      panels: { ...state.panels, P: { ...state.panels.P!, activeTabId: null } },
    };
    const dispatch = () => {};
    const handle = makeTileryHandle(() => state, dispatch);
    expect(handle.getPanel('P')!.activeTab).toBeNull();
  });
  it('appendTab delegates to tilery.appendTab', () => {
    const { handle, dispatched } = makeStore();
    const panel = handle.getPanel('P1')!;
    panel.appendTab({ id: 'NEW', data: {} });
    expect(dispatched[0]!.type).toBe('APPEND_TAB');
  });
  it('insertTab delegates to tilery.insertTab', () => {
    const { handle, dispatched } = makeStore();
    const panel = handle.getPanel('P1')!;
    panel.insertTab({ id: 'NEW', data: {} }, 0);
    expect(dispatched[0]!.type).toBe('INSERT_TAB');
  });
  it('split delegates to tilery.splitPanel', () => {
    const { handle, dispatched } = makeStore();
    const panel = handle.getPanel('P1')!;
    panel.split('left');
    expect(dispatched[0]!.type).toBe('SPLIT_PANEL');
  });
  it('remove delegates to tilery.removePanel', () => {
    const { handle, dispatched } = makeStore();
    const panel = handle.getPanel('P1')!;
    panel.remove();
    expect(dispatched[0]).toEqual({ type: 'REMOVE_PANEL', panelId: 'P1' });
  });
  it('fullscreen panel mode methods delegate to the root handle', () => {
    const { handle, dispatched } = makeStore();
    const panel = handle.getPanel('P1')!;
    panel.maximize();
    panel.restore();
    expect(dispatched).toEqual([
      { type: 'SET_PANEL_FULLSCREEN', panelId: 'P1', fullScreen: true },
      { type: 'SET_PANEL_FULLSCREEN', panelId: 'P1', fullScreen: false },
    ]);
  });
  it('setActiveTab delegates to tilery.setActiveTab', () => {
    const { handle, dispatched } = makeStore();
    const panel = handle.getPanel('P1')!;
    panel.setActiveTab('T2');
    expect(dispatched[0]).toEqual({ type: 'SET_ACTIVE_TAB', tabId: 'T2' });
  });
});

describe('TileryTabHandle', () => {
  it('reads panel, index, and data live from state', () => {
    const { handle } = makeStore();
    const tab = handle.getTab('T2')!;
    expect(tab.id).toBe('T2');
    expect(tab.panel.id).toBe('P1');
    expect(tab.index).toBe(1);
    expect((tab.data as { title: string }).title).toBe('two');
  });
  it('closeable defaults to true and reflects state', () => {
    const { handle } = makeStore();
    const tab = handle.getTab('T1')!;
    expect(tab.closeable).toBe(true);
  });
  it('draggable defaults to true and reflects state', () => {
    const { handle } = makeStore();
    const tab = handle.getTab('T1')!;
    expect(tab.draggable).toBe(true);
  });
  it('closeable returns true when tab is missing from state', () => {
    const { handle } = makeStore();
    const tab = handle.getTab('T1')!;
    handle.removeTab('T1');
    expect(tab.closeable).toBe(true);
  });
  it('draggable returns true when tab is missing from state', () => {
    const { handle } = makeStore();
    const tab = handle.getTab('T1')!;
    handle.removeTab('T1');
    expect(tab.draggable).toBe(true);
  });
  it('panel getter throws when the tab no longer exists', () => {
    const { handle } = makeStore();
    const tab = handle.getTab('T1')!;
    handle.removeTab('T1');
    expect(() => tab.panel).toThrow(/no longer exists/);
  });
  it('index returns -1 if tab is missing', () => {
    const { handle } = makeStore();
    const tab = handle.getTab('T1')!;
    handle.removeTab('T1');
    expect(tab.index).toBe(-1);
  });
  it('index returns -1 if the panel back-ref is broken', () => {
    let state = createStateFromPanels({
      panels: [
        {
          id: 'P',
          inset: { top: 0, right: 0, bottom: 0, left: 0 },
          tabs: [{ id: 'T', data: {} }],
        },
      ],
    });
    state = {
      ...state,
      tabs: { ...state.tabs, T: { ...state.tabs.T!, panelId: 'phantom' } },
    };
    const handle = makeTileryHandle(
      () => state,
      () => {},
    );
    const tab = handle.getTab('T')!;
    expect(tab.index).toBe(-1);
  });
  it('data returns undefined when the tab is gone', () => {
    const { handle } = makeStore();
    const tab = handle.getTab('T1')!;
    handle.removeTab('T1');
    expect(tab.data).toBeUndefined();
  });
  it('setData dispatches SET_PANEL_DATA', () => {
    const { handle, dispatched } = makeStore();
    const tab = handle.getTab('T1')!;
    tab.setData({ title: 'renamed' });
    expect(dispatched[0]).toEqual({
      type: 'SET_PANEL_DATA',
      tabId: 'T1',
      data: { title: 'renamed' },
    });
  });
  it('setBehavior delegates to tilery.setTabBehavior', () => {
    const { handle, dispatched, getState } = makeStore();
    const tab = handle.getTab('T1')!;
    tab.setBehavior({ locked: true });

    expect(dispatched[0]).toEqual({
      type: 'SET_TAB_BEHAVIOR',
      tabId: 'T1',
      behavior: { locked: true },
    });
    expect(getState().tabs.T1).toMatchObject({
      closeable: false,
      draggable: false,
    });
    expect(tab.closeable).toBe(false);
    expect(tab.draggable).toBe(false);
  });
  it('moveTo delegates to tilery.moveTab', () => {
    const { handle, dispatched } = makeStore();
    const tab = handle.getTab('T1')!;
    tab.moveTo({ panel: 'P2' });
    expect(dispatched[0]!.type).toBe('MOVE_TAB');
  });
  it('moveTo no-ops for a non-draggable tab after dispatch', () => {
    const { handle, getState } = makeStore(
      createStateFromPanels({
        panels: [
          {
            id: 'P1',
            inset: { top: 0, right: 50, bottom: 0, left: 0 },
            tabs: [{ id: 'T1', data: {}, draggable: false }],
          },
          {
            id: 'P2',
            inset: { top: 0, right: 0, bottom: 0, left: 50 },
            tabs: [{ id: 'T2', data: {} }],
          },
        ],
      }),
    );
    handle.getTab('T1')!.moveTo({ panel: 'P2' });
    expect(getState().panels.P1!.tabs).toEqual(['T1']);
    expect(getState().panels.P2!.tabs).toEqual(['T2']);
  });
  it('activate delegates to tilery.setActiveTab', () => {
    const { handle, dispatched } = makeStore();
    const tab = handle.getTab('T2')!;
    tab.activate();
    expect(dispatched[0]).toEqual({ type: 'SET_ACTIVE_TAB', tabId: 'T2' });
  });
  it('remove delegates to tilery.removeTab', () => {
    const { handle, dispatched } = makeStore();
    const tab = handle.getTab('T1')!;
    tab.remove();
    expect(dispatched[0]).toEqual({ type: 'REMOVE_TAB', tabId: 'T1' });
  });
  it('remove no-ops for a non-closeable tab after dispatch', () => {
    const { handle, getState } = makeStore(
      createStateFromPanels({
        panels: [
          {
            id: 'P1',
            inset: { top: 0, right: 0, bottom: 0, left: 0 },
            tabs: [{ id: 'T1', data: {}, closeable: false }],
          },
        ],
      }),
    );
    handle.getTab('T1')!.remove();
    expect(getState().tabs.T1).toBeDefined();
    expect(getState().panels.P1!.tabs).toEqual(['T1']);
  });
});
