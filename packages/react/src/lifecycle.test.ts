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
          { id: 'b', data: { title: 'B' }, closable: false },
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
      type: 'TAB_ACTIVE_SET',
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
      type: 'TAB_ACTIVE_SET',
      tabId: 'b',
    };
    const next = tileryReducer(state, action);
    const events = makeLifecycleEvents<Data>(state, next, action);

    expect(events.activeTabChange).toMatchObject({
      source: 'TAB_ACTIVE_SET',
      changes: [{ panelId: 'left', previousTabId: 'a', tabId: 'b' }],
      previousState: state,
      state: next,
    });
    expect(events.tabsMove).toBeNull();
  });

  it('treats tab id changes as renames instead of close/open pairs', () => {
    const state = layout();
    const action: TileryReducerAction = {
      type: 'TAB_ID_CHANGE',
      oldTabId: 'a',
      newTabId: 'a-renamed',
    };
    const next = tileryReducer(state, action);
    const events = makeLifecycleEvents<Data>(state, next, action);

    expect(events.activeTabChange).toMatchObject({
      source: 'TAB_ID_CHANGE',
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
      type: 'TAB_MOVE',
      tabId: 'b',
      to: { panelId: 'left', index: 0 },
    };
    const next = tileryReducer(state, action);
    const events = makeLifecycleEvents<Data>(state, next, action);

    expect(events.tabsMove).toMatchObject({
      source: 'TAB_MOVE',
      tabs: [
        {
          id: 'b',
          previousPanelId: 'left',
          panelId: 'left',
          previousIndex: 1,
          index: 0,
          data: { title: 'B' },
          closable: false,
          draggable: true,
        },
      ],
    });
    expect(events.panelsOpen).toBeNull();
  });

  it('derives panel open, tab open, and split events for panel splits', () => {
    const state = layout();
    const action: TileryReducerAction = {
      type: 'PANEL_SPLIT',
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
      source: 'PANEL_SPLIT',
      panels: [{ id: 'bottom', tabIds: ['logs'], activeTabId: 'logs' }],
      tabs: [
        {
          id: 'logs',
          panelId: 'bottom',
          data: { title: 'Logs' },
          closable: true,
          draggable: false,
        },
      ],
    });
    expect(events.tabsOpen).toMatchObject({
      source: 'PANEL_SPLIT',
      tabs: [{ id: 'logs', panelId: 'bottom' }],
    });
    expect(events.panelSplit).toMatchObject({
      source: 'PANEL_SPLIT',
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
      type: 'PANEL_REMOVE',
      panelId: 'right',
    };
    const next = tileryReducer(state, action);
    const events = makeLifecycleEvents<Data>(state, next, action);

    expect(events.tabsClose).toMatchObject({
      source: 'PANEL_REMOVE',
      tabs: [
        {
          id: 'c',
          panelId: 'right',
          data: { title: 'C' },
          closable: true,
          draggable: false,
        },
      ],
      panels: [{ id: 'right', tabIds: ['c'], activeTabId: 'c' }],
    });
    expect(events.panelsClose).toMatchObject({
      source: 'PANEL_REMOVE',
      panels: [{ id: 'right', tabIds: ['c'], activeTabId: 'c' }],
      tabs: [{ id: 'c', panelId: 'right' }],
    });
  });
});
