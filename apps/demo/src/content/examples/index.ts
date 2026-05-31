export { Example as BasicExample } from './basic/example';
export { Example as IdeExample } from './ide/example';
export { Example as DashboardExample } from './dashboard/example';
export { Example as PanelActionsExample } from './collapse/example';
export { Example as ConstraintsExample } from './constraints/example';
export { Example as ControlledExample } from './controlled/example';
export { Example as PersistenceExample } from './persistence/example';
export { Example as CallbacksExample } from './callbacks/example';
export { Example as NestedExample } from './nested/example';

export { metadata as basicMeta } from './basic/metadata';
export { metadata as ideMeta } from './ide/metadata';
export { metadata as dashboardMeta } from './dashboard/metadata';
export { metadata as panelActionsMeta } from './collapse/metadata';
export { metadata as constraintsMeta } from './constraints/metadata';
export { metadata as controlledMeta } from './controlled/metadata';
export { metadata as persistenceMeta } from './persistence/metadata';
export { metadata as callbacksMeta } from './callbacks/metadata';
export { metadata as nestedMeta } from './nested/metadata';

export const examples = [
  {
    slug: 'basic',
    title: 'Basic Layout',
    description: 'Two side-by-side panels with one tab each.',
  },
  {
    slug: 'ide',
    title: 'IDE Layout',
    description: 'VS Code-like layout with sidebar, editor, and terminal.',
  },
  {
    slug: 'dashboard',
    title: 'Dashboard',
    description: '2x2 grid of panels like an analytics dashboard.',
  },
  {
    slug: 'collapse',
    title: 'Panel Actions',
    description:
      'Built-in panel actions, custom menu items, and new-tab hooks.',
  },
  {
    slug: 'constraints',
    title: 'Size Constraints',
    description: 'Panels with per-panel minSize and maxSize resize limits.',
  },
  {
    slug: 'controlled',
    title: 'Programmatic Control',
    description: 'Use the imperative API to add, remove, and move tabs.',
  },
  {
    slug: 'persistence',
    title: 'Layout Persistence',
    description: 'Save and restore layout state via localStorage.',
  },
  {
    slug: 'callbacks',
    title: 'Lifecycle Callbacks',
    description: 'Track tab, panel, split, move, and active-tab events.',
  },
  {
    slug: 'nested',
    title: 'Nested Instances',
    description: 'A Tilery instance rendered inside a tab of another Tilery.',
  },
];
