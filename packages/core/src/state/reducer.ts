import type {
  Direction,
  InitialLayout,
  LayoutState,
  PanelId,
  PanelInit,
  PanelState,
  TabId,
  TabInit,
  TabState,
} from '../types';
import {
  DEFAULT_MIN_PANEL_SIZE,
  applyDividerResize,
  clampDividerPosition,
  deriveDividers,
  findCollapseFillers,
  splitFitsMin,
  splitInset,
} from './layout-math';

export type ReducerAction =
  | {
      type: 'SPLIT_PANEL';
      panelId: PanelId;
      direction: Direction;
      sizePercent: number;
      newPanelId: PanelId;
      tabs: { id: TabId; data: unknown }[];
      activate: boolean;
    }
  | { type: 'REMOVE_PANEL'; panelId: PanelId }
  | {
      type: 'APPEND_TAB';
      panelId: PanelId;
      tab: { id: TabId; data: unknown };
      activate: boolean;
    }
  | {
      type: 'INSERT_TAB';
      panelId: PanelId;
      tab: { id: TabId; data: unknown };
      index: number;
      activate: boolean;
    }
  | { type: 'REMOVE_TAB'; tabId: TabId }
  | {
      type: 'MOVE_TAB';
      tabId: TabId;
      to:
        | { panelId: PanelId; index: number }
        | { beforeTabId: TabId }
        | { afterTabId: TabId }
        | {
            splitPanelId: PanelId;
            direction: Direction;
            sizePercent: number;
            newPanelId: PanelId;
          };
    }
  | { type: 'SET_ACTIVE_TAB'; tabId: TabId }
  | { type: 'SET_PANEL_DATA'; tabId: TabId; data: unknown }
  | {
      type: 'RESIZE_DIVIDER';
      dividerId: string;
      newPosition: number;
      minSizePercent?: number;
    }
  | { type: 'SWAP_PANELS'; panelA: PanelId; panelB: PanelId }
  | { type: 'REPLACE_STATE'; state: LayoutState };

let _idCounter = 0;
export function nextId(prefix: string): string {
  _idCounter += 1;
  return `${prefix}_${_idCounter}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createInitialState(initial: InitialLayout): LayoutState {
  const state: LayoutState = {
    panels: {},
    panelOrder: [],
    tabs: {},
  };
  for (const init of initial.panels) {
    const panelId = init.id ?? nextId('p');
    const tabs: TabId[] = [];
    for (const tabInit of init.tabs) {
      const tabId = tabInit.id ?? nextId('t');
      state.tabs[tabId] = { id: tabId, panelId, data: tabInit.data };
      tabs.push(tabId);
    }
    const activeTabId =
      init.activeTabId && tabs.includes(init.activeTabId)
        ? init.activeTabId
        : (tabs[0] ?? null);
    state.panels[panelId] = {
      id: panelId,
      kind: 'tiled',
      inset: { ...init.inset },
      tabs,
      activeTabId,
    };
    state.panelOrder.push(panelId);
  }
  return state;
}

export function reducer(
  state: LayoutState,
  action: ReducerAction,
): LayoutState {
  switch (action.type) {
    case 'REPLACE_STATE':
      return action.state;
    case 'SPLIT_PANEL': {
      const source = state.panels[action.panelId];
      if (!source) return state;
      if (!splitFitsMin(source.inset, action.direction, action.sizePercent)) {
        return state;
      }
      const { source: sourceInset, created: createdInset } = splitInset(
        source.inset,
        action.direction,
        action.sizePercent,
      );
      const newTabs: Record<TabId, TabState> = { ...state.tabs };
      const tabIds: TabId[] = [];
      for (const t of action.tabs) {
        newTabs[t.id] = { id: t.id, panelId: action.newPanelId, data: t.data };
        tabIds.push(t.id);
      }
      const newPanel: PanelState = {
        id: action.newPanelId,
        kind: 'tiled',
        inset: createdInset,
        tabs: tabIds,
        activeTabId: tabIds[0] ?? null,
      };
      const sourceIdx = state.panelOrder.indexOf(action.panelId);
      const insertAt = sourceIdx >= 0 ? sourceIdx + 1 : state.panelOrder.length;
      const nextOrder = [
        ...state.panelOrder.slice(0, insertAt),
        action.newPanelId,
        ...state.panelOrder.slice(insertAt),
      ];
      return {
        panels: {
          ...state.panels,
          [action.panelId]: { ...source, inset: sourceInset },
          [action.newPanelId]: newPanel,
        },
        panelOrder: nextOrder,
        tabs: newTabs,
      };
    }
    case 'REMOVE_PANEL': {
      const target = state.panels[action.panelId];
      if (!target) return state;
      return collapsePanel(state, target);
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
        return collapsePanel(
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
        if (
          targetSource.id === sourcePanel.id &&
          sourcePanel.tabs.length === 1
        ) {
          return state;
        }
        if (
          !splitFitsMin(
            targetSource.inset,
            action.to.direction,
            action.to.sizePercent,
          )
        ) {
          return state;
        }
        const { source: srcInset, created: createdInset } = splitInset(
          targetSource.inset,
          action.to.direction,
          action.to.sizePercent,
        );
        let next = { ...state };
        next = {
          ...next,
          panels: {
            ...next.panels,
            [targetSource.id]: { ...targetSource, inset: srcInset },
          },
        };
        const newPanel: PanelState = {
          id: action.to.newPanelId,
          kind: 'tiled',
          inset: createdInset,
          tabs: [action.tabId],
          activeTabId: action.tabId,
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
        const sourceTabs = sourcePanel.tabs.filter((id) => id !== action.tabId);
        next.tabs = {
          ...next.tabs,
          [action.tabId]: { ...tab, panelId: action.to.newPanelId },
        };
        const wasActive = sourcePanel.activeTabId === action.tabId;
        if (sourceTabs.length === 0) {
          next = collapsePanel(next, {
            ...sourcePanel,
            tabs: [],
            activeTabId: null,
          });
        } else {
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
          [tab.panelId]: { ...panel, activeTabId: action.tabId },
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
      const dividers = deriveDividers(state);
      const target = dividers.find((d) => d.id === action.dividerId);
      if (!target) return state;
      const min = action.minSizePercent ?? DEFAULT_MIN_PANEL_SIZE;
      const clamped = clampDividerPosition(
        state,
        target,
        action.newPosition,
        min,
      );
      return applyDividerResize(state, target, clamped);
    }
    case 'SWAP_PANELS': {
      const a = state.panels[action.panelA];
      const b = state.panels[action.panelB];
      if (!a || !b) return state;
      if (a.id === b.id) return state;
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
  state: LayoutState,
  tab: TabState,
  sourcePanel: PanelState,
  targetPanelId: PanelId,
  nextTabsInTarget: TabId[],
): LayoutState {
  const wasActiveInSource = sourcePanel.activeTabId === tab.id;
  const isSamePanel = sourcePanel.id === targetPanelId;
  const next: LayoutState = {
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
    return collapsePanel(next, { ...sourcePanel, tabs: [], activeTabId: null });
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

function collapsePanel(state: LayoutState, removed: PanelState): LayoutState {
  const otherPanels = state.panelOrder
    .map((id) => state.panels[id])
    .filter((p): p is PanelState => Boolean(p) && p.id !== removed.id);
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
  const fillers = findCollapseFillers(otherPanels, removed);
  const nextPanels = { ...state.panels };
  delete nextPanels[removed.id];
  for (const f of fillers) {
    const p = nextPanels[f.id];
    if (!p) continue;
    nextPanels[f.id] = { ...p, inset: f.inset };
  }
  const nextOrder = state.panelOrder.filter((id) => id !== removed.id);
  const nextTabs = { ...state.tabs };
  for (const tid of removed.tabs) delete nextTabs[tid];
  return { panels: nextPanels, panelOrder: nextOrder, tabs: nextTabs };
}

export function panelInitToReducerInit(init: PanelInit): {
  id: PanelId;
  tabs: { id: TabId; data: unknown }[];
} {
  return {
    id: init.id ?? nextId('p'),
    tabs: init.tabs.map((t) => ({ id: t.id ?? nextId('t'), data: t.data })),
  };
}

export function tabInitToReducerInit(init: TabInit): {
  id: TabId;
  data: unknown;
} {
  return { id: init.id ?? nextId('t'), data: init.data };
}
