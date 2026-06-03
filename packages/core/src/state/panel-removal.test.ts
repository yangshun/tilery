import { describe, expect, it } from 'vite-plus/test';
import type { TileryInset, TileryLayoutState } from '../types';
import { tileryFloatPanel } from './floating';
import { tileryRemovePanel } from './panels';
import { createStateFromPanels } from './test-helpers';

// Investigation (audit Tier 3 #10): does the surviving-panel inset repair after
// removing a tiled panel match the repair done when the same panel is floated
// out? Removal and float each branch on `state.layout`: with a layout tree both
// use tileryRemovePanelFromLayout + tilerySyncLayoutPanels; in flat mode both use
// tileryFindRemovalFillers. These tests pin that the two paths agree.

function tiledInsets(state: TileryLayoutState): Record<string, TileryInset> {
  const result: Record<string, TileryInset> = {};
  for (const [id, panel] of Object.entries(state.panels)) {
    if (panel?.kind === 'tiled') result[id] = panel.inset;
  }
  return result;
}

// Left column (A) + right column split into B (top) and C (bottom).
function threePanelState(): TileryLayoutState {
  return createStateFromPanels({
    panels: [
      {
        id: 'A',
        inset: { top: 0, right: 50, bottom: 0, left: 0 },
        tabs: [{ data: 1 }],
      },
      {
        id: 'B',
        inset: { top: 0, right: 0, bottom: 50, left: 50 },
        tabs: [{ data: 2 }],
      },
      {
        id: 'C',
        inset: { top: 50, right: 0, bottom: 0, left: 50 },
        tabs: [{ data: 3 }],
      },
    ],
  });
}

describe('panel removal vs float survivor parity', () => {
  it('layout-tree mode: removing B repairs survivors the same as floating B', () => {
    const state = threePanelState();
    expect(state.layout).not.toBeNull();
    const removed = tileryRemovePanel(state, 'B');
    const floated = tileryFloatPanel(state, 'B');
    expect(tiledInsets(removed)).toEqual(tiledInsets(floated));
  });

  it('layout-tree mode: removing A repairs survivors the same as floating A', () => {
    const state = threePanelState();
    const removed = tileryRemovePanel(state, 'A');
    const floated = tileryFloatPanel(state, 'A');
    expect(tiledInsets(removed)).toEqual(tiledInsets(floated));
  });

  it('flat mode (no layout tree): removing B repairs survivors the same as floating B', () => {
    const state = { ...threePanelState(), layout: null };
    const removed = tileryRemovePanel(state, 'B');
    const floated = tileryFloatPanel(state, 'B');
    expect(tiledInsets(removed)).toEqual(tiledInsets(floated));
  });

  it('removing B leaves C filling the freed bottom-right region', () => {
    const removed = tileryRemovePanel(threePanelState(), 'B');
    // C originally occupied the bottom-right; after B is gone it should expand
    // up to cover the whole right column.
    expect(removed.panels['C']?.inset).toEqual({
      top: 0,
      right: 0,
      bottom: 0,
      left: 50,
    });
    expect(removed.panels['A']?.inset).toEqual({
      top: 0,
      right: 50,
      bottom: 0,
      left: 0,
    });
  });
});
