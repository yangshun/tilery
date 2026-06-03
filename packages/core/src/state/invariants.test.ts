import { describe, expect, it } from 'vite-plus/test';
import { makeTileryController } from './controller';
import { tileryCreateInitialState, tileryReducer } from './reducer';
import {
  tileryFloatingPanelOrderFromState,
  tileryPanelOrderFromLayout,
  tileryPanelOrderFromState,
} from './layout-tree';
import { tileryEdgePanelOrderFromState } from './edges';
import type {
  TileryController,
  TileryDirection,
  TileryInitialLayout,
  TileryLayoutSnapshot,
  TileryLayoutState,
} from '../types';

// These are whole-system property tests. The hand-written suites prove each
// reducer action in isolation; this proves that ANY interleaving of the
// high-level controller API leaves the state structurally consistent. It is
// the controller-level analogue of the geometric fuzz in layout-math.test.ts
// (which only splits + resizes a single tiled tree) — here we also float,
// dock, popout, move, swap, maximize, and remove across tiled/edge/floating
// panels, which is where cross-subsystem corruption would hide.

function lcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x1_0000_0000;
  };
}

function pick<T>(rand: () => number, items: readonly T[]): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(rand() * items.length)];
}

const DIRECTIONS: TileryDirection[] = ['left', 'right', 'top', 'bottom'];

// A layout that exercises every panel kind from the first op: a constrained
// tiled panel, a locked tiled panel, an edge panel, a plain floating panel,
// and a popped-out floating panel.
function richInitialLayout(): TileryInitialLayout {
  return {
    type: 'root',
    main: {
      type: 'group',
      direction: 'horizontal',
      children: [
        {
          type: 'panel',
          id: 'A',
          size: 30,
          minSize: 10,
          maxSize: 70,
          tabs: [{ id: 'a1', data: { n: 'a1' } }],
        },
        {
          type: 'panel',
          id: 'B',
          size: 70,
          locked: true,
          tabs: [
            { id: 'b1', data: { n: 'b1' } },
            { id: 'b2', data: { n: 'b2' } },
          ],
        },
      ],
    },
    edges: {
      left: {
        type: 'edgePanel',
        id: 'L',
        size: 18,
        tabs: [{ id: 'l1', data: { n: 'l1' } }],
      },
    },
    floating: [
      {
        type: 'floatingPanel',
        id: 'F',
        bounds: { x: 12, y: 12, width: 220, height: 160 },
        tabs: [{ id: 'f1', data: { n: 'f1' } }],
      },
      {
        type: 'floatingPanel',
        id: 'G',
        bounds: { x: 60, y: 80, width: 200, height: 150 },
        popout: true,
        tabs: [{ id: 'g1', data: { n: 'g1' } }],
      },
    ],
  };
}

function createController(initial: TileryInitialLayout): TileryController {
  let state = tileryCreateInitialState(initial);
  return makeTileryController(
    () => state,
    (action) => {
      state = tileryReducer(state, action);
    },
  );
}

// The structural contract every state must satisfy after every operation.
// Returns a list of human-readable violations (empty = healthy).
function invariantErrors(state: TileryLayoutState): string[] {
  const errors: string[] = [];
  const panelIds = Object.keys(state.panels);
  const tabIds = Object.keys(state.tabs);

  const tabOwners = new Map<string, string>();
  for (const panelId of panelIds) {
    const panel = state.panels[panelId]!;

    // A panel always owns at least one tab; emptied panels are pruned.
    if (panel.tabs.length === 0) {
      errors.push(`panel ${panelId} has no tabs`);
    }

    // The active tab is null only for an empty panel, else it is one of ours.
    if (panel.tabs.length > 0) {
      if (panel.activeTabId === null) {
        errors.push(`panel ${panelId} has tabs but no active tab`);
      } else if (!panel.tabs.includes(panel.activeTabId)) {
        errors.push(
          `panel ${panelId} active tab ${panel.activeTabId} is foreign`,
        );
      }
    }

    for (const tabId of panel.tabs) {
      const tab = state.tabs[tabId];
      if (!tab) {
        errors.push(`panel ${panelId} lists missing tab ${tabId}`);
        continue;
      }
      if (tab.panelId !== panelId) {
        errors.push(
          `tab ${tabId} listed by ${panelId} but owned by ${tab.panelId}`,
        );
      }
      const seenOwner = tabOwners.get(tabId);
      if (seenOwner !== undefined) {
        errors.push(`tab ${tabId} shared by ${seenOwner} and ${panelId}`);
      }
      tabOwners.set(tabId, panelId);
    }
  }

  // Every tab is owned by a panel that lists it (no orphans, no dangling refs).
  for (const tabId of tabIds) {
    const tab = state.tabs[tabId]!;
    const owner = state.panels[tab.panelId];
    if (!owner) {
      errors.push(`tab ${tabId} points to missing panel ${tab.panelId}`);
    } else if (!owner.tabs.includes(tabId)) {
      errors.push(`tab ${tabId} not listed by owner ${tab.panelId}`);
    }
  }

  // The three panel orders partition the panel set exactly: every panel is
  // classified once, by its kind, with no overlaps and nothing missing.
  const tiled = tileryPanelOrderFromState(state);
  const edge = tileryEdgePanelOrderFromState(state);
  const floating = tileryFloatingPanelOrderFromState(state);
  const union = [...tiled, ...edge, ...floating];
  if (union.length !== new Set(union).size) {
    errors.push(`panel orders overlap: [${union.join(', ')}]`);
  }
  if (new Set(union).size !== panelIds.length) {
    errors.push(
      `panel orders cover ${new Set(union).size}/${panelIds.length} panels`,
    );
  }
  for (const id of tiled) {
    if (state.panels[id]?.kind !== 'tiled') {
      errors.push(`${id} in tiled order but kind=${state.panels[id]?.kind}`);
    }
  }
  for (const id of edge) {
    if (state.panels[id]?.kind !== 'edge') {
      errors.push(`${id} in edge order but kind=${state.panels[id]?.kind}`);
    }
  }
  for (const id of floating) {
    if (state.panels[id]?.kind !== 'floating') {
      errors.push(`${id} in floating order but kind=${state.panels[id]?.kind}`);
    }
  }

  // The tiled layout tree's leaves are exactly the tiled panels. If any tiled
  // panel exists, the tree must too.
  if (tiled.length > 0 && !state.layout) {
    errors.push('tiled panels exist but the layout tree is null');
  }
  if (state.layout) {
    const leaves = tileryPanelOrderFromLayout(state.layout);
    if (leaves.length !== new Set(leaves).size) {
      errors.push(`layout tree has duplicate leaves: [${leaves.join(', ')}]`);
    }
    for (const leaf of leaves) {
      const panel = state.panels[leaf];
      if (!panel) errors.push(`layout leaf ${leaf} has no panel`);
      else if (panel.kind !== 'tiled') {
        errors.push(`layout leaf ${leaf} is kind=${panel.kind}`);
      }
    }
    for (const id of tiled) {
      if (!leaves.includes(id)) {
        errors.push(`tiled panel ${id} is missing from the layout tree`);
      }
    }
  }

  // At most one panel may be fullscreen (maximizing one restores the rest).
  const fullscreen = panelIds.filter((id) => state.panels[id]!.fullScreen);
  if (fullscreen.length > 1) {
    errors.push(`multiple fullscreen panels: [${fullscreen.join(', ')}]`);
  }

  // Kind-tagged data is present for the kinds that require it.
  for (const id of panelIds) {
    const panel = state.panels[id]!;
    if (panel.kind === 'floating' && !panel.floating) {
      errors.push(`floating panel ${id} has no bounds`);
    }
    if (panel.kind === 'edge' && !panel.edge) {
      errors.push(`edge panel ${id} has no edge placement`);
    }
  }

  return errors;
}

// Reading every public accessor doubles as a smoke test: the controller's
// lazy getters must never throw for a live panel/tab regardless of kind.
function touchAccessors(controller: TileryController): void {
  for (const panel of controller.getPanels()) {
    void panel.kind;
    void panel.inset;
    void panel.edge;
    void panel.edgeSize;
    void panel.edgeDefaultSize;
    void panel.floating;
    void panel.floatingBounds;
    void panel.floatingZIndex;
    void panel.poppedOut;
    void panel.popoutWindowBounds;
    void panel.fullScreen;
    void panel.minSize;
    void panel.maxSize;
    void panel.activeTab;
    for (const tab of panel.tabs) {
      void tab.index;
      void tab.data;
      void tab.closable;
      void tab.draggable;
      void tab.panel.id;
    }
  }
}

function step(
  rand: () => number,
  controller: TileryController,
  seq: number,
): void {
  const state = controller.getState();
  const panels = Object.keys(state.panels);
  const tabs = Object.keys(state.tabs);
  const tiled = tileryPanelOrderFromState(state);
  const floating = tileryFloatingPanelOrderFromState(state);
  const data = { n: `s${seq}` };

  switch (Math.floor(rand() * 16)) {
    case 0: {
      const id = pick(rand, tiled);
      if (id) {
        controller.splitPanel(id, pick(rand, DIRECTIONS)!, {
          size: 20 + Math.floor(rand() * 60),
          tabs: [{ data }],
        });
      }
      break;
    }
    case 1: {
      const id = pick(rand, panels);
      if (id) controller.appendTab(id, { data });
      break;
    }
    case 2: {
      const id = pick(rand, panels);
      if (id) {
        const count = state.panels[id]!.tabs.length;
        controller.insertTab(id, { data }, Math.floor(rand() * (count + 1)));
      }
      break;
    }
    case 3: {
      const id = pick(rand, tabs);
      if (id) controller.removeTab(id);
      break;
    }
    case 4: {
      const id = pick(rand, tabs);
      const target = pick(rand, panels);
      if (id && target) controller.moveTab(id, { panel: target });
      break;
    }
    case 5: {
      const id = pick(rand, tabs);
      const ref = pick(rand, tabs);
      if (id && ref && id !== ref) {
        controller.moveTab(
          id,
          rand() < 0.5 ? { beforeTab: ref } : { afterTab: ref },
        );
      }
      break;
    }
    case 6: {
      const id = pick(rand, tabs);
      const target = pick(rand, tiled);
      if (id && target) {
        controller.moveTab(id, {
          splitPanel: target,
          direction: pick(rand, DIRECTIONS)!,
          size: 30 + Math.floor(rand() * 40),
        });
      }
      break;
    }
    case 7: {
      const id = pick(rand, tabs);
      if (id) {
        controller.moveTab(id, {
          splitRoot: true,
          direction: pick(rand, DIRECTIONS)!,
        });
      }
      break;
    }
    case 8: {
      const id = pick(rand, tiled);
      if (id)
        controller.floatPanel(id, { x: 20, y: 20, width: 240, height: 180 });
      break;
    }
    case 9: {
      const id = pick(rand, floating);
      if (id) controller.dockPanel(id);
      break;
    }
    case 10: {
      const id = pick(rand, floating);
      if (id) {
        if (rand() < 0.5) controller.popoutPanel(id);
        else controller.returnPanelToFloating(id);
      }
      break;
    }
    case 11: {
      const id = pick(rand, panels);
      if (id) {
        if (rand() < 0.5) controller.maximizePanel(id);
        else controller.restorePanel(id);
      }
      break;
    }
    case 12: {
      const a = pick(rand, panels);
      const b = pick(rand, panels);
      if (a && b && a !== b) controller.swapPanels(a, b);
      break;
    }
    case 13: {
      const id = pick(rand, tabs);
      if (id)
        controller.floatTab(id, {
          bounds: { x: 8, y: 8, width: 180, height: 140 },
        });
      break;
    }
    case 14: {
      const id = pick(rand, tabs);
      if (id) controller.setActiveTab(id);
      break;
    }
    case 15: {
      const id = pick(rand, tabs);
      if (id) {
        controller.setTabBehavior(id, {
          closable: rand() < 0.5,
          draggable: rand() < 0.5,
        });
      }
      break;
    }
  }
}

describe('controller invariants — deterministic random fuzz', () => {
  for (const seed of [1, 7, 42, 99, 2024]) {
    it(`seed ${seed}: 250 random controller operations keep the state consistent`, () => {
      const rand = lcg(seed);
      const controller = createController(richInitialLayout());
      expect(invariantErrors(controller.getState())).toEqual([]);

      for (let i = 0; i < 250; i++) {
        step(rand, controller, i);
        const violations = invariantErrors(controller.getState());
        expect(violations, `after op ${i} (seed ${seed})`).toEqual([]);
        touchAccessors(controller);

        // Periodically round-trip through a JSON snapshot: serialization must
        // preserve both the invariants and the exact panel/tab identities.
        if (i % 40 === 39) {
          const before = controller.getState();
          const tabIdsBefore = new Set(Object.keys(before.tabs));
          const panelIdsBefore = new Set(Object.keys(before.panels));
          const snapshot = JSON.parse(
            JSON.stringify(controller.getLayout()),
          ) as TileryLayoutSnapshot;
          controller.setLayout(snapshot);
          const after = controller.getState();
          expect(invariantErrors(after), `round-trip after op ${i}`).toEqual(
            [],
          );
          expect(new Set(Object.keys(after.tabs))).toEqual(tabIdsBefore);
          expect(new Set(Object.keys(after.panels))).toEqual(panelIdsBefore);
        }
      }
    });
  }

  it('survives draining every tab from a rich layout to the empty state', () => {
    const rand = lcg(123);
    const controller = createController(richInitialLayout());
    let guard = 0;
    while (controller.getTabs().length > 0 && guard++ < 500) {
      const ids = controller.getTabs().map((t) => t.id);
      controller.removeTab(pick(rand, ids)!);
      expect(invariantErrors(controller.getState())).toEqual([]);
    }
    expect(controller.getPanels()).toHaveLength(0);
    expect(controller.getLayout()).toEqual({ type: 'empty' });
  });
});

describe('snapshot round-trip fidelity', () => {
  // A layout that uses every serializable feature at once. Tilery serializes
  // size CONSTRAINTS (minSize/maxSize) and explicit behavior flags, which some
  // docking libraries (e.g. Dockview) deliberately drop from toJSON — so the
  // round-trip is a guarantee worth pinning down, not an accident.
  function comprehensiveLayout(): TileryInitialLayout {
    return {
      type: 'root',
      main: {
        type: 'group',
        direction: 'vertical',
        children: [
          {
            type: 'group',
            direction: 'horizontal',
            children: [
              {
                type: 'panel',
                id: 'sidebar',
                size: 25,
                defaultSize: 25,
                minSize: 15,
                maxSize: 40,
                tabs: [{ id: 'explorer', data: { title: 'Explorer' } }],
              },
              {
                type: 'panel',
                id: 'editor',
                size: 75,
                locked: true,
                activeTabId: 'file-b',
                tabs: [
                  { id: 'file-a', data: { title: 'a.ts' }, closable: false },
                  { id: 'file-b', data: { title: 'b.ts' } },
                ],
              },
            ],
          },
          {
            type: 'panel',
            id: 'terminal',
            size: 30,
            minSize: '120px',
            fullScreen: true,
            tabs: [{ id: 'shell', data: { title: 'zsh' }, draggable: false }],
          },
        ],
      },
      edges: {
        left: {
          type: 'edgePanel',
          id: 'activity',
          size: 16,
          defaultSize: 16,
          minSize: 8,
          tabs: [{ id: 'search', data: { title: 'Search' } }],
        },
        bottom: {
          type: 'edgePanel',
          id: 'problems',
          size: 22,
          tabs: [{ id: 'lint', data: { title: 'Problems' } }],
        },
      },
      floating: [
        {
          type: 'floatingPanel',
          id: 'inspector',
          bounds: { x: 40, y: 40, width: 280, height: 220 },
          zIndex: 3,
          tabs: [{ id: 'props', data: { title: 'Properties' } }],
        },
        {
          type: 'floatingPanel',
          id: 'preview',
          bounds: { x: 120, y: 90, width: 320, height: 240 },
          zIndex: 5,
          locked: true,
          popout: {
            windowBounds: { left: 200, top: 150, width: 400, height: 300 },
          },
          tabs: [{ id: 'live', data: { title: 'Live Preview' } }],
        },
      ],
    };
  }

  function createController(initial: TileryInitialLayout): TileryController {
    let state = tileryCreateInitialState(initial);
    return makeTileryController(
      () => state,
      (action) => {
        state = tileryReducer(state, action);
      },
    );
  }

  function collectPanels(
    snapshot: TileryLayoutSnapshot,
  ): Record<string, Record<string, unknown>> {
    const out: Record<string, Record<string, unknown>> = {};
    const walkDocked = (
      node: TileryLayoutSnapshot | { type: 'empty' },
    ): void => {
      if (!('type' in node)) return;
      if (node.type === 'panel' && node.id) out[node.id] = node;
      else if (node.type === 'group') node.children.forEach(walkDocked);
    };
    if (snapshot.type === 'root') {
      walkDocked(snapshot.main);
      for (const edge of Object.values(snapshot.edges ?? {})) {
        if (edge?.id) out[edge.id] = edge;
      }
      for (const floating of snapshot.floating) {
        if (floating.id) out[floating.id] = floating;
      }
    } else {
      walkDocked(snapshot);
    }
    return out;
  }

  it('round-trips a JSON snapshot as an exact fixed point', () => {
    const controller = createController(comprehensiveLayout());

    // JSON is the real persistence boundary: stringify + parse must not lose
    // anything the snapshot relies on.
    const roundTrip = (snap: TileryLayoutSnapshot) => {
      controller.setLayout(JSON.parse(JSON.stringify(snap)));
      return controller.getLayout<{ title: string }>();
    };

    const first = controller.getLayout<{ title: string }>();
    const second = roundTrip(first);

    // getLayout() is a fixed point from the very first read: derived sizes have
    // their defaultSize resolved up front, so a save/restore cycle is a no-op.
    expect(second).toEqual(first);
  });

  it('preserves constraints, locks, fullscreen, edges, and popout metadata', () => {
    const controller = createController(comprehensiveLayout());
    const snapshot = controller.getLayout<{ title: string }>();
    expect(snapshot.type).toBe('root');

    const panels = collectPanels(snapshot);

    // Size constraints survive serialization (the Dockview-beating guarantee).
    expect(panels.sidebar).toMatchObject({
      minSize: 15,
      maxSize: 40,
      defaultSize: 25,
    });
    expect(panels.terminal).toMatchObject({
      minSize: '120px',
      fullScreen: true,
    });
    expect(panels.activity).toMatchObject({ minSize: 8, defaultSize: 16 });

    // `locked` expands to explicit behavior booleans (snapshots never emit `locked`).
    expect(panels.editor).toMatchObject({
      resizable: false,
      draggable: false,
      droppable: false,
    });
    expect(panels.editor).not.toHaveProperty('locked');

    // Per-tab behavior round-trips.
    const editorTabs = panels.editor.tabs as Array<Record<string, unknown>>;
    expect(editorTabs.find((t) => t.id === 'file-a')).toMatchObject({
      closable: false,
    });
    expect(panels.editor.activeTabId).toBe('file-b');

    // Edges keyed by side, with sizes and constraints.
    if (snapshot.type === 'root') {
      expect(Object.keys(snapshot.edges ?? {}).sort()).toEqual([
        'bottom',
        'left',
      ]);
      expect(snapshot.floating).toHaveLength(2);
    }

    // Popout window metadata is retained for the popped-out floating panel.
    expect(panels.preview).toMatchObject({
      popout: {
        windowBounds: { left: 200, top: 150, width: 400, height: 300 },
      },
      resizable: false,
    });
  });
});
