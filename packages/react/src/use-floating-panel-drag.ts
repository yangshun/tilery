'use client';

/**
 * Drag and resize controller for floating panels.
 *
 * Handles pointer-capture gestures that move or edge-resize a floating panel
 * within its container, delegating non-floating pointer events to the tab-drag
 * controller.
 */

import { useCallback, useRef, type PointerEvent, type RefObject } from 'react';
import {
  tileryPanelBehaviorFromState,
  tileryResizeFloatingBounds,
  type TileryFloatingPanelBounds,
  type TileryFloatingResizeEdge,
  type TileryController,
  type TileryPanelId,
} from 'tilery/internal';

type TileryFloatingPanelDragState = {
  panelId: TileryPanelId;
  pointerId: number;
  edge?: TileryFloatingResizeEdge;
  startX: number;
  startY: number;
  startBounds: TileryFloatingPanelBounds;
  containerWidth: number;
  containerHeight: number;
};

/**
 * Pointer event handlers returned by {@link useTileryFloatingPanelDrag} that
 * drive both move and resize interactions for floating panels.
 */
export type TileryFloatingPanelDragController = {
  /** Initiates a floating-panel move when the user drags its tab bar. */
  onFloatingTabBarPointerDown: (e: PointerEvent, panelId: string) => void;
  /** Initiates a floating-panel resize from the given edge handle. */
  onFloatingResizePointerDown: (
    e: PointerEvent,
    panelId: string,
    edge: TileryFloatingResizeEdge,
  ) => void;
  /** Dispatches move deltas for the active floating drag or resize. */
  onPointerMove: (e: PointerEvent) => void;
  /** Commits or cancels the current floating drag/resize on pointer-up. */
  onTabBarPointerUp: (e: PointerEvent) => void;
  /** Cancels any in-flight floating drag or resize. */
  onPointerCancel: (e: PointerEvent) => void;
  /**
   * Aborts an in-flight floating drag or resize, reverting the panel to the
   * bounds it had when the gesture began. Returns `true` when a gesture was
   * cancelled, or `false` when none was active.
   */
  cancelDrag: () => boolean;
};

/**
 * Manages drag-to-move and edge-resize interactions for floating panels,
 * updating panel bounds live via the Tilery controller on every pointer-move.
 */
export function useTileryFloatingPanelDrag({
  tilery,
  containerRef,
  onTabPointerMove,
  onTabBarPointerUp,
  onTabPointerCancel,
}: {
  tilery: () => TileryController | null;
  containerRef: RefObject<HTMLDivElement | null>;
  onTabPointerMove: (e: PointerEvent) => void;
  onTabBarPointerUp: (e: PointerEvent) => void;
  onTabPointerCancel: (e: PointerEvent) => void;
}): TileryFloatingPanelDragController {
  const floatingDragRef = useRef<TileryFloatingPanelDragState | null>(null);

  const onFloatingTabBarPointerDown = useCallback(
    (e: PointerEvent, panelId: string) => {
      if (e.button !== 0) return;
      const m = tilery();
      const panel = m?.getPanel(panelId);
      const bounds = panel?.floatingBounds;
      const container = containerRef.current;
      if (!panel?.floating || !bounds || !container || !m) return;
      panel.focus();
      const behavior = tileryPanelBehaviorFromState(m.getState(), panelId);
      if (!behavior.draggable) return;
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      e.preventDefault();
      floatingDragRef.current = {
        panelId,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        startBounds: { ...bounds },
        containerWidth: rect.width,
        containerHeight: rect.height,
      };
    },
    [containerRef, tilery],
  );

  const onFloatingResizePointerDown = useCallback(
    (e: PointerEvent, panelId: string, edge: TileryFloatingResizeEdge) => {
      if (e.button !== 0) return;
      const m = tilery();
      const panel = m?.getPanel(panelId);
      const bounds = panel?.floatingBounds;
      const container = containerRef.current;
      if (!panel?.floating || !bounds || !container || !m) return;
      panel.focus();
      const behavior = tileryPanelBehaviorFromState(m.getState(), panelId);
      if (!behavior.resizable) return;
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      e.preventDefault();
      e.stopPropagation();
      floatingDragRef.current = {
        panelId,
        pointerId: e.pointerId,
        edge,
        startX: e.clientX,
        startY: e.clientY,
        startBounds: { ...bounds },
        containerWidth: rect.width,
        containerHeight: rect.height,
      };
    },
    [containerRef, tilery],
  );

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      const floatingDrag = floatingDragRef.current;
      if (!floatingDrag || floatingDrag.pointerId !== e.pointerId) {
        onTabPointerMove(e);
        return;
      }
      const dx =
        ((e.clientX - floatingDrag.startX) / floatingDrag.containerWidth) * 100;
      const dy =
        ((e.clientY - floatingDrag.startY) / floatingDrag.containerHeight) *
        100;
      const nextBounds = floatingDrag.edge
        ? tileryResizeFloatingBounds(
            floatingDrag.startBounds,
            floatingDrag.edge,
            dx,
            dy,
          )
        : {
            ...floatingDrag.startBounds,
            x: floatingDrag.startBounds.x + dx,
            y: floatingDrag.startBounds.y + dy,
          };
      tilery()?.setFloatingPanelBounds(floatingDrag.panelId, nextBounds);
    },
    [onTabPointerMove, tilery],
  );

  const handleTabBarPointerUp = useCallback(
    (e: PointerEvent) => {
      const floatingDrag = floatingDragRef.current;
      if (floatingDrag?.pointerId === e.pointerId) {
        floatingDragRef.current = null;
        try {
          (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
        return;
      }
      onTabBarPointerUp(e);
    },
    [onTabBarPointerUp],
  );

  const onPointerCancel = useCallback(
    (e: PointerEvent) => {
      if (floatingDragRef.current?.pointerId === e.pointerId) {
        floatingDragRef.current = null;
      }
      onTabPointerCancel(e);
    },
    [onTabPointerCancel],
  );

  const cancelDrag = useCallback((): boolean => {
    const floatingDrag = floatingDragRef.current;
    if (!floatingDrag) return false;
    floatingDragRef.current = null;
    tilery()?.setFloatingPanelBounds(
      floatingDrag.panelId,
      floatingDrag.startBounds,
    );
    return true;
  }, [tilery]);

  return {
    onFloatingTabBarPointerDown,
    onFloatingResizePointerDown,
    onPointerMove,
    onTabBarPointerUp: handleTabBarPointerUp,
    onPointerCancel,
    cancelDrag,
  };
}
