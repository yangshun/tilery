import {
  tileryAllPanelOrderFromState,
  type TileryDirection,
  type TileryLayoutState,
  type TileryPanelId,
  type TileryReducerAction,
  type TileryTabId,
} from 'tilery/internal';

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

export type TileryTabLifecycleChange<TData = unknown> = {
  id: TileryTabId;
  panelId: TileryPanelId;
  data: TData;
  closable: boolean;
  draggable: boolean;
};

export type TileryPanelLifecycleChange = {
  id: TileryPanelId;
  tabIds: TileryTabId[];
  activeTabId: TileryTabId | null;
};

export type TileryActiveTabChange = {
  panelId: TileryPanelId;
  previousTabId: TileryTabId | null;
  tabId: TileryTabId | null;
};

export type TileryTabMoveChange<TData = unknown> = {
  id: TileryTabId;
  previousPanelId: TileryPanelId;
  panelId: TileryPanelId;
  previousIndex: number;
  index: number;
  data: TData;
  closable: boolean;
  draggable: boolean;
};

export type TileryActiveTabChangeEvent = {
  source: TileryLifecycleSource;
  changes: TileryActiveTabChange[];
  previousState: TileryLayoutState;
  state: TileryLayoutState;
};

export type TileryTabsMoveEvent<TData = unknown> = {
  source: TileryLifecycleSource;
  tabs: TileryTabMoveChange<TData>[];
  previousState: TileryLayoutState;
  state: TileryLayoutState;
};

export type TileryPanelsOpenEvent<TData = unknown> = {
  source: TileryLifecycleSource;
  panels: TileryPanelLifecycleChange[];
  tabs: TileryTabLifecycleChange<TData>[];
  previousState: TileryLayoutState;
  state: TileryLayoutState;
};

export type TileryPanelSplitEvent<TData = unknown> = {
  source: 'PANEL_SPLIT' | 'TAB_MOVE';
  splitPanelId: TileryPanelId;
  createdPanelId: TileryPanelId;
  direction: TileryDirection;
  size: number;
  splitPanel: TileryPanelLifecycleChange;
  createdPanel: TileryPanelLifecycleChange;
  tabs: TileryTabLifecycleChange<TData>[];
  previousState: TileryLayoutState;
  state: TileryLayoutState;
};

export type TileryTabsOpenEvent<TData = unknown> = {
  source: TileryLifecycleSource;
  tabs: TileryTabLifecycleChange<TData>[];
  previousState: TileryLayoutState;
  state: TileryLayoutState;
};

export type TileryTabsCloseEvent<TData = unknown> = {
  source: TileryLifecycleSource;
  tabs: TileryTabLifecycleChange<TData>[];
  panels: TileryPanelLifecycleChange[];
  previousState: TileryLayoutState;
  state: TileryLayoutState;
};

export type TileryPanelsCloseEvent<TData = unknown> = {
  source: TileryLifecycleSource;
  panels: TileryPanelLifecycleChange[];
  tabs: TileryTabLifecycleChange<TData>[];
  previousState: TileryLayoutState;
  state: TileryLayoutState;
};

export type TileryLifecycleEvents<TData = unknown> = {
  activeTabChange: TileryActiveTabChangeEvent | null;
  tabsMove: TileryTabsMoveEvent<TData> | null;
  panelsOpen: TileryPanelsOpenEvent<TData> | null;
  panelSplit: TileryPanelSplitEvent<TData> | null;
  tabsOpen: TileryTabsOpenEvent<TData> | null;
  tabsClose: TileryTabsCloseEvent<TData> | null;
  panelsClose: TileryPanelsCloseEvent<TData> | null;
};

// Exhaustive classification of every reducer action: the lifecycle source it
// reports, or null when it can never change panel/tab membership or the active
// tab (sizes, bounds, focus, data, and in-place panel transitions that keep the
// panel id). The explicit Record makes adding a new reducer action a compile
// error here until it is classified, replacing the previous unchecked cast.
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
