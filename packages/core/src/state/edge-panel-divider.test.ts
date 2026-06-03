import { describe, expect, it } from 'vite-plus/test';
import type { TileryGroupInit } from '../types';
import {
  tileryClampDividerPosition,
  tileryDeriveDividers,
} from './layout-math';
import { tileryCreateInitialState } from './reducer';

// Investigation (audit Tier 3 #7): can a large pinned edge panel let a tiled
// divider drag shrink the center below its minimum? Tiled dividers operate in the
// layout tree's own 0–100 logical space (ROOT_RECT); the divider-constraint
// derivation never reads edge-panel sizes. Edge offsets are applied at render,
// and edge resizing reserves center space separately via tileryClampEdgePanelSize.
// These tests pin that a tiled divider's clamping is unaffected by edge panels.

function mainGroup(): TileryGroupInit {
  return {
    type: 'group',
    direction: 'horizontal',
    children: [
      { type: 'panel', id: 'A', size: 50, tabs: [{ id: 'ta', data: {} }] },
      { type: 'panel', id: 'B', size: 50, tabs: [{ id: 'tb', data: {} }] },
    ],
  };
}

describe('tiled divider constraints are independent of edge panels', () => {
  it('honors tiled panel min sizes when dragged hard left, with or without a huge edge panel', () => {
    const noEdge = tileryCreateInitialState(mainGroup());
    const withEdge = tileryCreateInitialState({
      type: 'root',
      main: mainGroup(),
      edges: {
        left: {
          type: 'edgePanel',
          id: 'sidebar',
          size: 70, // very large pinned sidebar
          tabs: [{ id: 'nav', data: {} }],
        },
      },
    });

    const divNoEdge = tileryDeriveDividers(noEdge)[0]!;
    const divWithEdge = tileryDeriveDividers(withEdge)[0]!;

    // Target position 2 would shrink A to 2% (below the 10% default min). The
    // clamp stops at 10 in BOTH states — the edge panel does not change it.
    const clampedNoEdge = tileryClampDividerPosition(noEdge, divNoEdge, 2);
    const clampedWithEdge = tileryClampDividerPosition(
      withEdge,
      divWithEdge,
      2,
    );

    expect(clampedNoEdge).toBe(10);
    expect(clampedWithEdge).toBe(10);
  });

  it('clamps identically across the full range regardless of edge panel size', () => {
    const noEdge = tileryCreateInitialState(mainGroup());
    const withEdge = tileryCreateInitialState({
      type: 'root',
      main: mainGroup(),
      edges: {
        left: {
          type: 'edgePanel',
          id: 'l',
          size: 45,
          tabs: [{ id: 'lt', data: {} }],
        },
        right: {
          type: 'edgePanel',
          id: 'r',
          size: 45,
          tabs: [{ id: 'rt', data: {} }],
        },
      },
    });
    const dNo = tileryDeriveDividers(noEdge)[0]!;
    const dWith = tileryDeriveDividers(withEdge)[0]!;

    for (const target of [0, 5, 10, 30, 50, 70, 90, 95, 100]) {
      expect(tileryClampDividerPosition(withEdge, dWith, target)).toBe(
        tileryClampDividerPosition(noEdge, dNo, target),
      );
    }
  });
});
