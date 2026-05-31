'use client';

import { useCallback } from 'react';
import type { TileryJunction as JunctionType } from 'tilery/internal';
import { useTileryPointerDrag } from '../use-pointer-drag';

export type JunctionProps = {
  junction: JunctionType;
  hitSize?: number;
  onDrag: (
    junctionId: string,
    xPercent: number,
    yPercent: number,
    input: 'pointer',
  ) => boolean | void;
  onDragEnd?: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
};

const DEFAULT_HIT_SIZE_PX = 24;
const noop = () => {};

export function TileryJunction({
  junction,
  hitSize = DEFAULT_HIT_SIZE_PX,
  onDrag,
  onDragEnd = noop,
  containerRef,
}: JunctionProps) {
  const resolvedHitSize = normalizeHitSize(hitSize);
  const onMove = useCallback(
    (e: React.PointerEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      onDrag(
        junction.id,
        ((e.clientX - rect.left) / rect.width) * 100,
        ((e.clientY - rect.top) / rect.height) * 100,
        'pointer',
      );
    },
    [containerRef, junction.id, onDrag],
  );

  const handlers = useTileryPointerDrag({ onMove });

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      handlers.onPointerUp(e);
      onDragEnd();
    },
    [handlers, onDragEnd],
  );

  return (
    <div
      className="tilery__junction"
      data-junction-kind={junction.kind}
      data-resize-active={handlers.isDragging ? '' : undefined}
      style={{
        left: `calc(${junction.x}% - ${resolvedHitSize / 2}px)`,
        top: `calc(${junction.y}% - ${resolvedHitSize / 2}px)`,
        width: `${resolvedHitSize}px`,
        height: `${resolvedHitSize}px`,
        cursor: 'move',
      }}
      onPointerDown={handlers.onPointerDown}
      onPointerMove={handlers.onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      aria-hidden="true"
    />
  );
}

function normalizeHitSize(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_HIT_SIZE_PX;
}
