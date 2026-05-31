import type {
  TileryDirection,
  TileryInitialLayout,
  TileryLayoutState,
  TileryPanelId,
  TileryPanelInit,
  TileryPanelState,
  TileryTabId,
  TileryTabInit,
  TileryTabState,
} from '../types';
import {
  TILERY_DEFAULT_MIN_PANEL_SIZE,
  tileryApplyDividerResize,
  tileryClampDividerPosition,
  tileryDeriveDividers,
  tileryFindRemovalFillers,
  tilerySplitFitsMin,
  tilerySplitInset,
} from './layout-math';
import {
  tileryBuildLayoutTreeFromPanels,
  tileryRemovePanelFromLayout,
  tilerySplitPanelInLayout,
  tilerySwapPanelsInLayout,
  tilerySyncLayoutPanels,
} from './layout-tree';

export type TileryReducerAction =
  | {
      type: 'SPLIT_PANEL';
      panelId: TileryPanelId;
      direction: TileryDirection;
      sizePercent: number;
      newPanelId: TileryPanelId;
      tabs: { id: TileryTabId; data: unknown; closeable?: boolean }[];
      activate: boolean;
    }
  | { type: 'REMOVE_PANEL'; panelId: TileryPanelId }
  | {
      type: 'SET_PANEL_FULLSCREEN';
      panelId: TileryPanelId;
      fullScreen: boolean;
    }
  | {
      type: 'APPEND_TAB';
      panelId: TileryPanelId;
      tab: { id: TileryTabId; data: unknown; closeable?: boolean };
      activate: boolean;
    }
  | {
      type: 'INSERT_TAB';
      panelId: TileryPanelId;
      tab: { id: TileryTabId; data: unknown; closeable?: boolean };
      index: number;
      activate: boolean;
    }
  | { type: 'REMOVE_TAB'; tabId: TileryTabId }
  | {
      type: 'MOVE_TAB';
      tabId: TileryTabId;
      to:
        | { panelId: TileryPanelId; index: number }
        | { beforeTabId: TileryTabId }
        | { afterTabId: TileryTabId }
        | {
            splitPanelId: TileryPanelId;
            direction: TileryDirection;
            sizePercent: number;
            newPanelId: TileryPanelId;
          };
    }
  | { type: 'SET_ACTIVE_TAB'; tabId: TileryTabId }
  | { type: 'SET_PANEL_DATA'; tabId: TileryTabId; data: unknown }
  | {
      type: 'RESIZE_DIVIDER';
      dividerId: string;
      newPosition: number;
      minSizePercent?: number;
    }
  | { type: 'SWAP_PANELS'; panelA: TileryPanelId; panelB: TileryPanelId }
  | { type: 'REPLACE_STATE'; state: TileryLayoutState };

let _idCounter = 0;
export function tileryNextId(prefix: string): string {
  _idCounter += 1;
  return `${prefix}_${_idCounter}_${Math.random().toString(36).slice(2, 8)}`;
}

export function tileryCreateInitialState(
  initial: TileryInitialLayout,
): TileryLayoutState {
  const state: TileryLayoutState = {
    panels: {},
    panelOrder: [],
    tabs: {},
    layout: null,
  };
  let hasFullScreenPanel = false;
  for (const init of initial.panels) {
    const panelId = init.id ?? tileryNextId('p');
    const tabs: TileryTabId[] = [];
    for (const tabInit of init.tabs) {
      const tabId = tabInit.id ?? tileryNextId('t');
      state.tabs[tabId] = {
        id: tabId,
        panelId,
        data: tabInit.data,
        closeable: tabInit.closeable ?? true,
      };
      tabs.push(tabId);
    }
    const activeTabId =
      init.activeTabId && tabs.includes(init.activeTabId)
        ? init.activeTabId
        : (tabs[0] ?? null);
    const fullScreen = Boolean(init.fullScreen && !hasFullScreenPanel);
    if (fullScreen) hasFullScreenPanel = true;
    state.panels[panelId] = {
      id: panelId,
      kind: 'tiled',
      inset: { ...init.inset },
      tabs,
      activeTabId,
      fullScreen,
    };
    state.panelOrder.push(panelId);
  }
  const layout = tileryBuildLayoutTreeFromPanels(
    state.panelOrder.map((id) => state.panels[id]!).filter(Boolean),
  );
  return layout ? tilerySyncLayoutPanels({ ...state, layout }, layout) : state;
}

export function tileryReducer(
  state: TileryLayoutState,
  action: TileryReducerAction,
): TileryLayoutState {
  switch (action.type) {
    case 'REPLACE_STATE':
      return action.state;
    case 'SPLIT_PANEL': {
      const source = state.panels[action.panelId];
      if (!source) return state;
      if (source.fullScreen) return state;
      if (
        !tilerySplitFitsMin(source.inset, action.direction, action.sizePercent)
      ) {
        return state;
      }
      const { source: sourceInset, created: createdInset } = tilerySplitInset(
        source.inset,
        action.direction,
        action.sizePercent,
      );
      const newTabs: Record<TileryTabId, TileryTabState> = { ...state.tabs };
      const tabIds: TileryTabId[] = [];
      for (const t of action.tabs) {
        newTabs[t.id] = {
          id: t.id,
          panelId: action.newPanelId,
          data: t.data,
          closeable: t.closeable ?? true,
        };
        tabIds.push(t.id);
      }
      const newPanel: TileryPanelState = {
        id: action.newPanelId,
        kind: 'tiled',
        inset: createdInset,
        tabs: tabIds,
        activeTabId: tabIds[0] ?? null,
        fullScreen: false,
      };
      const sourceIdx = state.panelOrder.indexOf(action.panelId);
      const insertAt = sourceIdx >= 0 ? sourceIdx + 1 : state.panelOrder.length;
      const nextOrder = [
        ...state.panelOrder.slice(0, insertAt),
        action.newPanelId,
        ...state.panelOrder.slice(insertAt),
      ];
      const nextState: TileryLayoutState = {
        panels: {
          ...state.panels,
          [action.panelId]: {
            ...source,
            inset: sourceInset,
            fullScreen: false,
          },
          [action.newPanelId]: newPanel,
        },
        panelOrder: nextOrder,
        tabs: newTabs,
        layout: state.layout,
      };
      if (state.layout) {
        const layout = tilerySplitPanelInLayout(
          state.layout,
          action.panelId,
          action.newPanelId,
          action.direction,
          action.sizePercent,
        );
        if (layout)
          return tilerySyncLayoutPanels({ ...nextState, layout }, layout);
        return { ...nextState, layout: null };
      }
      return nextState;
    }
    case 'REMOVE_PANEL': {
      const target = state.panels[action.panelId];
      if (!target) return state;
      return removePanelAndFill(state, target);
    }
    case 'SET_PANEL_FULLSCREEN': {
      const panel = state.panels[action.panelId];
      if (!panel) return state;
      if (!action.fullScreen) {
        if (!panel.fullScreen) return state;
        return {
          ...state,
          panels: {
            ...state.panels,
            [action.panelId]: { ...panel, fullScreen: false },
          },
        };
      }
      const nextPanels: Record<TileryPanelId, TileryPanelState> = {};
      let changed = !panel.fullScreen;
      for (const panelId of Object.keys(state.panels)) {
        const current = state.panels[panelId]!;
        const next =
          panelId === action.panelId
            ? { ...current, fullScreen: true }
            : { ...current, fullScreen: false };
        if (next.fullScreen !== current.fullScreen) changed = true;
        nextPanels[panelId] = next;
      }
      if (!changed) return state;
      return { ...state, panels: nextPanels };
    }
    case 'APPEND_TAB': {
      const panel = state.panels[action.panelId];
      if (!panel) return state;
      return {
        ...state,
        panels: {
          ...state.panels,
          [action.panelId]: {
            ...panel,
            tabs: [...panel.tabs, action.tab.id],
            activeTabId: action.activate
              ? action.tab.id
              : (panel.activeTabId ?? action.tab.id),
          },
        },
        tabs: {
          ...state.tabs,
          [action.tab.id]: {
            id: action.tab.id,
            panelId: action.panelId,
            data: action.tab.data,
            closeable: action.tab.closeable ?? true,
          },
        },
      };
    }
    case 'INSERT_TAB': {
      const panel = state.panels[action.panelId];
      if (!panel) return state;
      const idx = Math.max(0, Math.min(panel.tabs.length, action.index));
      const nextTabs = [...panel.tabs];
      nextTabs.splice(idx, 0, action.tab.id);
      return {
        ...state,
        panels: {
          ...state.panels,
          [action.panelId]: {
            ...panel,
            tabs: nextTabs,
            activeTabId: action.activate
              ? action.tab.id
              : (panel.activeTabId ?? action.tab.id),
          },
        },
        tabs: {
          ...state.tabs,
          [action.tab.id]: {
            id: action.tab.id,
            panelId: action.panelId,
            data: action.tab.data,
            closeable: action.tab.closeable ?? true,
          },
        },
      };
    }
    case 'REMOVE_TAB': {
      const tab = state.tabs[action.tabId];
      if (!tab) return state;
      const panel = state.panels[tab.panelId];
      if (!panel) return state;
      const nextTabs = panel.tabs.filter((id) => id !== action.tabId);
      const { [action.tabId]: _drop, ...restTabs } = state.tabs;
      if (nextTabs.length === 0) {
        return removePanelAndFill(
          { ...state, tabs: restTabs },
          { ...panel, tabs: nextTabs, activeTabId: null },
        );
      }
      const nextActive =
        panel.activeTabId === action.tabId
          ? (nextTabs[
              Math.min(nextTabs.length - 1, panel.tabs.indexOf(action.tabId))
            ] ?? null)
          : panel.activeTabId;
      return {
        ...state,
        panels: {
          ...state.panels,
          [tab.panelId]: { ...panel, tabs: nextTabs, activeTabId: nextActive },
        },
        tabs: restTabs,
      };
    }
    case 'MOVE_TAB': {
      const tab = state.tabs[action.tabId];
      if (!tab) return state;
      const sourcePanel = state.panels[tab.panelId];
      if (!sourcePanel) return state;

      if ('beforeTabId' in action.to || 'afterTabId' in action.to) {
        const refTabId =
          'beforeTabId' in action.to
            ? action.to.beforeTabId
            : action.to.afterTabId;
        const refTab = state.tabs[refTabId];
        if (!refTab) return state;
        if (refTabId === action.tabId) return state;
        const targetPanelId = refTab.panelId;
        const targetPanel = state.panels[targetPanelId];
        if (!targetPanel) return state;
        let nextTabsInTarget = targetPanel.tabs;
        if (sourcePanel.id === targetPanelId) {
          nextTabsInTarget = nextTabsInTarget.filter(
            (id) => id !== action.tabId,
          );
        }
        const refIdx = nextTabsInTarget.indexOf(refTabId);
        const insertAt = 'beforeTabId' in action.to ? refIdx : refIdx + 1;
        nextTabsInTarget = [
          ...nextTabsInTarget.slice(0, insertAt),
          action.tabId,
          ...nextTabsInTarget.slice(insertAt),
        ];
        return finishTabMove(
          state,
          tab,
          sourcePanel,
          targetPanelId,
          nextTabsInTarget,
        );
      }
      if ('splitPanelId' in action.to) {
        const targetSource = state.panels[action.to.splitPanelId];
        if (!targetSource) return state;
        if (targetSource.fullScreen) return state;
        if (
          targetSource.id === sourcePanel.id &&
          sourcePanel.tabs.length === 1
        ) {
          return state;
        }
        if (
          !tilerySplitFitsMin(
            targetSource.inset,
            action.to.direction,
            action.to.sizePercent,
          )
        ) {
          return state;
        }
        const { source: srcInset, created: createdInset } = tilerySplitInset(
          targetSource.inset,
          action.to.direction,
          action.to.sizePercent,
        );
        let next: TileryLayoutState = { ...state };
        next = {
          ...next,
          panels: {
            ...next.panels,
            [targetSource.id]: {
              ...targetSource,
              inset: srcInset,
              fullScreen: false,
            },
          },
        };
        const newPanel: TileryPanelState = {
          id: action.to.newPanelId,
          kind: 'tiled',
          inset: createdInset,
          tabs: [action.tabId],
          activeTabId: action.tabId,
          fullScreen: false,
        };
        next = {
          ...next,
          panels: { ...next.panels, [action.to.newPanelId]: newPanel },
        };
        const targetIdx = next.panelOrder.indexOf(targetSource.id);
        next.panelOrder = [
          ...next.panelOrder.slice(0, targetIdx + 1),
          action.to.newPanelId,
          ...next.panelOrder.slice(targetIdx + 1),
        ];
        if (state.layout) {
          const layout = tilerySplitPanelInLayout(
            state.layout,
            targetSource.id,
            action.to.newPanelId,
            action.to.direction,
            action.to.sizePercent,
          );
          if (layout)
            next = tilerySyncLayoutPanels({ ...next, layout }, layout);
          else next = { ...next, layout: null };
        }
        const sourceTabs = sourcePanel.tabs.filter((id) => id !== action.tabId);
        next.tabs = {
          ...next.tabs,
          [action.tabId]: { ...tab, panelId: action.to.newPanelId },
        };
        const wasActive = sourcePanel.activeTabId === action.tabId;
        if (sourceTabs.length === 0) {
          next = removePanelAndFill(next, {
            ...sourcePanel,
            tabs: [],
            activeTabId: null,
          });
        } else {
          /* v8 ignore next */
          const latestSource = next.panels[sourcePanel.id] ?? sourcePanel;
          next = {
            ...next,
            panels: {
              ...next.panels,
              [sourcePanel.id]: {
                ...latestSource,
                tabs: sourceTabs,
                activeTabId: wasActive
                  ? (sourceTabs[
                      Math.min(
                        sourceTabs.length - 1,
                        sourcePanel.tabs.indexOf(action.tabId),
                      )
                    ] ?? null)
                  : sourcePanel.activeTabId,
              },
            },
          };
        }
        return next;
      }
      const targetPanelId = action.to.panelId;
      const targetPanel = state.panels[targetPanelId];
      if (!targetPanel) return state;
      let nextTabsInTarget = targetPanel.tabs;
      if (sourcePanel.id === targetPanelId) {
        nextTabsInTarget = nextTabsInTarget.filter((id) => id !== action.tabId);
      }
      const idx = Math.max(
        0,
        Math.min(nextTabsInTarget.length, action.to.index),
      );
      nextTabsInTarget = [
        ...nextTabsInTarget.slice(0, idx),
        action.tabId,
        ...nextTabsInTarget.slice(idx),
      ];
      return finishTabMove(
        state,
        tab,
        sourcePanel,
        targetPanelId,
        nextTabsInTarget,
      );
    }
    case 'SET_ACTIVE_TAB': {
      const tab = state.tabs[action.tabId];
      if (!tab) return state;
      const panel = state.panels[tab.panelId];
      if (!panel) return state;
      if (panel.activeTabId === action.tabId) return state;
      return {
        ...state,
        panels: {
          ...state.panels,
          [tab.panelId]: {
            ...panel,
            activeTabId: action.tabId,
          },
        },
      };
    }
    case 'SET_PANEL_DATA': {
      const tab = state.tabs[action.tabId];
      if (!tab) return state;
      return {
        ...state,
        tabs: { ...state.tabs, [action.tabId]: { ...tab, data: action.data } },
      };
    }
    case 'RESIZE_DIVIDER': {
      const dividers = tileryDeriveDividers(state);
      const target = dividers.find((d) => d.id === action.dividerId);
      if (!target) return state;
      const min = action.minSizePercent ?? TILERY_DEFAULT_MIN_PANEL_SIZE;
      const clamped = tileryClampDividerPosition(
        state,
        target,
        action.newPosition,
        min,
      );
      return tileryApplyDividerResize(state, target, clamped);
    }
    case 'SWAP_PANELS': {
      const a = state.panels[action.panelA];
      const b = state.panels[action.panelB];
      if (!a || !b) return state;
      if (a.id === b.id) return state;
      if (state.layout) {
        const layout = tilerySwapPanelsInLayout(
          state.layout,
          action.panelA,
          action.panelB,
        );
        return tilerySyncLayoutPanels({ ...state, layout }, layout);
      }
      return {
        ...state,
        panels: {
          ...state.panels,
          [a.id]: { ...a, inset: b.inset },
          [b.id]: { ...b, inset: a.inset },
        },
      };
    }
    default:
      return state;
  }
}

function finishTabMove(
  state: TileryLayoutState,
  tab: TileryTabState,
  sourcePanel: TileryPanelState,
  targetPanelId: TileryPanelId,
  nextTabsInTarget: TileryTabId[],
): TileryLayoutState {
  const wasActiveInSource = sourcePanel.activeTabId === tab.id;
  const isSamePanel = sourcePanel.id === targetPanelId;
  const next: TileryLayoutState = {
    ...state,
    tabs: { ...state.tabs, [tab.id]: { ...tab, panelId: targetPanelId } },
  };
  if (isSamePanel) {
    next.panels = {
      ...next.panels,
      [targetPanelId]: { ...sourcePanel, tabs: nextTabsInTarget },
    };
    return next;
  }
  const targetPanel = state.panels[targetPanelId]!;
  next.panels = {
    ...next.panels,
    [targetPanelId]: {
      ...targetPanel,
      tabs: nextTabsInTarget,
      activeTabId: tab.id,
    },
  };
  const sourceTabs = sourcePanel.tabs.filter((id) => id !== tab.id);
  if (sourceTabs.length === 0) {
    return removePanelAndFill(next, {
      ...sourcePanel,
      tabs: [],
      activeTabId: null,
    });
  }
  next.panels = {
    ...next.panels,
    [sourcePanel.id]: {
      ...sourcePanel,
      tabs: sourceTabs,
      activeTabId: wasActiveInSource
        ? (sourceTabs[
            Math.min(sourceTabs.length - 1, sourcePanel.tabs.indexOf(tab.id))
          ] ?? null)
        : sourcePanel.activeTabId,
    },
  };
  return next;
}

function removePanelAndFill(
  state: TileryLayoutState,
  removed: TileryPanelState,
): TileryLayoutState {
  if (state.layout) {
    const { [removed.id]: _drop, ...nextPanels } = state.panels;
    const nextTabs = { ...state.tabs };
    for (const tid of removed.tabs) delete nextTabs[tid];
    const layout =
      tileryRemovePanelFromLayout(state.layout, removed.id) ?? null;
    return tilerySyncLayoutPanels(
      {
        panels: nextPanels,
        panelOrder: state.panelOrder.filter((id) => id !== removed.id),
        tabs: nextTabs,
        layout,
      },
      layout,
    );
  }
  const otherPanels = state.panelOrder
    .map((id) => state.panels[id])
    .filter((p): p is TileryPanelState => Boolean(p) && p.id !== removed.id);
  if (otherPanels.length === 0) {
    const { [removed.id]: _drop, ...restPanels } = state.panels;
    const tabsToDrop = removed.tabs;
    const nextTabs = { ...state.tabs };
    for (const tid of tabsToDrop) delete nextTabs[tid];
    return {
      panels: restPanels,
      panelOrder: state.panelOrder.filter((id) => id !== removed.id),
      tabs: nextTabs,
    };
  }
  const fillers = tileryFindRemovalFillers(otherPanels, removed);
  const nextPanels = { ...state.panels };
  delete nextPanels[removed.id];
  for (const f of fillers) {
    const p = nextPanels[f.id];
    /* v8 ignore next */
    if (!p) continue;
    nextPanels[f.id] = { ...p, inset: f.inset };
  }
  const nextOrder = state.panelOrder.filter((id) => id !== removed.id);
  const nextTabs = { ...state.tabs };
  for (const tid of removed.tabs) delete nextTabs[tid];
  return { panels: nextPanels, panelOrder: nextOrder, tabs: nextTabs };
}

export function tileryPanelInitToReducerInit(init: TileryPanelInit): {
  id: TileryPanelId;
  tabs: { id: TileryTabId; data: unknown; closeable?: boolean }[];
} {
  return {
    id: init.id ?? tileryNextId('p'),
    tabs: init.tabs.map((t) => ({
      id: t.id ?? tileryNextId('t'),
      data: t.data,
      closeable: t.closeable ?? true,
    })),
  };
}

export function tileryTabInitToReducerInit(init: TileryTabInit): {
  id: TileryTabId;
  data: unknown;
  closeable: boolean;
} {
  return {
    id: init.id ?? tileryNextId('t'),
    data: init.data,
    closeable: init.closeable ?? true,
  };
}
