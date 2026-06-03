import type {
  TileryLayoutState,
  TileryPanelId,
  TileryPanelState,
  TileryTabId,
  TileryTabState,
} from '../types';
import type { TileryReducerAction } from './actions';
import { tileryEdgePanelOrderFromState } from './edges';
import {
  tileryCanSwapPanels,
  tileryPanelBehaviorFromState,
} from './layout-behavior';
import {
  tileryFindRemovalFillers,
  tilerySplitFitsPanelConstraints,
  tilerySplitInset,
} from './layout-math';
import {
  tileryPanelOrderFromState,
  tileryFloatingPanelOrderFromState,
  tileryRemovePanelFromLayout,
  tilerySplitPanelInLayout,
  tilerySwapPanelsInLayout,
  tilerySyncLayoutPanels,
} from './layout-tree';
import { tileryReducerTabActionToState } from './tab-state';

type SplitPanelAction = Extract<TileryReducerAction, { type: 'PANEL_SPLIT' }>;

export function tilerySplitPanel(
  current: TileryLayoutState,
  action: SplitPanelAction,
): TileryLayoutState {
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
    newTabs[t.id] = tileryReducerTabActionToState(t, action.newPanelId);
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
    if (layout) return tilerySyncLayoutPanels({ ...nextState, layout }, layout);
    return { ...nextState, layout: null };
  }
  return nextState;
}

export function tileryRemovePanel(
  current: TileryLayoutState,
  panelId: TileryPanelId,
): TileryLayoutState {
  const target = current.panels[panelId];
  if (!target) return current;
  if (tileryPanelHasNonCloseableTab(current, target)) return current;
  return tileryRemovePanelAndFill(current, target);
}

export function tilerySetPanelFullScreen(
  current: TileryLayoutState,
  panelId: TileryPanelId,
  fullScreen: boolean,
): TileryLayoutState {
  const panel = current.panels[panelId];
  if (!panel) return current;
  if (!fullScreen) {
    if (!panel.fullScreen) return current;
    return {
      ...current,
      panels: {
        ...current.panels,
        [panelId]: { ...panel, fullScreen: false },
      },
    };
  }
  const nextPanels: Record<TileryPanelId, TileryPanelState> = {};
  let changed = !panel.fullScreen;
  for (const id of Object.keys(current.panels)) {
    const currentPanel = current.panels[id]!;
    const next =
      id === panelId
        ? { ...currentPanel, fullScreen: true }
        : { ...currentPanel, fullScreen: false };
    if (next.fullScreen !== currentPanel.fullScreen) changed = true;
    nextPanels[id] = next;
  }
  if (!changed) return current;
  return { ...current, panels: nextPanels };
}

export function tilerySwapPanels(
  current: TileryLayoutState,
  panelA: TileryPanelId,
  panelB: TileryPanelId,
): TileryLayoutState {
  const a = current.panels[panelA];
  const b = current.panels[panelB];
  if (!a || !b) return current;
  if (a.kind !== 'tiled' || b.kind !== 'tiled') return current;
  if (a.id === b.id) return current;
  if (!tileryCanSwapPanels(current, a.id, b.id)) return current;
  if (current.layout) {
    const layout = tilerySwapPanelsInLayout(current.layout, panelA, panelB);
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

export function tileryRemovePanelAndFill(
  state: TileryLayoutState,
  removed: TileryPanelState,
): TileryLayoutState {
  if (removed.kind === 'edge') {
    const { [removed.id]: _drop, ...nextPanels } = state.panels;
    const nextTabs = { ...state.tabs };
    for (const tid of removed.tabs) delete nextTabs[tid];
    return {
      ...state,
      panels: nextPanels,
      edgePanelOrder: tileryEdgePanelOrderFromState(state).filter(
        (id) => id !== removed.id,
      ),
      tabs: nextTabs,
    };
  }

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
        ...state,
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
      ...state,
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

export function tileryPanelHasNonCloseableTab(
  state: TileryLayoutState,
  panel: TileryPanelState,
): boolean {
  return panel.tabs.some((tabId) => state.tabs[tabId]?.closeable === false);
}

export type TileryPanelSplitAction = SplitPanelAction;
