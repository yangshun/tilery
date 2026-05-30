import type {
  TileryDirection,
  TileryHandle,
  TileryPanelId,
  TileryTabId,
} from '../types';
import { tileryTabBarDropAt, type TileryPanelZone } from './drop-zones';

export type TileryDragState = {
  tabId: TileryTabId;
  pointerId: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  hoverPanelId: TileryPanelId | null;
  hoverZone: TileryPanelZone | null;
  hoverTabBar: {
    panelId: TileryPanelId;
    hit: ReturnType<typeof tileryTabBarDropAt>;
  } | null;
};

export function tileryCommitDrag(
  tilery: TileryHandle | null,
  drag: TileryDragState,
  tabId: TileryTabId,
  panelDrag: boolean = false,
) {
  if (!tilery) return;

  const draggedTab = tilery.getTab(tabId);
  if (!draggedTab) return;
  const sourcePanel = draggedTab.panel;
  const siblingTabIds = panelDrag
    ? sourcePanel.tabs.map((t) => t.id).filter((id) => id !== tabId)
    : [];

  if (drag.hoverTabBar) {
    const { hit, panelId } = drag.hoverTabBar;
    if (hit.kind === 'append') {
      const target = tilery.getPanel(panelId);
      if (target) {
        tilery.moveTab(tabId, { panel: panelId, index: target.tabs.length });
        for (const id of siblingTabIds) {
          tilery.moveTab(id, { afterTab: tabId });
        }
      }
      return;
    }
    if (hit.tabId === tabId) return;
    if (hit.kind === 'before') {
      tilery.moveTab(tabId, { beforeTab: hit.tabId });
      for (const id of siblingTabIds) {
        tilery.moveTab(id, { afterTab: tabId });
      }
    } else {
      tilery.moveTab(tabId, { afterTab: hit.tabId });
      for (const id of siblingTabIds) {
        tilery.moveTab(id, { afterTab: tabId });
      }
    }
    return;
  }
  if (drag.hoverPanelId && drag.hoverZone) {
    if (drag.hoverZone === 'center') {
      const target = tilery.getPanel(drag.hoverPanelId);
      if (target) {
        tilery.moveTab(tabId, {
          panel: drag.hoverPanelId,
          index: target.tabs.length,
        });
        for (const id of siblingTabIds) {
          tilery.moveTab(id, { afterTab: tabId });
        }
      }
      return;
    }
    const dir: TileryDirection = drag.hoverZone;
    const target = tilery.getPanel(drag.hoverPanelId);
    if (target && !panelDrag && shouldSwapForSplit(sourcePanel, target, dir)) {
      tilery.swapPanels(sourcePanel.id, target.id);
      return;
    }
    tilery.moveTab(tabId, {
      splitPanel: drag.hoverPanelId,
      direction: dir,
      sizePercent: 50,
    });
    for (const id of siblingTabIds) {
      tilery.moveTab(id, { afterTab: tabId });
    }
  }
}

type AdjacencySide = 'left' | 'right' | 'above' | 'below' | null;

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
