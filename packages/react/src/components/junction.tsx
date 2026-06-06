'use client';

/**
 * T-junction handle resizing two dividers at once.
 */

import { memo, useCallback } from 'react';
import type {
  TileryJunction as JunctionType,
  TilerySizeResolutionContext,
} from 'tilery/internal';
import { tileryRectEdgePercent } from 'tilery/internal';
import { useTileryPointerDrag } from '../use-pointer-drag';

/**
 * Props for the {@link TileryJunction} component.
 */
export type JunctionProps = {
  /** The junction model object describing the intersection point and kind. */
  junction: JunctionType;
  /** When true the handle is non-interactive and renders a default cursor. */
  disabled?: boolean;
  /**
   * Side-length of the square pointer-capture hit target in pixels.
   * @defaultValue 24
   */
  hitSize?: number;
  /**
   * Called when the junction is dragged. Receives the new x/y percentages
   * within the container and returns `true` if the position was applied.
   */
  onDrag: (
    junctionId: string,
    xPercent: number,
    yPercent: number,
    input: 'pointer',
    sizeContext?: TilerySizeResolutionContext,
  ) => boolean | void;
  /** Called when this junction's pointer resize starts or ends. */
  onActiveChange?: (junction: JunctionType, active: boolean) => void;
  /** Called after a drag interaction ends. */
  onDragEnd?: () => void;
  /** Ref to the layout container used to compute percentage positions. */
  containerRef: React.RefObject<HTMLDivElement | null>;
};

const DEFAULT_HIT_SIZE_PX = 24;
const noop = () => {};

/**
 * Pointer-draggable corner handle positioned at the intersection of a
 * horizontal and a vertical divider. Dragging it simultaneously adjusts
 * both dividers, keyed to the `junction.kind` layout topology.
 */
export const TileryJunction = memo(function TileryJunction({
  junction,
  disabled = false,
  hitSize = DEFAULT_HIT_SIZE_PX,
  onDrag,
  onActiveChange,
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

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      handlers.onPointerDown(e);
      if (e.button === 0 && e.isPrimary !== false) {
        onActiveChange?.(junction, true);
      }
    },
    [handlers, junction, onActiveChange],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      handlers.onPointerUp(e);
      onActiveChange?.(junction, false);
      onDragEnd();
    },
    [handlers, junction, onActiveChange, onDragEnd],
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
      onPointerDown={disabled ? undefined : onPointerDown}
      onPointerMove={disabled ? undefined : handlers.onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      aria-hidden="true"
    />
  );
});

function normalizeHitSize(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_HIT_SIZE_PX;
}
