'use client';

import { useMemo, useRef } from 'react';

type UsePointerDragOptions = {
  /** Called on every pointer-move event after `startDrag` is invoked. */
  onMove: (event: PointerEvent) => void;
  /** Called when the pointer is released, after capture is released. */
  onUp?: () => void;
};

type UsePointerDragReturn = {
  /**
   * Begin a drag from `element` for the given pointer. Sets pointer capture,
   * wires `pointermove`/`pointerup` listeners, and releases both automatically
   * on release — the caller only provides the per-frame logic in `onMove`.
   */
  startDrag: (element: HTMLElement, pointerId: number) => void;
};

/**
 * Wires pointer-capture semantics and move/up listeners to a handle element
 * so the caller only has to provide the per-frame business logic in `onMove`.
 *
 * The latest `onMove`/`onUp` are always called (refs mirror the latest
 * closure) so per-drag state can be tracked via refs at the call site.
 */
export function usePointerDrag({
  onMove,
  onUp,
}: UsePointerDragOptions): UsePointerDragReturn {
  const onMoveRef = useRef(onMove);
  const onUpRef = useRef(onUp);
  onMoveRef.current = onMove;
  onUpRef.current = onUp;

  return useMemo<UsePointerDragReturn>(
    () => ({
      startDrag: (element, pointerId) => {
        try {
          element.setPointerCapture(pointerId);
        } catch {
          // Synthetic events or stale pointerIds throw; ignore.
        }
        const handleMove = (event: PointerEvent) => {
          onMoveRef.current(event);
        };
        const handleUp = () => {
          try {
            element.releasePointerCapture(pointerId);
          } catch {
            // ignore
          }
          element.removeEventListener('pointermove', handleMove);
          element.removeEventListener('pointerup', handleUp);
          onUpRef.current?.();
        };
        element.addEventListener('pointermove', handleMove);
        element.addEventListener('pointerup', handleUp);
      },
    }),
    [],
  );
}
