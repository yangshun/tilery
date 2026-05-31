'use client';

import { useCallback, useRef, useState } from 'react';

export type TileryPointerDragOptions = {
  onMove: (e: React.PointerEvent) => void;
  stopPropagationOnDown?: boolean;
};

export type TileryPointerDragHandlers = {
  isDragging: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
};

export function useTileryPointerDrag({
  onMove,
  stopPropagationOnDown = false,
}: TileryPointerDragOptions): TileryPointerDragHandlers {
  const draggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
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
