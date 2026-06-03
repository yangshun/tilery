/**
 * Serialize/deserialize layout state to/from persistable snapshots.
 */
import type {
  TileryDockedLayoutSnapshot,
  TileryEdge,
  TileryEdgePanelSnapshot,
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
import { tileryEdgePanelIdBySide } from './edges';
import { tileryFloatingPanelOrderFromState } from './layout-tree';

type NonEmptyLayout<TData> = Exclude<
  TileryDockedLayoutSnapshot<TData>,
  { type: 'empty' }
>;

/**
 * Serializes the full layout state — tiled layout tree, edge panels, and
 * floating panels — into a `TileryLayoutSnapshot` that can be persisted and
 * later restored. Returns a plain `{ type: 'empty' }` snapshot when there are
 * no tiled panels, edge panels, or floating panels.
 */
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
  const edges = edgePanelsToSnapshot<TData>(state);
  const mainSnapshot: TileryDockedLayoutSnapshot<TData> = main ?? {
    type: 'empty',
  };
  if (floating.length === 0 && Object.keys(edges).length === 0) {
    return mainSnapshot;
  }
  return {
    type: 'root',
    main: mainSnapshot,
    ...(Object.keys(edges).length > 0 ? { edges } : {}),
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
        closable: tab.closable,
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
        closable: tab.closable,
        draggable: tab.draggable,
      };
    }),
  };
}

function edgePanelsToSnapshot<TData>(
  state: TileryLayoutState,
): Partial<Record<TileryEdge, TileryEdgePanelSnapshot<TData>>> {
  const bySide = tileryEdgePanelIdBySide(state);
  const out: Partial<Record<TileryEdge, TileryEdgePanelSnapshot<TData>>> = {};
  for (const side of edgeSides) {
    const panelId = bySide[side];
    if (!panelId) continue;
    const panel = state.panels[panelId];
    /* v8 ignore next -- bySide only yields existing edge panel ids. */
    if (!panel || panel.kind !== 'edge') continue;
    out[side] = {
      type: 'edgePanel',
      id: panel.id,
      size: panel.edge.size,
      defaultSize: panel.edge.defaultSize,
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
          closable: tab.closable,
          draggable: tab.draggable,
        };
      }),
    };
  }
  return out;
}

const edgeSides: TileryEdge[] = ['left', 'right', 'top', 'bottom'];

function childBehavior(layout: NonEmptyLayout<unknown>): TileryLayoutBehavior {
  return {
    resizable: layout.resizable,
    draggable: layout.draggable,
    droppable: layout.droppable,
  };
}
