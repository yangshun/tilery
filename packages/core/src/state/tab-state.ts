import type { TileryPanelId, TileryTabId, TileryTabState } from '../types';
import type { TileryReducerTabAction } from './actions';

export function tileryReducerTabActionToState(
  tab: TileryReducerTabAction,
  panelId: TileryPanelId,
): TileryTabState {
  return {
    id: tab.id,
    panelId,
    data: tab.data,
    closeable: tab.closeable ?? true,
    draggable: tab.draggable ?? true,
  };
}

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
