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
    title: 'A drop-in window manager',
    body: 'Draggable tabs, split zones, resize, maximize, floating panels, and pop-out windows — all from one <Tilery> component.',
  },
  {
    title: 'Framework-agnostic core',
    body: 'Layout, drag, and resize logic live in a dependency-free core. React is the first adapter, not a requirement.',
  },
  {
    title: 'Zero dependencies, fully typed',
    body: 'React is the only peer dependency, and every panel, tab, and controller is typed end to end.',
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
