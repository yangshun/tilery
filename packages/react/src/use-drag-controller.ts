'use client';

import { useCallback, useRef, useState } from 'react';
import type { TileryHandle, PanelId, TabId } from '@tilery/core';
import {
  tabBarDropAt,
  zoneAt,
  adjacencySide,
  classifyByZoneAndSide,
  commitDrag,
  type PanelZone,
  type DragState,
} from '@tilery/core';

export { adjacencySide, classifyByZoneAndSide, commitDrag } from '@tilery/core';
export type { DragState } from '@tilery/core';

type Refs = {
  panelEls: Map<PanelId, HTMLElement>;
  tabBarEls: Map<PanelId, HTMLElement>;
  tabEls: Map<TabId, HTMLElement>;
};

const DRAG_THRESHOLD_PX = 4;

export function useDragController(tilery: () => TileryHandle | null) {
  const refs = useRef<Refs>({
    panelEls: new Map(),
    tabBarEls: new Map(),
    tabEls: new Map(),
  });
  const [dragState, setDragStateInternal] = useState<DragState | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const setDragState = useCallback((next: DragState | null) => {
    dragStateRef.current = next;
    setDragStateInternal(next);
  }, []);
  const pendingRef = useRef<{
    tabId: TabId;
    pointerId: number;
    startX: number;
    startY: number;
  } | null>(null);

  const registerPanel = useCallback(
    (panelId: PanelId, el: HTMLElement | null) => {
      if (el) refs.current.panelEls.set(panelId, el);
      else refs.current.panelEls.delete(panelId);
    },
    [],
  );
  const registerTabBar = useCallback(
    (panelId: PanelId, el: HTMLElement | null) => {
      if (el) refs.current.tabBarEls.set(panelId, el);
      else refs.current.tabBarEls.delete(panelId);
    },
    [],
  );
  const registerTab = useCallback((tabId: TabId, el: HTMLElement | null) => {
    if (el) refs.current.tabEls.set(tabId, el);
    else refs.current.tabEls.delete(tabId);
  }, []);

  const isOwnSoloPanel = useCallback(
    (panelId: PanelId, draggedTabId: TabId): boolean => {
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
      panelId: PanelId,
      draggedTabId: TabId,
      zone: PanelZone,
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
      const side = adjacencySide(source, target);
      if (!side) return 'split';
      return classifyByZoneAndSide(zone, side);
    },
    [tilery],
  );

  const computeHover = useCallback(
    (
      x: number,
      y: number,
      draggedTabId: TabId,
    ): Pick<DragState, 'hoverPanelId' | 'hoverZone' | 'hoverTabBar'> => {
      let hoverPanelId: PanelId | null = null;
      let hoverZone: PanelZone | null = null;
      let hoverTabBar: DragState['hoverTabBar'] = null;

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
        const hit = tabBarDropAt(tabRects, x);
        hoverTabBar = { panelId, hit };
        hoverPanelId = panelId;
        break;
      }

      if (!hoverTabBar) {
        for (const [panelId, panelEl] of refs.current.panelEls) {
          const r = panelEl.getBoundingClientRect();
          const z = zoneAt(
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
    (e: React.PointerEvent, tabId: TabId) => {
      if (e.button !== 0) return;
      const target = e.currentTarget as HTMLElement;
      try {
        target.setPointerCapture(e.pointerId);
      } catch {
        // Synthetic events or already-released pointers will throw; ignore.
      }
      pendingRef.current = {
        tabId,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
      };
    },
    [],
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
    (_e: React.PointerEvent, tabId: TabId, onClick: () => void) => {
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
        commitDrag(tilery(), current, tabId);
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
    registerPanel,
    registerTabBar,
    registerTab,
    onTabPointerDown,
    onTabPointerMove,
    onTabPointerUp,
    onTabPointerCancel,
  };
}
