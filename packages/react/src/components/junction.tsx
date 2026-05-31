'use client';

import { useCallback } from 'react';
import type { TileryJunction as JunctionType } from 'tilery/internal';
import { useTileryPointerDrag } from '../use-pointer-drag';

export type JunctionProps = {
  junction: JunctionType;
  onDrag: (junctionId: string, xPercent: number, yPercent: number) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
};

const HIT_SIZE_PX = 24;

export function TileryJunction({
  junction,
  onDrag,
  containerRef,
}: JunctionProps) {
  const onMove = useCallback(
    (e: React.PointerEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      onDrag(
        junction.id,
        ((e.clientX - rect.left) / rect.width) * 100,
        ((e.clientY - rect.top) / rect.height) * 100,
      );
    },
    [containerRef, junction.id, onDrag],
  );

  const handlers = useTileryPointerDrag({ onMove });

  return (
    <div
      className="tilery__junction"
      data-junction-kind={junction.kind}
      style={{
        left: `calc(${junction.x}% - ${HIT_SIZE_PX / 2}px)`,
        top: `calc(${junction.y}% - ${HIT_SIZE_PX / 2}px)`,
        width: `${HIT_SIZE_PX}px`,
        height: `${HIT_SIZE_PX}px`,
        cursor: 'move',
      }}
      onPointerDown={handlers.onPointerDown}
      onPointerMove={handlers.onPointerMove}
      onPointerUp={handlers.onPointerUp}
      onPointerCancel={handlers.onPointerUp}
      aria-hidden="true"
    />
  );
}
