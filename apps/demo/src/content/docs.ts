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
        ],
        code: `type TileryLayoutState = {
  panels: Record<TileryPanelId, TileryPanelState>;
  panelOrder: TileryPanelId[];
  tabs: Record<TileryTabId, TileryTabState>;
  layout?: TileryLayoutTree | null;
};`,
      },
      {
        heading: 'Dividers',
        body: [
          'Dividers are computed automatically from split boundaries in the layout tree.',
          'Resizing a divider updates one split at a time, then derives fresh flat panel insets for rendering.',
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
              'minPanelSizePercent',
              'number',
              'No',
              'Minimum panel size in percent (default: 10)',
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
            ['setActiveTab(tabId)', 'Activates a tab'],
            ['swapPanels(panelA, panelB)', 'Swaps two panels positions'],
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
            ['setData(data)', 'Update the tab data'],
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
  | { splitPanel: TileryPanelId; direction: TileryDirection; size?: number };`,
      },
      {
        heading: 'TileryDirection',
        code: `type TileryDirection = 'left' | 'right' | 'top' | 'bottom';`,
      },
      {
        heading: 'TileryInitialLayout<TData>',
        code: `type TileryInitialLayout<TData> =
  | {
      type: 'panel';
      id?: string;
      size?: number;
      tabs: TabInit<TData>[];
      activeTabId?: string;
      fullScreen?: boolean;
    }
  | {
      type: 'split';
      id?: string;
      direction: 'horizontal' | 'vertical';
      size?: number;
      children: TileryInitialLayout<TData>[];
    };

type TabInit<TData> = {
  id?: string;
  data: TData;
  closeable?: boolean;
};`,
      },
    ],
  },
];
