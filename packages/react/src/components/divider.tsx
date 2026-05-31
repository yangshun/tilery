'use client';

import { useCallback } from 'react';
import type { TileryDivider as DividerType } from 'tilery/internal';
import { useTileryPointerDrag } from '../use-pointer-drag';

export type DividerProps = {
  divider: DividerType;
  accessibility: DividerAccessibility;
  onDrag: (dividerId: string, newPositionPercent: number) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
};

export type DividerAccessibility = {
  label: string;
  controls: string;
  valueMin: number;
  valueMax: number;
  valueNow: number;
  valueText: string;
  minPosition: number;
  maxPosition: number;
  axisStart: number;
  axisEnd: number;
};

const HIT_SIZE_PX = 24;
const KEYBOARD_STEP_PERCENT = 2;
const KEYBOARD_FAST_STEP_PERCENT = 10;

export function TileryDivider({
  divider,
  accessibility,
  onDrag,
  containerRef,
}: DividerProps) {
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

  const handlers = useTileryPointerDrag({ onMove });

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const min = Math.min(
        accessibility.minPosition,
        accessibility.maxPosition,
      );
      const max = Math.max(
        accessibility.minPosition,
        accessibility.maxPosition,
      );
      const step =
        ((accessibility.axisEnd - accessibility.axisStart) *
          (e.shiftKey ? KEYBOARD_FAST_STEP_PERCENT : KEYBOARD_STEP_PERCENT)) /
        100;
      let next: number | null = null;

      if (e.key === 'Home') next = min;
      else if (e.key === 'End') next = max;
      else if (divider.orientation === 'vertical') {
        if (e.key === 'ArrowLeft') next = divider.position - step;
        else if (e.key === 'ArrowRight') next = divider.position + step;
      } else if (e.key === 'ArrowUp') next = divider.position - step;
      else if (e.key === 'ArrowDown') next = divider.position + step;

      if (next == null) return;
      e.preventDefault();
      e.stopPropagation();
      onDrag(divider.id, Math.max(min, Math.min(max, next)));
    },
    [
      accessibility.axisEnd,
      accessibility.axisStart,
      accessibility.maxPosition,
      accessibility.minPosition,
      divider.id,
      divider.orientation,
      divider.position,
      onDrag,
    ],
  );

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
      tabIndex={0}
      onPointerDown={handlers.onPointerDown}
      onPointerMove={handlers.onPointerMove}
      onPointerUp={handlers.onPointerUp}
      onPointerCancel={handlers.onPointerUp}
      onKeyDown={onKeyDown}
      role="separator"
      aria-label={accessibility.label}
      aria-controls={accessibility.controls}
      aria-orientation={divider.orientation}
      aria-valuemin={accessibility.valueMin}
      aria-valuemax={accessibility.valueMax}
      aria-valuenow={accessibility.valueNow}
      aria-valuetext={accessibility.valueText}
      aria-keyshortcuts={
        divider.orientation === 'vertical'
          ? 'ArrowLeft ArrowRight Home End'
          : 'ArrowUp ArrowDown Home End'
      }
    />
  );
}
