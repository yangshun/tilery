/**
 * Lifecycle event payloads and the diffing logic that turns a single reducer
 * action into the structured tab/panel events the Tilery component emits.
 */

import {
  tileryAllPanelOrderFromState,
  type TileryDirection,
  type TileryLayoutState,
  type TileryPanelId,
  type TileryReducerAction,
  type TileryTabId,
} from 'tilery/internal';

/**
 * Identifies the kind of state transition that produced a lifecycle event, so
 * consumers can branch on how the change originated (a split, a tab move, a
 * removal, a whole-state replacement, and so on).
 */
export type TileryLifecycleSource =
  | 'PANEL_SPLIT'
  | 'PANEL_REMOVE'
  | 'TAB_APPEND'
  | 'TAB_INSERT'
  | 'TAB_ID_CHANGE'
  | 'TAB_REMOVE'
  | 'TAB_MOVE'
  | 'TAB_FLOAT'
  | 'TAB_POPOUT'
  | 'TAB_ACTIVE_SET'
  | 'STATE_REPLACE';

/** Compact snapshot of a single tab involved in a lifecycle transition. */
export type TileryTabLifecycleChange<TData = unknown> = {
  /** Identifier of the affected tab. */
  id: TileryTabId;
  /** Panel the tab belongs to at the snapshotted side of the transition. */
  panelId: TileryPanelId;
  /** Caller-supplied data carried by the tab. */
  data: TData;
  /** Whether the tab can be closed by the user. */
  closable: boolean;
  /** Whether the tab can be dragged. */
  draggable: boolean;
};

/** Compact snapshot of a panel and its tab membership at a transition side. */
export type TileryPanelLifecycleChange = {
  /** Identifier of the affected panel. */
  id: TileryPanelId;
  /** Ordered tab ids contained by the panel. */
  tabIds: TileryTabId[];
  /** Tab currently active in the panel, or null when it has none. */
  activeTabId: TileryTabId | null;
};

/** Describes one panel switching from one active tab to another. */
export type TileryActiveTabChange = {
  /** Panel whose active tab changed. */
  panelId: TileryPanelId;
  /** Tab that was active before the change, or null. */
  previousTabId: TileryTabId | null;
  /** Tab that is active after the change, or null. */
  tabId: TileryTabId | null;
};

/** Describes a tab relocating to a different panel or position. */
export type TileryTabMoveChange<TData = unknown> = {
  /** Identifier of the moved tab. */
  id: TileryTabId;
  /** Panel the tab left. */
  previousPanelId: TileryPanelId;
  /** Panel the tab moved into. */
  panelId: TileryPanelId;
  /** Index the tab occupied in its previous panel. */
  previousIndex: number;
  /** Index the tab occupies in its new panel. */
  index: number;
  /** Caller-supplied data carried by the tab. */
  data: TData;
  /** Whether the tab can be closed by the user. */
  closable: boolean;
  /** Whether the tab can be dragged. */
  draggable: boolean;
};

/** Payload for `onActiveTabChange`: one or more panels changed active tab. */
export type TileryActiveTabChangeEvent = {
  /** Transition that produced the change. */
  source: TileryLifecycleSource;
  /** Per-panel active-tab changes. */
  changes: TileryActiveTabChange[];
  /** Layout state before the transition. */
  previousState: TileryLayoutState;
  /** Layout state after the transition. */
  state: TileryLayoutState;
};

/** Payload for `onTabsMove`: tabs moved between panels or to new indexes. */
export type TileryTabsMoveEvent<TData = unknown> = {
  /** Transition that produced the move. */
  source: TileryLifecycleSource;
  /** The tabs that changed panel or position. */
  tabs: TileryTabMoveChange<TData>[];
  /** Layout state before the transition. */
  previousState: TileryLayoutState;
  /** Layout state after the transition. */
  state: TileryLayoutState;
};

/** Payload for `onPanelsOpen`: one or more panels were created. */
export type TileryPanelsOpenEvent<TData = unknown> = {
  /** Transition that created the panels. */
  source: TileryLifecycleSource;
  /** The panels that came into existence. */
  panels: TileryPanelLifecycleChange[];
  /** Tabs carried into the newly opened panels. */
  tabs: TileryTabLifecycleChange<TData>[];
  /** Layout state before the transition. */
  previousState: TileryLayoutState;
  /** Layout state after the transition. */
  state: TileryLayoutState;
};

/** Payload for `onPanelSplit`: a panel was divided into two. */
export type TileryPanelSplitEvent<TData = unknown> = {
  /** Whether the split came from an explicit split or a tab move. */
  source: 'PANEL_SPLIT' | 'TAB_MOVE';
  /** Panel that was split (and remains). */
  splitPanelId: TileryPanelId;
  /** Panel created alongside the split. */
  createdPanelId: TileryPanelId;
  /** Side of the split panel the new panel was placed on. */
  direction: TileryDirection;
  /** Size of the created panel as a percentage of the split region. */
  size: number;
  /** Snapshot of the split panel after the operation. */
  splitPanel: TileryPanelLifecycleChange;
  /** Snapshot of the newly created panel. */
  createdPanel: TileryPanelLifecycleChange;
  /** Tabs that landed in the created panel. */
  tabs: TileryTabLifecycleChange<TData>[];
  /** Layout state before the transition. */
  previousState: TileryLayoutState;
  /** Layout state after the transition. */
  state: TileryLayoutState;
};

/** Payload for `onTabsOpen`: one or more tabs were added. */
export type TileryTabsOpenEvent<TData = unknown> = {
  /** Transition that added the tabs. */
  source: TileryLifecycleSource;
  /** The tabs that were added. */
  tabs: TileryTabLifecycleChange<TData>[];
  /** Layout state before the transition. */
  previousState: TileryLayoutState;
  /** Layout state after the transition. */
  state: TileryLayoutState;
};

/** Payload for `onTabsClose`: one or more tabs were removed. */
export type TileryTabsCloseEvent<TData = unknown> = {
  /** Transition that removed the tabs. */
  source: TileryLifecycleSource;
  /** The tabs that were removed. */
  tabs: TileryTabLifecycleChange<TData>[];
  /** Panels that closed as a result of the removal, if any. */
  panels: TileryPanelLifecycleChange[];
  /** Layout state before the transition. */
  previousState: TileryLayoutState;
  /** Layout state after the transition. */
  state: TileryLayoutState;
};

/** Payload for `onPanelsClose`: one or more panels were removed. */
export type TileryPanelsCloseEvent<TData = unknown> = {
  /** Transition that removed the panels. */
  source: TileryLifecycleSource;
  /** The panels that were removed. */
  panels: TileryPanelLifecycleChange[];
  /** Tabs the removed panels contained, including any moved out. */
  tabs: TileryTabLifecycleChange<TData>[];
  /** Layout state before the transition. */
  previousState: TileryLayoutState;
  /** Layout state after the transition. */
  state: TileryLayoutState;
};

/**
 * Bundle of every lifecycle event that a single reducer action can fire; each
 * slot is non-null only when that kind of change actually occurred.
 */
export type TileryLifecycleEvents<TData = unknown> = {
  /** Active-tab change event, or null. */
  activeTabChange: TileryActiveTabChangeEvent | null;
  /** Tab move event, or null. */
  tabsMove: TileryTabsMoveEvent<TData> | null;
  /** Panels-open event, or null. */
  panelsOpen: TileryPanelsOpenEvent<TData> | null;
  /** Panel-split event, or null. */
  panelSplit: TileryPanelSplitEvent<TData> | null;
  /** Tabs-open event, or null. */
  tabsOpen: TileryTabsOpenEvent<TData> | null;
  /** Tabs-close event, or null. */
  tabsClose: TileryTabsCloseEvent<TData> | null;
  /** Panels-close event, or null. */
  panelsClose: TileryPanelsCloseEvent<TData> | null;
};

/**
 * Exhaustive classification of every reducer action: the lifecycle source it
 * reports, or null when it can never change panel/tab membership or the active
 * tab (sizes, bounds, focus, data, and in-place panel transitions that keep the
 * panel id). The explicit Record makes adding a new reducer action a compile
 * error here until it is classified, replacing the previous unchecked cast.
 */
const LIFECYCLE_SOURCE_BY_ACTION: Record<
  TileryReducerAction['type'],
  TileryLifecycleSource | null
> = {
  PANEL_SPLIT: 'PANEL_SPLIT',
  PANEL_REMOVE: 'PANEL_REMOVE',
  TAB_APPEND: 'TAB_APPEND',
  TAB_INSERT: 'TAB_INSERT',
  TAB_ID_CHANGE: 'TAB_ID_CHANGE',
  TAB_REMOVE: 'TAB_REMOVE',
  TAB_MOVE: 'TAB_MOVE',
  TAB_FLOAT: 'TAB_FLOAT',
  TAB_POPOUT: 'TAB_POPOUT',
  TAB_ACTIVE_SET: 'TAB_ACTIVE_SET',
  STATE_REPLACE: 'STATE_REPLACE',
  PANEL_FULLSCREEN_SET: null,
  PANEL_FLOAT: null,
  PANEL_POPOUT: null,
  PANEL_RETURN_TO_FLOATING: null,
  PANEL_DOCK: null,
  PANEL_FOCUS: null,
  PANEL_FLOATING_BOUNDS_SET: null,
  PANEL_POPOUT_WINDOW_BOUNDS_SET: null,
  PANEL_SWAP: null,
  EDGE_PANEL_SIZE_SET: null,
  TAB_DATA_SET: null,
  TAB_BEHAVIOR_SET: null,
  DIVIDER_RESIZE: null,
  DIVIDER_RESET: null,
  JUNCTION_RESIZE: null,
  CONTAINER_SIZE_NORMALIZE: null,
};

/**
 * Diffs the states surrounding a reducer action and returns the lifecycle
 * events that should fire for it. Actions classified with a null source never
 * change membership or the active tab, so they produce no events.
 */
export function makeLifecycleEvents<TData>(
  previousState: TileryLayoutState,
  state: TileryLayoutState,
  action: TileryReducerAction,
): TileryLifecycleEvents<TData> {
  const lifecycleSource = LIFECYCLE_SOURCE_BY_ACTION[action.type];
  // Actions classified as null never produce membership/active-tab diffs, so no
  // lifecycle events fire — return early rather than asserting a bogus source.
  if (lifecycleSource === null) {
    return {
      activeTabChange: null,
      tabsMove: null,
      panelsOpen: null,
      panelSplit: null,
      tabsOpen: null,
      tabsClose: null,
      panelsClose: null,
    };
  }
  const activeTabChanges = makeActiveTabChanges(previousState, state);
  const movedTabs = makeTabMoveChanges<TData>(previousState, state, action);
  const openedPanels = tileryAllPanelOrderFromState(state)
    .filter((panelId) => !previousState.panels[panelId])
    .map((panelId) => makePanelLifecycleChange(state.panels[panelId]!));
  const openedPanelTabs = openedPanels.flatMap((panel) =>
    panel.tabIds.map((tabId) =>
      makeTabLifecycleChange<TData>(state.tabs[tabId]!),
    ),
  );
  const panelSplit = makePanelSplitEvent<TData>(previousState, state, action);
  const openedTabs =
    action.type === 'TAB_ID_CHANGE'
      ? []
      : Object.values(state.tabs)
          .filter((tab) => !previousState.tabs[tab.id])
          .map(makeTabLifecycleChange<TData>);
  const closedTabs =
    action.type === 'TAB_ID_CHANGE'
      ? []
      : Object.values(previousState.tabs)
          .filter((tab) => !state.tabs[tab.id])
          .map(makeTabLifecycleChange<TData>);
  const closedPanels = tileryAllPanelOrderFromState(previousState)
    .filter((panelId) => !state.panels[panelId])
    .map((panelId) => makePanelLifecycleChange(previousState.panels[panelId]!));
  const panelTabs = closedPanels.flatMap((panel) =>
    panel.tabIds.map((tabId) =>
      makeTabLifecycleChange<TData>(previousState.tabs[tabId]!),
    ),
  );

  return {
    activeTabChange:
      activeTabChanges.length === 0
        ? null
        : {
            source: lifecycleSource,
            changes: activeTabChanges,
            previousState,
            state,
          },
    tabsMove:
      movedTabs.length === 0
        ? null
        : {
            source: lifecycleSource,
            tabs: movedTabs,
            previousState,
            state,
          },
    panelsOpen:
      openedPanels.length === 0
        ? null
        : {
            source: lifecycleSource,
            panels: openedPanels,
            tabs: openedPanelTabs,
            previousState,
            state,
          },
    panelSplit,
    tabsOpen:
      openedTabs.length === 0
        ? null
        : {
            source: lifecycleSource,
            tabs: openedTabs,
            previousState,
            state,
          },
    tabsClose:
      closedTabs.length === 0
        ? null
        : {
            source: lifecycleSource,
            tabs: closedTabs,
            panels: closedPanels,
            previousState,
            state,
          },
    panelsClose:
      closedPanels.length === 0
        ? null
        : {
            source: lifecycleSource,
            panels: closedPanels,
            tabs: panelTabs,
            previousState,
            state,
          },
  };
}

function makeActiveTabChanges(
  previousState: TileryLayoutState,
  state: TileryLayoutState,
): TileryActiveTabChange[] {
  const changes: TileryActiveTabChange[] = [];
  for (const panelId of tileryAllPanelOrderFromState(state)) {
    const previousPanel = previousState.panels[panelId];
    const panel = state.panels[panelId];
    if (!previousPanel || !panel) continue;
    if (previousPanel.activeTabId === panel.activeTabId) continue;
    changes.push({
      panelId,
      previousTabId: previousPanel.activeTabId,
      tabId: panel.activeTabId,
    });
  }
  return changes;
}

function makeTabMoveChanges<TData>(
  previousState: TileryLayoutState,
  state: TileryLayoutState,
  action: TileryReducerAction,
): TileryTabMoveChange<TData>[] {
  const tabId =
    action.type === 'TAB_MOVE' ||
    action.type === 'TAB_FLOAT' ||
    action.type === 'TAB_POPOUT'
      ? action.tabId
      : null;
  if (!tabId) return [];
  const previousTab = previousState.tabs[tabId];
  const tab = state.tabs[tabId];
  if (!previousTab || !tab) return [];
  const previousPanel = previousState.panels[previousTab.panelId]!;
  const panel = state.panels[tab.panelId]!;
  const previousIndex = previousPanel.tabs.indexOf(tabId);
  const index = panel.tabs.indexOf(tabId);
  if (previousTab.panelId === tab.panelId && previousIndex === index) return [];
  return [
    {
      id: tab.id,
      previousPanelId: previousTab.panelId,
      panelId: tab.panelId,
      previousIndex,
      index,
      data: tab.data as TData,
      closable: tab.closable,
      draggable: tab.draggable,
    },
  ];
}

function makePanelSplitEvent<TData>(
  previousState: TileryLayoutState,
  state: TileryLayoutState,
  action: TileryReducerAction,
): TileryPanelSplitEvent<TData> | null {
  if (action.type === 'PANEL_SPLIT') {
    return makePanelSplitEventFromParts(
      previousState,
      state,
      'PANEL_SPLIT',
      action.panelId,
      action.newPanelId,
      action.direction,
      action.sizePercent,
    );
  }
  if (action.type === 'TAB_MOVE' && 'splitPanelId' in action.to) {
    return makePanelSplitEventFromParts(
      previousState,
      state,
      'TAB_MOVE',
      action.to.splitPanelId,
      action.to.newPanelId,
      action.to.direction,
      action.to.sizePercent,
    );
  }
  return null;
}

function makePanelSplitEventFromParts<TData>(
  previousState: TileryLayoutState,
  state: TileryLayoutState,
  source: TileryPanelSplitEvent['source'],
  splitPanelId: TileryPanelId,
  createdPanelId: TileryPanelId,
  direction: TileryDirection,
  size: number,
): TileryPanelSplitEvent<TData> | null {
  const splitPanel = state.panels[splitPanelId];
  const createdPanel = state.panels[createdPanelId];
  if (!previousState.panels[splitPanelId] || !splitPanel || !createdPanel) {
    return null;
  }
  return {
    source,
    splitPanelId,
    createdPanelId,
    direction,
    size,
    splitPanel: makePanelLifecycleChange(splitPanel),
    createdPanel: makePanelLifecycleChange(createdPanel),
    tabs: createdPanel.tabs.map((tabId) =>
      makeTabLifecycleChange<TData>(state.tabs[tabId]!),
    ),
    previousState,
    state,
  };
}

function makeTabLifecycleChange<TData>(
  tab: NonNullable<TileryLayoutState['tabs'][string]>,
): TileryTabLifecycleChange<TData> {
  return {
    id: tab.id,
    panelId: tab.panelId,
    data: tab.data as TData,
    closable: tab.closable,
    draggable: tab.draggable,
  };
}

function makePanelLifecycleChange(
  panel: NonNullable<TileryLayoutState['panels'][string]>,
): TileryPanelLifecycleChange {
  return {
    id: panel.id,
    tabIds: [...panel.tabs],
    activeTabId: panel.activeTabId,
  };
}
