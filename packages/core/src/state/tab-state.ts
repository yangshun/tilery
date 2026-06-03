/**
 * Tab state helpers — constructing tab state objects and resolving active-tab
 * selection after a removal.
 */
import type { TileryPanelId, TileryTabId, TileryTabState } from '../types';
import type { TileryReducerTabAction } from './actions';

/**
 * Constructs a `TileryTabState` from a reducer tab action descriptor,
 * defaulting `closable` and `draggable` to `true` when not specified.
 */
export function tileryReducerTabActionToState(
  tab: TileryReducerTabAction,
  panelId: TileryPanelId,
): TileryTabState {
  return {
    id: tab.id,
    panelId,
    data: tab.data,
    closable: tab.closable ?? true,
    draggable: tab.draggable ?? true,
  };
}

/**
 * Determines the active tab ID after `removedTabId` is deleted from a panel.
 * Returns `activeTabId` unchanged when the removed tab was not active;
 * otherwise selects the tab at the same visual position in `nextTabs`
 * (clamped to the last tab), or `null` when the panel becomes empty.
 */
export function tileryNextActiveTabAfterRemoval(
  currentTabs: TileryTabId[],
  removedTabId: TileryTabId,
  nextTabs: TileryTabId[],
  activeTabId: TileryTabId | null,
): TileryTabId | null {
  if (activeTabId !== removedTabId) return activeTabId;
  return (
    nextTabs[
      Math.min(nextTabs.length - 1, currentTabs.indexOf(removedTabId))
    ] ?? null
  );
}
