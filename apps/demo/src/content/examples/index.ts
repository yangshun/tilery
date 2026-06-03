export { Example as BasicExample } from './basic/example';
export { Example as IdeExample } from './ide/example';
export { Example as DashboardExample } from './dashboard/example';
export {
  AbyssSpacedThemeExample,
  AbyssThemeExample,
  DraculaThemeExample,
  Example as ThemesExample,
  LightThemeExample,
  PillTabsThemeExample,
  ReplitThemeExample,
  VisualStudioThemeExample,
} from './themes/example';
export {
  Example as PanelActionsExample,
  NewTabExample,
  PanelMenuExample,
} from './collapse/example';
export {
  ContainerResizeExample,
  DefaultResetExample,
  Example as ConstraintsExample,
  PanelConstraintsExample,
} from './constraints/example';
export { Example as PanelLockingExample } from './panel-locking/example';
export {
  Example as TabLockingExample,
  InitialTabLocksExample,
  RuntimeTabBehaviorExample,
} from './tab-locking/example';
export {
  Example as OverflowExample,
  TabOverflowExample,
} from './overflow/example';
export {
  Example as ControlledExample,
  PanelApiExample,
  TabApiExample,
  WorkflowApiExample,
} from './controlled/example';
export { Example as LinkTabsExample } from './link-tabs/example';
export {
  Example as FloatingExample,
  InitialFloatingExample,
  NativePopoutExample,
  PopoutStylingExample,
  RuntimeFloatingExample,
  TabFloatingExample,
} from './floating/example';
export {
  Example as PersistenceExample,
  LocalStorageExample,
  SnapshotControlsExample,
} from './persistence/example';
export {
  Example as CallbacksExample,
  ResizeCallbacksExample,
  StructuralCallbacksExample,
} from './callbacks/example';
export { Example as NestedExample } from './nested/example';

export { metadata as basicMeta } from './basic/metadata';
export { metadata as ideMeta } from './ide/metadata';
export { metadata as dashboardMeta } from './dashboard/metadata';
export { metadata as themesMeta } from './themes/metadata';
export { metadata as panelActionsMeta } from './collapse/metadata';
export { metadata as constraintsMeta } from './constraints/metadata';
export { metadata as panelLockingMeta } from './panel-locking/metadata';
export { metadata as tabLockingMeta } from './tab-locking/metadata';
export { metadata as overflowMeta } from './overflow/metadata';
export { metadata as controlledMeta } from './controlled/metadata';
export { metadata as linkTabsMeta } from './link-tabs/metadata';
export { metadata as floatingMeta } from './floating/metadata';
export { metadata as persistenceMeta } from './persistence/metadata';
export { metadata as callbacksMeta } from './callbacks/metadata';
export { metadata as nestedMeta } from './nested/metadata';

export const exampleCategoryOrder = [
  'Layout Patterns',
  'Panel & Tab Behavior',
  'App Integration',
  'Advanced UI',
] as const;

export type ExampleCategory = (typeof exampleCategoryOrder)[number];

type ExampleSlug =
  | 'basic'
  | 'ide'
  | 'dashboard'
  | 'nested'
  | 'constraints'
  | 'collapse'
  | 'overflow'
  | 'panel-locking'
  | 'tab-locking'
  | 'controlled'
  | 'link-tabs'
  | 'persistence'
  | 'callbacks'
  | 'floating'
  | 'themes';

type ExampleMetadata = {
  slug: ExampleSlug;
  title: string;
  description: string;
  category: ExampleCategory;
  demos?: Array<{ id: string; sourceRegion?: string }>;
  guide: {
    paragraphs: string[];
    readNext: Array<{
      href: string;
      label: string;
      description: string;
    }>;
  };
};

const exampleOrder = [
  'basic',
  'ide',
  'dashboard',
  'nested',
  'constraints',
  'collapse',
  'overflow',
  'panel-locking',
  'tab-locking',
  'controlled',
  'link-tabs',
  'persistence',
  'callbacks',
  'floating',
  'themes',
] as const satisfies readonly ExampleSlug[];

const exampleDefinitions = [
  {
    slug: 'basic',
    title: 'Basic Layout',
    description: 'Two side-by-side panels with one tab each.',
    category: 'Layout Patterns',
    guide: {
      paragraphs: [
        'Start here if you want the smallest useful Tilery layout: two panels in a horizontal group, each with one tab. Drag the divider to see how the group distributes space between its children.',
        'The code shows how initialLayout, tab headers, and tab content work together before you add nested groups, custom actions, or persistence.',
      ],
      readNext: [
        {
          href: '/docs/getting-started',
          label: 'Getting Started',
          description: 'Build this layout from scratch.',
        },
        {
          href: '/docs/api/layout',
          label: 'Layouts & Snapshots',
          description: 'Understand the group and panel shape.',
        },
      ],
    },
  },
  {
    slug: 'ide',
    title: 'IDE Layout',
    description: 'VS Code-like layout with sidebar, editor, and terminal.',
    category: 'Layout Patterns',
    guide: {
      paragraphs: [
        'Use this layout for an editor-style shell with a sidebar, main editor, and terminal. Resize the sidebar and terminal, then move editor tabs to see which parts of the workspace are structural and which are document-like.',
        'Explorer is modeled as non-closeable app chrome, while the editor and terminal are ordinary tabbed panels inside nested groups.',
      ],
      readNext: [
        {
          href: '/docs/concepts',
          label: 'Concepts',
          description: 'Learn how panels, tabs, and groups fit together.',
        },
        {
          href: '/docs/api/layout',
          label: 'Layouts & Snapshots',
          description: 'See the tree shape behind the IDE layout.',
        },
      ],
    },
  },
  {
    slug: 'dashboard',
    title: 'Dashboard',
    description: '2x2 grid of panels like an analytics dashboard.',
    category: 'Layout Patterns',
    guide: {
      paragraphs: [
        'This is a dashboard built from nested horizontal and vertical groups rather than a separate grid primitive. Resize a row, then resize a panel inside that row to see how each group owns one dimension.',
        'The example keeps stable metric panels beside a tabbed activity area, which is the common shape for analytics and operations tools.',
      ],
      readNext: [
        {
          href: '/docs/concepts',
          label: 'Concepts',
          description: 'Use nested groups to model larger workspaces.',
        },
        {
          href: '/docs/api/layout',
          label: 'Layouts & Snapshots',
          description: 'Author rows, columns, and panel sizes.',
        },
      ],
    },
  },
  {
    slug: 'themes',
    title: 'Themes',
    description: 'A gallery of Tilery workspaces styled with CSS variables.',
    category: 'Advanced UI',
    demos: [
      { id: 'abyss', sourceRegion: 'abyss' },
      { id: 'visual-studio', sourceRegion: 'visual-studio' },
      { id: 'dracula', sourceRegion: 'dracula' },
      { id: 'light', sourceRegion: 'light' },
      { id: 'replit', sourceRegion: 'replit' },
      { id: 'abyss-spaced', sourceRegion: 'abyss-spaced' },
      { id: 'pill-tabs', sourceRegion: 'pill-tabs' },
    ],
    guide: {
      paragraphs: [
        'These demos keep the same workspace but swap the visual system around it. Compare dark, light, editor-inspired, and spaced themes to see how far CSS variables can take you.',
        'The pill tab theme intentionally uses class overrides as well, because changing component shape is usually clearer in CSS than adding more variables.',
      ],
      readNext: [
        {
          href: '/docs/styling',
          label: 'Styling',
          description: 'Choose between variables and scoped class overrides.',
        },
        {
          href: '/docs/api/styling',
          label: 'Styling API',
          description:
            'Look up supported variables, selectors, and data attributes.',
        },
      ],
    },
  },
  {
    slug: 'collapse',
    title: 'Panel Actions',
    description:
      'Built-in panel actions, custom menu items, and new-tab hooks.',
    category: 'Panel & Tab Behavior',
    demos: [
      { id: 'panel-menu', sourceRegion: 'panel-menu' },
      { id: 'new-tab', sourceRegion: 'new-tab' },
    ],
    guide: {
      paragraphs: [
        'Panel actions are for commands that belong to the panel shell: menus, maximize and minimize controls, and app-defined new-tab behavior. Open the menu and use the new-tab demo to see how Tilery leaves product-specific commands to your app.',
        'The tab bar stays built in, but panelActions, onPanelAction, and onNewTab let you extend the controls without replacing the whole header.',
      ],
      readNext: [
        {
          href: '/docs/api/component',
          label: 'Component Props',
          description: 'See action button and new-tab props.',
        },
        {
          href: '/docs/api/control',
          label: 'Programmatic Control',
          description: 'Open and manage tabs from app workflows.',
        },
      ],
    },
  },
  {
    slug: 'constraints',
    title: 'Size Constraints',
    description: 'Panels with percentage and pixel minSize/maxSize limits.',
    category: 'Panel & Tab Behavior',
    demos: [
      { id: 'panel-constraints', sourceRegion: 'panel-constraints' },
      { id: 'container-resize', sourceRegion: 'container-resize' },
      { id: 'default-reset', sourceRegion: 'default-reset' },
    ],
    guide: {
      paragraphs: [
        'Use size constraints when a panel has a real lower or upper bound, like a navigator that should not collapse past its content. Drag handles toward the constrained panels until they stop moving.',
        'Double-click a divider when you want to send adjacent panels back to their defaultSize ratio. The reset still runs through the same minSize and maxSize constraints as normal dragging.',
        'The container resize demo shows the same rules applying when the available area changes: proportions are preserved where possible, then min and max sizes clamp the result.',
      ],
      readNext: [
        {
          href: '/docs/api/layout',
          label: 'Layouts & Snapshots',
          description: 'Define minSize and maxSize in layout items.',
        },
        {
          href: '/docs/api/styling',
          label: 'Styling API',
          description: 'Style active, disabled, min, and max resize states.',
        },
      ],
    },
  },
  {
    slug: 'panel-locking',
    title: 'Panel Locking',
    description: 'Lock panel resizing, dragging, and drop targets.',
    category: 'Panel & Tab Behavior',
    guide: {
      paragraphs: [
        'Panel locking separates resize, drag, and drop behavior so app chrome can stay fixed while other regions remain flexible. Try resizing, dragging from, and dropping into locked panels.',
        'locked: true disables all three interactions, while resizable, draggable, and droppable let you model more specific restrictions.',
      ],
      readNext: [
        {
          href: '/docs/concepts',
          label: 'Concepts',
          description: 'See how panel behavior fits the workspace model.',
        },
        {
          href: '/docs/api/layout',
          label: 'Layouts & Snapshots',
          description: 'Use layout behavior fields on panels and groups.',
        },
      ],
    },
  },
  {
    slug: 'tab-locking',
    title: 'Tab Locking',
    description: 'Lock tabs or toggle whether they can be closed and dragged.',
    category: 'Panel & Tab Behavior',
    demos: [
      { id: 'initial-locks', sourceRegion: 'initial-locks' },
      { id: 'runtime-behavior', sourceRegion: 'runtime-behavior' },
    ],
    guide: {
      paragraphs: [
        'Tab locking is for tabs that represent protected resources or app-owned surfaces. Try closing and dragging the locked tabs, then use the runtime controls to change behavior without remounting tab content.',
        'locked: true maps to non-closeable and non-draggable; tab.setBehavior() applies the same behavior after the workspace is already running.',
      ],
      readNext: [
        {
          href: '/docs/api/layout',
          label: 'Layouts & Snapshots',
          description: 'Declare tab behavior in the initial layout.',
        },
        {
          href: '/docs/api/control',
          label: 'Programmatic Control',
          description: 'Update tab behavior through tab objects.',
        },
      ],
    },
  },
  {
    slug: 'overflow',
    title: 'Tab Overflow',
    description: 'Many tabs in one panel with scrolling and a hidden-tab menu.',
    category: 'Panel & Tab Behavior',
    demos: [{ id: 'tab-overflow', sourceRegion: 'tab-overflow' }],
    guide: {
      paragraphs: [
        'Use overflow behavior when a panel can collect more tabs than fit onscreen. Scroll the tab row, open the hidden-tab menu, and activate a clipped tab to see the row bring it back into view.',
        'Tabs keep natural widths while the row handles scrolling and menu access, so large workspaces do not need compressed tab labels.',
      ],
      readNext: [
        {
          href: '/docs/api/component',
          label: 'Component Props',
          description: 'Render tab headers and content for large tab sets.',
        },
        {
          href: '/docs/api/control',
          label: 'Programmatic Control',
          description: 'Activate or move tabs from application workflows.',
        },
      ],
    },
  },
  {
    slug: 'controlled',
    title: 'Programmatic Control',
    description:
      'Use the Tilery controller plus panel and tab objects for imperative workflows.',
    category: 'App Integration',
    demos: [
      { id: 'panel-objects', sourceRegion: 'panel-objects' },
      { id: 'tab-objects', sourceRegion: 'tab-objects' },
      { id: 'tab-workflows', sourceRegion: 'tab-workflows' },
    ],
    guide: {
      paragraphs: [
        'Programmatic control is for workflows that start outside a drag gesture, such as opening a resource from search or splitting a panel from a toolbar. Use the controls here to append tabs, split panels, and reopen an existing resource tab.',
        'The controller gives app-level operations, while panel and tab objects are convenient when your renderer already knows which part of the workspace it is acting on.',
      ],
      readNext: [
        {
          href: '/docs/api/control',
          label: 'Programmatic Control',
          description: 'Choose the right controller, panel, or tab method.',
        },
        {
          href: '/docs/api/events',
          label: 'Events & Callbacks',
          description: 'React to the structural changes made here.',
        },
      ],
    },
  },
  {
    slug: 'link-tabs',
    title: 'Link Tabs',
    description: 'Render tab triggers as anchors or router links.',
    category: 'App Integration',
    demos: [{ id: 'link-tabs', sourceRegion: 'link-tabs' }],
    guide: {
      paragraphs: [
        'Link tabs are a rendering concern: keep hrefs and router metadata in tab data, then use renderTabTrigger to render the tab trigger as an anchor or router component.',
        'Tilery keeps the close button outside the trigger, so link tabs do not wrap button controls and can still close without triggering navigation or activation.',
      ],
      readNext: [
        {
          href: '/docs/api/component',
          label: 'Component Props',
          description: 'See the renderTabTrigger API and related render props.',
        },
        {
          href: '/docs/api/control',
          label: 'Programmatic Control',
          description: 'Coordinate route changes with tab activation.',
        },
      ],
    },
  },
  {
    slug: 'floating',
    title: 'Floating Panels',
    description: 'Detach panels into movable overlays and dock them back.',
    category: 'Advanced UI',
    demos: [
      { id: 'initial-floating', sourceRegion: 'initial-floating' },
      { id: 'runtime-floating', sourceRegion: 'runtime-floating' },
      { id: 'tab-floating', sourceRegion: 'tab-floating' },
      { id: 'native-popout', sourceRegion: 'native-popout' },
      { id: 'popout-styling', sourceRegion: 'popout-styling' },
    ],
    guide: {
      paragraphs: [
        'Floating panels let users pull part of the workspace out of the tiled layout while keeping it in the same Tilery state. Move and resize a floating panel, then dock it back into the main layout.',
        'This page also shows the difference between floating a whole panel, floating one tab, and opening a native popout window with copied document-head styles.',
      ],
      readNext: [
        {
          href: '/docs/api/control',
          label: 'Programmatic Control',
          description: 'Use float, dock, popout, and bounds APIs.',
        },
        {
          href: '/docs/styling',
          label: 'Styling',
          description:
            'Make native popout styles survive the separate document.',
        },
      ],
    },
  },
  {
    slug: 'persistence',
    title: 'Layout Persistence',
    description: 'Save, restore, and replace layout snapshots.',
    category: 'App Integration',
    demos: [
      { id: 'local-storage', sourceRegion: 'local-storage' },
      { id: 'snapshot-controls', sourceRegion: 'snapshot-controls' },
    ],
    guide: {
      paragraphs: [
        'Persistence is built around snapshots: save the current layout, store it in your app, and pass it back later. Move tabs or resize panels in the localStorage demo, then reload the page.',
        'The snapshot controls show the same flow manually, which is useful when you want explicit save, reset, or restore actions instead of automatic persistence.',
      ],
      readNext: [
        {
          href: '/docs/concepts',
          label: 'Concepts',
          description: 'Understand snapshots versus runtime layout state.',
        },
        {
          href: '/docs/api/layout',
          label: 'Layouts & Snapshots',
          description: 'See the persisted snapshot shape.',
        },
      ],
    },
  },
  {
    slug: 'callbacks',
    title: 'Lifecycle Callbacks',
    description: 'Track structural and resize lifecycle events.',
    category: 'App Integration',
    demos: [
      { id: 'structural', sourceRegion: 'structural' },
      { id: 'resize', sourceRegion: 'resize' },
    ],
    guide: {
      paragraphs: [
        'Lifecycle callbacks let your app observe workspace changes without taking over the reducer. Move tabs, split panels, close tabs, and watch the event log.',
        'Resize callbacks are split between continuous updates and resize-end notifications, so you can update live UI during dragging while saving expensive work until the gesture finishes.',
      ],
      readNext: [
        {
          href: '/docs/api/events',
          label: 'Events & Callbacks',
          description:
            'Pick the right callback and payload for app state or analytics.',
        },
        {
          href: '/docs/api/component',
          label: 'Component Props',
          description: 'Wire callbacks on the Tilery component.',
        },
      ],
    },
  },
  {
    slug: 'nested',
    title: 'Nested Instances',
    description: 'A Tilery instance rendered inside a tab of another Tilery.',
    category: 'Layout Patterns',
    guide: {
      paragraphs: [
        'Nested instances are useful when a tab contains a self-contained tool with its own workspace. Resize the inner layout, then resize the outer panel to see that each Tilery root manages its own state.',
        'The inner workspace is just tab content from the outer workspace, so it can use a separate controller, callbacks, and persistence model.',
      ],
      readNext: [
        {
          href: '/docs/concepts',
          label: 'Concepts',
          description: 'Understand how each Tilery root owns its own state.',
        },
        {
          href: '/docs/api/component',
          label: 'Component Props',
          description: 'Render nested content through tab content renderers.',
        },
      ],
    },
  },
] satisfies ExampleMetadata[];

const examplesBySlug = new Map(
  exampleDefinitions.map((example) => [example.slug, example]),
);

function getOrderedExample(slug: ExampleSlug) {
  const example = examplesBySlug.get(slug);
  if (!example) {
    throw new Error(`Missing example metadata for ${slug}`);
  }
  return example;
}

export const examples = exampleOrder.map(getOrderedExample);
