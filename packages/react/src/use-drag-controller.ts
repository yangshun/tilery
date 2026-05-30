'use client';

import { useCallback, useRef, useState } from 'react';
import type { TileryHandle, TileryPanelId, TileryTabId } from 'tilery/internal';
import {
  tileryTabBarDropAt,
  tileryZoneAt,
  tileryAdjacencySide,
  tileryClassifyByZoneAndSide,
  tileryCommitDrag,
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

export function useTileryDragController(tilery: () => TileryHandle | null) {
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
      return tileryClassifyByZoneAndSide(zone, side);
    },
    [tilery],
  );

  const computeHover = useCallback(
    (
      x: number,
      y: number,
      draggedTabId: TileryTabId,
    ): Pick<TileryDragState, 'hoverPanelId' | 'hoverZone' | 'hoverTabBar'> => {
      let hoverPanelId: TileryPanelId | null = null;
      let hoverZone: TileryPanelZone | null = null;
      let hoverTabBar: TileryDragState['hoverTabBar'] = null;

      for (const [panelId, tabBarEl] of refs.current.tabBarEls) {
        const r = tabBarEl.getBoundingClientRect();
        if (x < r.left || x > r.right || y < r.top || y > r.bottom) continue;
        if (isOwnSoloPanel(panelId, draggedTabId)) continue;
        const tabRects: { tabId: string; left: number; right: number }[] = [];
        const panel = tilery()?.getPanel(panelId);
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

      if (!hoverTabBar) {
        for (const [panelId, panelEl] of refs.current.panelEls) {
          const r = panelEl.getBoundingClientRect();
          const z = tileryZoneAt(
            { left: r.left, top: r.top, width: r.width, height: r.height },
            x,
            y,
          );
          if (!z) continue;
          if (isOwnSoloPanel(panelId, draggedTabId)) continue;
          if (classifySplitInteraction(panelId, draggedTabId, z) === 'suppress')
            continue;
          hoverPanelId = panelId;
          hoverZone = z;
          break;
        }
      }
      return { hoverPanelId, hoverZone, hoverTabBar };
    },
    [tilery, isOwnSoloPanel, classifySplitInteraction],
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
      };
    },
    [],
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
  };
}
