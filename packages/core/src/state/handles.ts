import type {
  TileryDirection,
  TileryLayoutState,
  TileryHandle,
  TileryMoveTarget,
  TileryPanelHandle,
  TileryPanelId,
  TileryTabBehaviorUpdate,
  TileryTabHandle,
  TileryTabId,
  TileryTabInit,
} from '../types';
import {
  tileryCreateInitialState,
  tileryNextId,
  tileryTabInitToReducerInit,
  type TileryReducerAction,
} from './reducer';
import { tileryPanelOrderFromState } from './layout-tree';
import { tileryCreateLayoutSnapshot } from './snapshot';
import { tileryNormalizeLayoutBehavior } from './layout-behavior';

export type TileryDispatch = (action: TileryReducerAction) => void;
export type TileryGetState = () => TileryLayoutState;

export function makeTileryHandle(
  getState: TileryGetState,
  dispatch: TileryDispatch,
): TileryHandle {
  const handle: TileryHandle = {
    getState,
    getPanel(id: TileryPanelId) {
      const state = getState();
      if (!state.panels[id]) return null;
      return tileryMakePanelHandle(id, getState, dispatch, handle);
    },
    getTab(id: TileryTabId) {
      const state = getState();
      if (!state.tabs[id]) return null;
      return tileryMakeTabHandle(id, getState, dispatch, handle);
    },
    getPanels() {
      const state = getState();
      return tileryPanelOrderFromState(state)
        .map((id) => handle.getPanel(id))
        .filter((p): p is TileryPanelHandle => Boolean(p));
    },
    getTabs() {
      const state = getState();
      return Object.keys(state.tabs)
        .map((id) => handle.getTab(id))
        .filter((t): t is TileryTabHandle => Boolean(t));
    },
    splitPanel(panelId, direction, opts) {
      const newPanelId = tileryNextId('p');
      const tabs = (opts?.tabs ?? []).map(tileryTabInitToReducerInit);
      const behavior = tileryNormalizeLayoutBehavior(opts);
      dispatch({
        type: 'SPLIT_PANEL',
        panelId,
        direction,
        sizePercent: opts?.size ?? 50,
        newPanelId,
        minSize: opts?.minSize,
        maxSize: opts?.maxSize,
        ...behavior,
        tabs,
        activate: opts?.activate ?? true,
      });
      return tileryMakePanelHandle(newPanelId, getState, dispatch, handle);
    },
    removePanel(panelId) {
      dispatch({ type: 'REMOVE_PANEL', panelId });
    },
    maximizePanel(panelId) {
      dispatch({ type: 'SET_PANEL_FULLSCREEN', panelId, fullScreen: true });
    },
    restorePanel(panelId) {
      dispatch({ type: 'SET_PANEL_FULLSCREEN', panelId, fullScreen: false });
    },
    appendTab(panelId, tab, opts) {
      const t = tileryTabInitToReducerInit(tab);
      dispatch({
        type: 'APPEND_TAB',
        panelId,
        tab: t,
        activate: opts?.activate ?? true,
      });
      return tileryMakeTabHandle(t.id, getState, dispatch, handle);
    },
    insertTab(panelId, tab, index, opts) {
      const t = tileryTabInitToReducerInit(tab);
      dispatch({
        type: 'INSERT_TAB',
        panelId,
        tab: t,
        index,
        activate: opts?.activate ?? true,
      });
      return tileryMakeTabHandle(t.id, getState, dispatch, handle);
    },
    removeTab(tabId) {
      dispatch({ type: 'REMOVE_TAB', tabId });
    },
    moveTab(tabId, target) {
      dispatch({ type: 'MOVE_TAB', tabId, to: normalizeMoveTarget(target) });
    },
    setTabBehavior(tabId, behavior) {
      dispatch({ type: 'SET_TAB_BEHAVIOR', tabId, behavior });
    },
    swapPanels(panelA, panelB) {
      dispatch({ type: 'SWAP_PANELS', panelA, panelB });
    },
    setActiveTab(tabId) {
      dispatch({ type: 'SET_ACTIVE_TAB', tabId });
    },
    getLayout() {
      return tileryCreateLayoutSnapshot(getState());
    },
    setLayout(layout) {
      dispatch({
        type: 'REPLACE_STATE',
        state: tileryCreateInitialState(layout),
      });
    },
  };
  return handle;
}

function normalizeMoveTarget(target: TileryMoveTarget) {
  if ('beforeTab' in target) return { beforeTabId: target.beforeTab };
  if ('afterTab' in target) return { afterTabId: target.afterTab };
  if ('splitPanel' in target) {
    const behavior = tileryNormalizeLayoutBehavior(target);
    return {
      splitPanelId: target.splitPanel,
      direction: target.direction,
      sizePercent: target.size ?? 50,
      newPanelId: tileryNextId('p'),
      minSize: target.minSize,
      maxSize: target.maxSize,
      ...behavior,
    };
  }
  return {
    panelId: target.panel,
    index: target.index ?? Number.MAX_SAFE_INTEGER,
  };
}

export function tileryMakePanelHandle(
  id: TileryPanelId,
  getState: TileryGetState,
  dispatch: TileryDispatch,
  tilery: TileryHandle,
): TileryPanelHandle {
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
        tileryMakeTabHandle(tid, getState, dispatch, tilery),
      );
    },
    get activeTab() {
      const p = getState().panels[id];
      if (!p || !p.activeTabId) return null;
      return tileryMakeTabHandle(p.activeTabId, getState, dispatch, tilery);
    },
    get fullScreen() {
      return getState().panels[id]?.fullScreen ?? false;
    },
    get minSize() {
      return getState().panels[id]?.minSize;
    },
    get maxSize() {
      return getState().panels[id]?.maxSize;
    },
    appendTab(tab: TileryTabInit, opts) {
      return tilery.appendTab(id, tab, opts);
    },
    insertTab(tab: TileryTabInit, index: number, opts) {
      return tilery.insertTab(id, tab, index, opts);
    },
    split(direction: TileryDirection, opts) {
      return tilery.splitPanel(id, direction, opts);
    },
    remove() {
      tilery.removePanel(id);
    },
    maximize() {
      tilery.maximizePanel(id);
    },
    restore() {
      tilery.restorePanel(id);
    },
    setActiveTab(tabId: TileryTabId) {
      tilery.setActiveTab(tabId);
    },
  };
}

export function tileryMakeTabHandle<TData = unknown>(
  id: TileryTabId,
  getState: TileryGetState,
  dispatch: TileryDispatch,
  tilery: TileryHandle,
): TileryTabHandle<TData> {
  return {
    get id() {
      return id;
    },
    get panel(): TileryPanelHandle {
      const state = getState();
      const tab = state.tabs[id];
      if (!tab) {
        throw new Error(`Tab ${id} no longer exists`);
      }
      return tileryMakePanelHandle(tab.panelId, getState, dispatch, tilery);
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
    get closeable() {
      return getState().tabs[id]?.closeable ?? true;
    },
    get draggable() {
      return getState().tabs[id]?.draggable ?? true;
    },
    setData(data) {
      dispatch({ type: 'SET_PANEL_DATA', tabId: id, data });
    },
    setBehavior(behavior: TileryTabBehaviorUpdate) {
      tilery.setTabBehavior(id, behavior);
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
