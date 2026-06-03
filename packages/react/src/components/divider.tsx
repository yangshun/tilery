'use client';

import { useCallback } from 'react';
import type {
  TileryDivider as DividerType,
  TilerySizeResolutionContext,
} from 'tilery/internal';
import { useTileryPointerDrag } from '../use-pointer-drag';

export type DividerProps = {
  divider: DividerType;
  accessibility: DividerAccessibility;
  disabled?: boolean;
  hitSize?: number;
  onDrag: (
    dividerId: string,
    newPositionPercent: number,
    input: 'keyboard' | 'pointer',
    sizeContext?: TilerySizeResolutionContext,
  ) => boolean | void;
  onReset?: (
    dividerId: string,
    sizeContext?: TilerySizeResolutionContext,
  ) => boolean | void;
  onDragEnd?: () => void;
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

const DEFAULT_HIT_SIZE_PX = 24;
const KEYBOARD_STEP_PERCENT = 2;
const KEYBOARD_FAST_STEP_PERCENT = 10;
const EPSILON = 0.0001;
const noop = () => {};

export function TileryDivider({
  divider,
  accessibility,
  disabled = false,
  hitSize = DEFAULT_HIT_SIZE_PX,
  onDrag,
  onReset,
  onDragEnd = noop,
  containerRef,
}: DividerProps) {
  const resolvedHitSize = normalizeHitSize(hitSize);
  const onMove = useCallback(
    (e: React.PointerEvent) => {
      /* v8 ignore next -- disabled handles detach pointer move before this callback is reachable. */
      if (disabled) return;
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const pct =
        divider.orientation === 'vertical'
          ? ((e.clientX - rect.left) / rect.width) * 100
          : ((e.clientY - rect.top) / rect.height) * 100;
      onDrag(divider.id, pct, 'pointer', {
        width: rect.width,
        height: rect.height,
      });
    },
    [containerRef, disabled, divider.id, divider.orientation, onDrag],
  );

  const onDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled || !onReset) return;
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      e.preventDefault();
      e.stopPropagation();
      const didReset = onReset(divider.id, {
        width: rect.width,
        height: rect.height,
      });
      if (didReset) onDragEnd();
    },
    [containerRef, disabled, divider.id, onDragEnd, onReset],
  );

  const handlers = useTileryPointerDrag({ onMove });
  const minPosition = Math.min(
    accessibility.minPosition,
    accessibility.maxPosition,
  );
  const maxPosition = Math.max(
    accessibility.minPosition,
    accessibility.maxPosition,
  );
  const isAtMin = divider.position <= minPosition + EPSILON;
  const isAtMax = divider.position >= maxPosition - EPSILON;
  const isActive = handlers.isDragging && !disabled;

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      handlers.onPointerUp(e);
      onDragEnd();
    },
    [handlers, onDragEnd],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
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
      onDrag(divider.id, Math.max(min, Math.min(max, next)), 'keyboard');
      onDragEnd();
    },
    [
      accessibility.axisEnd,
      accessibility.axisStart,
      accessibility.maxPosition,
      accessibility.minPosition,
      divider.id,
      divider.orientation,
      divider.position,
      disabled,
      onDrag,
      onDragEnd,
    ],
  );

  const style: React.CSSProperties =
    divider.orientation === 'vertical'
      ? {
          left: `calc(${divider.position}% - ${resolvedHitSize / 2}px)`,
          top: `${divider.start}%`,
          height: `${divider.end - divider.start}%`,
          width: `${resolvedHitSize}px`,
          cursor: disabled ? 'default' : 'col-resize',
        }
      : {
          top: `calc(${divider.position}% - ${resolvedHitSize / 2}px)`,
          left: `${divider.start}%`,
          width: `${divider.end - divider.start}%`,
          height: `${resolvedHitSize}px`,
          cursor: disabled ? 'default' : 'row-resize',
        };
  return (
    <div
      className="tilery__divider"
      data-orientation={divider.orientation}
      data-resize-active={isActive ? '' : undefined}
      data-resize-at-min={isAtMin ? '' : undefined}
      data-resize-at-max={isAtMax ? '' : undefined}
      data-resize-disabled={disabled ? '' : undefined}
      style={style}
      tabIndex={disabled ? -1 : 0}
      onPointerDown={disabled ? undefined : handlers.onPointerDown}
      onPointerMove={disabled ? undefined : handlers.onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={onDoubleClick}
      onKeyDown={onKeyDown}
      role="separator"
      aria-disabled={disabled ? true : undefined}
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

function normalizeHitSize(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_HIT_SIZE_PX;
}
