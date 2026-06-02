import { describe, expect, it } from 'vite-plus/test';
import {
  tileryCreateInitialState,
  tileryReducer,
  type TileryReducerAction,
} from 'tilery/internal';
import { makeLifecycleEvents } from './lifecycle';

type Data = { title: string };

function layout() {
  return tileryCreateInitialState({
    type: 'group',
    direction: 'horizontal',
    children: [
      {
        type: 'panel',
        id: 'left',
        tabs: [
          { id: 'a', data: { title: 'A' } },
          { id: 'b', data: { title: 'B' }, closeable: false },
        ],
      },
      {
        type: 'panel',
        id: 'right',
        tabs: [{ id: 'c', data: { title: 'C' }, draggable: false }],
      },
    ],
  });
}

describe('makeLifecycleEvents', () => {
  it('returns null events for no-op state transitions', () => {
    const state = layout();
    const action: TileryReducerAction = {
      type: 'SET_ACTIVE_TAB',
      tabId: 'missing',
    };

    expect(
      makeLifecycleEvents<Data>(state, tileryReducer(state, action), action),
    ).toEqual({
      activeTabChange: null,
      tabsMove: null,
      panelsOpen: null,
      panelSplit: null,
      tabsOpen: null,
      tabsClose: null,
      panelsClose: null,
    });
  });

  it('derives active tab changes from panel state', () => {
    const state = layout();
    const action: TileryReducerAction = {
      type: 'SET_ACTIVE_TAB',
      tabId: 'b',
    };
    const next = tileryReducer(state, action);
    const events = makeLifecycleEvents<Data>(state, next, action);

    expect(events.activeTabChange).toMatchObject({
      source: 'SET_ACTIVE_TAB',
      changes: [{ panelId: 'left', previousTabId: 'a', tabId: 'b' }],
      previousState: state,
      state: next,
    });
    expect(events.tabsMove).toBeNull();
  });

  it('treats tab id changes as renames instead of close/open pairs', () => {
    const state = layout();
    const action: TileryReducerAction = {
      type: 'CHANGE_TAB_ID',
      oldTabId: 'a',
      newTabId: 'a-renamed',
    };
    const next = tileryReducer(state, action);
    const events = makeLifecycleEvents<Data>(state, next, action);

    expect(events.activeTabChange).toMatchObject({
      source: 'CHANGE_TAB_ID',
      changes: [
        {
          panelId: 'left',
          previousTabId: 'a',
          tabId: 'a-renamed',
        },
      ],
    });
    expect(events.tabsOpen).toBeNull();
    expect(events.tabsClose).toBeNull();
  });

  it('derives tab move changes when a tab index changes', () => {
    const state = layout();
    const action: TileryReducerAction = {
      type: 'MOVE_TAB',
      tabId: 'b',
      to: { panelId: 'left', index: 0 },
    };
    const next = tileryReducer(state, action);
    const events = makeLifecycleEvents<Data>(state, next, action);

    expect(events.tabsMove).toMatchObject({
      source: 'MOVE_TAB',
      tabs: [
        {
          id: 'b',
          previousPanelId: 'left',
          panelId: 'left',
          previousIndex: 1,
          index: 0,
          data: { title: 'B' },
          closeable: false,
          draggable: true,
        },
      ],
    });
    expect(events.panelsOpen).toBeNull();
  });

  it('derives panel open, tab open, and split events for panel splits', () => {
    const state = layout();
    const action: TileryReducerAction = {
      type: 'SPLIT_PANEL',
      panelId: 'right',
      direction: 'bottom',
      sizePercent: 35,
      newPanelId: 'bottom',
      tabs: [{ id: 'logs', data: { title: 'Logs' }, draggable: false }],
      activate: true,
    };
    const next = tileryReducer(state, action);
    const events = makeLifecycleEvents<Data>(state, next, action);

    expect(events.panelsOpen).toMatchObject({
      source: 'SPLIT_PANEL',
      panels: [{ id: 'bottom', tabIds: ['logs'], activeTabId: 'logs' }],
      tabs: [
        {
          id: 'logs',
          panelId: 'bottom',
          data: { title: 'Logs' },
          closeable: true,
          draggable: false,
        },
      ],
    });
    expect(events.tabsOpen).toMatchObject({
      source: 'SPLIT_PANEL',
      tabs: [{ id: 'logs', panelId: 'bottom' }],
    });
    expect(events.panelSplit).toMatchObject({
      source: 'SPLIT_PANEL',
      splitPanelId: 'right',
      createdPanelId: 'bottom',
      direction: 'bottom',
      size: 35,
      createdPanel: { id: 'bottom', tabIds: ['logs'] },
      tabs: [{ id: 'logs', panelId: 'bottom' }],
    });
  });

  it('derives close events for removed panels and their tabs', () => {
    const state = layout();
    const action: TileryReducerAction = {
      type: 'REMOVE_PANEL',
      panelId: 'right',
    };
    const next = tileryReducer(state, action);
    const events = makeLifecycleEvents<Data>(state, next, action);

    expect(events.tabsClose).toMatchObject({
      source: 'REMOVE_PANEL',
      tabs: [
        {
          id: 'c',
          panelId: 'right',
          data: { title: 'C' },
          closeable: true,
          draggable: false,
        },
      ],
      panels: [{ id: 'right', tabIds: ['c'], activeTabId: 'c' }],
    });
    expect(events.panelsClose).toMatchObject({
      source: 'REMOVE_PANEL',
      panels: [{ id: 'right', tabIds: ['c'], activeTabId: 'c' }],
      tabs: [{ id: 'c', panelId: 'right' }],
    });
  });
});
