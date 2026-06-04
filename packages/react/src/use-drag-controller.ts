'use client';

/**
 * High-level tab and panel drag controller.
 *
 * Orchestrates pointer-event handlers, DOM element registration, drop-zone
 * hit-testing, and drag-state tracking for the full tab/panel drag lifecycle.
 */

import { useCallback, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type {
  TileryController,
  TileryDirection,
  TileryPanelId,
  TileryTabId,
} from 'tilery/internal';
import {
  tileryAdjacencySide,
  tileryCanMoveTabBetweenPanels,
  tileryEdgeZoneAt,
  tileryTabBarDropAt,
  tileryZoneAt,
  tileryClassifyByZoneAndSide,
  tileryCommitDrag,
  tileryGetFullScreenPanelId,
  tileryPanelBehaviorFromState,
  tileryPanelOrderFromState,
  tileryRootSplitSizeForDrag,
  type TileryPanelZone,
  type TileryDragState,
} from 'tilery/internal';

export {
  tileryAdjacencySide,
  tileryClassifyByZoneAndSide,
  tileryCommitDrag,
} from 'tilery/internal';
export type { TileryDragState } from 'tilery/internal';

type Refs = {
  panelEls: Map<TileryPanelId, HTMLElement>;
  tabBarEls: Map<TileryPanelId, HTMLElement>;
  tabEls: Map<TileryTabId, HTMLElement>;
};

const DRAG_THRESHOLD_PX = 4;
const ROOT_DROP_EDGE_PX = 24;

/**
 * Creates all pointer event handlers and DOM-element registration callbacks
 * needed to drive tab and panel dragging within the Tilery layout.
 *
 * @returns Handlers to attach to tab, tab-bar, and container elements, the
 * current {@link TileryDragState}, and ref-registration helpers.
 */
export function useTileryDragController(
  tilery: () => TileryController | null,
  mainContainerRef?: RefObject<HTMLDivElement | null>,
) {
  const refs = useRef<Refs>({
    panelEls: new Map(),
    tabBarEls: new Map(),
    tabEls: new Map(),
  });
  const [dragState, setDragStateInternal] = useState<TileryDragState | null>(
    null,
  );
  const dragStateRef = useRef<TileryDragState | null>(null);
  const setDragState = useCallback((next: TileryDragState | null) => {
    dragStateRef.current = next;
    setDragStateInternal(next);
  }, []);
  const pendingRef = useRef<{
    tabId: TileryTabId;
    pointerId: number;
    startX: number;
    startY: number;
    canDrag: boolean;
  } | null>(null);
  const panelDragRef = useRef(false);

  const registerPanel = useCallback(
    (panelId: TileryPanelId, el: HTMLElement | null) => {
      if (el) refs.current.panelEls.set(panelId, el);
      else refs.current.panelEls.delete(panelId);
    },
    [],
  );
  const registerTabBar = useCallback(
    (panelId: TileryPanelId, el: HTMLElement | null) => {
      if (el) refs.current.tabBarEls.set(panelId, el);
      else refs.current.tabBarEls.delete(panelId);
    },
    [],
  );
  const registerTab = useCallback(
    (tabId: TileryTabId, el: HTMLElement | null) => {
      if (el) refs.current.tabEls.set(tabId, el);
      else refs.current.tabEls.delete(tabId);
    },
    [],
  );

  const isOwnSoloPanel = useCallback(
    (panelId: TileryPanelId, draggedTabId: TileryTabId): boolean => {
      const m = tilery();
      /* v8 ignore next */
      if (!m) return false;
      const panel = m.getPanel(panelId);
      const draggedTab = m.getTab(draggedTabId);
      if (!panel || !draggedTab) return false;
      return draggedTab.panel.id === panelId && panel.tabs.length === 1;
    },
    [tilery],
  );

  const classifySplitInteraction = useCallback(
    (
      panelId: TileryPanelId,
      draggedTabId: TileryTabId,
      zone: TileryPanelZone,
    ): 'suppress' | 'swap' | 'split' => {
      if (zone === 'center') return 'split';
      const m = tilery();
      /* v8 ignore next */
      if (!m) return 'split';
      const target = m.getPanel(panelId);
      const draggedTab = m.getTab(draggedTabId);
      /* v8 ignore next */
      if (!target || !draggedTab) return 'split';
      const source = draggedTab.panel;
      if (source.id === target.id) return 'split';
      if (source.tabs.length !== 1) return 'split';
      if (target.tabs.length !== 1) return 'split';
      const side = tileryAdjacencySide(source, target);
      if (!side) return 'split';
      if (!shareFullEdge(source.inset, target.inset, side)) return 'split';
      return tileryClassifyByZoneAndSide(zone, side);
    },
    [tilery],
  );

  const canDropOnPanel = useCallback(
    (panelId: TileryPanelId, draggedTabId: TileryTabId): boolean => {
      const m = tilery();
      /* v8 ignore next */
      if (!m) return true;
      const target = m.getPanel(panelId);
      const draggedTab = m.getTab(draggedTabId);
      if (!target || !draggedTab) return false;
      // Tab-level draggability is a tab-state flag the core helper doesn't cover;
      // the source/target panel droppable rule lives in core.
      if (!draggedTab.draggable) return false;
      return tileryCanMoveTabBetweenPanels(
        m.getState(),
        draggedTab.panel.id,
        target.id,
      );
    },
    [tilery],
  );

  const canDropOnRoot = useCallback(
    (draggedTabId: TileryTabId, panelDrag: boolean): boolean => {
      const m = tilery();
      /* v8 ignore next */
      if (!m) return true;
      const draggedTab = m.getTab(draggedTabId);
      /* v8 ignore next -- a drag only starts on an existing, draggable tab. */
      if (!draggedTab || !draggedTab.draggable) return false;
      const state = m.getState();
      const sourceBehavior = tileryPanelBehaviorFromState(
        state,
        draggedTab.panel.id,
      );
      /* v8 ignore next -- a drag only starts from a draggable source panel. */
      if (!sourceBehavior.draggable) return false;
      const tiledPanelCount = tileryPanelOrderFromState(state).length;
      if (draggedTab.panel.kind !== 'tiled') return true;
      if (panelDrag) return tiledPanelCount > 1;
      return tiledPanelCount > 1 || draggedTab.panel.tabs.length > 1;
    },
    [tilery],
  );

  const canStartTabDrag = useCallback(
    (tabId: TileryTabId): boolean => {
      const m = tilery();
      if (!m) return true;
      const tab = m.getTab(tabId);
      return Boolean(tab?.draggable);
    },
    [tilery],
  );

  const computeHover = useCallback(
    (
      x: number,
      y: number,
      draggedTabId: TileryTabId,
    ): Pick<
      TileryDragState,
      | 'hoverPanelId'
      | 'hoverZone'
      | 'hoverRootZone'
      | 'hoverTabBar'
      | 'hoverRootSize'
    > => {
      let hoverPanelId: TileryPanelId | null = null;
      let hoverZone: TileryPanelZone | null = null;
      let hoverRootZone: TileryDirection | null = null;
      let hoverRootSize: number | null = null;
      let hoverTabBar: TileryDragState['hoverTabBar'] = null;
      const m = tilery();
      const fullScreenPanelId = m
        ? tileryGetFullScreenPanelId(m.getState())
        : null;

      for (const [panelId, tabBarEl] of refs.current.tabBarEls) {
        if (fullScreenPanelId && panelId !== fullScreenPanelId) continue;
        const panel = m?.getPanel(panelId);
        const r = tabBarEl.getBoundingClientRect();
        if (x < r.left || x > r.right || y < r.top || y > r.bottom) continue;
        if (isOwnSoloPanel(panelId, draggedTabId)) continue;
        if (!canDropOnPanel(panelId, draggedTabId)) continue;
        const tabRects: { tabId: string; left: number; right: number }[] = [];
        if (panel) {
          for (const t of panel.tabs) {
            const el = refs.current.tabEls.get(t.id);
            if (!el) continue;
            const tr = el.getBoundingClientRect();
            tabRects.push({ tabId: t.id, left: tr.left, right: tr.right });
          }
        }
        const hit = tileryTabBarDropAt(tabRects, x);
        hoverTabBar = { panelId, hit };
        hoverPanelId = panelId;
        break;
      }

      if (!hoverTabBar && !fullScreenPanelId) {
        const mainEl = mainContainerRef?.current;
        if (mainEl) {
          const r = mainEl.getBoundingClientRect();
          const rootZone = tileryEdgeZoneAt(
            { left: r.left, top: r.top, width: r.width, height: r.height },
            x,
            y,
            ROOT_DROP_EDGE_PX,
          );
          if (rootZone && canDropOnRoot(draggedTabId, panelDragRef.current)) {
            hoverRootZone = rootZone;
            /* v8 ignore next 7 -- the controller is always resolved during an active drag. */
            hoverRootSize = m
              ? tileryRootSplitSizeForDrag(
                  m.getState(),
                  draggedTabId,
                  rootZone,
                  panelDragRef.current,
                )
              : null;
          }
        }
      }

      if (!hoverTabBar && !hoverRootZone && !fullScreenPanelId) {
        for (const [panelId, panelEl] of refs.current.panelEls) {
          const r = panelEl.getBoundingClientRect();
          const z = tileryZoneAt(
            { left: r.left, top: r.top, width: r.width, height: r.height },
            x,
            y,
          );
          if (!z) continue;
          const panel = m?.getPanel(panelId);
          if (panel?.floating && z !== 'center') continue;
          if (panel?.kind === 'edge' && z !== 'center') continue;
          if (isOwnSoloPanel(panelId, draggedTabId)) continue;
          if (!canDropOnPanel(panelId, draggedTabId)) continue;
          if (classifySplitInteraction(panelId, draggedTabId, z) === 'suppress')
            continue;
          hoverPanelId = panelId;
          hoverZone = z;
          break;
        }
      }
      return {
        hoverPanelId,
        hoverZone,
        hoverRootZone,
        hoverRootSize,
        hoverTabBar,
      };
    },
    [
      tilery,
      mainContainerRef,
      isOwnSoloPanel,
      classifySplitInteraction,
      canDropOnPanel,
      canDropOnRoot,
    ],
  );

  const onTabPointerDown = useCallback(
    (e: React.PointerEvent, tabId: TileryTabId) => {
      if (e.button !== 0) return;
      const target = e.currentTarget as HTMLElement;
      try {
        target.setPointerCapture(e.pointerId);
      } catch {
        // Synthetic events or already-released pointers will throw; ignore.
      }
      panelDragRef.current = false;
      pendingRef.current = {
        tabId,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        canDrag: canStartTabDrag(tabId),
      };
    },
    [canStartTabDrag],
  );

  const onTabBarPointerDown = useCallback(
    (e: React.PointerEvent, panelId: TileryPanelId) => {
      /* v8 ignore next */
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.closest('[data-tab-id]')) return;
      const m = tilery();
      /* v8 ignore next */
      if (!m) return;
      const panel = m.getPanel(panelId);
      /* v8 ignore next */
      if (!panel || !panel.activeTab) return;
      if (!tileryPanelBehaviorFromState(m.getState(), panel.id).draggable) {
        return;
      }
      if (!panel.tabs.every((tab) => tab.draggable)) return;
      const barEl = e.currentTarget as HTMLElement;
      try {
        barEl.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      panelDragRef.current = true;
      pendingRef.current = {
        tabId: panel.activeTab.id,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        canDrag: true,
      };
    },
    [tilery],
  );

  const onTabPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const pending = pendingRef.current;
      const current = dragStateRef.current;
      if (!pending || pending.pointerId !== e.pointerId) {
        if (current && current.pointerId === e.pointerId) {
          const hover = computeHover(e.clientX, e.clientY, current.tabId);
          setDragState({ ...current, x: e.clientX, y: e.clientY, ...hover });
        }
        return;
      }
      const dx = e.clientX - pending.startX;
      const dy = e.clientY - pending.startY;
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
      if (!pending.canDrag) {
        pendingRef.current = null;
        return;
      }
      const hover = computeHover(e.clientX, e.clientY, pending.tabId);
      setDragState({
        tabId: pending.tabId,
        pointerId: pending.pointerId,
        startX: pending.startX,
        startY: pending.startY,
        x: e.clientX,
        y: e.clientY,
        ...hover,
      });
      pendingRef.current = null;
    },
    [computeHover, setDragState],
  );

  const onTabPointerUp = useCallback(
    (_e: React.PointerEvent, tabId: TileryTabId, onClick: () => void) => {
      const target = _e.currentTarget as HTMLElement;
      try {
        target.releasePointerCapture(_e.pointerId);
      } catch {
        // ignore
      }
      const current = dragStateRef.current;
      if (pendingRef.current && pendingRef.current.pointerId === _e.pointerId) {
        pendingRef.current = null;
        onClick();
        return;
      }
      if (current && current.pointerId === _e.pointerId) {
        tileryCommitDrag(tilery(), current, tabId, panelDragRef.current);
        panelDragRef.current = false;
        setDragState(null);
      }
    },
    [tilery, setDragState],
  );

  const onTabBarPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const target = e.currentTarget as HTMLElement;
      try {
        target.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      const current = dragStateRef.current;
      if (pendingRef.current && pendingRef.current.pointerId === e.pointerId) {
        pendingRef.current = null;
        panelDragRef.current = false;
        return;
      }
      /* v8 ignore next 7 */
      if (current && current.pointerId === e.pointerId) {
        tileryCommitDrag(
          tilery(),
          current,
          current.tabId,
          panelDragRef.current,
        );
        panelDragRef.current = false;
        setDragState(null);
      }
    },
    [tilery, setDragState],
  );

  const onTabPointerCancel = useCallback(
    (e: React.PointerEvent) => {
      const current = dragStateRef.current;
      if (pendingRef.current && pendingRef.current.pointerId === e.pointerId) {
        pendingRef.current = null;
      }
      if (current && current.pointerId === e.pointerId) {
        setDragState(null);
      }
    },
    [setDragState],
  );

  // Aborts an in-progress drag without committing it (e.g. on Escape). The
  // gesture only commits on pointer-up, so discarding the drag state restores
  // the pre-drag layout. No-ops (returning false) when no drag is active so
  // callers can let the key event propagate normally.
  const cancelDrag = useCallback((): boolean => {
    if (!dragStateRef.current) return false;
    pendingRef.current = null;
    panelDragRef.current = false;
    setDragState(null);
    return true;
  }, [setDragState]);

  return {
    dragState,
    panelDragRef,
    registerPanel,
    registerTabBar,
    registerTab,
    onTabPointerDown,
    onTabPointerMove,
    onTabPointerUp,
    onTabPointerCancel,
    onTabBarPointerDown,
    onTabBarPointerUp,
    cancelDrag,
  };
}

function shareFullEdge(
  a: { top: number; right: number; bottom: number; left: number },
  b: { top: number; right: number; bottom: number; left: number },
  side: 'left' | 'right' | 'above' | 'below',
): boolean {
  const EPS = 0.0001;
  if (side === 'left' || side === 'right') {
    return Math.abs(a.top - b.top) < EPS && Math.abs(a.bottom - b.bottom) < EPS;
  }
  return Math.abs(a.left - b.left) < EPS && Math.abs(a.right - b.right) < EPS;
}
