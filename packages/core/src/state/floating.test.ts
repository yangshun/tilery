import { describe, expect, it } from 'vite-plus/test';
import {
  TILERY_DEFAULT_POPOUT_WINDOW_BOUNDS,
  tileryDefaultDockSize,
  tileryDefaultFloatingBounds,
  tileryFloatingBoundsEqual,
  tileryFloatingBoundsToInset,
  tileryFloatingZIndex,
  tileryLayoutBehaviorEqual,
  tileryMergeFloatingBehavior,
  tileryNextFloatingZIndex,
  tileryNormalizeFloatingBounds,
  tileryNormalizePopoutPanelPlacement,
  tileryNormalizePopoutWindowBounds,
  tileryPopoutWindowBoundsEqual,
  tileryPopoutWindowFeatureString,
  tileryResizeFloatingBounds,
} from './floating';
import { tileryCreateInitialState } from './reducer';
import type { TileryFloatingPanelBounds, TileryPanelState } from '../types';

describe('floating bounds helpers', () => {
  it('normalizes floating bounds with clamped dimensions and rounded coordinates', () => {
    expect(
      tileryNormalizeFloatingBounds(
        { x: 99, y: -8, width: 200, height: 6 },
        { x: 10, y: 20, width: 30, height: 40 },
      ),
    ).toEqual({ x: 0, y: 0, width: 100, height: 12 });
    expect(
      tileryNormalizeFloatingBounds(
        { x: 1.23456, y: 2.34567 },
        { x: 10, y: 20, width: 33.333333, height: 44.444444 },
      ),
    ).toEqual({ x: 1.2346, y: 2.3457, width: 33.3333, height: 44.4444 });
  });

  it('derives default floating bounds from large and already-sized panels', () => {
    const largePanel = {
      inset: { top: 0, right: 0, bottom: 0, left: 0 },
    } as TileryPanelState;
    const sizedPanel = {
      inset: { top: 12, right: 44, bottom: 18, left: 8 },
    } as TileryPanelState;

    expect(tileryDefaultFloatingBounds(largePanel)).toEqual({
      x: 18,
      y: 12,
      width: 46,
      height: 48,
    });
    expect(tileryDefaultFloatingBounds(sizedPanel)).toEqual({
      x: 8,
      y: 12,
      width: 48,
      height: 70,
    });
  });

  it('converts floating bounds to inset values and compares bounds', () => {
    const bounds: TileryFloatingPanelBounds = {
      x: 12,
      y: 8,
      width: 36,
      height: 44,
    };

    expect(tileryFloatingBoundsToInset(bounds)).toEqual({
      top: 8,
      right: 52,
      bottom: 48,
      left: 12,
    });
    expect(tileryFloatingBoundsEqual(bounds, { ...bounds })).toBe(true);
    expect(tileryFloatingBoundsEqual(bounds, { ...bounds, width: 40 })).toBe(
      false,
    );
  });

  it('resizes floating bounds from edges and corners', () => {
    const bounds: TileryFloatingPanelBounds = {
      x: 20,
      y: 10,
      width: 40,
      height: 30,
    };

    expect(tileryResizeFloatingBounds(bounds, 'left', 5, 0)).toEqual({
      x: 25,
      y: 10,
      width: 35,
      height: 30,
    });
    expect(tileryResizeFloatingBounds(bounds, 'right', 5, 0)).toEqual({
      x: 20,
      y: 10,
      width: 45,
      height: 30,
    });
    expect(tileryResizeFloatingBounds(bounds, 'top-left', -4, 3)).toEqual({
      x: 16,
      y: 13,
      width: 44,
      height: 27,
    });
    expect(tileryResizeFloatingBounds(bounds, 'bottom-right', 6, 7)).toEqual({
      x: 20,
      y: 10,
      width: 46,
      height: 37,
    });
  });

  it('normalizes popout placement and native window bounds', () => {
    expect(tileryNormalizePopoutPanelPlacement(undefined)).toBeUndefined();
    expect(tileryNormalizePopoutPanelPlacement(true)).toEqual({
      windowBounds: TILERY_DEFAULT_POPOUT_WINDOW_BOUNDS,
    });
    expect(
      tileryNormalizePopoutWindowBounds(
        { left: Infinity, top: -20_000, width: 10, height: Infinity },
        { left: 80, top: 90, width: 720, height: 520 },
      ),
    ).toEqual({ left: -10000, top: -10000, width: 240, height: 160 });
  });

  it('compares and serializes native popout window bounds', () => {
    const bounds = { left: 24, top: 32, width: 640, height: 420 };

    expect(tileryPopoutWindowBoundsEqual(bounds, { ...bounds })).toBe(true);
    expect(tileryPopoutWindowBoundsEqual(bounds, { ...bounds, top: 40 })).toBe(
      false,
    );
    expect(tileryPopoutWindowFeatureString(bounds)).toBe(
      'popup=yes,left=24,top=32,width=640,height=420',
    );
  });

  it('normalizes floating behavior and derived floating z-indexes', () => {
    expect(
      tileryMergeFloatingBehavior(
        { resizable: true, draggable: true, droppable: true },
        { locked: true },
      ),
    ).toEqual({ resizable: false, draggable: false, droppable: false });
    expect(
      tileryMergeFloatingBehavior(
        { resizable: true, draggable: false, droppable: true },
        { draggable: true },
      ),
    ).toEqual({ resizable: true, draggable: true, droppable: true });
    expect(
      tileryLayoutBehaviorEqual(
        { resizable: true, draggable: true, droppable: false },
        { resizable: true, draggable: true, droppable: false },
      ),
    ).toBe(true);
    expect(
      tileryLayoutBehaviorEqual(
        { resizable: true, draggable: true, droppable: false },
        { resizable: true, draggable: false, droppable: false },
      ),
    ).toBe(false);

    const state = tileryCreateInitialState({
      type: 'root',
      main: { type: 'empty' },
      floating: [
        { type: 'floatingPanel', id: 'a', tabs: [] },
        { type: 'floatingPanel', id: 'b', tabs: [] },
      ],
    });

    expect(tileryDefaultDockSize({ x: 0, y: 0, width: 8, height: 40 })).toBe(
      20,
    );
    expect(tileryDefaultDockSize({ x: 0, y: 0, width: 64, height: 40 })).toBe(
      50,
    );
    expect(tileryFloatingZIndex(2)).toBe(22);
    expect(tileryNextFloatingZIndex(state)).toBe(22);
  });
});
