export {
  metadata as basicMeta,
  Example as BasicExample,
  source as basicSource,
} from './basic';
export {
  metadata as ideMeta,
  Example as IdeExample,
  source as ideSource,
} from './ide';
export {
  metadata as dashboardMeta,
  Example as DashboardExample,
  source as dashboardSource,
} from './dashboard';
export {
  metadata as controlledMeta,
  Example as ControlledExample,
  source as controlledSource,
} from './controlled';
export {
  metadata as persistenceMeta,
  Example as PersistenceExample,
  source as persistenceSource,
} from './persistence';
export {
  metadata as nestedMeta,
  Example as NestedExample,
  source as nestedSource,
} from './nested';

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
    slug: 'nested',
    title: 'Nested Instances',
    description: 'A tilery instance rendered inside a tab of another tilery.',
  },
];
