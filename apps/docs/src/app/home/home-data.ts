// Shared homepage copy. Plain module (no 'use client') so it can be imported by
// both the Server page and the client scenes. The scenes are still
// server-rendered for the initial HTML, so this text ships in the SSR payload.

export type HomePrinciple = {
  title: string;
  body: string;
};

export type HomeCapability = {
  /** Short label, also used as the faux tab-bar title. */
  title: string;
  body: string;
  /** Which micro-diagram the capability card animates. */
  demo:
    | 'tab-move'
    | 'resize'
    | 'render'
    | 'styling'
    | 'core'
    | 'imperative'
    | 'floating'
    | 'persist'
    | 'lock';
};

export const principles: HomePrinciple[] = [
  {
    title: 'Flexible panel layouts',
    body: 'Split panels, resize dividers, move tabs, maximize views, float panels, and open popout windows from one Tilery surface.',
  },
  {
    title: 'Framework-agnostic core',
    body: 'Layout, drag, and resize logic live in the dependency-free tilery core. @tileryjs/react is the first adapter, not a requirement.',
  },
  {
    title: 'Typed from core to adapter',
    body: 'The core has no runtime dependencies, and the React adapter exposes typed panels, tabs, controllers, and events.',
  },
];

export const capabilities: HomeCapability[] = [
  {
    title: 'Tab movement',
    body: 'Reorder tabs, move them across panels, or drop them into new split zones.',
    demo: 'tab-move',
  },
  {
    title: 'Resize model',
    body: 'Split dividers are derived from the layout tree automatically.',
    demo: 'resize',
  },
  {
    title: 'Rendering control',
    body: 'Bring your own tab headers, panel content, icons, and interaction chrome.',
    demo: 'render',
  },
  {
    title: 'Styling system',
    body: 'Tune the default surface with CSS variables instead of replacing the whole renderer.',
    demo: 'styling',
  },
  {
    title: 'Package split',
    body: 'Install @tileryjs/react for apps; use tilery directly for framework adapters and layout tooling.',
    demo: 'core',
  },
  {
    title: 'Imperative API',
    body: 'Split, append, insert, remove, activate, swap, and inspect layouts from product code.',
    demo: 'imperative',
  },
  {
    title: 'Floating & popout',
    body: 'Detach a panel into a draggable overlay, or pop it out into its own browser window.',
    demo: 'floating',
  },
  {
    title: 'Save & restore',
    body: 'Serialize the whole layout — tabs, splits, sizes, and active views — then restore it exactly.',
    demo: 'persist',
  },
  {
    title: 'Lock panels & tabs',
    body: 'Freeze resizing, dragging, dropping, or closing wherever you need it.',
    demo: 'lock',
  },
];
