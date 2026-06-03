'use client';

import { useCallback } from 'react';
import type {
  TileryJunction as JunctionType,
  TilerySizeResolutionContext,
} from 'tilery/internal';
import { tileryRectEdgePercent } from 'tilery/internal';
import { useTileryPointerDrag } from '../use-pointer-drag';

export type JunctionProps = {
  junction: JunctionType;
  disabled?: boolean;
  hitSize?: number;
  onDrag: (
    junctionId: string,
    xPercent: number,
    yPercent: number,
    input: 'pointer',
    sizeContext?: TilerySizeResolutionContext,
  ) => boolean | void;
  onDragEnd?: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
};

const DEFAULT_HIT_SIZE_PX = 24;
const noop = () => {};

export function TileryJunction({
  junction,
  disabled = false,
  hitSize = DEFAULT_HIT_SIZE_PX,
  onDrag,
  onDragEnd = noop,
  containerRef,
}: JunctionProps) {
  const resolvedHitSize = normalizeHitSize(hitSize);
  const onMove = useCallback(
    (e: React.PointerEvent) => {
      /* v8 ignore next -- disabled handles detach pointer move before this callback is reachable. */
      if (disabled) return;
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      onDrag(
        junction.id,
        tileryRectEdgePercent(rect, e.clientX, e.clientY, 'left'),
        tileryRectEdgePercent(rect, e.clientX, e.clientY, 'top'),
        'pointer',
        { width: rect.width, height: rect.height },
      );
    },
    [containerRef, disabled, junction.id, onDrag],
  );

  const handlers = useTileryPointerDrag({ onMove });
  const isActive = handlers.isDragging && !disabled;

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
      data-resize-active={isActive ? '' : undefined}
      data-resize-disabled={disabled ? '' : undefined}
      style={{
        left: `calc(${junction.x}% - ${resolvedHitSize / 2}px)`,
        top: `calc(${junction.y}% - ${resolvedHitSize / 2}px)`,
        width: `${resolvedHitSize}px`,
        height: `${resolvedHitSize}px`,
        cursor: disabled ? 'default' : 'move',
      }}
      onPointerDown={disabled ? undefined : handlers.onPointerDown}
      onPointerMove={disabled ? undefined : handlers.onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      aria-hidden="true"
    />
  );
}

function normalizeHitSize(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_HIT_SIZE_PX;
}
