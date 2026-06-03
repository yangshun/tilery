import { describe, expect, it } from 'vite-plus/test';
import {
  tileryClampEdgePanelSize,
  tileryEdgePanelIdBySide,
  tileryEdgePanelOrderFromState,
  tileryEdgePanelSizes,
  tileryNormalizeEdgePanelOrders,
  tilerySetEdgePanelSize,
} from './edges';
import { tileryCreateInitialState } from './reducer';
import type { TileryInitialLayout } from '../types';

// edges.ts had no dedicated suite — it was only reached indirectly. These tests
// pin the edge-panel sizing math: opposite-edge competition for center space,
// pixel constraints that cannot resolve without a measured axis, and order
// normalization.

function rootWith(
  edges: NonNullable<Extract<TileryInitialLayout, { type: 'root' }>['edges']>,
): TileryInitialLayout {
  return {
    type: 'root',
    main: {
      type: 'panel',
      id: 'center',
      tabs: [{ id: 'c1', data: {} }],
    },
    edges,
  };
}

describe('tileryClampEdgePanelSize', () => {
  it('caps a left edge against the opposite right edge and the center minimum', () => {
    const state = tileryCreateInitialState(
      rootWith({
        left: {
          type: 'edgePanel',
          id: 'L',
          size: 20,
          tabs: [{ id: 'l', data: {} }],
        },
        right: {
          type: 'edgePanel',
          id: 'R',
          size: 30,
          tabs: [{ id: 'r', data: {} }],
        },
      }),
    );

    // Right takes 30, center needs >= 10, so left can grow to at most 60.
    expect(tileryClampEdgePanelSize(state, 'L', 95)).toBeCloseTo(60, 5);
    // The opposite lookup also resolves from the right side back to the left.
    expect(tileryClampEdgePanelSize(state, 'R', 95)).toBeCloseTo(70, 5);
  });

  it('falls back to the default minimum when a pixel constraint cannot be measured', () => {
    const state = tileryCreateInitialState(
      rootWith({
        left: {
          type: 'edgePanel',
          id: 'L',
          size: 30,
          minSize: '300px',
          tabs: [{ id: 'l', data: {} }],
        },
      }),
    );

    // No size context => '300px' resolves to undefined => min falls back to 10%.
    expect(tileryClampEdgePanelSize(state, 'L', 2)).toBeCloseTo(10, 5);
    // A pixel center-minimum that cannot resolve also falls back to the default.
    expect(tileryClampEdgePanelSize(state, 'L', 50, '300px')).toBeGreaterThan(
      0,
    );
  });

  it('defaults an edge panel size when the init omits it', () => {
    const state = tileryCreateInitialState(
      rootWith({
        // No `size` => the side's default edge size is used.
        right: { type: 'edgePanel', id: 'R', tabs: [{ id: 'r', data: {} }] },
      }),
    );
    const panel = state.panels.R;
    expect(panel?.kind === 'edge' ? panel.edge.size : 0).toBeGreaterThan(0);
  });

  it('keeps the current size when the minimum cannot fit beside the opposite edge', () => {
    const state = tileryCreateInitialState(
      rootWith({
        left: {
          type: 'edgePanel',
          id: 'L',
          size: 20,
          minSize: 80,
          tabs: [{ id: 'l', data: {} }],
        },
        right: {
          type: 'edgePanel',
          id: 'R',
          size: 30,
          tabs: [{ id: 'r', data: {} }],
        },
      }),
    );
    // min (80) exceeds the available upper bound (100 - 30 - 10), so it pins.
    expect(tileryClampEdgePanelSize(state, 'L', 95)).toBeCloseTo(20, 5);
  });

  it('returns the clamped target for a non-edge or missing panel', () => {
    const state = tileryCreateInitialState(
      rootWith({
        left: {
          type: 'edgePanel',
          id: 'L',
          size: 20,
          tabs: [{ id: 'l', data: {} }],
        },
      }),
    );
    expect(tileryClampEdgePanelSize(state, 'center', 150)).toBe(100);
    expect(tileryClampEdgePanelSize(state, 'missing', -10)).toBe(0);
  });
});

describe('tileryEdgePanelSizes and tileryEdgePanelIdBySide', () => {
  it('reports sizes and ids keyed by side', () => {
    const state = tileryCreateInitialState(
      rootWith({
        left: {
          type: 'edgePanel',
          id: 'L',
          size: 22,
          tabs: [{ id: 'l', data: {} }],
        },
        bottom: {
          type: 'edgePanel',
          id: 'B',
          size: 18,
          tabs: [{ id: 'b', data: {} }],
        },
      }),
    );
    expect(tileryEdgePanelSizes(state)).toEqual({
      left: 22,
      right: 0,
      top: 0,
      bottom: 18,
    });
    expect(tileryEdgePanelIdBySide(state)).toEqual({ left: 'L', bottom: 'B' });
  });
});

describe('tilerySetEdgePanelSize', () => {
  it('is a no-op for a non-resizable edge panel and resizes a normal one', () => {
    const locked = tileryCreateInitialState(
      rootWith({
        left: {
          type: 'edgePanel',
          id: 'L',
          size: 20,
          locked: true,
          tabs: [{ id: 'l', data: {} }],
        },
      }),
    );
    expect(tilerySetEdgePanelSize(locked, 'L', 40)).toBe(locked);

    const state = tileryCreateInitialState(
      rootWith({
        left: {
          type: 'edgePanel',
          id: 'L',
          size: 20,
          tabs: [{ id: 'l', data: {} }],
        },
      }),
    );
    const resized = tilerySetEdgePanelSize(state, 'L', 35);
    const panel = resized.panels.L;
    expect(panel?.kind === 'edge' ? panel.edge.size : null).toBeCloseTo(35, 5);
    // An unchanged size returns the same reference.
    expect(tilerySetEdgePanelSize(resized, 'L', 35)).toBe(resized);
  });
});

describe('tileryNormalizeEdgePanelOrders', () => {
  it('rewrites a stale edge order and keeps a correct one by reference', () => {
    const state = tileryCreateInitialState(
      rootWith({
        left: {
          type: 'edgePanel',
          id: 'L',
          size: 20,
          tabs: [{ id: 'l', data: {} }],
        },
      }),
    );

    // Already normalized => same reference.
    expect(tileryNormalizeEdgePanelOrders(state)).toBe(state);

    // A different-length stale order is replaced with the derived order.
    const stale = { ...state, edgePanelOrder: ['L', 'ghost'] };
    const fixed = tileryNormalizeEdgePanelOrders(stale);
    expect(fixed).not.toBe(stale);
    expect(fixed.edgePanelOrder).toEqual(tileryEdgePanelOrderFromState(state));
  });
});
