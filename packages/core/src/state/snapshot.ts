import type {
  TileryLayoutBehavior,
  TileryLayoutSnapshot,
  TileryLayoutState,
  TileryLayoutTree,
} from '../types';
import {
  tileryBehaviorFromNode,
  tileryMergeLayoutBehavior,
} from './layout-behavior';

type NonEmptyLayout<TData> = Exclude<
  TileryLayoutSnapshot<TData>,
  { type: 'empty' }
>;

export function tileryCreateLayoutSnapshot<TData = unknown>(
  state: TileryLayoutState,
): TileryLayoutSnapshot<TData> {
  const snapshot = state.layout
    ? layoutToSnapshot<TData>(state.layout, state)
    : null;
  return snapshot ?? { type: 'empty' };
}

function layoutToSnapshot<TData>(
  layout: TileryLayoutTree,
  state: TileryLayoutState,
): NonEmptyLayout<TData> | null {
  if (layout.kind === 'split') {
    const children = layout.children
      .map((child) => layoutToSnapshot<TData>(child, state))
      .filter((child): child is NonEmptyLayout<TData> => Boolean(child));
    /* v8 ignore next 2 -- normalized layouts do not keep empty splits. */
    if (children.length === 0) return null;
    if (children.length === 1) {
      return {
        ...children[0]!,
        size: layout.size,
        ...tileryMergeLayoutBehavior(
          tileryBehaviorFromNode(layout),
          childBehavior(children[0]!),
        ),
      };
    }
    return {
      type: 'group',
      id: layout.id,
      direction: layout.direction,
      size: layout.size,
      ...tileryBehaviorFromNode(layout),
      children,
    };
  }

  const panel = state.panels[layout.panelId];
  /* v8 ignore next -- normalized layouts only reference existing panels. */
  if (!panel) return null;
  return {
    type: 'panel',
    id: panel.id,
    size: layout.size,
    ...tileryBehaviorFromNode(layout),
    activeTabId: panel.activeTabId ?? undefined,
    fullScreen: panel.fullScreen,
    minSize: panel.minSize,
    maxSize: panel.maxSize,
    tabs: panel.tabs.map((tabId) => {
      const tab = state.tabs[tabId]!;
      return {
        id: tab.id,
        data: tab.data as TData,
        closeable: tab.closeable,
        draggable: tab.draggable,
      };
    }),
  };
}

function childBehavior(layout: NonEmptyLayout<unknown>): TileryLayoutBehavior {
  return {
    resizable: layout.resizable,
    draggable: layout.draggable,
    droppable: layout.droppable,
  };
}
