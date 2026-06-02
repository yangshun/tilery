import type {
  TileryDockedLayoutInit,
  TileryDockPanelTarget,
  TileryDirection,
  TileryFloatingPanelBounds,
  TileryFloatingPanelBoundsInit,
  TileryFloatingPanelInit,
  TileryInitialLayout,
  TileryLayoutBehavior,
  TileryLayoutBehaviorConfig,
  TileryLayoutTree,
  TileryLayoutState,
  TileryPanelId,
  TileryPanelInit,
  TileryPanelState,
  TileryPopoutPanelConfig,
  TileryPopoutPanelOptions,
  TileryPopoutPanelPlacement,
  TileryPopoutWindowBounds,
  TileryPopoutWindowBoundsInit,
  TilerySize,
  TilerySizeResolutionContext,
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
  tileryNormalizeLayoutForContainerResize,
  tileryFloatingPanelOrderFromState,
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
import { tileryWarnForConstraintDiagnostics } from './diagnostics';

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
      minSize?: TilerySize;
      maxSize?: TilerySize;
      sizeContext?: TilerySizeResolutionContext;
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
      type: 'FLOAT_PANEL';
      panelId: TileryPanelId;
      bounds?: TileryFloatingPanelBoundsInit;
      behavior?: TileryLayoutBehaviorConfig;
    }
  | {
      type: 'POPOUT_PANEL';
      panelId: TileryPanelId;
      opts?: TileryPopoutPanelOptions;
    }
  | {
      type: 'RETURN_PANEL_TO_FLOATING';
      panelId: TileryPanelId;
      bounds?: TileryFloatingPanelBoundsInit;
    }
  | {
      type: 'FLOAT_TAB';
      tabId: TileryTabId;
      newPanelId: TileryPanelId;
      bounds?: TileryFloatingPanelBoundsInit;
      behavior?: TileryLayoutBehaviorConfig;
    }
  | {
      type: 'POPOUT_TAB';
      tabId: TileryTabId;
      newPanelId: TileryPanelId;
      opts?: TileryPopoutPanelOptions;
    }
  | {
      type: 'DOCK_PANEL';
      panelId: TileryPanelId;
      target?: TileryDockPanelTarget;
      sizeContext?: TilerySizeResolutionContext;
    }
  | { type: 'FOCUS_PANEL'; panelId: TileryPanelId }
  | {
      type: 'SET_FLOATING_PANEL_BOUNDS';
      panelId: TileryPanelId;
      bounds: TileryFloatingPanelBounds;
    }
  | {
      type: 'SET_POPOUT_WINDOW_BOUNDS';
      panelId: TileryPanelId;
      bounds: TileryPopoutWindowBounds;
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
            minSize?: TilerySize;
            maxSize?: TilerySize;
            sizeContext?: TilerySizeResolutionContext;
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
      minSize?: TilerySize;
      sizeContext?: TilerySizeResolutionContext;
    }
  | {
      type: 'RESIZE_JUNCTION';
      junctionId: string;
      x: number;
      y: number;
      minSize?: TilerySize;
      sizeContext?: TilerySizeResolutionContext;
    }
  | {
      type: 'NORMALIZE_CONTAINER_SIZE';
      minSize?: TilerySize;
      sizeContext?: TilerySizeResolutionContext;
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
  floatingPanelOrder: TileryPanelId[];
  hasFullScreenPanel: boolean;
};

function buildInitialLayoutTree(
  init: TileryDockedLayoutInit,
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

  if (init.type === 'group') {
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

  const unsupported = init as { type?: unknown };
  throw new Error(
    `Unsupported Tilery layout type: ${String(unsupported.type)}`,
  );
}

function buildInitialFloatingPanel(
  init: TileryFloatingPanelInit,
  ctx: InitialStateBuildContext,
  index: number,
) {
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
  const bounds = normalizeFloatingBounds(init.bounds, {
    x: 18 + index * 4,
    y: 12 + index * 4,
    width: 46,
    height: 48,
  });
  const popout = normalizePopoutPanelPlacement(init.popout);
  ctx.panels[panelId] = {
    id: panelId,
    kind: 'floating',
    inset: floatingBoundsToInset(bounds),
    tabs,
    activeTabId,
    fullScreen,
    minSize: init.minSize,
    maxSize: init.maxSize,
    behavior: tileryNormalizeLayoutBehavior(init),
    floating: {
      bounds,
      zIndex: init.zIndex ?? floatingZIndex(index),
      ...(popout ? { popout } : {}),
    },
  };
  ctx.floatingPanelOrder.push(panelId);
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
    floatingPanelOrder: [],
    hasFullScreenPanel: false,
  };
  const main = initial.type === 'root' ? initial.main : initial;
  const layout = buildInitialLayoutTree(main, ctx);
  if (initial.type === 'root') {
    initial.floating?.forEach((panel, index) =>
      buildInitialFloatingPanel(panel, ctx, index),
    );
  }
  const state: TileryLayoutState = {
    panels: ctx.panels,
    panelOrder: [],
    floatingPanelOrder: ctx.floatingPanelOrder,
    tabs: ctx.tabs,
    layout,
  };
  const next = tilerySyncLayoutPanels(state, layout);
  tileryWarnForConstraintDiagnostics(next);
  return next;
}

export function tileryReducer(
  state: TileryLayoutState,
  action: TileryReducerAction,
): TileryLayoutState {
  const current = tileryNormalizeLayoutState(state);
  switch (action.type) {
    case 'REPLACE_STATE': {
      const next = tileryNormalizeLayoutState(action.state);
      tileryWarnForConstraintDiagnostics(next);
      return next;
    }
    case 'SPLIT_PANEL': {
      const source = current.panels[action.panelId];
      if (!source) return current;
      if (source.kind !== 'tiled') return current;
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
          undefined,
          action.sizeContext,
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
    case 'FLOAT_PANEL': {
      return floatPanel(
        current,
        action.panelId,
        action.bounds,
        action.behavior,
      );
    }
    case 'POPOUT_PANEL': {
      return popoutPanel(current, action.panelId, action.opts);
    }
    case 'RETURN_PANEL_TO_FLOATING': {
      return returnPanelToFloating(current, action.panelId, action.bounds);
    }
    case 'FLOAT_TAB': {
      return floatTab(
        current,
        action.tabId,
        action.newPanelId,
        action.bounds,
        action.behavior,
      );
    }
    case 'POPOUT_TAB': {
      return popoutTab(current, action.tabId, action.newPanelId, action.opts);
    }
    case 'DOCK_PANEL': {
      return dockPanel(
        current,
        action.panelId,
        action.target,
        action.sizeContext,
      );
    }
    case 'FOCUS_PANEL': {
      return focusFloatingPanel(current, action.panelId);
    }
    case 'SET_FLOATING_PANEL_BOUNDS': {
      const panel = current.panels[action.panelId];
      if (!panel || panel.kind !== 'floating') return current;
      const bounds = normalizeFloatingBounds(
        action.bounds,
        panel.floating.bounds,
      );
      if (floatingBoundsEqual(panel.floating.bounds, bounds)) return current;
      return {
        ...current,
        panels: {
          ...current.panels,
          [action.panelId]: {
            ...panel,
            inset: floatingBoundsToInset(bounds),
            floating: { ...panel.floating, bounds },
          },
        },
      };
    }
    case 'SET_POPOUT_WINDOW_BOUNDS': {
      const panel = current.panels[action.panelId];
      if (!panel || panel.kind !== 'floating' || !panel.floating.popout) {
        return current;
      }
      const windowBounds = normalizePopoutWindowBounds(
        action.bounds,
        panel.floating.popout.windowBounds,
      );
      if (
        popoutWindowBoundsEqual(
          panel.floating.popout.windowBounds,
          windowBounds,
        )
      ) {
        return current;
      }
      return {
        ...current,
        panels: {
          ...current.panels,
          [action.panelId]: {
            ...panel,
            floating: {
              ...panel.floating,
              popout: { windowBounds },
            },
          },
        },
      };
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
        if (targetSource.kind !== 'tiled') return current;
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
            undefined,
            action.to.sizeContext,
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
        action.sizeContext,
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
        action.sizeContext,
      );
    }
    case 'NORMALIZE_CONTAINER_SIZE': {
      if (!current.layout) return current;
      tileryWarnForConstraintDiagnostics(current, {
        minSize: action.minSize,
        sizeContext: action.sizeContext,
      });
      const layout = tileryNormalizeLayoutForContainerResize(
        current.layout,
        current.panels,
        action.minSize ?? TILERY_DEFAULT_MIN_SIZE,
        action.sizeContext,
      );
      if (layout === current.layout) return current;
      return tilerySyncLayoutPanels({ ...current, layout }, layout);
    }
    case 'SWAP_PANELS': {
      const a = current.panels[action.panelA];
      const b = current.panels[action.panelB];
      if (!a || !b) return current;
      if (a.kind !== 'tiled' || b.kind !== 'tiled') return current;
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

function floatPanel(
  state: TileryLayoutState,
  panelId: TileryPanelId,
  boundsInit?: TileryFloatingPanelBoundsInit,
  behaviorConfig?: TileryLayoutBehaviorConfig,
): TileryLayoutState {
  const panel = state.panels[panelId];
  if (!panel) return state;
  if (panel.kind === 'floating') {
    const bounds = boundsInit
      ? normalizeFloatingBounds(boundsInit, panel.floating.bounds)
      : panel.floating.bounds;
    const behavior = mergeFloatingBehavior(panel.behavior, behaviorConfig);
    const changed =
      !floatingBoundsEqual(bounds, panel.floating.bounds) ||
      Boolean(panel.floating.popout) ||
      !layoutBehaviorEqual(panel.behavior, behavior);
    const next = changed
      ? {
          ...state,
          panels: {
            ...state.panels,
            [panelId]: {
              ...panel,
              inset: floatingBoundsToInset(bounds),
              floating: {
                bounds,
                zIndex: panel.floating.zIndex,
              },
              behavior,
            },
          },
        }
      : state;
    return focusFloatingPanel(next, panelId);
  }

  const bounds = normalizeFloatingBounds(
    boundsInit,
    defaultFloatingBounds(panel),
  );
  const floatingPanel: TileryPanelState = {
    id: panel.id,
    kind: 'floating',
    inset: floatingBoundsToInset(bounds),
    tabs: panel.tabs,
    activeTabId: panel.activeTabId,
    fullScreen: false,
    minSize: panel.minSize,
    maxSize: panel.maxSize,
    behavior: mergeFloatingBehavior(
      tileryPanelBehaviorFromState(state, panelId),
      behaviorConfig,
    ),
    floating: {
      bounds,
      zIndex: nextFloatingZIndex(state),
    },
  };
  let nextPanels: Record<TileryPanelId, TileryPanelState> = {
    ...state.panels,
    [panelId]: floatingPanel,
  };
  const floatingPanelOrder = [
    ...tileryFloatingPanelOrderFromState(state).filter((id) => id !== panelId),
    panelId,
  ];

  if (state.layout) {
    const layout = tileryRemovePanelFromLayout(state.layout, panelId) ?? null;
    return focusFloatingPanel(
      tilerySyncLayoutPanels(
        {
          ...state,
          panels: nextPanels,
          panelOrder: tileryPanelOrderFromState(state).filter(
            (id) => id !== panelId,
          ),
          floatingPanelOrder,
          layout,
        },
        layout,
      ),
      panelId,
    );
  }

  const currentOrder = tileryPanelOrderFromState(state);
  const otherPanels = currentOrder
    .map((id) => state.panels[id])
    .filter(
      (item): item is TileryPanelState =>
        Boolean(item) && item.kind === 'tiled' && item.id !== panelId,
    );
  /* v8 ignore next 8 -- filler ids are derived from existing tiled panels. */
  for (const filler of tileryFindRemovalFillers(otherPanels, panel)) {
    const current = nextPanels[filler.id];
    if (!current) continue;
    nextPanels = {
      ...nextPanels,
      [filler.id]: { ...current, inset: filler.inset },
    };
  }

  return focusFloatingPanel(
    {
      ...state,
      panels: nextPanels,
      panelOrder: currentOrder.filter((id) => id !== panelId),
      floatingPanelOrder,
      layout: null,
    },
    panelId,
  );
}

function popoutPanel(
  state: TileryLayoutState,
  panelId: TileryPanelId,
  opts?: TileryPopoutPanelOptions,
): TileryLayoutState {
  const floated = floatPanel(state, panelId, opts?.floatingBounds, opts);
  const panel = floated.panels[panelId];
  if (!panel || panel.kind !== 'floating') return floated;
  const popout = normalizePopoutPanelPlacement(
    opts?.windowBounds ? { windowBounds: opts.windowBounds } : true,
  );
  return focusFloatingPanel(
    {
      ...floated,
      panels: {
        ...floated.panels,
        [panelId]: {
          ...panel,
          floating: {
            ...panel.floating,
            popout,
          },
        },
      },
    },
    panelId,
  );
}

function returnPanelToFloating(
  state: TileryLayoutState,
  panelId: TileryPanelId,
  boundsInit?: TileryFloatingPanelBoundsInit,
): TileryLayoutState {
  const panel = state.panels[panelId];
  if (!panel || panel.kind !== 'floating') return state;
  if (!panel.floating.popout && !boundsInit) return state;
  const bounds = boundsInit
    ? normalizeFloatingBounds(boundsInit, panel.floating.bounds)
    : panel.floating.bounds;
  return focusFloatingPanel(
    {
      ...state,
      panels: {
        ...state.panels,
        [panelId]: {
          ...panel,
          inset: floatingBoundsToInset(bounds),
          floating: {
            bounds,
            zIndex: panel.floating.zIndex,
          },
        },
      },
    },
    panelId,
  );
}

function floatTab(
  state: TileryLayoutState,
  tabId: TileryTabId,
  newPanelId: TileryPanelId,
  boundsInit?: TileryFloatingPanelBoundsInit,
  behaviorConfig?: TileryLayoutBehaviorConfig,
): TileryLayoutState {
  const tab = state.tabs[tabId];
  if (!tab) return state;
  if (!tab.draggable) return state;
  if (state.panels[newPanelId]) return state;
  const sourcePanel = state.panels[tab.panelId];
  if (!sourcePanel) return state;
  if (!tileryPanelBehaviorFromState(state, sourcePanel.id).draggable) {
    return state;
  }

  const bounds = normalizeFloatingBounds(
    boundsInit,
    sourcePanel.kind === 'floating'
      ? sourcePanel.floating.bounds
      : defaultFloatingBounds(sourcePanel),
  );
  const newPanel: TileryPanelState = {
    id: newPanelId,
    kind: 'floating',
    inset: floatingBoundsToInset(bounds),
    tabs: [tabId],
    activeTabId: tabId,
    fullScreen: false,
    behavior: tileryNormalizeLayoutBehavior(behaviorConfig),
    floating: {
      bounds,
      zIndex: nextFloatingZIndex(state),
    },
  };
  const sourceTabs = sourcePanel.tabs.filter((id) => id !== tabId);
  const wasActiveInSource = sourcePanel.activeTabId === tabId;
  let next: TileryLayoutState = {
    ...state,
    panels: {
      ...state.panels,
      [newPanelId]: newPanel,
    },
    tabs: {
      ...state.tabs,
      [tabId]: {
        ...tab,
        panelId: newPanelId,
      },
    },
    floatingPanelOrder: [
      ...tileryFloatingPanelOrderFromState(state).filter(
        (id) => id !== newPanelId,
      ),
      newPanelId,
    ],
  };

  if (sourceTabs.length === 0) {
    next = removePanelAndFill(next, {
      ...sourcePanel,
      tabs: [],
      activeTabId: null,
    });
  } else {
    next = {
      ...next,
      panels: {
        ...next.panels,
        [sourcePanel.id]: {
          ...sourcePanel,
          tabs: sourceTabs,
          activeTabId: wasActiveInSource
            ? (sourceTabs[
                Math.min(sourceTabs.length - 1, sourcePanel.tabs.indexOf(tabId))
              ] ?? null)
            : sourcePanel.activeTabId,
        },
      },
    };
  }

  return focusFloatingPanel(next, newPanelId);
}

function popoutTab(
  state: TileryLayoutState,
  tabId: TileryTabId,
  newPanelId: TileryPanelId,
  opts?: TileryPopoutPanelOptions,
): TileryLayoutState {
  const floated = floatTab(
    state,
    tabId,
    newPanelId,
    opts?.floatingBounds,
    opts,
  );
  if (floated === state) return state;
  const panel = floated.panels[newPanelId];
  /* v8 ignore next -- floatTab just created this floating panel. */
  if (!panel || panel.kind !== 'floating') return floated;
  const popout = normalizePopoutPanelPlacement({
    windowBounds: opts?.windowBounds,
  });
  return focusFloatingPanel(
    {
      ...floated,
      panels: {
        ...floated.panels,
        [newPanelId]: {
          ...panel,
          floating: {
            ...panel.floating,
            popout,
          },
        },
      },
    },
    newPanelId,
  );
}

function dockPanel(
  state: TileryLayoutState,
  panelId: TileryPanelId,
  target: TileryDockPanelTarget | undefined,
  sizeContext?: TilerySizeResolutionContext,
): TileryLayoutState {
  const panel = state.panels[panelId];
  if (!panel || panel.kind !== 'floating') return state;
  if (!panel.behavior.draggable) return state;

  const floatingPanelOrder = tileryFloatingPanelOrderFromState(state).filter(
    (id) => id !== panelId,
  );
  const behavior = targetHasLayoutBehavior(target)
    ? tileryNormalizeLayoutBehavior(target)
    : panel.behavior;
  const minSize = target?.minSize ?? panel.minSize;
  const maxSize = target?.maxSize ?? panel.maxSize;

  const dockedPanel: TileryPanelState = {
    id: panel.id,
    kind: 'tiled',
    inset: panel.inset,
    tabs: panel.tabs,
    activeTabId: panel.activeTabId,
    fullScreen: false,
    minSize,
    maxSize,
  };

  const tiledOrder = tileryPanelOrderFromState(state);
  if (tiledOrder.length === 0) {
    const layout: TileryLayoutTree = {
      kind: 'panel',
      panelId,
      ...behavior,
    };
    return tilerySyncLayoutPanels(
      {
        ...state,
        panels: { ...state.panels, [panelId]: dockedPanel },
        panelOrder: [panelId],
        floatingPanelOrder,
        layout,
      },
      layout,
    );
  }

  const splitPanelId = target?.splitPanel ?? tiledOrder[0]!;
  const targetSource = state.panels[splitPanelId];
  if (!targetSource || targetSource.kind !== 'tiled') return state;
  if (targetSource.fullScreen) return state;
  if (!tileryPanelBehaviorFromState(state, splitPanelId).droppable) {
    return state;
  }
  const direction = target?.direction ?? 'right';
  const sizePercent = target?.size ?? defaultDockSize(panel.floating.bounds);
  if (
    !tilerySplitFitsPanelConstraints(
      targetSource,
      direction,
      sizePercent,
      { minSize, maxSize },
      undefined,
      sizeContext,
    )
  ) {
    return state;
  }

  const { source: sourceInset, created: createdInset } = tilerySplitInset(
    targetSource.inset,
    direction,
    sizePercent,
  );
  const nextPanels: Record<TileryPanelId, TileryPanelState> = {
    ...state.panels,
    [targetSource.id]: {
      ...targetSource,
      inset: sourceInset,
      fullScreen: false,
    },
    [panelId]: {
      ...dockedPanel,
      inset: createdInset,
    },
  };
  const targetIdx = tiledOrder.indexOf(splitPanelId);
  const nextOrder = [
    ...tiledOrder.slice(0, targetIdx + 1),
    panelId,
    ...tiledOrder.slice(targetIdx + 1),
  ];
  const layout = state.layout
    ? tilerySplitPanelInLayout(
        state.layout,
        splitPanelId,
        panelId,
        direction,
        sizePercent,
        behavior,
      )
    : null;
  if (layout) {
    return tilerySyncLayoutPanels(
      {
        ...state,
        panels: nextPanels,
        panelOrder: nextOrder,
        floatingPanelOrder,
        layout,
      },
      layout,
    );
  }
  return {
    ...state,
    panels: nextPanels,
    panelOrder: nextOrder,
    floatingPanelOrder,
    layout: null,
  };
}

function focusFloatingPanel(
  state: TileryLayoutState,
  panelId: TileryPanelId,
): TileryLayoutState {
  const panel = state.panels[panelId];
  if (!panel || panel.kind !== 'floating') return state;
  const order = [
    ...tileryFloatingPanelOrderFromState(state).filter((id) => id !== panelId),
    panelId,
  ];
  return syncFloatingZIndexes(state, order);
}

function syncFloatingZIndexes(
  state: TileryLayoutState,
  order: TileryPanelId[],
): TileryLayoutState {
  let panels = state.panels;
  /* v8 ignore next -- normalized floating states carry an explicit order. */
  let changed = !arrayEqual(state.floatingPanelOrder ?? [], order);
  order.forEach((panelId, index) => {
    const panel = panels[panelId];
    /* v8 ignore next -- order is produced from existing floating panels. */
    if (!panel || panel.kind !== 'floating') return;
    const zIndex = floatingZIndex(index);
    if (panel.floating.zIndex === zIndex) return;
    if (panels === state.panels) panels = { ...state.panels };
    panels[panelId] = {
      ...panel,
      floating: { ...panel.floating, zIndex },
    };
    changed = true;
  });
  return changed ? { ...state, panels, floatingPanelOrder: order } : state;
}

function removePanelAndFill(
  state: TileryLayoutState,
  removed: TileryPanelState,
): TileryLayoutState {
  if (removed.kind === 'floating') {
    const { [removed.id]: _drop, ...nextPanels } = state.panels;
    const nextTabs = { ...state.tabs };
    for (const tid of removed.tabs) delete nextTabs[tid];
    return {
      ...state,
      panels: nextPanels,
      floatingPanelOrder: tileryFloatingPanelOrderFromState(state).filter(
        (id) => id !== removed.id,
      ),
      tabs: nextTabs,
    };
  }
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

function defaultFloatingBounds(
  panel: TileryPanelState,
): TileryFloatingPanelBounds {
  const width = 100 - panel.inset.left - panel.inset.right;
  const height = 100 - panel.inset.top - panel.inset.bottom;
  const fallback =
    width > 85 && height > 85
      ? { x: 18, y: 12, width: 46, height: 48 }
      : {
          x: panel.inset.left,
          y: panel.inset.top,
          width,
          height,
        };
  return normalizeFloatingBounds(undefined, fallback);
}

function normalizeFloatingBounds(
  value: TileryFloatingPanelBoundsInit | undefined,
  fallback: TileryFloatingPanelBounds,
): TileryFloatingPanelBounds {
  const width = clampFinite(value?.width ?? fallback.width, 12, 100);
  const height = clampFinite(value?.height ?? fallback.height, 12, 100);
  const x = clampFinite(value?.x ?? fallback.x, 0, 100 - width);
  const y = clampFinite(value?.y ?? fallback.y, 0, 100 - height);
  return {
    x: roundFloatingCoord(x),
    y: roundFloatingCoord(y),
    width: roundFloatingCoord(width),
    height: roundFloatingCoord(height),
  };
}

const DEFAULT_POPOUT_WINDOW_BOUNDS: TileryPopoutWindowBounds = {
  left: 80,
  top: 80,
  width: 720,
  height: 520,
};

function normalizePopoutPanelPlacement(
  value: TileryPopoutPanelConfig | undefined,
): TileryPopoutPanelPlacement | undefined {
  if (!value) return undefined;
  const init = value === true ? undefined : value.windowBounds;
  return {
    windowBounds: normalizePopoutWindowBounds(
      init,
      DEFAULT_POPOUT_WINDOW_BOUNDS,
    ),
  };
}

function normalizePopoutWindowBounds(
  value: TileryPopoutWindowBoundsInit | undefined,
  fallback: TileryPopoutWindowBounds,
): TileryPopoutWindowBounds {
  const width = clampFinite(value?.width ?? fallback.width, 240, 10000);
  const height = clampFinite(value?.height ?? fallback.height, 160, 10000);
  return {
    left: Math.round(clampFinite(value?.left ?? fallback.left, -10000, 10000)),
    top: Math.round(clampFinite(value?.top ?? fallback.top, -10000, 10000)),
    width: Math.round(width),
    height: Math.round(height),
  };
}

function floatingBoundsToInset(bounds: TileryFloatingPanelBounds) {
  return {
    top: bounds.y,
    right: 100 - bounds.x - bounds.width,
    bottom: 100 - bounds.y - bounds.height,
    left: bounds.x,
  };
}

function floatingBoundsEqual(
  a: TileryFloatingPanelBounds,
  b: TileryFloatingPanelBounds,
): boolean {
  return (
    a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height
  );
}

function popoutWindowBoundsEqual(
  a: TileryPopoutWindowBounds,
  b: TileryPopoutWindowBounds,
): boolean {
  return (
    a.left === b.left &&
    a.top === b.top &&
    a.width === b.width &&
    a.height === b.height
  );
}

function mergeFloatingBehavior(
  base: TileryLayoutBehavior,
  config: TileryLayoutBehaviorConfig | undefined,
): TileryLayoutBehavior {
  if (config?.locked === true) {
    return { resizable: false, draggable: false, droppable: false };
  }
  return {
    resizable: config?.resizable ?? base.resizable,
    draggable: config?.draggable ?? base.draggable,
    droppable: config?.droppable ?? base.droppable,
  };
}

function layoutBehaviorEqual(
  a: TileryLayoutBehavior,
  b: TileryLayoutBehavior,
): boolean {
  return (
    a.resizable === b.resizable &&
    a.draggable === b.draggable &&
    a.droppable === b.droppable
  );
}

function defaultDockSize(bounds: TileryFloatingPanelBounds): number {
  return Math.max(20, Math.min(50, bounds.width));
}

function nextFloatingZIndex(state: TileryLayoutState): number {
  return floatingZIndex(tileryFloatingPanelOrderFromState(state).length);
}

function floatingZIndex(index: number): number {
  return 20 + index;
}

function targetHasLayoutBehavior(
  target: TileryDockPanelTarget | undefined,
): boolean {
  return Boolean(
    target &&
    ('locked' in target ||
      'resizable' in target ||
      'draggable' in target ||
      'droppable' in target),
  );
}

function clampFinite(value: number, min: number, max: number): number {
  const finite = Number.isFinite(value) ? value : min;
  return Math.max(min, Math.min(max, finite));
}

function roundFloatingCoord(value: number): number {
  return Number(value.toFixed(4));
}

function arrayEqual<T>(a: T[], b: T[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
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
