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
    | 'imperative';
};

export type HomeLink = {
  label: string;
  href: string;
  /** Mono keycap-style hint shown on the right of the command-palette row. */
  hint: string;
};

export const principles: HomePrinciple[] = [
  {
    title: 'A real workspace surface',
    body: 'Drag tabs, split panels, and resize complex arrangements without building your own window manager.',
  },
  {
    title: 'State that follows the work',
    body: 'Stable portal hosts keep React subtrees alive as tabs move, so forms, editors, and previews do not reset.',
  },
  {
    title: 'Programmable by default',
    body: 'Use the typed controller plus panel and tab objects to create panels, move tabs, activate views, persist layouts, and build your own controls.',
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
    title: 'Core package',
    body: 'Keep state and layout operations framework-agnostic, with React as the first adapter.',
    demo: 'core',
  },
  {
    title: 'Imperative API',
    body: 'Split, append, insert, remove, activate, swap, and inspect layouts from product code.',
    demo: 'imperative',
  },
];

export const links: HomeLink[] = [
  { label: 'Getting Started', href: '/docs/getting-started', hint: 'docs' },
  { label: 'Concepts', href: '/docs/concepts', hint: 'guide' },
  { label: 'API Reference', href: '/docs/api', hint: 'api' },
  { label: 'Examples', href: '/examples/ide', hint: 'demo' },
];
