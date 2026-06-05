'use client';

/**
 * Low-level pointer-capture drag hook.
 *
 * Handles pointer capture, `isDragging` state, and move/up event wiring for
 * any drag interaction backed by the Pointer Events API.
 */

import { useCallback, useRef, useState } from 'react';

/** Options accepted by {@link useTileryPointerDrag}. */
export type TileryPointerDragOptions = {
  /** Called on every pointer-move event while the drag is active. */
  onMove: (e: React.PointerEvent) => void;
  /**
   * When `true`, `stopPropagation` is called on the initial pointer-down
   * event to prevent ancestor handlers from reacting.
   */
  stopPropagationOnDown?: boolean;
};

/**
 * Pointer event handlers and drag state returned by
 * {@link useTileryPointerDrag}.
 */
export type TileryPointerDragHandlers = {
  /** `true` while a drag gesture is in progress. */
  isDragging: boolean;
  /** Attach to the element that should initiate the drag on pointer-down. */
  onPointerDown: (e: React.PointerEvent) => void;
  /** Attach to the element to receive move events during the drag. */
  onPointerMove: (e: React.PointerEvent) => void;
  /** Attach to the element to end the drag on pointer-up. */
  onPointerUp: (e: React.PointerEvent) => void;
};

/**
 * Attaches pointer-capture semantics to an element so it receives all pointer
 * events for the duration of a drag, even if the cursor leaves the element.
 */
export function useTileryPointerDrag({
  onMove,
  stopPropagationOnDown = false,
}: TileryPointerDragOptions): TileryPointerDragHandlers {
  const draggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      // Ignore secondary pointers (e.g. a 2nd touch point during a gesture).
      // `=== false` so events that omit the field still count as primary.
      if (e.isPrimary === false) return;
      e.preventDefault();
      if (stopPropagationOnDown) e.stopPropagation();
      const el = e.currentTarget as HTMLElement;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        // Synthetic events or stale pointerIds throw; ignore.
      }
      draggingRef.current = true;
      setIsDragging(true);
    },
    [stopPropagationOnDown],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current) return;
      onMove(e);
    },
    [onMove],
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    const el = e.currentTarget as HTMLElement;
    try {
      el.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    draggingRef.current = false;
    setIsDragging(false);
  }, []);

  return { isDragging, onPointerDown, onPointerMove, onPointerUp };
}
