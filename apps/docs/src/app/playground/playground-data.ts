// Shared, pure (no-JSX) data + helpers for the Playground page: the tab data
// shape, the default layout, swappable layout presets, theme presets, and the
// snapshot-walking helpers the inspector uses to read and patch panel config.
//
// Why snapshot helpers? Tab behavior (closable/draggable) is runtime-settable
// via tab.setBehavior(), but panel behavior (resizable/draggable/droppable) and
// min/max size are init-only — there is no setPanelBehavior on the controller.
// To toggle them at runtime we round-trip through getLayout() -> patch the panel
// node -> setLayout(). Snapshots preserve ids, so every panel/tab we create gets
// an explicit id and these lookups stay stable.

import type { CSSProperties } from 'react';
import type {
  TileryDockedLayoutSnapshot,
  TileryEdge,
  TileryEdgePanelSnapshot,
  TileryFloatingPanelSnapshot,
  TileryInitialLayout,
  TileryLayoutSnapshot,
  TileryPanelSnapshot,
  TileryRootSnapshot,
  TilerySize,
} from '@tileryjs/react';

// ---------------------------------------------------------------------------
// Tab data
// ---------------------------------------------------------------------------

export type PgTabKind =
  | 'editor'
  | 'terminal'
  | 'files'
  | 'preview'
  | 'notes'
  | 'output';

export type PgTabData = {
  title: string;
  kind: PgTabKind;
};

/** Order new tabs cycle through when the user clicks "Add tab". */
export const PG_TAB_KINDS: PgTabKind[] = [
  'editor',
  'terminal',
  'notes',
  'preview',
  'files',
  'output',
];

export const PG_KIND_LABEL: Record<PgTabKind, string> = {
  editor: 'Editor',
  terminal: 'Terminal',
  files: 'Files',
  preview: 'Preview',
  notes: 'Notes',
  output: 'Output',
};

// ---------------------------------------------------------------------------
// Layouts + presets
// ---------------------------------------------------------------------------

type Layout = TileryInitialLayout<PgTabData>;

const defaultLayout: Layout = {
  type: 'group',
  direction: 'horizontal',
  children: [
    {
      type: 'panel',
      id: 'sidebar',
      size: 24,
      tabs: [{ id: 'files', data: { title: 'Files', kind: 'files' } }],
    },
    {
      type: 'group',
      direction: 'vertical',
      size: 76,
      children: [
        {
          type: 'panel',
          id: 'editor',
          size: 68,
          activeTabId: 'main-ts',
          tabs: [
            { id: 'main-ts', data: { title: 'main.ts', kind: 'editor' } },
            { id: 'styles-css', data: { title: 'styles.css', kind: 'editor' } },
          ],
        },
        {
          type: 'panel',
          id: 'terminal',
          size: 32,
          tabs: [
            {
              id: 'terminal-tab',
              data: { title: 'Terminal', kind: 'terminal' },
            },
          ],
        },
      ],
    },
  ],
};

const ideLayout: Layout = {
  type: 'root',
  edges: {
    left: {
      type: 'edgePanel',
      id: 'edge-explorer',
      size: 20,
      tabs: [{ id: 'explorer', data: { title: 'Explorer', kind: 'files' } }],
    },
    bottom: {
      type: 'edgePanel',
      id: 'edge-output',
      size: 26,
      tabs: [
        { id: 'output', data: { title: 'Output', kind: 'output' } },
        { id: 'ide-terminal', data: { title: 'Terminal', kind: 'terminal' } },
      ],
    },
  },
  main: {
    type: 'group',
    direction: 'horizontal',
    children: [
      {
        type: 'panel',
        id: 'ide-editor',
        size: 64,
        activeTabId: 'ide-main',
        tabs: [
          { id: 'ide-main', data: { title: 'index.tsx', kind: 'editor' } },
          { id: 'ide-readme', data: { title: 'README.md', kind: 'notes' } },
        ],
      },
      {
        type: 'panel',
        id: 'ide-preview',
        size: 36,
        tabs: [
          {
            id: 'ide-preview-tab',
            data: { title: 'Preview', kind: 'preview' },
          },
        ],
      },
    ],
  },
};

const dashboardLayout: Layout = {
  type: 'group',
  direction: 'vertical',
  children: [
    {
      type: 'group',
      direction: 'horizontal',
      size: 50,
      children: [
        {
          type: 'panel',
          id: 'metrics',
          size: 50,
          tabs: [
            { id: 'metrics-tab', data: { title: 'Metrics', kind: 'preview' } },
          ],
        },
        {
          type: 'panel',
          id: 'traffic',
          size: 50,
          tabs: [
            { id: 'traffic-tab', data: { title: 'Traffic', kind: 'preview' } },
          ],
        },
      ],
    },
    {
      type: 'group',
      direction: 'horizontal',
      size: 50,
      children: [
        {
          type: 'panel',
          id: 'logs',
          size: 60,
          tabs: [{ id: 'logs-tab', data: { title: 'Logs', kind: 'output' } }],
        },
        {
          type: 'panel',
          id: 'activity',
          size: 40,
          tabs: [
            { id: 'activity-tab', data: { title: 'Activity', kind: 'notes' } },
          ],
        },
      ],
    },
  ],
};

const floatingLayout: Layout = {
  type: 'root',
  main: {
    type: 'group',
    direction: 'horizontal',
    children: [
      {
        type: 'panel',
        id: 'float-nav',
        size: 28,
        tabs: [{ id: 'float-files', data: { title: 'Files', kind: 'files' } }],
      },
      {
        type: 'panel',
        id: 'float-editor',
        size: 72,
        tabs: [{ id: 'float-main', data: { title: 'app.ts', kind: 'editor' } }],
      },
    ],
  },
  floating: [
    {
      type: 'floatingPanel',
      id: 'float-inspector',
      bounds: { x: 52, y: 14, width: 38, height: 48 },
      tabs: [
        {
          id: 'float-inspect-tab',
          data: { title: 'Inspector', kind: 'notes' },
        },
      ],
    },
  ],
};

export type PgPreset = { id: string; label: string; layout: Layout };

export const PG_DEFAULT_LAYOUT = defaultLayout;

export const PG_PRESETS: PgPreset[] = [
  { id: 'default', label: 'Default', layout: defaultLayout },
  { id: 'ide', label: 'IDE + edges', layout: ideLayout },
  { id: 'dashboard', label: 'Dashboard', layout: dashboardLayout },
  { id: 'floating', label: 'Floating', layout: floatingLayout },
];

// ---------------------------------------------------------------------------
// Theme presets (reused from the Themes example; proven --tilery-* sets)
// ---------------------------------------------------------------------------

export type PgThemeStyle = CSSProperties & Record<`--${string}`, string>;

export type PgTheme = { id: string; label: string; style: PgThemeStyle };

const pageAccentVars = {
  '--tilery-accent': 'var(--site-workspace-accent)',
  '--tilery-drop-bg':
    'color-mix(in srgb, var(--site-workspace-accent), transparent 84%)',
  '--tilery-drop-border':
    'color-mix(in srgb, var(--site-workspace-accent), transparent 42%)',
  '--tilery-resize-handle-active-bg':
    'color-mix(in srgb, var(--site-workspace-accent), transparent 40%)',
} satisfies Record<`--${string}`, string>;

export const PG_THEMES: PgTheme[] = [
  {
    id: 'default',
    label: 'Default',
    style: { colorScheme: 'dark', ...pageAccentVars },
  },
  {
    id: 'light',
    label: 'Light',
    style: {
      colorScheme: 'light',
      '--tilery-bg': '#f4f6fb',
      '--tilery-fg': '#1f2937',
      '--tilery-panel-bg': '#ffffff',
      '--tilery-panel-border': '#d8dee8',
      '--tilery-tabbar-bg': '#edf1f7',
      '--tilery-tab-fg': '#667085',
      '--tilery-tab-active-bg': '#ffffff',
      '--tilery-tab-active-fg': '#111827',
      '--tilery-tab-hover-bg': '#e2e8f2',
      '--tilery-menu-bg': '#ffffff',
      '--tilery-action-hover-bg': '#e5ebf4',
      ...pageAccentVars,
    },
  },
  {
    id: 'dracula',
    label: 'Dracula',
    style: {
      colorScheme: 'dark',
      '--tilery-bg': '#191a21',
      '--tilery-fg': '#f8f8f2',
      '--tilery-panel-bg': '#282a36',
      '--tilery-panel-border': '#44475a',
      '--tilery-tabbar-bg': '#21222c',
      '--tilery-tab-fg': '#bdc0d6',
      '--tilery-tab-active-bg': '#343746',
      '--tilery-tab-active-fg': '#ffffff',
      '--tilery-tab-hover-bg': '#303241',
      '--tilery-menu-bg': '#282a36',
      '--tilery-action-hover-bg': '#3a3d4f',
      ...pageAccentVars,
    },
  },
  {
    id: 'replit',
    label: 'Replit',
    style: {
      colorScheme: 'dark',
      '--tilery-bg': '#0e1525',
      '--tilery-fg': '#f5f9fc',
      '--tilery-panel-bg': '#1c2333',
      '--tilery-panel-border': '#30394f',
      '--tilery-tabbar-bg': '#131b2c',
      '--tilery-tab-fg': '#a5adba',
      '--tilery-tab-active-bg': '#20283a',
      '--tilery-tab-active-fg': '#ffffff',
      '--tilery-tab-hover-bg': '#26314a',
      '--tilery-menu-bg': '#1c2333',
      '--tilery-action-hover-bg': '#2a344a',
      ...pageAccentVars,
    },
  },
  {
    id: 'abyss',
    label: 'Abyss',
    style: {
      colorScheme: 'dark',
      '--tilery-bg': '#000c18',
      '--tilery-fg': '#d7ecff',
      '--tilery-panel-bg': '#001b33',
      '--tilery-panel-border': '#123a58',
      '--tilery-tabbar-bg': '#001426',
      '--tilery-tab-fg': '#8db9d6',
      '--tilery-tab-active-bg': '#002440',
      '--tilery-tab-active-fg': '#f4fbff',
      '--tilery-tab-hover-bg': '#052b4a',
      '--tilery-menu-bg': '#02243f',
      '--tilery-action-hover-bg': '#0b3555',
      ...pageAccentVars,
    },
  },
];

// ---------------------------------------------------------------------------
// Snapshot helpers
// ---------------------------------------------------------------------------

type Snapshot = TileryLayoutSnapshot<PgTabData>;
type AnyPanelSnapshot =
  | TileryPanelSnapshot<PgTabData>
  | TileryEdgePanelSnapshot<PgTabData>
  | TileryFloatingPanelSnapshot<PgTabData>;

/** Flattened, inspector-friendly view of one panel from a snapshot. */
export type PgPanelEntry = {
  id: string;
  container: 'tiled' | 'edge' | 'floating';
  kindLabel: string;
  resizable: boolean;
  draggable: boolean;
  droppable: boolean;
  fullScreen: boolean;
  poppedOut: boolean;
  minSize?: TilerySize;
  maxSize?: TilerySize;
  tabs: Array<{
    id: string;
    title: string;
    kind: PgTabKind;
    closable: boolean;
    draggable: boolean;
  }>;
};

function isRoot(snapshot: Snapshot): snapshot is TileryRootSnapshot<PgTabData> {
  return (snapshot as { type?: string }).type === 'root';
}

function toEntry(
  node: AnyPanelSnapshot,
  container: PgPanelEntry['container'],
  kindLabel: string,
): PgPanelEntry {
  return {
    id: node.id ?? '',
    container,
    kindLabel,
    resizable: node.resizable,
    draggable: node.draggable,
    droppable: node.droppable,
    fullScreen: node.fullScreen ?? false,
    poppedOut:
      container === 'floating' &&
      !!(node as TileryFloatingPanelSnapshot<PgTabData>).popout,
    minSize: node.minSize,
    maxSize: node.maxSize,
    tabs: node.tabs
      .filter((tab) => typeof tab.id === 'string')
      .map((tab) => ({
        id: tab.id as string,
        title: tab.data.title,
        kind: tab.data.kind,
        closable: tab.closable,
        draggable: tab.draggable,
      })),
  };
}

function walkDocked(
  node: TileryDockedLayoutSnapshot<PgTabData>,
  out: PgPanelEntry[],
): void {
  if (node.type === 'panel') {
    out.push(toEntry(node, 'tiled', 'Tiled'));
  } else if (node.type === 'group') {
    for (const child of node.children) walkDocked(child, out);
  }
}

/** All panels in a snapshot as flat entries: main tree, then edges, then floating. */
export function collectPanels(snapshot: Snapshot): PgPanelEntry[] {
  const out: PgPanelEntry[] = [];
  if (isRoot(snapshot)) {
    walkDocked(snapshot.main, out);
    if (snapshot.edges) {
      for (const side of Object.keys(snapshot.edges) as TileryEdge[]) {
        const panel = snapshot.edges[side];
        if (panel) out.push(toEntry(panel, 'edge', `Edge · ${side}`));
      }
    }
    for (const panel of snapshot.floating) {
      out.push(toEntry(panel, 'floating', 'Floating'));
    }
  } else {
    walkDocked(snapshot, out);
  }
  return out.filter((entry) => entry.id !== '');
}

function findDocked(
  node: TileryDockedLayoutSnapshot<PgTabData>,
  id: string,
): AnyPanelSnapshot | null {
  if (node.type === 'panel') return node.id === id ? node : null;
  if (node.type === 'group') {
    for (const child of node.children) {
      const found = findDocked(child, id);
      if (found) return found;
    }
  }
  return null;
}

/** Locate a mutable panel node in a snapshot by id (or null). */
export function findPanelNode(
  snapshot: Snapshot,
  id: string,
): AnyPanelSnapshot | null {
  if (isRoot(snapshot)) {
    const main = findDocked(snapshot.main, id);
    if (main) return main;
    if (snapshot.edges) {
      for (const side of Object.keys(snapshot.edges) as TileryEdge[]) {
        const panel = snapshot.edges[side];
        if (panel?.id === id) return panel;
      }
    }
    return snapshot.floating.find((panel) => panel.id === id) ?? null;
  }
  return findDocked(snapshot, id);
}

export type PgPanelPatch = {
  resizable?: boolean;
  draggable?: boolean;
  droppable?: boolean;
  // `null` clears the constraint; a value sets it; omitted leaves it alone.
  minSize?: TilerySize | null;
  maxSize?: TilerySize | null;
};

/** Mutate a snapshot in place, patching one panel's behavior/size. Returns true if found. */
export function patchPanelInSnapshot(
  snapshot: Snapshot,
  id: string,
  patch: PgPanelPatch,
): boolean {
  const node = findPanelNode(snapshot, id);
  if (!node) return false;
  if (patch.resizable !== undefined) node.resizable = patch.resizable;
  if (patch.draggable !== undefined) node.draggable = patch.draggable;
  if (patch.droppable !== undefined) node.droppable = patch.droppable;
  if (patch.minSize !== undefined) {
    if (patch.minSize === null) delete node.minSize;
    else node.minSize = patch.minSize;
  }
  if (patch.maxSize !== undefined) {
    if (patch.maxSize === null) delete node.maxSize;
    else node.maxSize = patch.maxSize;
  }
  return true;
}
