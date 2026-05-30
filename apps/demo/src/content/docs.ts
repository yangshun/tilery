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
          'Install the React adapter — it includes the core package automatically.',
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
  panels: [
    {
      id: 'left',
      inset: { top: 0, right: 50, bottom: 0, left: 0 },
      tabs: [{ id: 'a', data: { title: 'Panel A' } }],
    },
    {
      id: 'right',
      inset: { top: 0, right: 0, bottom: 0, left: 50 },
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
        heading: 'Inset-Based Positioning',
        body: [
          'Panels are positioned using percentage-based insets from each edge of the container. This is similar to CSS inset but uses percentages of the Tilery container dimensions.',
          'A panel taking the left 40% of the container would have: { top: 0, right: 60, bottom: 0, left: 0 }. The right inset of 60 means "60% from the right edge", leaving 40% width.',
        ],
        code: `// Full width panel
{ top: 0, right: 0, bottom: 0, left: 0 }

// Left half
{ top: 0, right: 50, bottom: 0, left: 0 }

// Right half
{ top: 0, right: 0, bottom: 0, left: 50 }

// Top-right quadrant
{ top: 0, right: 0, bottom: 50, left: 50 }`,
      },
      {
        heading: 'Panels and Tabs',
        body: [
          'A panel is a rectangular region containing a tab bar and a content area. Each panel holds one or more tabs. Only one tab is active (visible) at a time within each panel.',
          'Tabs can be dragged between panels, reordered within a panel, or dropped on a panel edge to split it into two.',
        ],
      },
      {
        heading: 'State Model',
        body: [
          'The layout state is a flat structure with panels and tabs stored in lookup objects. Panel order is tracked separately for deterministic rendering.',
        ],
        code: `type TileryLayoutState = {
  panels: Record<TileryPanelId, TileryPanelState>;
  panelOrder: TileryPanelId[];
  tabs: Record<TileryTabId, TileryTabState>;
};`,
      },
      {
        heading: 'Dividers and Junctions',
        body: [
          'Dividers are computed automatically from panel geometry — wherever two panels share an edge, a draggable divider appears.',
          'Junctions are 2D resize handles that appear where a vertical divider crosses a horizontal divider, allowing diagonal resizing.',
        ],
      },
      {
        heading: 'State Preservation',
        body: [
          'Tab content is rendered via React portals into stable DOM hosts. When a tab moves between panels, its portal target stays the same — React preserves the entire subtree including local state, refs, and uncontrolled inputs.',
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
    description: 'Complete API documentation for tilery.',
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
            ['removePanel(panelId)', 'Removes a panel (redistributes space)'],
            ['appendTab(panelId, tab, opts?)', 'Appends a tab to a panel'],
            [
              'insertTab(panelId, tab, index, opts?)',
              'Inserts a tab at a specific index',
            ],
            ['removeTab(tabId)', 'Removes a tab (collapses panel if last)'],
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
            ['appendTab(tab, opts?)', 'Append a tab to this panel'],
            ['insertTab(tab, index, opts?)', 'Insert a tab at index'],
            ['split(direction, opts?)', 'Split this panel'],
            ['remove()', 'Remove this panel'],
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
  | { panel: TileryPanelId; index?: number }        // Move to panel at index
  | { beforeTab: TileryTabId }                       // Insert before a tab
  | { afterTab: TileryTabId }                        // Insert after a tab
  | { splitPanel: TileryPanelId; direction: TileryDirection; sizePercent?: number };`,
      },
      {
        heading: 'TileryDirection',
        code: `type TileryDirection = 'left' | 'right' | 'top' | 'bottom';`,
      },
      {
        heading: 'TileryInitialLayout<TData>',
        code: `type TileryInitialLayout<TData> = {
  panels: PanelInit<TData>[];
};

type PanelInit<TData> = {
  id?: string;
  inset: { top: number; right: number; bottom: number; left: number };
  tabs: TabInit<TData>[];
  activeTabId?: string;
};

type TabInit<TData> = {
  id?: string;
  data: TData;
};`,
      },
    ],
  },
];
