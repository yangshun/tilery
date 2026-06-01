export { Example as BasicExample } from './basic/example';
export { Example as IdeExample } from './ide/example';
export { Example as DashboardExample } from './dashboard/example';
export { Example as PanelActionsExample } from './collapse/example';
export { Example as ConstraintsExample } from './constraints/example';
export { Example as TabLockingExample } from './tab-locking/example';
export { Example as ControlledExample } from './controlled/example';
export { Example as PersistenceExample } from './persistence/example';
export { Example as CallbacksExample } from './callbacks/example';
export { Example as NestedExample } from './nested/example';

export { metadata as basicMeta } from './basic/metadata';
export { metadata as ideMeta } from './ide/metadata';
export { metadata as dashboardMeta } from './dashboard/metadata';
export { metadata as panelActionsMeta } from './collapse/metadata';
export { metadata as constraintsMeta } from './constraints/metadata';
export { metadata as tabLockingMeta } from './tab-locking/metadata';
export { metadata as controlledMeta } from './controlled/metadata';
export { metadata as persistenceMeta } from './persistence/metadata';
export { metadata as callbacksMeta } from './callbacks/metadata';
export { metadata as nestedMeta } from './nested/metadata';

export const examples = [
  {
    slug: 'basic',
    title: 'Basic Layout',
    description: 'Two side-by-side panels with one tab each.',
    notes: [
      'The initial layout is a horizontal split with two panels and one tab per panel.',
      'Drag the divider to see how sibling panel sizes are redistributed.',
    ],
  },
  {
    slug: 'ide',
    title: 'IDE Layout',
    description: 'VS Code-like layout with sidebar, editor, and terminal.',
    notes: [
      'Nested horizontal and vertical splits model a familiar editor shell.',
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
    slug: 'collapse',
    title: 'Panel Actions',
    description:
      'Built-in panel actions, custom menu items, and new-tab hooks.',
    notes: [
      'The panel action menu can mix Tilery actions with app-supplied commands.',
      'The editor panel also exposes a new-tab button backed by the onNewTab callback.',
    ],
  },
  {
    slug: 'constraints',
    title: 'Size Constraints',
    description: 'Panels with percentage and pixel minSize/maxSize limits.',
    notes: [
      'Each panel can define its own minSize and maxSize in the layout tree, using percentages or pixel values.',
      'Resize handles clamp against the nearest constrained panels in the active split.',
      'Impossible constraint combinations warn once in development; runtime resize still clamps or no-ops instead of throwing.',
      'Handles expose data-resize-* attributes for active, disabled, and min/max clamp states; hover and focus styling use CSS pseudo-classes.',
    ],
  },
  {
    slug: 'tab-locking',
    title: 'Tab Locking',
    description: 'Lock tabs or toggle whether they can be closed and dragged.',
    notes: [
      'locked: true is shorthand for a tab that cannot be closed or dragged.',
      'The in-panel controls call tab.setBehavior() to update closeable and draggable at runtime.',
    ],
  },
  {
    slug: 'controlled',
    title: 'Programmatic Control',
    description: 'Use the imperative API to add, remove, and move tabs.',
    notes: [
      'The Tilery ref exposes panel and tab handles for imperative workflows.',
      'The toolbar appends tabs, creates a split, and removes the active tab through those handles.',
    ],
  },
  {
    slug: 'persistence',
    title: 'Layout Persistence',
    description: 'Save and restore layout state via localStorage.',
    notes: [
      'getLayout() returns a serializable snapshot that can be stored outside Tilery.',
      'Passing the saved snapshot back as initialLayout restores panel sizes and tab state.',
    ],
  },
  {
    slug: 'callbacks',
    title: 'Lifecycle Callbacks',
    description: 'Track tab, panel, split, move, and active-tab events.',
    notes: [
      'Callbacks receive structured events for tab moves, active-tab changes, splits, opens, and closes.',
      'The event log shows which operations fire as toolbar actions mutate the layout.',
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
