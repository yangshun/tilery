'use client';

import { useCallback } from 'react';
import type { Divider as DividerType } from 'tilery';
import { usePointerDrag } from '../use-pointer-drag';

export type DividerProps = {
  divider: DividerType;
  onDrag: (dividerId: string, newPositionPercent: number) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
};

const HIT_SIZE_PX = 8;

export function Divider({ divider, onDrag, containerRef }: DividerProps) {
  const onMove = useCallback(
    (e: React.PointerEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const pct =
        divider.orientation === 'vertical'
          ? ((e.clientX - rect.left) / rect.width) * 100
          : ((e.clientY - rect.top) / rect.height) * 100;
      onDrag(divider.id, pct);
    },
    [containerRef, divider.id, divider.orientation, onDrag],
  );

  const handlers = usePointerDrag({ onMove });

  const style: React.CSSProperties =
    divider.orientation === 'vertical'
      ? {
          left: `calc(${divider.position}% - ${HIT_SIZE_PX / 2}px)`,
          top: `${divider.start}%`,
          height: `${divider.end - divider.start}%`,
          width: `${HIT_SIZE_PX}px`,
          cursor: 'col-resize',
        }
      : {
          top: `calc(${divider.position}% - ${HIT_SIZE_PX / 2}px)`,
          left: `${divider.start}%`,
          width: `${divider.end - divider.start}%`,
          height: `${HIT_SIZE_PX}px`,
          cursor: 'row-resize',
        };
  return (
    <div
      className="tilery__divider"
      data-orientation={divider.orientation}
      style={style}
      onPointerDown={handlers.onPointerDown}
      onPointerMove={handlers.onPointerMove}
      onPointerUp={handlers.onPointerUp}
      onPointerCancel={handlers.onPointerUp}
      role="separator"
      aria-orientation={divider.orientation}
    />
  );
}
