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
export { metadata as floatingMeta } from './floating/metadata';
export { metadata as persistenceMeta } from './persistence/metadata';
export { metadata as callbacksMeta } from './callbacks/metadata';
export { metadata as nestedMeta } from './nested/metadata';

export const examples = [
  {
    slug: 'basic',
    title: 'Basic Layout',
    description: 'Two side-by-side panels with one tab each.',
    notes: [
      'The initial layout is a horizontal group with two panels and one tab per panel.',
      'Drag the divider to see how sibling panel sizes are redistributed.',
    ],
  },
  {
    slug: 'ide',
    title: 'IDE Layout',
    description: 'VS Code-like layout with sidebar, editor, and terminal.',
    notes: [
      'Nested horizontal and vertical groups model a familiar editor shell.',
      'Non-closeable tabs keep structural panels like Explorer and Terminal present.',
    ],
  },
  {
    slug: 'dashboard',
    title: 'Dashboard',
    description: '2x2 grid of panels like an analytics dashboard.',
    notes: [
      'A vertical root split contains two horizontal rows, producing a 2x2 grid.',
      'Several panels pin their primary tab while the activity panel remains tabbed.',
    ],
  },
  {
    slug: 'themes',
    title: 'Themes',
    description: 'A gallery of Tilery workspaces styled with CSS variables.',
    demos: [
      { id: 'abyss', sourceRegion: 'abyss' },
      { id: 'visual-studio', sourceRegion: 'visual-studio' },
      { id: 'dracula', sourceRegion: 'dracula' },
      { id: 'light', sourceRegion: 'light' },
      { id: 'replit', sourceRegion: 'replit' },
      { id: 'abyss-spaced', sourceRegion: 'abyss-spaced' },
      { id: 'pill-tabs', sourceRegion: 'pill-tabs' },
    ],
    notes: [
      'Each theme is a wrapper around Tilery that defines --tilery-* CSS variables.',
      'The examples mirror the style of Dockview theme demos: dark, light, editor-inspired, and spaced variants.',
      'The Pill Tabs example shows where class overrides fit when a theme changes component shape rather than only colors and sizing tokens.',
      'Spacing themes only change panel and outer gaps, so the same layout can support compact or separated workspaces.',
    ],
  },
  {
    slug: 'collapse',
    title: 'Panel Actions',
    description:
      'Built-in panel actions, custom menu items, and new-tab hooks.',
    demos: [
      { id: 'panel-menu', sourceRegion: 'panel-menu' },
      { id: 'new-tab', sourceRegion: 'new-tab' },
    ],
    notes: [
      'The first demo mixes built-in panel actions with an app-supplied menu command.',
      'The second demo exposes a new-tab button only on one panel and creates tabs through onNewTab.',
    ],
  },
  {
    slug: 'constraints',
    title: 'Size Constraints',
    description: 'Panels with percentage and pixel minSize/maxSize limits.',
    demos: [
      { id: 'panel-constraints', sourceRegion: 'panel-constraints' },
      { id: 'container-resize', sourceRegion: 'container-resize' },
    ],
    notes: [
      'Each panel can define its own minSize and maxSize in the layout tree, using percentages or pixel values.',
      'Resize handles clamp against the nearest constrained panels in the active split.',
      'Container resizes preserve split proportions by default and adjust only the panels that would otherwise violate constraints.',
      'Impossible constraint combinations warn once in development; runtime resize still clamps or no-ops instead of throwing.',
      'Handles expose data-resize-* attributes for active, disabled, and min/max clamp states; hover and focus styling use CSS pseudo-classes.',
    ],
  },
  {
    slug: 'panel-locking',
    title: 'Panel Locking',
    description: 'Lock panel resizing, dragging, and drop targets.',
    notes: [
      'locked: true is shorthand for disabling resize, drag, and drop behavior on a layout item.',
      'resizable, draggable, and droppable can also be set independently when a panel should allow only some interactions.',
    ],
  },
  {
    slug: 'tab-locking',
    title: 'Tab Locking',
    description: 'Lock tabs or toggle whether they can be closed and dragged.',
    demos: [
      { id: 'initial-locks', sourceRegion: 'initial-locks' },
      { id: 'runtime-behavior', sourceRegion: 'runtime-behavior' },
    ],
    notes: [
      'The first demo shows locked, closeable, and draggable values declared in initialLayout.',
      'The second demo uses tab.setBehavior() to update closeable and draggable at runtime.',
    ],
  },
  {
    slug: 'overflow',
    title: 'Tab Overflow',
    description: 'Many tabs in one panel with horizontal scrolling.',
    demos: [{ id: 'tab-overflow', sourceRegion: 'tab-overflow' }],
    notes: [
      'Tabs keep their natural width and the tab row scrolls horizontally when there is not enough space.',
      'Wheel input over the tab row scrolls horizontally without taking over page scrolling at the row boundaries.',
      'When a tab becomes active through the API or by clicking, Tilery scrolls it into view automatically.',
    ],
  },
  {
    slug: 'controlled',
    title: 'Programmatic Control',
    description: 'Use panel and tab handles for imperative workflows.',
    demos: [
      { id: 'panel-handles', sourceRegion: 'panel-handles' },
      { id: 'tab-handles', sourceRegion: 'tab-handles' },
      { id: 'tab-workflows', sourceRegion: 'tab-workflows' },
    ],
    notes: [
      'Panel handles append tabs, create splits, and remove active tabs.',
      'Tab handles update tab data, activate a known tab, and move a tab to another panel.',
      'Workflow helpers activate an existing resource tab or open it once near a related tab.',
    ],
  },
  {
    slug: 'floating',
    title: 'Floating Panels',
    description: 'Detach panels into movable overlays and dock them back.',
    demos: [
      { id: 'initial-floating', sourceRegion: 'initial-floating' },
      { id: 'runtime-floating', sourceRegion: 'runtime-floating' },
      { id: 'tab-floating', sourceRegion: 'tab-floating' },
      { id: 'native-popout', sourceRegion: 'native-popout' },
      { id: 'popout-styling', sourceRegion: 'popout-styling' },
    ],
    notes: [
      'Layouts with detached panels use type: "root" with a normal docked layout under main and floatingPanel entries under floating.',
      'Floating panels are rendered above the tiled tree, can be focused for z-order, moved by empty tab-bar space, and resized from their edges or corners.',
      'floatPanel() detaches an existing panel without closing its tabs; dockPanel() inserts it back into the tiled layout.',
      'floatTab() extracts one tab into a new floating panel; moveTab() can insert it back into another tab bar.',
      'popoutPanel() renders a detached panel into a same-origin browser window through a React portal, so app context is preserved.',
      'Native popout windows copy style and stylesheet tags from the document head, but they do not inherit wrapper elements, html/body classes, or inline variables from the main page.',
      'getLayout() and setLayout() round-trip floating bounds, popout window bounds, tab state, and z-order.',
    ],
  },
  {
    slug: 'persistence',
    title: 'Layout Persistence',
    description: 'Save, restore, and replace layout snapshots.',
    demos: [
      { id: 'local-storage', sourceRegion: 'local-storage' },
      { id: 'snapshot-controls', sourceRegion: 'snapshot-controls' },
    ],
    notes: [
      'The localStorage demo stores getLayout() output on every change and reuses it as initialLayout.',
      'The snapshot-controls demo saves a layout in React state and restores it with setLayout().',
    ],
  },
  {
    slug: 'callbacks',
    title: 'Lifecycle Callbacks',
    description: 'Track structural and resize lifecycle events.',
    demos: [
      { id: 'structural', sourceRegion: 'structural' },
      { id: 'resize', sourceRegion: 'resize' },
    ],
    notes: [
      'Structural callbacks receive events for tab moves, active-tab changes, splits, opens, and closes.',
      'Resize callbacks report continuous pointer/keyboard resize updates and the committed resize-end event.',
    ],
  },
  {
    slug: 'nested',
    title: 'Nested Instances',
    description: 'A Tilery instance rendered inside a tab of another Tilery.',
    notes: [
      'A tab content renderer can mount a second Tilery instance with its own layout state.',
      'Nested instances are isolated, so inner resizing and tabs do not modify the outer tree.',
    ],
  },
];
