import type {
  TileryDockedLayoutSnapshot,
  TileryFloatingPanelSnapshot,
  TileryLayoutBehavior,
  TileryLayoutSnapshot,
  TileryLayoutState,
  TileryLayoutTree,
} from '../types';
import {
  tileryBehaviorFromNode,
  tileryMergeLayoutBehavior,
} from './layout-behavior';
import { tileryFloatingPanelOrderFromState } from './layout-tree';

type NonEmptyLayout<TData> = Exclude<
  TileryDockedLayoutSnapshot<TData>,
  { type: 'empty' }
>;

export function tileryCreateLayoutSnapshot<TData = unknown>(
  state: TileryLayoutState,
): TileryLayoutSnapshot<TData> {
  const main = state.layout
    ? layoutToSnapshot<TData>(state.layout, state)
    : null;
  const floating = tileryFloatingPanelOrderFromState(state)
    .map((panelId) => floatingPanelToSnapshot<TData>(state, panelId))
    .filter((panel): panel is TileryFloatingPanelSnapshot<TData> =>
      Boolean(panel),
    );
  const mainSnapshot: TileryDockedLayoutSnapshot<TData> = main ?? {
    type: 'empty',
  };
  if (floating.length === 0) return mainSnapshot;
  return {
    type: 'root',
    main: mainSnapshot,
    floating,
  };
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
        defaultSize: layout.defaultSize,
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
      defaultSize: layout.defaultSize,
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
    defaultSize: layout.defaultSize,
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

function floatingPanelToSnapshot<TData>(
  state: TileryLayoutState,
  panelId: string,
): TileryFloatingPanelSnapshot<TData> | null {
  const panel = state.panels[panelId];
  /* v8 ignore next -- floating panel ids are filtered before snapshotting. */
  if (!panel || panel.kind !== 'floating') return null;
  return {
    type: 'floatingPanel',
    id: panel.id,
    bounds: { ...panel.floating.bounds },
    zIndex: panel.floating.zIndex,
    ...(panel.floating.popout
      ? {
          popout: {
            windowBounds: { ...panel.floating.popout.windowBounds },
          },
        }
      : {}),
    ...panel.behavior,
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
