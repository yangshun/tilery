'use client';

import { useCallback } from 'react';
import type {
  TileryEdge,
  TileryPanelId,
  TilerySizeResolutionContext,
} from 'tilery/internal';
import { tileryRectEdgePercent } from 'tilery/internal';
import { useTileryPointerDrag } from '../use-pointer-drag';

export type EdgeResizeHandleProps = {
  panelId: TileryPanelId;
  side: TileryEdge;
  disabled?: boolean;
  hitSize?: number;
  placementStyle?: React.CSSProperties;
  onDrag: (
    panelId: TileryPanelId,
    size: number,
    input: 'pointer',
    sizeContext?: TilerySizeResolutionContext,
  ) => boolean | void;
  onDragEnd?: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
};

const DEFAULT_HIT_SIZE_PX = 24;
const noop = () => {};

export function EdgeResizeHandle({
  panelId,
  side,
  disabled = false,
  hitSize = DEFAULT_HIT_SIZE_PX,
  placementStyle,
  onDrag,
  onDragEnd = noop,
  containerRef,
}: EdgeResizeHandleProps) {
  const resolvedHitSize = normalizeHitSize(hitSize);
  const onMove = useCallback(
    (e: React.PointerEvent) => {
      /* v8 ignore next -- disabled handles detach pointer move before this callback is reachable. */
      if (disabled) return;
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const size = tileryRectEdgePercent(rect, e.clientX, e.clientY, side);
      onDrag(panelId, size, 'pointer', {
        width: rect.width,
        height: rect.height,
      });
    },
    [containerRef, disabled, onDrag, panelId, side],
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
      className="tilery__edge-resize-handle"
      data-edge-resize-side={side}
      data-resize-active={isActive ? '' : undefined}
      data-resize-disabled={disabled ? '' : undefined}
      style={placementStyle ?? edgeResizeStyle(side, resolvedHitSize)}
      onPointerDown={disabled ? undefined : handlers.onPointerDown}
      onPointerMove={disabled ? undefined : handlers.onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      aria-hidden="true"
    />
  );
}

function edgeResizeStyle(
  side: TileryEdge,
  hitSize: number,
): React.CSSProperties {
  const offset = `-${hitSize / 2}px`;
  if (side === 'left') {
    return {
      top: 0,
      right: offset,
      bottom: 0,
      width: hitSize,
      cursor: 'col-resize',
    };
  }
  if (side === 'right') {
    return {
      top: 0,
      left: offset,
      bottom: 0,
      width: hitSize,
      cursor: 'col-resize',
    };
  }
  if (side === 'top') {
    return {
      right: 0,
      bottom: offset,
      left: 0,
      height: hitSize,
      cursor: 'row-resize',
    };
  }
  return {
    top: offset,
    right: 0,
    left: 0,
    height: hitSize,
    cursor: 'row-resize',
  };
}

function normalizeHitSize(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_HIT_SIZE_PX;
}
