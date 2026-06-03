/**
 * Classify and commit drag interactions.
 * Determines whether a drag resolves to a tab-bar reorder, a root-edge split,
 * a panel-zone split, or a panel swap, then dispatches the appropriate
 * controller commands.
 */
import type {
  TileryDirection,
  TileryController,
  TileryLayoutState,
  TileryPanelId,
  TileryTabId,
} from '../types';
import {
  tileryCanMoveTabBetweenPanels,
  tileryPanelBehaviorFromState,
} from '../state/layout-behavior';
import {
  tileryDefaultRootSplitSize,
  tileryRemovePanelFromLayout,
} from '../state/layout-tree';
import { tileryTabBarDropAt, type TileryPanelZone } from './drop-zones';

/**
 * Live state for an in-progress drag gesture, tracking the originating tab,
 * current pointer position, and the resolved drop zone.
 */
export type TileryDragState = {
  tabId: TileryTabId;
  pointerId: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  hoverPanelId: TileryPanelId | null;
  hoverZone: TileryPanelZone | null;
  hoverRootZone?: TileryDirection | null;
  hoverRootSize?: number | null;
  hoverTabBar: {
    panelId: TileryPanelId;
    hit: ReturnType<typeof tileryTabBarDropAt>;
  } | null;
};

/**
 * Evaluate the completed drag state and dispatch the appropriate controller
 * command: tab-bar reorder, root split, panel-zone split, or panel swap.
 * Silently no-ops when behavior flags prevent the move.
 */
export function tileryCommitDrag(
  tilery: TileryController | null,
  drag: TileryDragState,
  tabId: TileryTabId,
  panelDrag: boolean = false,
) {
  if (!tilery) return;

  const draggedTab = tilery.getTab(tabId);
  if (!draggedTab) return;
  if (draggedTab.draggable === false) return;
  const sourcePanel = draggedTab.panel;
  const state = tilery.getState();
  if (!tileryPanelBehaviorFromState(state, sourcePanel.id).draggable) return;
  const allTabIds = panelDrag ? sourcePanel.tabs.map((t) => t.id) : [];
  if (panelDrag && sourcePanel.tabs.some((tab) => tab.draggable === false)) {
    return;
  }
  const leadIndex = allTabIds.indexOf(tabId);
  const tabsBefore = allTabIds.slice(0, leadIndex);
  const tabsAfter = allTabIds.slice(leadIndex + 1);

  if (drag.hoverTabBar) {
    const { hit, panelId } = drag.hoverTabBar;
    if (hit.kind === 'append') {
      const target = tilery.getPanel(panelId);
      if (
        target &&
        tileryCanMoveTabBetweenPanels(state, sourcePanel.id, panelId)
      ) {
        tilery.moveTab(tabId, { panel: panelId, index: target.tabs.length });
        moveSiblingsPreservingOrder(tilery, tabsBefore, tabsAfter, tabId);
        if (panelDrag) tilery.setActiveTab(tabId);
      }
      return;
    }
    if (hit.tabId === tabId) return;
    const refTab = tilery.getTab(hit.tabId);
    if (
      !refTab ||
      !tileryCanMoveTabBetweenPanels(state, sourcePanel.id, refTab.panel.id)
    ) {
      return;
    }
    if (hit.kind === 'before') {
      tilery.moveTab(tabId, { beforeTab: hit.tabId });
      moveSiblingsPreservingOrder(tilery, tabsBefore, tabsAfter, tabId);
      if (panelDrag) tilery.setActiveTab(tabId);
    } else {
      tilery.moveTab(tabId, { afterTab: hit.tabId });
      moveSiblingsPreservingOrder(tilery, tabsBefore, tabsAfter, tabId);
      if (panelDrag) tilery.setActiveTab(tabId);
    }
    return;
  }
  if (drag.hoverRootZone) {
    const size =
      drag.hoverRootSize ??
      tileryRootSplitSizeForDrag(state, tabId, drag.hoverRootZone, panelDrag);
    tilery.moveTab(tabId, {
      splitRoot: true,
      direction: drag.hoverRootZone,
      size,
    });
    moveSiblingsPreservingOrder(tilery, tabsBefore, tabsAfter, tabId);
    if (panelDrag) tilery.setActiveTab(tabId);
    return;
  }
  if (drag.hoverPanelId && drag.hoverZone) {
    if (drag.hoverZone === 'center') {
      const target = tilery.getPanel(drag.hoverPanelId);
      if (
        target &&
        tileryCanMoveTabBetweenPanels(state, sourcePanel.id, drag.hoverPanelId)
      ) {
        tilery.moveTab(tabId, {
          panel: drag.hoverPanelId,
          index: target.tabs.length,
        });
        moveSiblingsPreservingOrder(tilery, tabsBefore, tabsAfter, tabId);
        if (panelDrag) tilery.setActiveTab(tabId);
      }
      return;
    }
    const dir: TileryDirection = drag.hoverZone;
    const target = tilery.getPanel(drag.hoverPanelId);
    if (
      !tileryCanMoveTabBetweenPanels(state, sourcePanel.id, drag.hoverPanelId)
    ) {
      return;
    }
    if (
      target &&
      !panelDrag &&
      !sourcePanel.floating &&
      !target.floating &&
      shouldSwapForSplit(sourcePanel, target, dir)
    ) {
      tilery.swapPanels(sourcePanel.id, target.id);
      return;
    }
    tilery.moveTab(tabId, {
      splitPanel: drag.hoverPanelId,
      direction: dir,
      size: 50,
    });
    moveSiblingsPreservingOrder(tilery, tabsBefore, tabsAfter, tabId);
    if (panelDrag) tilery.setActiveTab(tabId);
  }
}

/**
 * Compute the default size percentage for a new root-edge panel that would
 * result from dragging `tabId` to a root edge. Temporarily removes the source
 * panel from the layout when it would be relocated entirely.
 */
export function tileryRootSplitSizeForDrag(
  state: TileryLayoutState,
  tabId: TileryTabId,
  direction: TileryDirection,
  panelDrag: boolean = false,
): number {
  const tab = state.tabs[tabId];
  if (!tab) return 50;
  const sourcePanel = state.panels[tab.panelId];
  if (!sourcePanel) return 50;
  const splitDirection =
    direction === 'left' || direction === 'right' ? 'horizontal' : 'vertical';
  const layout =
    sourcePanel.kind === 'tiled' && (panelDrag || sourcePanel.tabs.length === 1)
      ? tileryRemovePanelFromLayout(state.layout, sourcePanel.id)
      : state.layout;
  return tileryDefaultRootSplitSize(layout, splitDirection);
}

function moveSiblingsPreservingOrder(
  tilery: TileryController,
  tabsBefore: TileryTabId[],
  tabsAfter: TileryTabId[],
  leadTabId: TileryTabId,
) {
  // Reconstruct the original order: [...tabsBefore, leadTabId, ...tabsAfter]
  // Move each sibling in sequence using afterTab on the previous one.
  // Start by moving tabsBefore in order, each after the previous (first one after lead initially,
  // then we fix by moving lead after them all at the end).
  // Simpler: move tabsAfter after lead, then move tabsBefore before lead.
  // Even simpler: move all in original order using panel+index targeting.

  // Move tabs that were after the lead: chain after lead in order
  let prev = leadTabId;
  for (const id of tabsAfter) {
    tilery.moveTab(id, { afterTab: prev });
    prev = id;
  }
  // Move tabs that were before the lead: insert before lead in original order
  // Each one goes before the lead, pushing previous ones further left
  for (const id of tabsBefore) {
    tilery.moveTab(id, { beforeTab: leadTabId });
  }
}

/** Relative spatial relationship between two adjacent panels. */
type AdjacencySide = 'left' | 'right' | 'above' | 'below' | null;

/**
 * Classify a drag-zone / adjacency-side combination as `'swap'` (panels
 * should exchange positions), `'suppress'` (the source is already on that
 * side, so no move is needed), or `'split'` (insert a new split).
 */
export function tileryClassifyByZoneAndSide(
  zone: TileryDirection,
  side: NonNullable<AdjacencySide>,
): 'suppress' | 'swap' | 'split' {
  if (zone === 'left') {
    if (side === 'left') return 'suppress';
    if (side === 'right') return 'swap';
    return 'split';
  }
  if (zone === 'right') {
    if (side === 'right') return 'suppress';
    if (side === 'left') return 'swap';
    return 'split';
  }
  if (zone === 'top') {
    if (side === 'above') return 'suppress';
    if (side === 'below') return 'swap';
    return 'split';
  }
  if (side === 'below') return 'suppress';
  if (side === 'above') return 'swap';
  return 'split';
}

/**
 * Determine which side of `target` the `source` panel is directly adjacent to,
 * or `null` when the two panels do not share a touching edge with overlap.
 */
export function tileryAdjacencySide(
  source: {
    inset: { top: number; right: number; bottom: number; left: number };
  },
  target: {
    inset: { top: number; right: number; bottom: number; left: number };
  },
): AdjacencySide {
  const EPS = 0.0001;
  const sL = source.inset.left;
  const sR = 100 - source.inset.right;
  const sT = source.inset.top;
  const sB = 100 - source.inset.bottom;
  const tL = target.inset.left;
  const tR = 100 - target.inset.right;
  const tT = target.inset.top;
  const tB = 100 - target.inset.bottom;
  const yOverlap = Math.min(sB, tB) > Math.max(sT, tT) + EPS;
  const xOverlap = Math.min(sR, tR) > Math.max(sL, tL) + EPS;
  if (yOverlap) {
    if (Math.abs(sR - tL) < EPS) return 'left';
    if (Math.abs(sL - tR) < EPS) return 'right';
  }
  if (xOverlap) {
    if (Math.abs(sB - tT) < EPS) return 'above';
    if (Math.abs(sT - tB) < EPS) return 'below';
  }
  return null;
}

function shouldSwapForSplit(
  source: {
    id: string;
    tabs: readonly { id: string }[];
    inset: { top: number; right: number; bottom: number; left: number };
  },
  target: {
    id: string;
    tabs: readonly { id: string }[];
    inset: { top: number; right: number; bottom: number; left: number };
  },
  zone: TileryDirection,
): boolean {
  if (source.id === target.id) return false;
  if (source.tabs.length !== 1) return false;
  if (target.tabs.length !== 1) return false;
  const side = tileryAdjacencySide(source, target);
  if (!side) return false;
  if (!shareFullEdge(source.inset, target.inset, side)) return false;
  return tileryClassifyByZoneAndSide(zone, side) === 'swap';
}

function shareFullEdge(
  a: { top: number; right: number; bottom: number; left: number },
  b: { top: number; right: number; bottom: number; left: number },
  side: NonNullable<AdjacencySide>,
): boolean {
  const EPS = 0.0001;
  if (side === 'left' || side === 'right') {
    return Math.abs(a.top - b.top) < EPS && Math.abs(a.bottom - b.bottom) < EPS;
  }
  return Math.abs(a.left - b.left) < EPS && Math.abs(a.right - b.right) < EPS;
}
