export type DocSection = {
  heading?: string;
  body?: string[];
  code?: string;
  language?: string;
  table?: { headers: string[]; rows: string[][] };
};

export type DocPage = {
  slug: string;
  title: string;
  description: string;
  group: 'Guide' | 'Reference';
  sections: DocSection[];
};

export const docs: DocPage[] = [
  {
    slug: 'getting-started',
    title: 'Getting Started',
    description: 'Install Tilery and render your first tiling layout.',
    group: 'Guide',
    sections: [
      {
        heading: 'Installation',
        body: [
          'Install the React adapter - it includes the core package automatically.',
        ],
        code: 'npm install @tilery/react',
        language: 'sh',
      },
      {
        heading: 'Import Styles',
        body: [
          'Import the base stylesheet that provides panel chrome, tab bars, dividers, and drag overlays.',
        ],
        code: `import '@tilery/react/style.css';`,
      },
      {
        heading: 'Basic Usage',
        body: [
          'The Tilery component takes an initial layout describing your panels and tabs, plus two render functions for tab headers and content.',
        ],
        code: `import { Tilery } from '@tilery/react';
import '@tilery/react/style.css';
import type { TileryInitialLayout, TileryTabHandle } from '@tilery/react';

type MyTab = { title: string };

const layout: TileryInitialLayout<MyTab> = {
  type: 'split',
  direction: 'horizontal',
  children: [
    {
      type: 'panel',
      id: 'left',
      size: 50,
      tabs: [{ id: 'a', data: { title: 'Panel A' } }],
    },
    {
      type: 'panel',
      id: 'right',
      size: 50,
      tabs: [{ id: 'b', data: { title: 'Panel B' } }],
    },
  ],
};

function App() {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <Tilery
        initialLayout={layout}
        renderTabHeader={(tab) => <span>{tab.data.title}</span>}
        renderTabContent={(tab) => <div>{tab.data.title} content</div>}
      />
    </div>
  );
}`,
      },
      {
        heading: 'Next Steps',
        body: [
          'Learn how panels are positioned in the Concepts page, customize the look in Styling, or explore the full API reference.',
        ],
      },
    ],
  },
  {
    slug: 'concepts',
    title: 'Concepts',
    description: 'Understand how Tilery positions panels and manages state.',
    group: 'Guide',
    sections: [
      {
        heading: 'Split Tree Layouts',
        body: [
          'Initial layouts are authored as n-ary split trees. A horizontal split places children left to right; a vertical split places children top to bottom.',
          "size belongs to each child item and controls that child's allocation inside its parent split. Omitted child sizes share the remaining space.",
        ],
        code: `{
  type: 'split',
  direction: 'horizontal',
  children: [
    { type: 'panel', id: 'sidebar', size: 40, tabs: [...] },
    {
      type: 'split',
      direction: 'vertical',
      size: 60,
      children: [
        { type: 'panel', id: 'editor', size: 60, tabs: [...] },
        { type: 'panel', id: 'terminal', size: 40, tabs: [...] },
      ],
    },
  ],
}`,
      },
      {
        heading: 'Panels and Tabs',
        body: [
          'A panel is a rectangular region containing a tab bar and a content area. Each panel holds one or more tabs. Only one tab is active within each panel.',
          'Tabs can be dragged between panels, reordered within a panel, or dropped on a panel edge to split it into two.',
          'A fullscreen panel renders over the full container and suppresses dividers and panel drop zones until restored.',
        ],
      },
      {
        heading: 'State Model',
        body: [
          'The public layout state keeps panels and tabs in flat lookup objects for direct access, but layout geometry is stored as a nested split tree.',
          'Tilery derives panel insets plus panelOrder from the tree for deterministic rendering.',
          'Use layout snapshots for persistence instead of storing raw layout state.',
        ],
        code: `type TileryLayoutState = {
  panels: Record<TileryPanelId, TileryPanelState>;
  panelOrder: TileryPanelId[];
  tabs: Record<TileryTabId, TileryTabState>;
  layout?: TileryLayoutTree | null;
};`,
      },
      {
        heading: 'Layout Snapshots',
        body: [
          'TileryLayoutSnapshot is the serializable layout shape returned by getLayout(). Store it as JSON and pass it back to initialLayout or setLayout(snapshot) to restore the panel tree.',
          'Initial layouts use a discriminated behavior API: locked: true is shorthand for resizable: false, draggable: false, and droppable: false. Snapshots store those explicit booleans directly and do not emit locked.',
          'For SSR, parse a saved cookie on the server and pass that snapshot as initialLayout. For client-only persistence, read and write the snapshot from localStorage.',
        ],
        code: `const saved = localStorage.getItem('tilery-layout');

<Tilery
  ref={tileryRef}
  initialLayout={saved ? JSON.parse(saved) : defaultLayout}
  onChange={() => {
    const layout = tileryRef.current?.getLayout<MyTabData>();
    if (layout) {
      localStorage.setItem('tilery-layout', JSON.stringify(layout));
    }
  }}
  renderTabHeader={renderTabHeader}
  renderTabContent={renderTabContent}
/>;`,
      },
      {
        heading: 'Dividers',
        body: [
          'Dividers are computed automatically from split boundaries in the layout tree.',
          'Resizing a divider updates one split at a time, then derives fresh flat panel insets for rendering.',
          'Dividers are focusable separators with ARIA value metadata. Keyboard users can resize them with arrow keys, Shift+Arrow, Home, and End.',
          'Set resizable=false on Tilery to disable all resize handles globally. On layout items, resizable controls adjacent divider resizing, draggable controls moving tabs out of the item, and droppable controls dropping tabs into or splitting over the item.',
          'Set resizeHandleHitSize to adjust the pointer target for divider and T-junction resize handles.',
          'Resize handles expose data-orientation on dividers, data-resize-active while dragging, data-resize-disabled when locked, and data-resize-at-min / data-resize-at-max when a divider reaches its bounds.',
          'Use CSS :hover and :focus-visible for transient pointer and keyboard focus styling. Tilery does not mirror hover or focus into data attributes.',
        ],
      },
      {
        heading: 'State Preservation',
        body: [
          'Tab content is rendered via React portals into stable DOM hosts. When a tab moves between panels, its portal target stays the same, so React preserves the subtree including local state, refs, and uncontrolled inputs.',
        ],
      },
    ],
  },
  {
    slug: 'styling',
    title: 'Styling',
    description: 'Customize the look of Tilery with CSS variables.',
    group: 'Guide',
    sections: [
      {
        heading: 'CSS Variables',
        body: [
          'All visual properties are customizable via CSS custom properties on the .tilery root element or any ancestor.',
        ],
        table: {
          headers: ['Variable', 'Default', 'Description'],
          rows: [
            ['--tilery-bg', '#0e0f12', 'Root background'],
            ['--tilery-fg', '#d9dde3', 'Root text color'],
            ['--tilery-font', 'inherit', 'Font family'],
            ['--tilery-panel-bg', '#1a1c20', 'Panel background'],
            ['--tilery-panel-border', '#2a2d33', 'Panel and tab-bar borders'],
            ['--tilery-panel-gap', '4px', 'Gap between panels'],
            ['--tilery-outer-gap', '(panel-gap)', 'Gap around the outer edge'],
            ['--tilery-tabbar-bg', '#16181c', 'Tab bar background'],
            ['--tilery-tab-fg', '#9aa1ab', 'Inactive tab text color'],
            ['--tilery-tab-active-fg', '#f3f4f7', 'Active tab text color'],
            ['--tilery-menu-bg', '#1f2228', 'Panel action menu background'],
            [
              '--tilery-accent',
              '#3884ff',
              'Accent (active indicator, drop zones)',
            ],
          ],
        },
      },
      {
        heading: 'Light Theme Example',
        body: ['Override the variables to create a light theme:'],
        code: `.tilery {
  --tilery-bg: #ffffff;
  --tilery-fg: #1a1a1a;
  --tilery-panel-bg: #f8f9fa;
  --tilery-panel-border: #e0e0e0;
  --tilery-tabbar-bg: #f0f1f3;
  --tilery-tab-fg: #6b7280;
  --tilery-tab-active-fg: #1a1a1a;
  --tilery-accent: #2563eb;
}`,
        language: 'css',
      },
      {
        heading: 'Custom Panel Gap',
        body: ['Adjust the gap between panels or remove it entirely:'],
        code: `.tilery {
  --tilery-panel-gap: 1px;   /* thin dividers */
  --tilery-outer-gap: 0px;   /* flush edges */
}`,
        language: 'css',
      },
      {
        heading: 'Resize Handle States',
        body: [
          'Dividers and T-junction resize handles expose data attributes for semantic resize state. Use these for active, disabled, and clamped-edge styling.',
          'Hover and keyboard focus are normal interaction states, so style them with :hover and :focus-visible instead of data attributes.',
        ],
        code: `.tilery__divider[data-resize-active],
.tilery__junction[data-resize-active] {
  background: color-mix(in srgb, var(--tilery-accent), transparent 70%);
}

.tilery__divider[data-resize-disabled],
.tilery__junction[data-resize-disabled] {
  cursor: default;
  opacity: 0.45;
}

.tilery__divider[data-resize-at-min],
.tilery__divider[data-resize-at-max] {
  background: color-mix(in srgb, var(--tilery-accent), transparent 84%);
}

.tilery__divider:hover,
.tilery__junction:hover {
  background: color-mix(in srgb, var(--tilery-accent), transparent 86%);
}

.tilery__divider:focus-visible {
  outline: 2px solid var(--tilery-accent);
  outline-offset: -2px;
}`,
        language: 'css',
      },
    ],
  },
  {
    slug: 'api',
    title: 'API Reference',
    description: 'Complete API documentation for Tilery.',
    group: 'Reference',
    sections: [
      {
        heading: 'Tilery Component Props',
        table: {
          headers: ['Prop', 'Type', 'Required', 'Description'],
          rows: [
            [
              'initialLayout',
              'TileryInitialLayout<TData>',
              'Yes',
              'Initial panel and tab configuration',
            ],
            [
              'renderTabHeader',
              '(tab: TileryTabHandle<TData>, ctx: { isActive: boolean }) => ReactNode',
              'Yes',
              'Renders tab button content',
            ],
            [
              'renderTabContent',
              '(tab: TileryTabHandle<TData>) => ReactNode',
              'Yes',
              'Renders tab panel content',
            ],
            [
              'onChange',
              '(state: TileryLayoutState) => void',
              'No',
              'Called after every state change',
            ],
            [
              'onResize',
              '(event: TileryResizeEvent) => void',
              'No',
              'Called for each divider or junction resize',
            ],
            [
              'onResizeEnd',
              '(event: TileryResizeEvent) => void',
              'No',
              'Called when a resize interaction commits',
            ],
            [
              'onActiveTabChange',
              '(event: TileryActiveTabChangeEvent) => void',
              'No',
              "Called when a panel's active tab changes",
            ],
            [
              'onTabsMove',
              '(event: TileryTabsMoveEvent<TData>) => void',
              'No',
              'Called when tabs move between panels or indexes',
            ],
            [
              'onPanelsOpen',
              '(event: TileryPanelsOpenEvent<TData>) => void',
              'No',
              'Called when panels are created',
            ],
            [
              'onPanelSplit',
              '(event: TileryPanelSplitEvent<TData>) => void',
              'No',
              'Called when a panel is split',
            ],
            [
              'onTabsOpen',
              '(event: TileryTabsOpenEvent<TData>) => void',
              'No',
              'Called when tabs are added',
            ],
            [
              'onTabsClose',
              '(event: TileryTabsCloseEvent<TData>) => void',
              'No',
              'Called when tabs are removed',
            ],
            [
              'onPanelsClose',
              '(event: TileryPanelsCloseEvent<TData>) => void',
              'No',
              'Called when panels are removed',
            ],
            [
              'minSize',
              'number',
              'No',
              'Default minimum panel size percentage',
            ],
            [
              'resizable',
              'boolean',
              'No',
              'Enables or disables all resize handles',
            ],
            [
              'resizeHandleHitSize',
              'number',
              'No',
              'Pointer hit target size for resize handles',
            ],
            [
              'showActionsButton',
              'boolean | (panel: TileryPanelHandle) => boolean',
              'No',
              'Shows the built-in panel action menu',
            ],
            [
              'showNewTabButton',
              'boolean | (panel: TileryPanelHandle) => boolean',
              'No',
              'Shows the optional new-tab button',
            ],
            [
              'onNewTab',
              '(panel, ctx) => TileryTabInit<TData> | void',
              'No',
              'Handles the new-tab button',
            ],
            [
              'renderPanelActions',
              '(panel, ctx) => ReactNode',
              'No',
              'Appends custom content to the panel action menu',
            ],
            [
              'renderActionsButtonIcon',
              '(panel) => ReactNode',
              'No',
              'Customizes the action menu button icon',
            ],
            [
              'ref',
              'Ref<TileryHandle>',
              'No',
              'Imperative handle for programmatic control',
            ],
          ],
        },
      },
      {
        heading: 'TileryInitialLayout and Snapshots',
        body: [
          'Initial layouts and persisted snapshots share the same serializable tree shape. A snapshot preserves the panel tree, tab order, active tabs, fullscreen panel, size constraints, and explicit behavior booleans.',
          'Initial layouts accept locked: true as shorthand for disabling resize, drag, and drop on a layout item. Tabs accept locked: true as shorthand for disabling close and drag. Snapshots store explicit booleans directly.',
        ],
        code: `type TileryInitialLayout<TData> =
  | { type: 'empty' }
  | ({
      type: 'panel';
      id?: string;
      size?: number;
      minSize?: number;
      maxSize?: number;
      tabs: TileryTabInit<TData>[];
      activeTabId?: string;
      fullScreen?: boolean;
    } & TileryLayoutBehaviorConfig)
  | ({
      type: 'split';
      id?: string;
      direction: 'horizontal' | 'vertical';
      size?: number;
      children: TileryInitialLayout<TData>[];
    } & TileryLayoutBehaviorConfig);

type TileryLayoutBehaviorConfig =
  | { locked: true; resizable?: never; draggable?: never; droppable?: never }
  | { locked?: false; resizable?: boolean; draggable?: boolean; droppable?: boolean };

type TileryLayoutBehavior = {
  resizable: boolean;
  draggable: boolean;
  droppable: boolean;
};

type TileryTabBehaviorConfig =
  | { locked: true; closeable?: never; draggable?: never }
  | { locked?: false; closeable?: boolean; draggable?: boolean };

type TileryTabBehaviorUpdate =
  | { locked: true; closeable?: never; draggable?: never }
  | { locked?: false; closeable?: boolean; draggable?: boolean };

type TileryTabInit<TData> = {
  id?: string;
  data: TData;
} & TileryTabBehaviorConfig;

type TileryTabBehavior = {
  closeable: boolean;
  draggable: boolean;
};

type TileryTabBehaviorUpdate =
  | { locked: true; closeable?: never; draggable?: never }
  | { locked?: false; closeable?: boolean; draggable?: boolean };

type TileryTabSnapshot<TData> = {
  id?: string;
  data: TData;
} & TileryTabBehavior;

type TileryLayoutSnapshot<TData> =
  | { type: 'empty' }
  | ({
      type: 'panel';
      id?: string;
      size?: number;
      minSize?: number;
      maxSize?: number;
      tabs: TileryTabSnapshot<TData>[];
      activeTabId?: string;
      fullScreen?: boolean;
    } & TileryLayoutBehavior)
  | ({
      type: 'split';
      id?: string;
      direction: 'horizontal' | 'vertical';
      size?: number;
      children: TileryLayoutSnapshot<TData>[];
    } & TileryLayoutBehavior);`,
      },
      {
        heading: 'TileryResizeEvent',
        body: [
          'onResize fires for each pointer or keyboard resize that changes panel sizes. onResizeEnd fires on pointer release for drag resizes and immediately after each keyboard resize.',
        ],
        code: `type TileryResizeEvent = {
  phase: 'resize' | 'end';
  input: 'keyboard' | 'pointer';
  source:
    | {
        type: 'divider';
        dividerId: string;
        orientation: 'vertical' | 'horizontal';
        previousPosition: number;
        position: number;
      }
    | {
        type: 'junction';
        junctionId: string;
        previousX: number;
        previousY: number;
        x: number;
        y: number;
        verticalDividerId: string;
        horizontalDividerId: string;
      };
  changes: Array<{
    panelId: string;
    dimension: 'width' | 'height';
    previousSize: number;
    size: number;
    previousPixelSize?: number;
    pixelSize?: number;
  }>;
  previousState: TileryLayoutState;
  state: TileryLayoutState;
};`,
      },
      {
        heading: 'Lifecycle Events',
        body: [
          'Lifecycle events fire for state changes that activate, move, add, or remove tabs and panels. Events include the action source, previous state, next state, and compact tab or panel snapshots from the relevant side of the transition.',
          'When a panel closes because its last tab moved out, onPanelsClose reports that moved tab even though onTabsClose does not fire.',
        ],
        code: `type TileryLifecycleSource =
  | 'SPLIT_PANEL'
  | 'REMOVE_PANEL'
  | 'APPEND_TAB'
  | 'INSERT_TAB'
  | 'REMOVE_TAB'
  | 'MOVE_TAB'
  | 'SET_ACTIVE_TAB'
  | 'REPLACE_STATE';

type TileryTabLifecycleChange<TData> = {
  id: string;
  panelId: string;
  data: TData;
  closeable: boolean;
  draggable: boolean;
};

type TileryPanelLifecycleChange = {
  id: string;
  tabIds: string[];
  activeTabId: string | null;
};

type TileryActiveTabChange = {
  panelId: string;
  previousTabId: string | null;
  tabId: string | null;
};

type TileryTabMoveChange<TData> = {
  id: string;
  previousPanelId: string;
  panelId: string;
  previousIndex: number;
  index: number;
  data: TData;
  closeable: boolean;
  draggable: boolean;
};

type TileryActiveTabChangeEvent = {
  source: TileryLifecycleSource;
  changes: TileryActiveTabChange[];
  previousState: TileryLayoutState;
  state: TileryLayoutState;
};

type TileryTabsMoveEvent<TData> = {
  source: TileryLifecycleSource;
  tabs: TileryTabMoveChange<TData>[];
  previousState: TileryLayoutState;
  state: TileryLayoutState;
};

type TileryPanelsOpenEvent<TData> = {
  source: TileryLifecycleSource;
  panels: TileryPanelLifecycleChange[];
  tabs: TileryTabLifecycleChange<TData>[];
  previousState: TileryLayoutState;
  state: TileryLayoutState;
};

type TileryPanelSplitEvent<TData> = {
  source: 'SPLIT_PANEL' | 'MOVE_TAB';
  splitPanelId: string;
  createdPanelId: string;
  direction: 'left' | 'right' | 'top' | 'bottom';
  size: number;
  splitPanel: TileryPanelLifecycleChange;
  createdPanel: TileryPanelLifecycleChange;
  tabs: TileryTabLifecycleChange<TData>[];
  previousState: TileryLayoutState;
  state: TileryLayoutState;
};

type TileryTabsOpenEvent<TData> = {
  source: TileryLifecycleSource;
  tabs: TileryTabLifecycleChange<TData>[];
  previousState: TileryLayoutState;
  state: TileryLayoutState;
};

type TileryTabsCloseEvent<TData> = {
  source: TileryLifecycleSource;
  tabs: TileryTabLifecycleChange<TData>[];
  panels: TileryPanelLifecycleChange[];
  previousState: TileryLayoutState;
  state: TileryLayoutState;
};

type TileryPanelsCloseEvent<TData> = {
  source: TileryLifecycleSource;
  panels: TileryPanelLifecycleChange[];
  tabs: TileryTabLifecycleChange<TData>[];
  previousState: TileryLayoutState;
  state: TileryLayoutState;
};`,
      },
      {
        heading: 'TileryHandle',
        body: [
          'The imperative API exposed via ref. Use it for programmatic layout manipulation.',
        ],
        table: {
          headers: ['Method', 'Description'],
          rows: [
            ['getPanel(id)', 'Returns a PanelHandle or null'],
            ['getTab(id)', 'Returns a TileryTabHandle or null'],
            ['getPanels()', 'Returns all PanelHandle[]'],
            ['getTabs()', 'Returns all TileryTabHandle[]'],
            [
              'splitPanel(panelId, direction, opts?)',
              'Splits a panel, returns new PanelHandle',
            ],
            ['removePanel(panelId)', 'Removes a panel and redistributes space'],
            ['maximizePanel(panelId)', 'Shows one panel fullscreen'],
            ['restorePanel(panelId)', 'Restores a fullscreen panel'],
            ['appendTab(panelId, tab, opts?)', 'Appends a tab to a panel'],
            [
              'insertTab(panelId, tab, index, opts?)',
              'Inserts a tab at a specific index',
            ],
            ['removeTab(tabId)', 'Removes a tab and removes panel if last'],
            ['moveTab(tabId, target)', 'Moves a tab to a target location'],
            [
              'setTabBehavior(tabId, behavior)',
              'Updates tab close and drag behavior',
            ],
            ['setActiveTab(tabId)', 'Activates a tab'],
            ['swapPanels(panelA, panelB)', 'Swaps two panels positions'],
            ['getLayout()', 'Returns a serializable TileryLayoutSnapshot'],
            ['setLayout(layout)', 'Restores a TileryLayoutSnapshot'],
            ['getState()', 'Returns the current TileryLayoutState'],
          ],
        },
      },
      {
        heading: 'PanelHandle',
        body: ['Returned by getPanel(). Provides panel-scoped operations.'],
        table: {
          headers: ['Property / Method', 'Description'],
          rows: [
            ['id', 'Panel identifier'],
            ['inset', 'Current { top, right, bottom, left } percentages'],
            ['tabs', 'Array of TileryTabHandle for this panel'],
            ['activeTab', 'The active TileryTabHandle or null'],
            ['fullScreen', 'Whether this panel is currently fullscreen'],
            ['minSize', 'Panel minimum size constraint, if set'],
            ['maxSize', 'Panel maximum size constraint, if set'],
            ['appendTab(tab, opts?)', 'Append a tab to this panel'],
            ['insertTab(tab, index, opts?)', 'Insert a tab at index'],
            ['split(direction, opts?)', 'Split this panel'],
            ['remove()', 'Remove this panel'],
            ['maximize()', 'Show this panel fullscreen'],
            ['restore()', 'Restore this panel from fullscreen'],
            ['setActiveTab(tabId)', 'Set the active tab'],
          ],
        },
      },
      {
        heading: 'TileryTabHandle<TData>',
        body: ['Returned by getTab(). Provides tab-scoped operations.'],
        table: {
          headers: ['Property / Method', 'Description'],
          rows: [
            ['id', 'Tab identifier'],
            ['panel', 'The parent PanelHandle'],
            ['index', 'Position within the panel tab list'],
            ['data', 'The TData payload'],
            ['closeable', 'Whether close actions are allowed'],
            ['draggable', 'Whether move actions are allowed'],
            ['setData(data)', 'Update the tab data'],
            ['setBehavior(behavior)', 'Update tab close and drag behavior'],
            ['moveTo(target)', 'Move to a target location'],
            ['activate()', 'Make this the active tab'],
            ['remove()', 'Remove this tab'],
          ],
        },
      },
      {
        heading: 'TileryMoveTarget',
        body: ['Used with moveTab() and tabHandle.moveTo():'],
        code: `type TileryMoveTarget =
  | { panel: TileryPanelId; index?: number }
  | { beforeTab: TileryTabId }
  | { afterTab: TileryTabId }
  | ({
      splitPanel: TileryPanelId;
      direction: TileryDirection;
      size?: number;
      minSize?: number;
      maxSize?: number;
    } & TileryLayoutBehaviorConfig);`,
      },
      {
        heading: 'TileryDirection',
        code: `type TileryDirection = 'left' | 'right' | 'top' | 'bottom';`,
      },
      {
        heading: 'TileryInitialLayout<TData>',
        code: `type TileryInitialLayout<TData> =
  | ({
      type: 'panel';
      id?: string;
      size?: number;
      minSize?: number;
      maxSize?: number;
      tabs: TileryTabInit<TData>[];
      activeTabId?: string;
      fullScreen?: boolean;
    } & TileryLayoutBehaviorConfig)
  | ({
      type: 'split';
      id?: string;
      direction: 'horizontal' | 'vertical';
      size?: number;
      children: TileryInitialLayout<TData>[];
    } & TileryLayoutBehaviorConfig);

type TileryLayoutBehaviorConfig =
  | { locked: true; resizable?: never; draggable?: never; droppable?: never }
  | { locked?: false; resizable?: boolean; draggable?: boolean; droppable?: boolean };

type TileryTabBehaviorConfig =
  | { locked: true; closeable?: never; draggable?: never }
  | { locked?: false; closeable?: boolean; draggable?: boolean };

type TileryTabInit<TData> = {
  id?: string;
  data: TData;
} & TileryTabBehaviorConfig;`,
      },
    ],
  },
];
