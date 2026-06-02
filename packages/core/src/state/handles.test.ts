import { describe, expect, it } from 'vite-plus/test';
import { makeTileryHandle, type TileryHandleOptions } from './handles';
import { tileryReducer, type TileryReducerAction } from './reducer';
import { createStateFromPanels } from './test-helpers';
import type { TileryLayoutState, TilerySizeResolutionContext } from '../types';

function makeStore(
  initial?: TileryLayoutState,
  getSizeContext?: () => TilerySizeResolutionContext | undefined,
  options?: TileryHandleOptions,
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
  const handle = makeTileryHandle(getState, dispatch, getSizeContext, options);
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
  it('getPanels returns tiled panels followed by floating panels', () => {
    const { handle } = makeStore();
    handle.floatPanel('P1', { x: 10, y: 12, width: 40, height: 44 });
    expect(handle.getPanels().map((p) => p.id)).toEqual(['P2', 'P1']);
    expect(handle.getPanel('P1')?.floating).toBe(true);
    expect(handle.getPanel('P1')?.floatingBounds).toEqual({
      x: 10,
      y: 12,
      width: 40,
      height: 44,
    });
  });
  it('floatPanel dispatches runtime behavior options', () => {
    const { handle, dispatched, getState } = makeStore();
    handle.floatPanel('P1', {
      resizable: false,
      draggable: false,
      droppable: false,
    });

    expect(dispatched[0]).toEqual({
      type: 'FLOAT_PANEL',
      panelId: 'P1',
      behavior: { resizable: false, draggable: false, droppable: false },
    });
    expect(getState().panels.P1).toMatchObject({
      kind: 'floating',
      behavior: { resizable: false, draggable: false, droppable: false },
    });
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
      type: 'group',
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
  it('round-trips floating panels through layout snapshots', () => {
    const { handle, getState } = makeStore();

    handle.floatPanel('P1', { x: 14, y: 16, width: 42, height: 46 });
    handle.focusPanel('P1');
    const snapshot = handle.getLayout<{ title: string }>();

    expect(snapshot).toMatchObject({
      type: 'root',
      main: {
        type: 'panel',
        id: 'P2',
      },
      floating: [
        {
          type: 'floatingPanel',
          id: 'P1',
          bounds: { x: 14, y: 16, width: 42, height: 46 },
          zIndex: 20,
          tabs: [
            {
              id: 'T1',
              data: { title: 'one' },
              closeable: true,
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
      ],
    });

    handle.setLayout(snapshot);

    expect(getState().panels.P1).toMatchObject({
      kind: 'floating',
      floating: {
        bounds: { x: 14, y: 16, width: 42, height: 46 },
        zIndex: 20,
      },
    });
    expect(handle.getPanels().map((panel) => panel.id)).toEqual(['P2', 'P1']);
  });
  it('round-trips native popout metadata through layout snapshots', () => {
    const { handle, getState } = makeStore();

    handle.popoutPanel('P1', {
      floatingBounds: { x: 14, y: 16, width: 42, height: 46 },
      windowBounds: { left: 90, top: 80, width: 760, height: 540 },
    });
    const snapshot = handle.getLayout<{ title: string }>();

    expect(snapshot).toMatchObject({
      type: 'root',
      floating: [
        {
          type: 'floatingPanel',
          id: 'P1',
          popout: {
            windowBounds: { left: 90, top: 80, width: 760, height: 540 },
          },
        },
      ],
    });

    handle.setLayout(snapshot);

    expect(getState().panels.P1).toMatchObject({
      kind: 'floating',
      floating: {
        popout: {
          windowBounds: { left: 90, top: 80, width: 760, height: 540 },
        },
      },
    });
    expect(handle.getPanel('P1')?.poppedOut).toBe(true);
    expect(handle.getPanel('P1')?.popoutWindowBounds).toEqual({
      left: 90,
      top: 80,
      width: 760,
      height: 540,
    });
  });

  it('omits activeTabId for a floating panel with no active tab', () => {
    const { handle } = makeStore(
      createStateFromPanels({
        panels: [
          {
            id: 'P1',
            inset: { top: 0, right: 0, bottom: 0, left: 0 },
            tabs: [],
            activeTabId: null,
          },
        ],
      }),
    );

    handle.floatPanel('P1');

    expect(handle.getLayout()).toMatchObject({
      type: 'root',
      main: { type: 'empty' },
      floating: [
        {
          type: 'floatingPanel',
          id: 'P1',
          activeTabId: undefined,
          tabs: [],
        },
      ],
    });
  });

  it('ignores non-floating ids while serializing floating panel snapshots', () => {
    const state: TileryLayoutState = {
      ...createStateFromPanels({
        panels: [
          {
            id: 'P1',
            inset: { top: 0, right: 0, bottom: 0, left: 0 },
            tabs: [{ id: 'T1', data: { title: 'one' } }],
          },
        ],
      }),
      floatingPanelOrder: ['P1'],
    };
    const { handle } = makeStore(state);

    expect(handle.getLayout()).toMatchObject({
      type: 'panel',
      id: 'P1',
      resizable: true,
      draggable: true,
      droppable: true,
      tabs: [
        {
          id: 'T1',
          data: { title: 'one' },
          closeable: true,
          draggable: true,
        },
      ],
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
  it('popoutPanel ignores missing panels before requesting a window', () => {
    const requests: unknown[] = [];
    const { handle, dispatched } = makeStore(undefined, undefined, {
      requestPopoutPanel(panelId, opts) {
        requests.push({ panelId, opts });
      },
    });

    handle.popoutPanel('missing');

    expect(requests).toEqual([]);
    expect(dispatched).toEqual([]);
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
  it('openOrActivateTab activates an existing tab without adding another one', () => {
    const { handle, dispatched, getState } = makeStore();
    const tab = handle.openOrActivateTab(
      { id: 'T2', data: { title: 'updated' } },
      { panel: 'P2' },
    );

    expect(tab?.id).toBe('T2');
    expect(dispatched).toEqual([{ type: 'SET_ACTIVE_TAB', tabId: 'T2' }]);
    expect(getState().panels.P1!.tabs).toEqual(['T1', 'T2']);
    expect(getState().tabs.T2!.data).toEqual({ title: 'two' });
    expect(getState().panels.P1!.activeTabId).toBe('T2');
  });
  it('openOrActivateTab opens a missing tab at a panel target', () => {
    const { handle, dispatched, getState } = makeStore();
    const tab = handle.openOrActivateTab(
      { id: 'NEW', data: { title: 'new' } },
      { panel: 'P1', index: 1 },
    );

    expect(tab?.id).toBe('NEW');
    expect(dispatched[0]).toEqual({
      type: 'INSERT_TAB',
      panelId: 'P1',
      tab: {
        id: 'NEW',
        data: { title: 'new' },
        closeable: true,
        draggable: true,
      },
      index: 1,
      activate: true,
    });
    expect(getState().panels.P1!.tabs).toEqual(['T1', 'NEW', 'T2']);
    expect(getState().panels.P1!.activeTabId).toBe('NEW');
  });
  it('openOrActivateTab appends to a panel when no index is provided', () => {
    const { handle, dispatched, getState } = makeStore();
    const tab = handle.openOrActivateTab(
      { id: 'APPENDED', data: { title: 'appended' } },
      { panel: 'P1' },
    );

    expect(tab?.id).toBe('APPENDED');
    expect(dispatched[0]).toMatchObject({
      type: 'INSERT_TAB',
      panelId: 'P1',
      index: 2,
    });
    expect(getState().panels.P1!.tabs).toEqual(['T1', 'T2', 'APPENDED']);
  });
  it('openOrActivateTab opens around beforeTab and afterTab targets', () => {
    const { handle, getState } = makeStore();

    handle.openOrActivateTab({ id: 'BEFORE', data: {} }, { beforeTab: 'T2' });
    handle.openOrActivateTab({ id: 'AFTER', data: {} }, { afterTab: 'T2' });

    expect(getState().panels.P1!.tabs).toEqual(['T1', 'BEFORE', 'T2', 'AFTER']);
  });
  it('openOrActivateTab returns null when the open target cannot be resolved', () => {
    const { handle, dispatched } = makeStore();

    expect(
      handle.openOrActivateTab(
        { id: 'MISSING_PANEL', data: {} },
        { panel: 'X' },
      ),
    ).toBeNull();
    expect(
      handle.openOrActivateTab(
        { id: 'MISSING_TAB', data: {} },
        { beforeTab: 'X' },
      ),
    ).toBeNull();

    expect(dispatched).toEqual([]);
  });
  it('openOrActivateTab returns null when a tab back-reference is stale', () => {
    const state = createStateFromPanels({
      panels: [
        {
          id: 'P',
          inset: { top: 0, right: 0, bottom: 0, left: 0 },
          tabs: [{ id: 'T', data: {} }],
        },
      ],
    });
    const broken = {
      ...state,
      panels: {
        ...state.panels,
        P: { ...state.panels.P!, tabs: [] },
      },
    };
    const { handle, dispatched } = makeStore(broken);

    expect(
      handle.openOrActivateTab({ id: 'NEW', data: {} }, { afterTab: 'T' }),
    ).toBeNull();
    expect(dispatched).toEqual([]);

    const missingPanel = {
      ...state,
      tabs: { ...state.tabs, T: { ...state.tabs.T!, panelId: 'missing' } },
    };
    const stale = makeStore(missingPanel);

    expect(
      stale.handle.openOrActivateTab(
        { id: 'NEW_FROM_MISSING_PANEL', data: {} },
        { afterTab: 'T' },
      ),
    ).toBeNull();
    expect(stale.dispatched).toEqual([]);
  });
  it('changeTabId renames the tab, panel references, and active tab id', () => {
    const { handle, dispatched, getState } = makeStore();
    const tab = handle.changeTabId('T1', 'T1_RENAMED');

    expect(tab?.id).toBe('T1_RENAMED');
    expect(dispatched[0]).toEqual({
      type: 'CHANGE_TAB_ID',
      oldTabId: 'T1',
      newTabId: 'T1_RENAMED',
    });
    expect(handle.getTab('T1')).toBeNull();
    expect(handle.getTab('T1_RENAMED')?.data).toEqual({ title: 'one' });
    expect(getState().panels.P1!.tabs).toEqual(['T1_RENAMED', 'T2']);
    expect(getState().panels.P1!.activeTabId).toBe('T1_RENAMED');
  });
  it('changeTabId returns an existing handle when the id is unchanged', () => {
    const { handle, dispatched } = makeStore();

    expect(handle.changeTabId('T1', 'T1')?.id).toBe('T1');
    expect(handle.changeTabId('missing', 'missing')).toBeNull();
    expect(dispatched).toEqual([]);
  });
  it('changeTabId returns null for missing tabs, duplicate ids, and stale panel refs', () => {
    const { handle, dispatched } = makeStore();

    expect(handle.changeTabId('missing', 'NEW')).toBeNull();
    expect(handle.changeTabId('T1', 'T2')).toBeNull();
    expect(dispatched).toEqual([]);

    const state = createStateFromPanels({
      panels: [
        {
          id: 'P',
          inset: { top: 0, right: 0, bottom: 0, left: 0 },
          tabs: [{ id: 'T', data: {} }],
        },
      ],
    });
    const broken = {
      ...state,
      tabs: { ...state.tabs, T: { ...state.tabs.T!, panelId: 'missing' } },
    };
    const stale = makeStore(broken);

    expect(stale.handle.changeTabId('T', 'NEW')).toBeNull();
    expect(stale.dispatched).toEqual([]);
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
      type: 'group',
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
      type: 'group',
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
      floatingPanelOrder: [],
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

describe('TileryHandle tab floating helpers', () => {
  it('floatTab extracts a tab into a generated floating panel and returns its handle', () => {
    const { handle, dispatched, getState } = makeStore();
    const panel = handle.floatTab('T2', {
      bounds: { x: 12, y: 14, width: 34, height: 36 },
    });

    expect(panel?.id).toMatch(/^p_/);
    expect(dispatched[0]).toMatchObject({
      type: 'FLOAT_TAB',
      tabId: 'T2',
      bounds: { x: 12, y: 14, width: 34, height: 36 },
    });
    if (dispatched[0]?.type !== 'FLOAT_TAB') {
      throw new Error('expected FLOAT_TAB');
    }
    expect(dispatched[0].newPanelId).toBe(panel?.id);
    expect(getState().tabs.T2?.panelId).toBe(panel?.id);
    expect(panel?.floating).toBe(true);
  });

  it('floatTab can use an explicit panel id', () => {
    const { handle, dispatched, getState } = makeStore();
    const panel = handle.floatTab('T2', {
      panelId: 'T2_FLOATING',
      bounds: { x: 20 },
      resizable: false,
    });

    expect(panel?.id).toBe('T2_FLOATING');
    expect(dispatched[0]).toEqual({
      type: 'FLOAT_TAB',
      tabId: 'T2',
      newPanelId: 'T2_FLOATING',
      bounds: { x: 20 },
      behavior: { resizable: false },
    });
    expect(getState().panels.T2_FLOATING).toBeDefined();
    expect(getState().panels.T2_FLOATING).toMatchObject({
      behavior: { resizable: false, draggable: true, droppable: true },
    });
  });

  it('floatTab returns null without dispatching when the tab cannot move', () => {
    const { handle, dispatched } = makeStore(
      createStateFromPanels({
        panels: [
          {
            id: 'P1',
            inset: { top: 0, right: 0, bottom: 0, left: 0 },
            tabs: [{ id: 'T1', data: {}, draggable: false }],
          },
        ],
      }),
    );

    expect(handle.floatTab('T1', { panelId: 'T1_FLOATING' })).toBeNull();
    expect(dispatched).toEqual([]);
  });

  it('popoutTab requests a native window before dispatching extraction', () => {
    const requests: unknown[] = [];
    const { handle, dispatched, getState } = makeStore(undefined, undefined, {
      requestPopoutPanel(panelId, opts) {
        requests.push({ panelId, opts });
      },
    });

    const panel = handle.popoutTab('T2', {
      panelId: 'T2_POPOUT',
      floatingBounds: { x: 8, y: 10 },
      windowBounds: { left: 12, top: 14 },
      resizable: false,
    });

    expect(panel?.id).toBe('T2_POPOUT');
    expect(requests).toEqual([
      {
        panelId: 'T2_POPOUT',
        opts: {
          floatingBounds: { x: 8, y: 10 },
          windowBounds: { left: 12, top: 14 },
          resizable: false,
        },
      },
    ]);
    expect(dispatched[0]).toEqual({
      type: 'POPOUT_TAB',
      tabId: 'T2',
      newPanelId: 'T2_POPOUT',
      opts: {
        floatingBounds: { x: 8, y: 10 },
        windowBounds: { left: 12, top: 14 },
        resizable: false,
      },
    });
    expect(getState().tabs.T2?.panelId).toBe('T2_POPOUT');
    expect(getState().panels.T2_POPOUT).toMatchObject({
      behavior: { resizable: false, draggable: true, droppable: true },
    });
  });

  it('popoutTab returns null without dispatching when the popup is blocked', () => {
    const { handle, dispatched, getState } = makeStore(undefined, undefined, {
      requestPopoutPanel() {
        return false;
      },
    });

    expect(handle.popoutTab('T2', { panelId: 'T2_POPOUT' })).toBeNull();
    expect(dispatched).toEqual([]);
    expect(getState().tabs.T2?.panelId).toBe('P1');
  });

  it('popoutTab without options requests no panel options', () => {
    const requests: unknown[] = [];
    const { handle, dispatched } = makeStore(undefined, undefined, {
      requestPopoutPanel(panelId, opts) {
        requests.push({ panelId, opts });
      },
    });

    const panel = handle.popoutTab('T2');

    expect(panel?.id).toMatch(/^p_/);
    expect(requests).toEqual([{ panelId: panel?.id, opts: undefined }]);
    expect(dispatched[0]).toMatchObject({
      type: 'POPOUT_TAB',
      tabId: 'T2',
      newPanelId: panel?.id,
    });
  });

  it('floatTab returns null before dispatching when the target panel id already exists', () => {
    const { handle, dispatched } = makeStore();

    expect(handle.floatTab('T2', { panelId: 'P2' })).toBeNull();
    expect(dispatched).toEqual([]);
  });

  it('floatTab returns null before dispatching when the source panel is broken', () => {
    const state = createStateFromPanels({
      panels: [
        {
          id: 'P1',
          inset: { top: 0, right: 0, bottom: 0, left: 0 },
          tabs: [{ id: 'T1', data: {} }],
        },
      ],
    });
    const broken: TileryLayoutState = {
      ...state,
      tabs: {
        ...state.tabs,
        T1: { ...state.tabs.T1!, panelId: 'missing' },
      },
    };
    const { handle, dispatched } = makeStore(broken);

    expect(handle.floatTab('T1', { panelId: 'T1_FLOATING' })).toBeNull();
    expect(dispatched).toEqual([]);
  });

  it('popoutTab returns null before dispatching when the tab cannot move', () => {
    const { handle, dispatched } = makeStore(
      createStateFromPanels({
        panels: [
          {
            id: 'P1',
            inset: { top: 0, right: 0, bottom: 0, left: 0 },
            tabs: [{ id: 'T1', data: {}, draggable: false }],
          },
        ],
      }),
    );

    expect(handle.popoutTab('T1', { panelId: 'T1_POPOUT' })).toBeNull();
    expect(dispatched).toEqual([]);
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
    expect(panel.kind).toBe('tiled');
    expect(panel.floatingZIndex).toBeUndefined();
    expect(panel.popoutWindowBounds).toBeUndefined();
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
  it('floating and popout methods delegate to the root handle', () => {
    const { handle, dispatched } = makeStore();
    const panel = handle.getPanel('P1')!;
    panel.setFloatingBounds({ x: 4, y: 5, width: 40, height: 42 });
    panel.popout({ windowBounds: { left: 1, top: 2 } });
    panel.returnToFloating({ x: 10 });
    panel.setPopoutWindowBounds({ left: 3, top: 4, width: 500, height: 400 });

    expect(dispatched[0]).toEqual({
      type: 'SET_FLOATING_PANEL_BOUNDS',
      panelId: 'P1',
      bounds: { x: 4, y: 5, width: 40, height: 42 },
    });
    expect(dispatched[1]).toMatchObject({
      type: 'POPOUT_PANEL',
      panelId: 'P1',
    });
    expect(dispatched[2]).toEqual({
      type: 'RETURN_PANEL_TO_FLOATING',
      panelId: 'P1',
      bounds: { x: 10 },
    });
    expect(dispatched[3]).toEqual({
      type: 'SET_POPOUT_WINDOW_BOUNDS',
      panelId: 'P1',
      bounds: { left: 3, top: 4, width: 500, height: 400 },
    });
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
  it('floating helpers delegate to root tab APIs', () => {
    const { handle, dispatched } = makeStore();
    const tab = handle.getTab('T2')!;
    const floated = tab.float({
      panelId: 'T2_FLOATING',
      bounds: { x: 12 },
      resizable: false,
    });
    const popped = tab.popout({
      panelId: 'T2_POPOUT',
      floatingBounds: { x: 20 },
      locked: true,
    });

    expect(floated?.id).toBe('T2_FLOATING');
    expect(popped?.id).toBe('T2_POPOUT');
    expect(dispatched[0]).toEqual({
      type: 'FLOAT_TAB',
      tabId: 'T2',
      newPanelId: 'T2_FLOATING',
      bounds: { x: 12 },
      behavior: { resizable: false },
    });
    expect(dispatched[1]).toEqual({
      type: 'POPOUT_TAB',
      tabId: 'T2',
      newPanelId: 'T2_POPOUT',
      opts: { floatingBounds: { x: 20 }, locked: true },
    });
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
