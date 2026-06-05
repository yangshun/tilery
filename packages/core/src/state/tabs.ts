/**
 * Tab-level state operations: append, insert, remove, move, id-rename, active
 * selection, data update, and behavior update.
 */
import type {
  TileryLayoutState,
  TileryPanelId,
  TileryPanelState,
  TileryTabId,
  TileryTabState,
} from '../types';
import type { TileryReducerAction } from './actions';
import {
  tileryBehaviorFromNode,
  tileryCanMoveTabBetweenPanels,
  tileryPanelBehaviorFromState,
} from './layout-behavior';
import {
  tilerySplitFitsPanelConstraints,
  tilerySplitInset,
} from './layout-math';
import {
  tileryPanelOrderFromState,
  tilerySplitPanelInLayout,
  tilerySplitRootInLayout,
  tilerySyncLayoutPanels,
} from './layout-tree';
import { tileryRemovePanelAndFill } from './panels';
import { tileryApplyTabBehaviorUpdate } from './tab-behavior';
import {
  tileryNextActiveTabAfterRemoval,
  tileryReducerTabActionToState,
} from './tab-state';

type AppendTabAction = Extract<TileryReducerAction, { type: 'TAB_APPEND' }>;
type InsertTabAction = Extract<TileryReducerAction, { type: 'TAB_INSERT' }>;
type ChangeTabIdAction = Extract<
  TileryReducerAction,
  { type: 'TAB_ID_CHANGE' }
>;
type MoveTabAction = Extract<TileryReducerAction, { type: 'TAB_MOVE' }>;
type MoveTabToSplitAction = MoveTabAction & {
  to: Extract<MoveTabAction['to'], { splitPanelId: TileryPanelId }>;
};
type MoveTabToRootSplitAction = MoveTabAction & {
  to: Extract<MoveTabAction['to'], { splitRoot: true }>;
};

/**
 * Appends a new tab to the end of the panel's tab list and optionally makes
 * it the active tab.
 * @returns The input state unchanged when the target panel does not exist or a
 *   tab with `action.tab.id` already exists.
 */
export function tileryAppendTab(
  current: TileryLayoutState,
  action: AppendTabAction,
): TileryLayoutState {
  const panel = current.panels[action.panelId];
  if (!panel) return current;
  if (current.tabs[action.tab.id]) return current;
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
      [action.tab.id]: tileryReducerTabActionToState(
        action.tab,
        action.panelId,
      ),
    },
  };
}

/**
 * Inserts a new tab at the given index within the panel's tab list and
 * optionally makes it the active tab. The index is clamped to the valid
 * range `[0, panel.tabs.length]`.
 * @returns The input state unchanged when the target panel does not exist or a
 *   tab with `action.tab.id` already exists.
 */
export function tileryInsertTab(
  current: TileryLayoutState,
  action: InsertTabAction,
): TileryLayoutState {
  const panel = current.panels[action.panelId];
  if (!panel) return current;
  if (current.tabs[action.tab.id]) return current;
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
      [action.tab.id]: tileryReducerTabActionToState(
        action.tab,
        action.panelId,
      ),
    },
  };
}

/**
 * Removes a tab from its panel and selects the nearest remaining sibling as
 * the active tab. If removing the tab would empty the panel, the panel itself
 * is removed via `tileryRemovePanelAndFill`.
 * @returns The input state unchanged when the tab is missing, not closable,
 *   or its parent panel is missing.
 */
export function tileryRemoveTab(
  current: TileryLayoutState,
  tabId: TileryTabId,
): TileryLayoutState {
  const tab = current.tabs[tabId];
  if (!tab) return current;
  if (!tab.closable) return current;
  const panel = current.panels[tab.panelId];
  if (!panel) return current;
  const nextTabs = panel.tabs.filter((id) => id !== tabId);
  const { [tabId]: _drop, ...restTabs } = current.tabs;
  if (nextTabs.length === 0) {
    return tileryRemovePanelAndFill(
      { ...current, tabs: restTabs },
      { ...panel, tabs: nextTabs, activeTabId: null },
    );
  }
  const nextActive = tileryNextActiveTabAfterRemoval(
    panel.tabs,
    tabId,
    nextTabs,
    panel.activeTabId,
  );
  return {
    ...current,
    panels: {
      ...current.panels,
      [tab.panelId]: { ...panel, tabs: nextTabs, activeTabId: nextActive },
    },
    tabs: restTabs,
  };
}

/**
 * Renames a tab's id from `action.oldTabId` to `action.newTabId`, updating
 * the owning panel's tab list and activeTabId reference in one step.
 * @returns The input state unchanged when the old id is missing, the new id
 *   is already taken, or the parent panel is missing.
 */
export function tileryChangeTabId(
  current: TileryLayoutState,
  action: ChangeTabIdAction,
): TileryLayoutState {
  if (action.oldTabId === action.newTabId) return current;
  const tab = current.tabs[action.oldTabId];
  if (!tab) return current;
  if (current.tabs[action.newTabId]) return current;
  const panel = current.panels[tab.panelId];
  if (!panel) return current;
  const { [action.oldTabId]: _drop, ...restTabs } = current.tabs;
  return {
    ...current,
    panels: {
      ...current.panels,
      [panel.id]: {
        ...panel,
        tabs: panel.tabs.map((id) =>
          id === action.oldTabId ? action.newTabId : id,
        ),
        activeTabId:
          panel.activeTabId === action.oldTabId
            ? action.newTabId
            : panel.activeTabId,
      },
    },
    tabs: {
      ...restTabs,
      [action.newTabId]: { ...tab, id: action.newTabId },
    },
  };
}

/**
 * Moves a tab to a new position, which may be a different index within the
 * same panel, before/after another tab, or into a freshly-split panel
 * (either by splitting an existing panel or by splitting the layout root).
 * @returns The input state unchanged when the tab is missing, non-draggable,
 *   its source panel is missing, or behavior rules prevent the move.
 */
export function tileryMoveTab(
  current: TileryLayoutState,
  action: MoveTabAction,
): TileryLayoutState {
  const tab = current.tabs[action.tabId];
  if (!tab) return current;
  if (!tab.draggable) return current;
  const sourcePanel = current.panels[tab.panelId];
  if (!sourcePanel) return current;

  if ('beforeTabId' in action.to || 'afterTabId' in action.to) {
    const refTabId =
      'beforeTabId' in action.to ? action.to.beforeTabId : action.to.afterTabId;
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
      nextTabsInTarget = nextTabsInTarget.filter((id) => id !== action.tabId);
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
    return moveTabToSplit(
      current,
      action as MoveTabToSplitAction,
      tab,
      sourcePanel,
    );
  }

  if ('splitRoot' in action.to) {
    return moveTabToRootSplit(
      current,
      action as MoveTabToRootSplitAction,
      tab,
      sourcePanel,
    );
  }

  const targetPanelId = action.to.panelId;
  const targetPanel = current.panels[targetPanelId];
  if (!targetPanel) return current;
  if (!tileryCanMoveTabBetweenPanels(current, sourcePanel.id, targetPanelId)) {
    return current;
  }
  let nextTabsInTarget = targetPanel.tabs;
  if (sourcePanel.id === targetPanelId) {
    nextTabsInTarget = nextTabsInTarget.filter((id) => id !== action.tabId);
  }
  const idx = Math.max(0, Math.min(nextTabsInTarget.length, action.to.index));
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

/**
 * Makes the given tab the active tab in its panel.
 * @returns The input state unchanged when the tab is missing, its panel is
 *   missing, or it is already the active tab.
 */
export function tilerySetActiveTab(
  current: TileryLayoutState,
  tabId: TileryTabId,
): TileryLayoutState {
  const tab = current.tabs[tabId];
  if (!tab) return current;
  const panel = current.panels[tab.panelId];
  if (!panel) return current;
  if (panel.activeTabId === tabId) return current;
  return {
    ...current,
    panels: {
      ...current.panels,
      [tab.panelId]: {
        ...panel,
        activeTabId: tabId,
      },
    },
  };
}

/**
 * Replaces the `data` payload stored on a tab without touching any other
 * state.
 * @returns The input state unchanged when the tab does not exist.
 */
export function tilerySetPanelData(
  current: TileryLayoutState,
  tabId: TileryTabId,
  data: unknown,
): TileryLayoutState {
  const tab = current.tabs[tabId];
  if (!tab) return current;
  return {
    ...current,
    tabs: {
      ...current.tabs,
      [tabId]: { ...tab, data },
    },
  };
}

/**
 * Applies a partial behavior update (`closable`, `draggable`) to a tab.
 * @returns The input state unchanged when the tab is missing or the resolved
 *   behavior flags are identical to the current values.
 */
export function tilerySetTabBehavior(
  current: TileryLayoutState,
  tabId: TileryTabId,
  behaviorUpdate: Extract<
    TileryReducerAction,
    { type: 'TAB_BEHAVIOR_SET' }
  >['behavior'],
): TileryLayoutState {
  const tab = current.tabs[tabId];
  if (!tab) return current;
  const behavior = tileryApplyTabBehaviorUpdate(tab, behaviorUpdate);
  if (
    behavior.closable === tab.closable &&
    behavior.draggable === tab.draggable
  ) {
    return current;
  }
  return {
    ...current,
    tabs: {
      ...current.tabs,
      [tabId]: { ...tab, ...behavior },
    },
  };
}

function moveTabToSplit(
  current: TileryLayoutState,
  action: MoveTabToSplitAction,
  tab: TileryTabState,
  sourcePanel: TileryPanelState,
): TileryLayoutState {
  const targetSource = current.panels[action.to.splitPanelId];
  if (!targetSource) return current;
  if (targetSource.kind !== 'tiled') return current;
  if (targetSource.fullScreen) return current;
  if (
    !tileryCanMoveTabBetweenPanels(current, sourcePanel.id, targetSource.id)
  ) {
    return current;
  }
  if (targetSource.id === sourcePanel.id && sourcePanel.tabs.length === 1) {
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
    if (layout) next = tilerySyncLayoutPanels({ ...next, layout }, layout);
    else next = { ...next, layout: null };
  }
  const sourceTabs = sourcePanel.tabs.filter((id) => id !== action.tabId);
  next.tabs = {
    ...next.tabs,
    [action.tabId]: { ...tab, panelId: action.to.newPanelId },
  };
  const wasActive = sourcePanel.activeTabId === action.tabId;
  if (sourceTabs.length === 0) {
    next = tileryRemovePanelAndFill(next, {
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
            ? tileryNextActiveTabAfterRemoval(
                sourcePanel.tabs,
                action.tabId,
                sourceTabs,
                sourcePanel.activeTabId,
              )
            : sourcePanel.activeTabId,
        },
      },
    };
  }
  return next;
}

function moveTabToRootSplit(
  current: TileryLayoutState,
  action: MoveTabToRootSplitAction,
  tab: TileryTabState,
  sourcePanel: TileryPanelState,
): TileryLayoutState {
  if (!tileryPanelBehaviorFromState(current, sourcePanel.id).draggable) {
    return current;
  }
  if (current.layout && !tileryBehaviorFromNode(current.layout).droppable) {
    return current;
  }
  if (
    sourcePanel.kind === 'tiled' &&
    sourcePanel.tabs.length === 1 &&
    tileryPanelOrderFromState(current).length === 1
  ) {
    return current;
  }

  let next: TileryLayoutState = {
    ...current,
    tabs: {
      ...current.tabs,
      [action.tabId]: { ...tab, panelId: action.to.newPanelId },
    },
  };
  const sourceTabs = sourcePanel.tabs.filter((id) => id !== action.tabId);
  const wasActive = sourcePanel.activeTabId === action.tabId;
  if (sourceTabs.length === 0) {
    next = tileryRemovePanelAndFill(next, {
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
          activeTabId: wasActive
            ? tileryNextActiveTabAfterRemoval(
                sourcePanel.tabs,
                action.tabId,
                sourceTabs,
                sourcePanel.activeTabId,
              )
            : sourcePanel.activeTabId,
        },
      },
    };
  }

  const behavior = tileryBehaviorFromNode(action.to);
  const newPanel: TileryPanelState = {
    id: action.to.newPanelId,
    kind: 'tiled',
    inset: { top: 0, right: 0, bottom: 0, left: 0 },
    tabs: [action.tabId],
    activeTabId: action.tabId,
    fullScreen: false,
    minSize: action.to.minSize,
    maxSize: action.to.maxSize,
  };
  const layout = tilerySplitRootInLayout(
    next.layout,
    action.to.newPanelId,
    action.to.direction,
    action.to.sizePercent,
    behavior,
  );
  return tilerySyncLayoutPanels(
    {
      ...next,
      panels: { ...next.panels, [action.to.newPanelId]: newPanel },
      layout,
    },
    layout,
  );
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
    return tileryRemovePanelAndFill(next, {
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
        ? tileryNextActiveTabAfterRemoval(
            sourcePanel.tabs,
            tab.id,
            sourceTabs,
            sourcePanel.activeTabId,
          )
        : sourcePanel.activeTabId,
    },
  };
  return next;
}
