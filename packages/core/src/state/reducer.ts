import type {
  TileryDirection,
  TileryInitialLayout,
  TileryLayoutTree,
  TileryLayoutState,
  TileryPanelId,
  TileryPanelInit,
  TileryPanelState,
  TileryTabBehaviorUpdate,
  TileryTabId,
  TileryTabInit,
  TileryTabState,
} from '../types';
import {
  TILERY_DEFAULT_MIN_SIZE,
  tileryApplyDividerResize,
  tileryApplyJunctionResize,
  tileryClampDividerPosition,
  tileryDeriveDividers,
  tileryDeriveJunctions,
  tileryFindRemovalFillers,
  tilerySplitFitsPanelConstraints,
  tilerySplitInset,
} from './layout-math';
import {
  tileryNormalizeLayoutState,
  tileryPanelOrderFromState,
  tileryRemovePanelFromLayout,
  tilerySplitPanelInLayout,
  tilerySwapPanelsInLayout,
  tilerySyncLayoutPanels,
} from './layout-tree';
import {
  tileryBehaviorFromNode,
  tileryCanMoveTabBetweenPanels,
  tileryCanSwapPanels,
  tileryMergeLayoutBehavior,
  tileryNormalizeLayoutBehavior,
  tileryPanelBehaviorFromState,
} from './layout-behavior';
import {
  tileryApplyTabBehaviorUpdate,
  tileryNormalizeTabBehavior,
} from './tab-behavior';

type TileryReducerTabInit = {
  id: TileryTabId;
  data: unknown;
  closeable: boolean;
  draggable: boolean;
};

type TileryReducerTabAction = {
  id: TileryTabId;
  data: unknown;
  closeable?: boolean;
  draggable?: boolean;
};

export type TileryReducerAction =
  | {
      type: 'SPLIT_PANEL';
      panelId: TileryPanelId;
      direction: TileryDirection;
      sizePercent: number;
      newPanelId: TileryPanelId;
      minSize?: number;
      maxSize?: number;
      resizable?: boolean;
      draggable?: boolean;
      droppable?: boolean;
      tabs: TileryReducerTabAction[];
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
      tab: TileryReducerTabAction;
      activate: boolean;
    }
  | {
      type: 'INSERT_TAB';
      panelId: TileryPanelId;
      tab: TileryReducerTabAction;
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
            minSize?: number;
            maxSize?: number;
            resizable?: boolean;
            draggable?: boolean;
            droppable?: boolean;
          };
    }
  | { type: 'SET_ACTIVE_TAB'; tabId: TileryTabId }
  | { type: 'SET_PANEL_DATA'; tabId: TileryTabId; data: unknown }
  | {
      type: 'SET_TAB_BEHAVIOR';
      tabId: TileryTabId;
      behavior: TileryTabBehaviorUpdate;
    }
  | {
      type: 'RESIZE_DIVIDER';
      dividerId: string;
      newPosition: number;
      minSize?: number;
    }
  | {
      type: 'RESIZE_JUNCTION';
      junctionId: string;
      x: number;
      y: number;
      minSize?: number;
    }
  | { type: 'SWAP_PANELS'; panelA: TileryPanelId; panelB: TileryPanelId }
  | { type: 'REPLACE_STATE'; state: TileryLayoutState };

let _idCounter = 0;
export function tileryNextId(prefix: string): string {
  _idCounter += 1;
  return `${prefix}_${_idCounter}_${Math.random().toString(36).slice(2, 8)}`;
}

type InitialStateBuildContext = {
  panels: Record<TileryPanelId, TileryPanelState>;
  tabs: Record<TileryTabId, TileryTabState>;
  hasFullScreenPanel: boolean;
};

function buildInitialLayoutTree(
  init: TileryInitialLayout,
  ctx: InitialStateBuildContext,
): TileryLayoutTree | null {
  if (init.type === 'empty') return null;

  if (init.type === 'panel') {
    const panelId = init.id ?? tileryNextId('p');
    const tabs: TileryTabId[] = [];
    for (const tabInit of init.tabs) {
      const tabId = tabInit.id ?? tileryNextId('t');
      const behavior = tileryNormalizeTabBehavior(tabInit);
      ctx.tabs[tabId] = {
        id: tabId,
        panelId,
        data: tabInit.data,
        ...behavior,
      };
      tabs.push(tabId);
    }
    const activeTabId =
      init.activeTabId && tabs.includes(init.activeTabId)
        ? init.activeTabId
        : (tabs[0] ?? null);
    const fullScreen = Boolean(init.fullScreen && !ctx.hasFullScreenPanel);
    if (fullScreen) ctx.hasFullScreenPanel = true;
    const behavior = tileryNormalizeLayoutBehavior(init);
    ctx.panels[panelId] = {
      id: panelId,
      kind: 'tiled',
      inset: { top: 0, right: 0, bottom: 0, left: 0 },
      tabs,
      activeTabId,
      fullScreen,
      minSize: init.minSize,
      maxSize: init.maxSize,
    };
    return {
      kind: 'panel',
      panelId,
      size: init.size,
      ...behavior,
    };
  }

  const behavior = tileryNormalizeLayoutBehavior(init);
  const children = init.children
    .map((child) => buildInitialLayoutTree(child, ctx))
    .filter((child): child is TileryLayoutTree => Boolean(child));
  if (children.length === 0) return null;
  if (children.length === 1) {
    return {
      ...children[0]!,
      size: init.size,
      ...tileryMergeLayoutBehavior(
        behavior,
        tileryBehaviorFromNode(children[0]!),
      ),
    };
  }
  return {
    kind: 'split',
    id: init.id ?? initialSplitId(init.direction, children),
    direction: init.direction,
    size: init.size,
    ...behavior,
    children,
  };
}

function initialSplitId(
  direction: Extract<TileryLayoutTree, { kind: 'split' }>['direction'],
  children: TileryLayoutTree[],
): string {
  return `initial:${direction}:${children.map(layoutLeafSignature).join('|')}`;
}

function layoutLeafSignature(layout: TileryLayoutTree): string {
  if (layout.kind === 'panel') return layout.panelId;
  return `${layout.direction}(${layout.children.map(layoutLeafSignature).join(',')})`;
}

export function tileryCreateInitialState(
  initial: TileryInitialLayout,
): TileryLayoutState {
  const ctx: InitialStateBuildContext = {
    panels: {},
    tabs: {},
    hasFullScreenPanel: false,
  };
  const layout = buildInitialLayoutTree(initial, ctx);
  const state: TileryLayoutState = {
    panels: ctx.panels,
    panelOrder: [],
    tabs: ctx.tabs,
    layout,
  };
  return tilerySyncLayoutPanels(state, layout);
}

export function tileryReducer(
  state: TileryLayoutState,
  action: TileryReducerAction,
): TileryLayoutState {
  const current = tileryNormalizeLayoutState(state);
  switch (action.type) {
    case 'REPLACE_STATE':
      return tileryNormalizeLayoutState(action.state);
    case 'SPLIT_PANEL': {
      const source = current.panels[action.panelId];
      if (!source) return current;
      if (source.fullScreen) return current;
      if (!tileryPanelBehaviorFromState(current, action.panelId).droppable) {
        return current;
      }
      if (
        !tilerySplitFitsPanelConstraints(
          source,
          action.direction,
          action.sizePercent,
          { minSize: action.minSize, maxSize: action.maxSize },
        )
      ) {
        return current;
      }
      const { source: sourceInset, created: createdInset } = tilerySplitInset(
        source.inset,
        action.direction,
        action.sizePercent,
      );
      const newTabs: Record<TileryTabId, TileryTabState> = { ...current.tabs };
      const tabIds: TileryTabId[] = [];
      for (const t of action.tabs) {
        newTabs[t.id] = {
          id: t.id,
          panelId: action.newPanelId,
          data: t.data,
          closeable: t.closeable ?? true,
          draggable: t.draggable ?? true,
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
        minSize: action.minSize,
        maxSize: action.maxSize,
      };
      const currentOrder = tileryPanelOrderFromState(current);
      const sourceIdx = currentOrder.indexOf(action.panelId);
      const insertAt = sourceIdx >= 0 ? sourceIdx + 1 : currentOrder.length;
      const nextOrder = [
        ...currentOrder.slice(0, insertAt),
        action.newPanelId,
        ...currentOrder.slice(insertAt),
      ];
      const nextState: TileryLayoutState = {
        panels: {
          ...current.panels,
          [action.panelId]: {
            ...source,
            inset: sourceInset,
            fullScreen: false,
          },
          [action.newPanelId]: newPanel,
        },
        panelOrder: nextOrder,
        tabs: newTabs,
        layout: current.layout,
      };
      if (current.layout) {
        const layout = tilerySplitPanelInLayout(
          current.layout,
          action.panelId,
          action.newPanelId,
          action.direction,
          action.sizePercent,
          action,
        );
        if (layout)
          return tilerySyncLayoutPanels({ ...nextState, layout }, layout);
        return { ...nextState, layout: null };
      }
      return nextState;
    }
    case 'REMOVE_PANEL': {
      const target = current.panels[action.panelId];
      if (!target) return current;
      if (panelHasNonCloseableTab(current, target)) return current;
      return removePanelAndFill(current, target);
    }
    case 'SET_PANEL_FULLSCREEN': {
      const panel = current.panels[action.panelId];
      if (!panel) return current;
      if (!action.fullScreen) {
        if (!panel.fullScreen) return current;
        return {
          ...current,
          panels: {
            ...current.panels,
            [action.panelId]: { ...panel, fullScreen: false },
          },
        };
      }
      const nextPanels: Record<TileryPanelId, TileryPanelState> = {};
      let changed = !panel.fullScreen;
      for (const panelId of Object.keys(current.panels)) {
        const currentPanel = current.panels[panelId]!;
        const next =
          panelId === action.panelId
            ? { ...currentPanel, fullScreen: true }
            : { ...currentPanel, fullScreen: false };
        if (next.fullScreen !== currentPanel.fullScreen) changed = true;
        nextPanels[panelId] = next;
      }
      if (!changed) return current;
      return { ...current, panels: nextPanels };
    }
    case 'APPEND_TAB': {
      const panel = current.panels[action.panelId];
      if (!panel) return current;
      return {
        ...current,
        panels: {
          ...current.panels,
          [action.panelId]: {
            ...panel,
            tabs: [...panel.tabs, action.tab.id],
            activeTabId: action.activate
              ? action.tab.id
              : (panel.activeTabId ?? action.tab.id),
          },
        },
        tabs: {
          ...current.tabs,
          [action.tab.id]: {
            id: action.tab.id,
            panelId: action.panelId,
            data: action.tab.data,
            closeable: action.tab.closeable ?? true,
            draggable: action.tab.draggable ?? true,
          },
        },
      };
    }
    case 'INSERT_TAB': {
      const panel = current.panels[action.panelId];
      if (!panel) return current;
      const idx = Math.max(0, Math.min(panel.tabs.length, action.index));
      const nextTabs = [...panel.tabs];
      nextTabs.splice(idx, 0, action.tab.id);
      return {
        ...current,
        panels: {
          ...current.panels,
          [action.panelId]: {
            ...panel,
            tabs: nextTabs,
            activeTabId: action.activate
              ? action.tab.id
              : (panel.activeTabId ?? action.tab.id),
          },
        },
        tabs: {
          ...current.tabs,
          [action.tab.id]: {
            id: action.tab.id,
            panelId: action.panelId,
            data: action.tab.data,
            closeable: action.tab.closeable ?? true,
            draggable: action.tab.draggable ?? true,
          },
        },
      };
    }
    case 'REMOVE_TAB': {
      const tab = current.tabs[action.tabId];
      if (!tab) return current;
      if (!tab.closeable) return current;
      const panel = current.panels[tab.panelId];
      if (!panel) return current;
      const nextTabs = panel.tabs.filter((id) => id !== action.tabId);
      const { [action.tabId]: _drop, ...restTabs } = current.tabs;
      if (nextTabs.length === 0) {
        return removePanelAndFill(
          { ...current, tabs: restTabs },
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
        ...current,
        panels: {
          ...current.panels,
          [tab.panelId]: { ...panel, tabs: nextTabs, activeTabId: nextActive },
        },
        tabs: restTabs,
      };
    }
    case 'MOVE_TAB': {
      const tab = current.tabs[action.tabId];
      if (!tab) return current;
      if (!tab.draggable) return current;
      const sourcePanel = current.panels[tab.panelId];
      if (!sourcePanel) return current;

      if ('beforeTabId' in action.to || 'afterTabId' in action.to) {
        const refTabId =
          'beforeTabId' in action.to
            ? action.to.beforeTabId
            : action.to.afterTabId;
        const refTab = current.tabs[refTabId];
        if (!refTab) return current;
        if (refTabId === action.tabId) return current;
        const targetPanelId = refTab.panelId;
        const targetPanel = current.panels[targetPanelId];
        if (!targetPanel) return current;
        if (
          !tileryCanMoveTabBetweenPanels(current, sourcePanel.id, targetPanelId)
        ) {
          return current;
        }
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
          current,
          tab,
          sourcePanel,
          targetPanelId,
          nextTabsInTarget,
        );
      }
      if ('splitPanelId' in action.to) {
        const targetSource = current.panels[action.to.splitPanelId];
        if (!targetSource) return current;
        if (targetSource.fullScreen) return current;
        if (
          !tileryCanMoveTabBetweenPanels(
            current,
            sourcePanel.id,
            targetSource.id,
          )
        ) {
          return current;
        }
        if (
          targetSource.id === sourcePanel.id &&
          sourcePanel.tabs.length === 1
        ) {
          return current;
        }
        if (
          !tilerySplitFitsPanelConstraints(
            targetSource,
            action.to.direction,
            action.to.sizePercent,
            { minSize: action.to.minSize, maxSize: action.to.maxSize },
          )
        ) {
          return current;
        }
        const { source: srcInset, created: createdInset } = tilerySplitInset(
          targetSource.inset,
          action.to.direction,
          action.to.sizePercent,
        );
        let next: TileryLayoutState = { ...current };
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
          minSize: action.to.minSize,
          maxSize: action.to.maxSize,
        };
        next = {
          ...next,
          panels: { ...next.panels, [action.to.newPanelId]: newPanel },
        };
        const currentOrder = tileryPanelOrderFromState(next);
        const targetIdx = currentOrder.indexOf(targetSource.id);
        next.panelOrder = [
          ...currentOrder.slice(0, targetIdx + 1),
          action.to.newPanelId,
          ...currentOrder.slice(targetIdx + 1),
        ];
        if (current.layout) {
          const layout = tilerySplitPanelInLayout(
            current.layout,
            targetSource.id,
            action.to.newPanelId,
            action.to.direction,
            action.to.sizePercent,
            action.to,
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
      const targetPanel = current.panels[targetPanelId];
      if (!targetPanel) return current;
      if (
        !tileryCanMoveTabBetweenPanels(current, sourcePanel.id, targetPanelId)
      ) {
        return current;
      }
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
        current,
        tab,
        sourcePanel,
        targetPanelId,
        nextTabsInTarget,
      );
    }
    case 'SET_ACTIVE_TAB': {
      const tab = current.tabs[action.tabId];
      if (!tab) return current;
      const panel = current.panels[tab.panelId];
      if (!panel) return current;
      if (panel.activeTabId === action.tabId) return current;
      return {
        ...current,
        panels: {
          ...current.panels,
          [tab.panelId]: {
            ...panel,
            activeTabId: action.tabId,
          },
        },
      };
    }
    case 'SET_PANEL_DATA': {
      const tab = current.tabs[action.tabId];
      if (!tab) return current;
      return {
        ...current,
        tabs: {
          ...current.tabs,
          [action.tabId]: { ...tab, data: action.data },
        },
      };
    }
    case 'SET_TAB_BEHAVIOR': {
      const tab = current.tabs[action.tabId];
      if (!tab) return current;
      const behavior = tileryApplyTabBehaviorUpdate(tab, action.behavior);
      if (
        behavior.closeable === tab.closeable &&
        behavior.draggable === tab.draggable
      ) {
        return current;
      }
      return {
        ...current,
        tabs: {
          ...current.tabs,
          [action.tabId]: { ...tab, ...behavior },
        },
      };
    }
    case 'RESIZE_DIVIDER': {
      const dividers = tileryDeriveDividers(current);
      const target = dividers.find((d) => d.id === action.dividerId);
      if (!target) return current;
      const min = action.minSize ?? TILERY_DEFAULT_MIN_SIZE;
      const clamped = tileryClampDividerPosition(
        current,
        target,
        action.newPosition,
        min,
      );
      return tileryApplyDividerResize(current, target, clamped);
    }
    case 'RESIZE_JUNCTION': {
      const junction = tileryDeriveJunctions(current).find(
        (j) => j.id === action.junctionId,
      );
      if (!junction) return current;
      return tileryApplyJunctionResize(
        current,
        junction,
        { x: action.x, y: action.y },
        action.minSize ?? TILERY_DEFAULT_MIN_SIZE,
      );
    }
    case 'SWAP_PANELS': {
      const a = current.panels[action.panelA];
      const b = current.panels[action.panelB];
      if (!a || !b) return current;
      if (a.id === b.id) return current;
      if (!tileryCanSwapPanels(current, a.id, b.id)) return current;
      if (current.layout) {
        const layout = tilerySwapPanelsInLayout(
          current.layout,
          action.panelA,
          action.panelB,
        );
        return tilerySyncLayoutPanels({ ...current, layout }, layout);
      }
      return {
        ...current,
        panels: {
          ...current.panels,
          [a.id]: { ...a, inset: b.inset },
          [b.id]: { ...b, inset: a.inset },
        },
      };
    }
    default:
      return current;
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
    const currentOrder = tileryPanelOrderFromState(state);
    return tilerySyncLayoutPanels(
      {
        panels: nextPanels,
        panelOrder: currentOrder.filter((id) => id !== removed.id),
        tabs: nextTabs,
        layout,
      },
      layout,
    );
  }
  const currentOrder = tileryPanelOrderFromState(state);
  const otherPanels = currentOrder
    .map((id) => state.panels[id])
    .filter((p): p is TileryPanelState => Boolean(p) && p.id !== removed.id);
  if (otherPanels.length === 0) {
    const { [removed.id]: _drop, ...restPanels } = state.panels;
    const tabsToDrop = removed.tabs;
    const nextTabs = { ...state.tabs };
    for (const tid of tabsToDrop) delete nextTabs[tid];
    return {
      panels: restPanels,
      panelOrder: currentOrder.filter((id) => id !== removed.id),
      tabs: nextTabs,
      layout: null,
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
  const nextOrder = currentOrder.filter((id) => id !== removed.id);
  const nextTabs = { ...state.tabs };
  for (const tid of removed.tabs) delete nextTabs[tid];
  return {
    panels: nextPanels,
    panelOrder: nextOrder,
    tabs: nextTabs,
    layout: null,
  };
}

function panelHasNonCloseableTab(
  state: TileryLayoutState,
  panel: TileryPanelState,
): boolean {
  return panel.tabs.some((tabId) => state.tabs[tabId]?.closeable === false);
}

export function tileryPanelInitToReducerInit(init: TileryPanelInit): {
  id: TileryPanelId;
  tabs: TileryReducerTabInit[];
} {
  return {
    id: init.id ?? tileryNextId('p'),
    tabs: init.tabs.map(tileryTabInitToReducerInit),
  };
}

export function tileryTabInitToReducerInit(
  init: TileryTabInit,
): TileryReducerTabInit {
  const behavior = tileryNormalizeTabBehavior(init);
  return {
    id: init.id ?? tileryNextId('t'),
    data: init.data,
    ...behavior,
  };
}
