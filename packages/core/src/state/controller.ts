/**
 * Builds the imperative `TileryController` facade over a dispatch function
 * and a state getter, providing strongly-typed panel and tab handle objects.
 */
import type {
  TileryDockPanelTarget,
  TileryDirection,
  TileryFloatPanelOptions,
  TileryFloatTabOptions,
  TileryFloatingPanelBounds,
  TileryFloatingPanelBoundsInit,
  TileryLayoutBehaviorConfig,
  TileryLayoutState,
  TileryController,
  TileryMoveTarget,
  TileryOpenTabTarget,
  TileryPanel,
  TileryPanelId,
  TileryPopoutPanelOptions,
  TileryPopoutTabOptions,
  TileryPopoutWindowBounds,
  TilerySizeResolutionContext,
  TileryTabBehaviorUpdate,
  TileryTab,
  TileryTabId,
  TileryTabInit,
} from '../types';
import {
  tileryCreateInitialState,
  tileryNextId,
  tileryTabInitToReducerInit,
  type TileryReducerAction,
} from './reducer';
import { tileryAllPanelOrderFromState } from './layout-tree';
import { tileryCreateLayoutSnapshot } from './snapshot';
import {
  tileryNormalizeLayoutBehavior,
  tileryPanelBehaviorFromState,
} from './layout-behavior';

/** Function type for dispatching a reducer action. */
export type TileryDispatch = (action: TileryReducerAction) => void;

/** Function type for reading the current layout state snapshot. */
export type TileryGetState = () => TileryLayoutState;

/** Function type for reading the current container size resolution context. */
export type TileryGetSizeContext = () =>
  | TilerySizeResolutionContext
  | undefined;

/** Optional host-level callbacks injected into the controller at construction time. */
export type TileryControllerOptions = {
  /**
   * Called before a panel is popped out; returning `false` cancels the
   * popout.
   */
  requestPopoutPanel?: (
    panelId: TileryPanelId,
    opts?: TileryPopoutPanelOptions,
  ) => boolean | void;
  /** Called when a popped-out panel is returned to the floating layer. */
  onReturnPanelToFloating?: (panelId: TileryPanelId) => void;
};

/**
 * Creates a `TileryController` that wires public API methods to reducer
 * dispatches, reading current state through `getState` and resolving size
 * constraints through the optional `getSizeContext`.
 */
export function makeTileryController(
  getState: TileryGetState,
  dispatch: TileryDispatch,
  getSizeContext?: TileryGetSizeContext,
  options?: TileryControllerOptions,
): TileryController {
  const controller: TileryController = {
    getState,
    getPanel(id: TileryPanelId) {
      const state = getState();
      if (!state.panels[id]) return null;
      return tileryMakePanel(id, getState, dispatch, controller);
    },
    getTab(id: TileryTabId) {
      const state = getState();
      if (!state.tabs[id]) return null;
      return tileryMakeTab(id, getState, dispatch, controller);
    },
    getPanels() {
      const state = getState();
      return tileryAllPanelOrderFromState(state)
        .map((id) => controller.getPanel(id))
        .filter((p): p is TileryPanel => Boolean(p));
    },
    getTabs() {
      const state = getState();
      return Object.keys(state.tabs)
        .map((id) => controller.getTab(id))
        .filter((t): t is TileryTab => Boolean(t));
    },
    splitPanel(panelId, direction, opts) {
      const newPanelId = tileryNextId('p');
      const tabs = (opts?.tabs ?? []).map(tileryTabInitToReducerInit);
      const behavior = tileryNormalizeLayoutBehavior(opts);
      dispatch({
        type: 'PANEL_SPLIT',
        panelId,
        direction,
        sizePercent: opts?.size ?? 50,
        newPanelId,
        minSize: opts?.minSize,
        maxSize: opts?.maxSize,
        sizeContext: getSizeContext?.(),
        ...behavior,
        tabs,
        activate: opts?.activate ?? true,
      });
      return tileryMakePanel(newPanelId, getState, dispatch, controller);
    },
    removePanel(panelId) {
      dispatch({ type: 'PANEL_REMOVE', panelId });
    },
    maximizePanel(panelId) {
      dispatch({ type: 'PANEL_FULLSCREEN_SET', panelId, fullScreen: true });
    },
    restorePanel(panelId) {
      dispatch({ type: 'PANEL_FULLSCREEN_SET', panelId, fullScreen: false });
    },
    floatPanel(panelId, opts) {
      const behavior = layoutBehaviorConfigFromOptions(opts);
      const bounds = floatingBoundsFromOptions(opts);
      dispatch({
        type: 'PANEL_FLOAT',
        panelId,
        ...(bounds ? { bounds } : {}),
        ...(behavior ? { behavior } : {}),
      });
    },
    popoutPanel(panelId, opts) {
      if (!getState().panels[panelId]) return;
      if (options?.requestPopoutPanel?.(panelId, opts) === false) return;
      dispatch({ type: 'PANEL_POPOUT', panelId, opts });
    },
    returnPanelToFloating(panelId, bounds) {
      options?.onReturnPanelToFloating?.(panelId);
      dispatch({ type: 'PANEL_RETURN_TO_FLOATING', panelId, bounds });
    },
    dockPanel(panelId, target) {
      dispatch({
        type: 'PANEL_DOCK',
        panelId,
        target,
        sizeContext: getSizeContext?.(),
      });
    },
    focusPanel(panelId) {
      dispatch({ type: 'PANEL_FOCUS', panelId });
    },
    setFloatingPanelBounds(panelId, bounds) {
      dispatch({ type: 'PANEL_FLOATING_BOUNDS_SET', panelId, bounds });
    },
    setPopoutWindowBounds(panelId, bounds) {
      dispatch({ type: 'PANEL_POPOUT_WINDOW_BOUNDS_SET', panelId, bounds });
    },
    appendTab(panelId, tab, opts) {
      const t = tileryTabInitToReducerInit(tab);
      dispatch({
        type: 'TAB_APPEND',
        panelId,
        tab: t,
        activate: opts?.activate ?? true,
      });
      return tileryMakeTab(t.id, getState, dispatch, controller);
    },
    insertTab(panelId, tab, index, opts) {
      const t = tileryTabInitToReducerInit(tab);
      dispatch({
        type: 'TAB_INSERT',
        panelId,
        tab: t,
        index,
        activate: opts?.activate ?? true,
      });
      return tileryMakeTab(t.id, getState, dispatch, controller);
    },
    openOrActivateTab(tab, target) {
      if (tab.id && getState().tabs[tab.id]) {
        dispatch({ type: 'TAB_ACTIVE_SET', tabId: tab.id });
        return tileryMakeTab(tab.id, getState, dispatch, controller);
      }
      const resolved = resolveOpenTabTarget(getState(), target);
      if (!resolved) return null;
      const t = tileryTabInitToReducerInit(tab);
      dispatch({
        type: 'TAB_INSERT',
        panelId: resolved.panelId,
        tab: t,
        index: resolved.index,
        activate: true,
      });
      return tileryMakeTab(t.id, getState, dispatch, controller);
    },
    changeTabId(oldTabId, newTabId) {
      const state = getState();
      const tab = state.tabs[oldTabId];
      if (oldTabId === newTabId) {
        return tab && state.panels[tab.panelId]
          ? tileryMakeTab(oldTabId, getState, dispatch, controller)
          : null;
      }
      if (!tab || !state.panels[tab.panelId] || state.tabs[newTabId]) {
        return null;
      }
      dispatch({ type: 'TAB_ID_CHANGE', oldTabId, newTabId });
      return tileryMakeTab(newTabId, getState, dispatch, controller);
    },
    removeTab(tabId) {
      dispatch({ type: 'TAB_REMOVE', tabId });
    },
    moveTab(tabId, target) {
      dispatch({
        type: 'TAB_MOVE',
        tabId,
        to: normalizeMoveTarget(target, getSizeContext?.()),
      });
    },
    floatTab(tabId, opts) {
      const newPanelId = opts?.panelId ?? tileryNextId('p');
      if (!canExtractTabToFloatingPanel(getState(), tabId, newPanelId)) {
        return null;
      }
      const behavior = layoutBehaviorConfigFromOptions(opts);
      dispatch({
        type: 'TAB_FLOAT',
        tabId,
        newPanelId,
        bounds: opts?.bounds,
        ...(behavior ? { behavior } : {}),
      });
      return tileryMakePanel(newPanelId, getState, dispatch, controller);
    },
    popoutTab(tabId, opts) {
      const newPanelId = opts?.panelId ?? tileryNextId('p');
      if (!canExtractTabToFloatingPanel(getState(), tabId, newPanelId)) {
        return null;
      }
      const popoutOpts = tabPopoutOptionsToPanelOptions(opts);
      if (options?.requestPopoutPanel?.(newPanelId, popoutOpts) === false) {
        return null;
      }
      dispatch({
        type: 'TAB_POPOUT',
        tabId,
        newPanelId,
        opts: popoutOpts,
      });
      return tileryMakePanel(newPanelId, getState, dispatch, controller);
    },
    setTabBehavior(tabId, behavior) {
      dispatch({ type: 'TAB_BEHAVIOR_SET', tabId, behavior });
    },
    swapPanels(panelA, panelB) {
      dispatch({ type: 'PANEL_SWAP', panelA, panelB });
    },
    setActiveTab(tabId) {
      dispatch({ type: 'TAB_ACTIVE_SET', tabId });
    },
    getLayout() {
      return tileryCreateLayoutSnapshot(getState());
    },
    setLayout(layout) {
      dispatch({
        type: 'STATE_REPLACE',
        state: tileryCreateInitialState(layout),
      });
    },
  };
  return controller;
}

function resolveOpenTabTarget(
  state: TileryLayoutState,
  target: TileryOpenTabTarget,
): { panelId: TileryPanelId; index: number } | null {
  if ('beforeTab' in target || 'afterTab' in target) {
    const refTabId = 'beforeTab' in target ? target.beforeTab : target.afterTab;
    const refTab = state.tabs[refTabId];
    if (!refTab) return null;
    const panel = state.panels[refTab.panelId];
    if (!panel) return null;
    const refIndex = panel.tabs.indexOf(refTabId);
    if (refIndex === -1) return null;
    return {
      panelId: panel.id,
      index: 'beforeTab' in target ? refIndex : refIndex + 1,
    };
  }

  const panel = state.panels[target.panel];
  if (!panel) return null;
  return {
    panelId: panel.id,
    index: target.index ?? panel.tabs.length,
  };
}

function normalizeMoveTarget(
  target: TileryMoveTarget,
  sizeContext?: TilerySizeResolutionContext,
) {
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
      sizeContext,
      ...behavior,
    };
  }
  if ('splitRoot' in target) {
    const behavior = tileryNormalizeLayoutBehavior(target);
    return {
      splitRoot: true as const,
      direction: target.direction,
      ...(target.size === undefined ? {} : { sizePercent: target.size }),
      newPanelId: tileryNextId('p'),
      minSize: target.minSize,
      maxSize: target.maxSize,
      sizeContext,
      ...behavior,
    };
  }
  return {
    panelId: target.panel,
    index: target.index ?? Number.MAX_SAFE_INTEGER,
  };
}

/**
 * Constructs a live `TileryPanel` handle whose properties reflect the
 * current state on every read — they are not snapshots.
 */
export function tileryMakePanel(
  id: TileryPanelId,
  getState: TileryGetState,
  dispatch: TileryDispatch,
  tilery: TileryController,
): TileryPanel {
  return {
    get id() {
      return id;
    },
    get kind() {
      return getState().panels[id]?.kind ?? 'tiled';
    },
    get inset() {
      return (
        getState().panels[id]?.inset ?? { top: 0, right: 0, bottom: 0, left: 0 }
      );
    },
    get edge() {
      const panel = getState().panels[id];
      return panel?.kind === 'edge' ? panel.edge.side : undefined;
    },
    get edgeSize() {
      const panel = getState().panels[id];
      return panel?.kind === 'edge' ? panel.edge.size : undefined;
    },
    get edgeDefaultSize() {
      const panel = getState().panels[id];
      return panel?.kind === 'edge' ? panel.edge.defaultSize : undefined;
    },
    get floating() {
      return getState().panels[id]?.kind === 'floating';
    },
    get floatingBounds() {
      const panel = getState().panels[id];
      return panel?.kind === 'floating' ? panel.floating.bounds : undefined;
    },
    get floatingZIndex() {
      const panel = getState().panels[id];
      return panel?.kind === 'floating' ? panel.floating.zIndex : undefined;
    },
    get poppedOut() {
      const panel = getState().panels[id];
      return panel?.kind === 'floating' && Boolean(panel.floating.popout);
    },
    get popoutWindowBounds() {
      const panel = getState().panels[id];
      return panel?.kind === 'floating'
        ? panel.floating.popout?.windowBounds
        : undefined;
    },
    get tabs() {
      const p = getState().panels[id];
      if (!p) return [];
      return p.tabs.map((tid) =>
        tileryMakeTab(tid, getState, dispatch, tilery),
      );
    },
    get activeTab() {
      const p = getState().panels[id];
      if (!p || !p.activeTabId) return null;
      return tileryMakeTab(p.activeTabId, getState, dispatch, tilery);
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
    float(opts?: TileryFloatPanelOptions) {
      tilery.floatPanel(id, opts);
    },
    popout(opts?: TileryPopoutPanelOptions) {
      tilery.popoutPanel(id, opts);
    },
    returnToFloating(bounds?: TileryFloatingPanelBoundsInit) {
      tilery.returnPanelToFloating(id, bounds);
    },
    dock(target?: TileryDockPanelTarget) {
      tilery.dockPanel(id, target);
    },
    focus() {
      tilery.focusPanel(id);
    },
    setFloatingBounds(bounds: TileryFloatingPanelBounds) {
      tilery.setFloatingPanelBounds(id, bounds);
    },
    setPopoutWindowBounds(bounds: TileryPopoutWindowBounds) {
      tilery.setPopoutWindowBounds(id, bounds);
    },
    setActiveTab(tabId: TileryTabId) {
      tilery.setActiveTab(tabId);
    },
  };
}

/**
 * Constructs a live `TileryTab` handle whose properties reflect the current
 * state on every read — they are not snapshots.
 */
export function tileryMakeTab<TData = unknown>(
  id: TileryTabId,
  getState: TileryGetState,
  dispatch: TileryDispatch,
  tilery: TileryController,
): TileryTab<TData> {
  return {
    get id() {
      return id;
    },
    get panel(): TileryPanel {
      const state = getState();
      const tab = state.tabs[id];
      if (!tab) {
        throw new Error(`Tab ${id} no longer exists`);
      }
      return tileryMakePanel(tab.panelId, getState, dispatch, tilery);
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
    get closable() {
      return getState().tabs[id]?.closable ?? true;
    },
    get draggable() {
      return getState().tabs[id]?.draggable ?? true;
    },
    setData(data) {
      dispatch({ type: 'TAB_DATA_SET', tabId: id, data });
    },
    setBehavior(behavior: TileryTabBehaviorUpdate) {
      tilery.setTabBehavior(id, behavior);
    },
    moveTo(target) {
      tilery.moveTab(id, target);
    },
    float(opts?: TileryFloatTabOptions) {
      return tilery.floatTab(id, opts);
    },
    popout(opts?: TileryPopoutTabOptions) {
      return tilery.popoutTab(id, opts);
    },
    activate() {
      tilery.setActiveTab(id);
    },
    remove() {
      tilery.removeTab(id);
    },
  };
}

function canExtractTabToFloatingPanel(
  state: TileryLayoutState,
  tabId: TileryTabId,
  newPanelId: TileryPanelId,
): boolean {
  const tab = state.tabs[tabId];
  if (!tab?.draggable) return false;
  if (state.panels[newPanelId]) return false;
  const panel = state.panels[tab.panelId];
  if (!panel) return false;
  return tileryPanelBehaviorFromState(state, panel.id).draggable;
}

function layoutBehaviorConfigFromOptions(
  opts: TileryLayoutBehaviorConfig | undefined,
): TileryLayoutBehaviorConfig | undefined {
  if (!opts) return undefined;
  if (opts.locked === true) return { locked: true };
  const behavior: {
    resizable?: boolean;
    draggable?: boolean;
    droppable?: boolean;
  } = {};
  if (opts.resizable !== undefined) behavior.resizable = opts.resizable;
  if (opts.draggable !== undefined) behavior.draggable = opts.draggable;
  if (opts.droppable !== undefined) behavior.droppable = opts.droppable;
  return Object.keys(behavior).length > 0 ? behavior : undefined;
}

function floatingBoundsFromOptions(
  opts: TileryFloatingPanelBoundsInit | undefined,
): TileryFloatingPanelBoundsInit | undefined {
  if (!opts) return undefined;
  const bounds: TileryFloatingPanelBoundsInit = {};
  if (opts.x !== undefined) bounds.x = opts.x;
  if (opts.y !== undefined) bounds.y = opts.y;
  if (opts.width !== undefined) bounds.width = opts.width;
  if (opts.height !== undefined) bounds.height = opts.height;
  return Object.keys(bounds).length > 0 ? bounds : undefined;
}

function tabPopoutOptionsToPanelOptions(
  opts: TileryPopoutTabOptions | undefined,
): TileryPopoutPanelOptions | undefined {
  if (!opts) return undefined;
  const behavior = layoutBehaviorConfigFromOptions(opts);
  const panelOpts: TileryPopoutPanelOptions = { ...behavior };
  if (opts.floatingBounds) panelOpts.floatingBounds = opts.floatingBounds;
  if (opts.windowBounds) panelOpts.windowBounds = opts.windowBounds;
  return Object.keys(panelOpts).length > 0 ? panelOpts : undefined;
}
