import type {
  Direction,
  LayoutState,
  TileryHandle,
  MoveTarget,
  PanelHandle,
  PanelId,
  TabHandle,
  TabId,
  TabInit,
} from '../types';
import { nextId, tabInitToReducerInit, type ReducerAction } from './reducer';

export type Dispatch = (action: ReducerAction) => void;
export type GetState = () => LayoutState;

export function makeTileryHandle(
  getState: GetState,
  dispatch: Dispatch,
): TileryHandle {
  const handle: TileryHandle = {
    getState,
    getPanel(id: PanelId) {
      const state = getState();
      if (!state.panels[id]) return null;
      return makePanelHandle(id, getState, dispatch, handle);
    },
    getTab(id: TabId) {
      const state = getState();
      if (!state.tabs[id]) return null;
      return makeTabHandle(id, getState, dispatch, handle);
    },
    getPanels() {
      const state = getState();
      return state.panelOrder
        .map((id) => handle.getPanel(id))
        .filter((p): p is PanelHandle => Boolean(p));
    },
    getTabs() {
      const state = getState();
      return Object.keys(state.tabs)
        .map((id) => handle.getTab(id))
        .filter((t): t is TabHandle => Boolean(t));
    },
    splitPanel(panelId, direction, opts) {
      const newPanelId = nextId('p');
      const tabs = (opts?.tabs ?? []).map(tabInitToReducerInit);
      dispatch({
        type: 'SPLIT_PANEL',
        panelId,
        direction,
        sizePercent: opts?.sizePercent ?? 50,
        newPanelId,
        tabs,
        activate: opts?.activate ?? true,
      });
      return makePanelHandle(newPanelId, getState, dispatch, handle);
    },
    removePanel(panelId) {
      dispatch({ type: 'REMOVE_PANEL', panelId });
    },
    appendTab(panelId, tab, opts) {
      const t = tabInitToReducerInit(tab);
      dispatch({
        type: 'APPEND_TAB',
        panelId,
        tab: t,
        activate: opts?.activate ?? true,
      });
      return makeTabHandle(t.id, getState, dispatch, handle);
    },
    insertTab(panelId, tab, index, opts) {
      const t = tabInitToReducerInit(tab);
      dispatch({
        type: 'INSERT_TAB',
        panelId,
        tab: t,
        index,
        activate: opts?.activate ?? true,
      });
      return makeTabHandle(t.id, getState, dispatch, handle);
    },
    removeTab(tabId) {
      dispatch({ type: 'REMOVE_TAB', tabId });
    },
    moveTab(tabId, target) {
      dispatch({ type: 'MOVE_TAB', tabId, to: normalizeMoveTarget(target) });
    },
    swapPanels(panelA, panelB) {
      dispatch({ type: 'SWAP_PANELS', panelA, panelB });
    },
    setActiveTab(tabId) {
      dispatch({ type: 'SET_ACTIVE_TAB', tabId });
    },
  };
  return handle;
}

function normalizeMoveTarget(target: MoveTarget) {
  if ('beforeTab' in target) return { beforeTabId: target.beforeTab };
  if ('afterTab' in target) return { afterTabId: target.afterTab };
  if ('splitPanel' in target) {
    return {
      splitPanelId: target.splitPanel,
      direction: target.direction,
      sizePercent: target.sizePercent ?? 50,
      newPanelId: nextId('p'),
    };
  }
  return {
    panelId: target.panel,
    index: target.index ?? Number.MAX_SAFE_INTEGER,
  };
}

export function makePanelHandle(
  id: PanelId,
  getState: GetState,
  dispatch: Dispatch,
  tilery: TileryHandle,
): PanelHandle {
  return {
    get id() {
      return id;
    },
    get inset() {
      return (
        getState().panels[id]?.inset ?? { top: 0, right: 0, bottom: 0, left: 0 }
      );
    },
    get tabs() {
      const p = getState().panels[id];
      if (!p) return [];
      return p.tabs.map((tid) =>
        makeTabHandle(tid, getState, dispatch, tilery),
      );
    },
    get activeTab() {
      const p = getState().panels[id];
      if (!p || !p.activeTabId) return null;
      return makeTabHandle(p.activeTabId, getState, dispatch, tilery);
    },
    appendTab(tab: TabInit, opts) {
      return tilery.appendTab(id, tab, opts);
    },
    insertTab(tab: TabInit, index: number, opts) {
      return tilery.insertTab(id, tab, index, opts);
    },
    split(direction: Direction, opts) {
      return tilery.splitPanel(id, direction, opts);
    },
    remove() {
      tilery.removePanel(id);
    },
    setActiveTab(tabId: TabId) {
      tilery.setActiveTab(tabId);
    },
  };
}

export function makeTabHandle<TData = unknown>(
  id: TabId,
  getState: GetState,
  dispatch: Dispatch,
  tilery: TileryHandle,
): TabHandle<TData> {
  return {
    get id() {
      return id;
    },
    get panel(): PanelHandle {
      const state = getState();
      const tab = state.tabs[id];
      if (!tab) {
        throw new Error(`Tab ${id} no longer exists`);
      }
      return makePanelHandle(tab.panelId, getState, dispatch, tilery);
    },
    get index() {
      const state = getState();
      const tab = state.tabs[id];
      if (!tab) return -1;
      return state.panels[tab.panelId]?.tabs.indexOf(id) ?? -1;
    },
    get data() {
      return (getState().tabs[id]?.data as TData) ?? (undefined as TData);
    },
    setData(data) {
      dispatch({ type: 'SET_PANEL_DATA', tabId: id, data });
    },
    moveTo(target) {
      tilery.moveTab(id, target);
    },
    activate() {
      tilery.setActiveTab(id);
    },
    remove() {
      tilery.removeTab(id);
    },
  };
}
