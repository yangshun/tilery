'use client';

import { useCallback } from 'react';
import type { TileryJunction } from 'tilery/internal';
import { useTileryPointerDrag } from '../use-pointer-drag';

export type JunctionHandleProps = {
  junction: TileryJunction;
  onDrag: (junction: TileryJunction, xPct: number, yPct: number) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
};

const HIT_SIZE_PX = 14;

export function JunctionHandle({
  junction,
  onDrag,
  containerRef,
}: JunctionHandleProps) {
  const onMove = useCallback(
    (e: React.PointerEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const xPct = ((e.clientX - rect.left) / rect.width) * 100;
      const yPct = ((e.clientY - rect.top) / rect.height) * 100;
      onDrag(junction, xPct, yPct);
    },
    [containerRef, junction, onDrag],
  );

  const handlers = useTileryPointerDrag({
    onMove,
    stopPropagationOnDown: true,
  });

  return (
    <div
      className="tilery__junction"
      data-junction-id={junction.id}
      style={{
        left: `calc(${junction.x}% - ${HIT_SIZE_PX / 2}px)`,
        top: `calc(${junction.y}% - ${HIT_SIZE_PX / 2}px)`,
        width: HIT_SIZE_PX,
        height: HIT_SIZE_PX,
      }}
      onPointerDown={handlers.onPointerDown}
      onPointerMove={handlers.onPointerMove}
      onPointerUp={handlers.onPointerUp}
      onPointerCancel={handlers.onPointerUp}
      role="separator"
      aria-label="Resize junction"
    />
  );
}
