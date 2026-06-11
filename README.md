# Tilery

A tiling panel layout engine for React. Build IDE-like interfaces, dashboard builders, or any multi-panel application with fluid panel management, drag-and-drop tab reordering, and resizable dividers.

[Website](https://tileryjs.com) | [GitHub](https://github.com/yangshun/tilery)

## Features

- Drag tabs between panels or into new splits
- Resize panels via split dividers
- Maximize one panel fullscreen
- Preserves React state across tab moves (portal-based rendering)
- Framework-agnostic core with a React adapter
- Fully customizable tab headers and content
- Zero dependencies (React is a peer dep)
- TypeScript-first with full type coverage

## Installation

```sh
npm install @tileryjs/react
```

`tilery` (the core package) is included as a dependency automatically.

## Quick Start

```tsx
import { Tilery } from '@tileryjs/react';
import '@tileryjs/react/style.css';
import type { TileryInitialLayout, TileryTab } from '@tileryjs/react';

type MyTabData = { title: string };

const layout: TileryInitialLayout<MyTabData> = {
  type: 'group',
  direction: 'horizontal',
  children: [
    {
      type: 'panel',
      id: 'sidebar',
      size: 30,
      tabs: [{ id: 'explorer', data: { title: 'Explorer' } }],
    },
    {
      type: 'panel',
      id: 'editor',
      size: 70,
      tabs: [
        { id: 'file-a', data: { title: 'index.ts' } },
        { id: 'file-b', data: { title: 'app.tsx' } },
      ],
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
}
```

## Styling

Import the base stylesheet which provides the panel chrome, tab bar, dividers, and drag overlay:

```ts
import '@tileryjs/react/style.css';
```

All visual properties are customizable via CSS variables:

| Variable                                  | Default                  | Description                               |
| ----------------------------------------- | ------------------------ | ----------------------------------------- |
| `--tilery-bg`                             | `#0e0f12`                | Root background                           |
| `--tilery-fg`                             | `#d9dde3`                | Root text color                           |
| `--tilery-font`                           | `inherit`                | Font family                               |
| `--tilery-panel-bg`                       | `#1a1c20`                | Panel background                          |
| `--tilery-panel-border`                   | `#2a2d33`                | Panel/tab-bar borders                     |
| `--tilery-panel-gap`                      | `4px`                    | Gap between panels                        |
| `--tilery-outer-gap`                      | (panel-gap)              | Gap around the outer edge                 |
| `--tilery-tabbar-bg`                      | `#16181c`                | Tab bar background                        |
| `--tilery-tabbar-height`                  | `32px`                   | Tab bar height                            |
| `--tilery-tab-font-size`                  | `12px`                   | Tab label font size                       |
| `--tilery-tab-fg`                         | `#9aa1ab`                | Inactive tab text                         |
| `--tilery-tab-active-bg`                  | (panel-bg)               | Active tab background                     |
| `--tilery-tab-active-fg`                  | `#f3f4f7`                | Active tab text                           |
| `--tilery-tab-hover-bg`                   | transparent              | Inactive tab hover background             |
| `--tilery-menu-bg`                        | `#1f2228`                | Panel action menu background              |
| `--tilery-menu-shadow`                    | `0 8px 24px rgba(...)`   | Panel action menu shadow                  |
| `--tilery-action-hover-bg`                | `rgba(255,255,255,0.08)` | Action, close button, and menu item hover |
| `--tilery-accent`                         | `#3884ff`                | Accent color (active indicator, focus)    |
| `--tilery-drop-bg`                        | `rgba(56,132,255,0.18)`  | Drop overlay background                   |
| `--tilery-drop-border`                    | `rgba(56,132,255,0.6)`   | Drop overlay border and insertion marker  |
| `--tilery-resize-handle-active-bg`        | (accent)                 | Active resize divider line color          |
| `--tilery-resize-handle-active-line-size` | `2px`                    | Active resize divider line thickness      |

## API

### `<Tilery>`

The main component. Renders a tiling panel layout.

```tsx
<Tilery
  initialLayout={layout}
  renderTabHeader={renderTabHeader}
  renderTabContent={renderTabContent}
  onChange={handleChange}
  onResize={handleResize}
  onResizeEnd={handleResizeEnd}
  onActiveTabChange={handleActiveTabChange}
  onTabsMove={handleTabsMove}
  onPanelsOpen={handlePanelsOpen}
  onPanelSplit={handlePanelSplit}
  onTabsOpen={handleTabsOpen}
  onTabsClose={handleTabsClose}
  onPanelsClose={handlePanelsClose}
  minSize={10}
  showActionsButton
  showNewTabButton={(panel) => panel.id === 'editor'}
  onNewTab={(panel) => ({ data: { title: 'Untitled' } })}
  renderPanelActions={renderPanelActions}
  renderActionsButtonIcon={renderActionsButtonIcon}
  ref={tileryRef}
/>
```

#### Props

| Prop                      | Type                                                               | Required | Description                                     |
| ------------------------- | ------------------------------------------------------------------ | -------- | ----------------------------------------------- |
| `initialLayout`           | `TileryInitialLayout<TData>`                                       | Yes      | The initial panel and tab configuration         |
| `renderTabHeader`         | `(tab: TileryTab<TData>, ctx: { isActive: boolean }) => ReactNode` | Yes      | Renders the tab button content                  |
| `renderTabTrigger`        | `(ctx: TileryTabTriggerRenderContext<TData>) => ReactElement`      | No       | Customizes the main tab trigger element         |
| `renderTabContent`        | `(tab: TileryTab<TData>) => ReactNode`                             | Yes      | Renders the tab panel content                   |
| `onChange`                | `(state: TileryLayoutState) => void`                               | No       | Called after every state change                 |
| `onResize`                | `(event: TileryResizeEvent) => void`                               | No       | Called for each divider or junction resize      |
| `onResizeEnd`             | `(event: TileryResizeEvent) => void`                               | No       | Called when a resize interaction commits        |
| `onActiveTabChange`       | `(event: TileryActiveTabChangeEvent) => void`                      | No       | Called when a panel's active tab changes        |
| `onTabsMove`              | `(event: TileryTabsMoveEvent<TData>) => void`                      | No       | Called when tabs move between panels or indexes |
| `onPanelsOpen`            | `(event: TileryPanelsOpenEvent<TData>) => void`                    | No       | Called when panels are created                  |
| `onPanelSplit`            | `(event: TileryPanelSplitEvent<TData>) => void`                    | No       | Called when a panel is split                    |
| `onTabsOpen`              | `(event: TileryTabsOpenEvent<TData>) => void`                      | No       | Called when tabs are added                      |
| `onTabsClose`             | `(event: TileryTabsCloseEvent<TData>) => void`                     | No       | Called when tabs are removed                    |
| `onPanelsClose`           | `(event: TileryPanelsCloseEvent<TData>) => void`                   | No       | Called when panels are removed                  |
| `minSize`                 | `number`                                                           | No       | Default minimum panel size percentage           |
| `resizable`               | `boolean`                                                          | No       | Enables or disables all resize handles          |
| `resizeHandleHitSize`     | `number`                                                           | No       | Pointer hit target size for resize handles      |
| `showActionsButton`       | `boolean \| (panel: TileryPanel) => boolean`                       | No       | Shows the built-in panel action menu            |
| `showNewTabButton`        | `boolean \| (panel: TileryPanel) => boolean`                       | No       | Shows the optional new-tab button               |
| `onNewTab`                | `(panel, ctx) => TileryTabInit<TData> \| void`                     | No       | Responds to the new-tab button                  |
| `renderPanelActions`      | `(panel, ctx) => ReactNode`                                        | No       | Appends custom content to the panel action menu |
| `renderActionsButtonIcon` | `(panel) => ReactNode`                                             | No       | Customizes the action menu button icon          |
| `ref`                     | `Ref<TileryController>`                                            | No       | Controller ref for programmatic control         |

#### Custom tab triggers

Use `renderTabTrigger` when tabs need to render as links or router components.
Keep link metadata in your tab `data`; Tilery supplies the props that preserve
selection, drag, and accessibility behavior.

```tsx
<Tilery
  initialLayout={layout}
  renderTabHeader={(tab) => <span>{tab.data.title}</span>}
  renderTabTrigger={({ tab, props, children }) =>
    tab.data.href ? (
      <a href={tab.data.href} {...props}>
        {children}
      </a>
    ) : (
      <div {...props}>{children}</div>
    )
  }
  renderTabContent={(tab) => <div>{tab.data.title} content</div>}
/>
```

### `TileryInitialLayout<TData>`

Describes the initial panel arrangement.

```ts
type TileryInitialLayout<TData> =
  | {
      type: 'empty';
    }
  | ({
      type: 'panel';
      id?: string;
      size?: number;
      minSize?: number;
      maxSize?: number;
      tabs: TileryTabInit<TData>[];
      activeTabId?: string;
      fullScreen?: boolean;
    } & TileryLayoutBehaviorConfig)
  | ({
      type: 'group';
      id?: string;
      direction: 'horizontal' | 'vertical';
      size?: number;
      children: TileryInitialLayout<TData>[];
    } & TileryLayoutBehaviorConfig);

type TileryLayoutBehaviorConfig =
  | {
      locked: true;
      resizable?: never;
      draggable?: never;
      droppable?: never;
    }
  | {
      locked?: false;
      resizable?: boolean;
      draggable?: boolean;
      droppable?: boolean;
    };

type TileryTabBehaviorConfig =
  | { locked: true; closeable?: never; draggable?: never }
  | { locked?: false; closeable?: boolean; draggable?: boolean };

type TileryTabInit<TData> = {
  id?: string;
  data: TData;
} & TileryTabBehaviorConfig;

type TileryTabBehavior = {
  closeable: boolean;
  draggable: boolean;
};

type TileryTabBehaviorUpdate =
  | { locked: true; closeable?: never; draggable?: never }
  | { locked?: false; closeable?: boolean; draggable?: boolean };

type TileryTabSnapshot<TData> = {
  id?: string;
  data: TData;
} & TileryTabBehavior;

type TileryLayoutBehavior = {
  resizable: boolean;
  draggable: boolean;
  droppable: boolean;
};

type TileryLayoutSnapshot<TData> =
  | { type: 'empty' }
  | ({
      type: 'panel';
      id?: string;
      size?: number;
      minSize?: number;
      maxSize?: number;
      tabs: TileryTabSnapshot<TData>[];
      activeTabId?: string;
      fullScreen?: boolean;
    } & TileryLayoutBehavior)
  | ({
      type: 'group';
      id?: string;
      direction: 'horizontal' | 'vertical';
      size?: number;
      children: TileryLayoutSnapshot<TData>[];
    } & TileryLayoutBehavior);
```

Layouts are initialized as an n-ary group tree. A horizontal group places its
children left to right; a vertical group places its children top to bottom.
`size` belongs to each child item and controls that child's allocation
inside its parent group. Omitted child sizes share the remaining space. A root
node's `size` is ignored.

Panels can also define `minSize` and `maxSize` constraints as percentages.
These constraints override the root `minSize` fallback when resizing dividers.
Set `resizable={false}` on `Tilery` to disable all resize handles globally.
On layout items, `resizable` controls adjacent divider resizing, `draggable`
controls moving tabs out of the item, and `droppable` controls dropping tabs
into or splitting over the item. Use `locked: true` as public API shorthand for
`resizable: false`, `draggable: false`, and `droppable: false`.

On tabs, `closeable` controls close actions and `draggable` controls tab move
actions. Use tab `locked: true` as shorthand for `closeable: false` and
`draggable: false`.

Resize dividers are keyboard-accessible separators. Focus a divider, then use
the arrow keys for axis-aligned resizing, Shift+Arrow for larger steps, and
Home/End to move to the nearest minimum or maximum allowed size.
Set `resizeHandleHitSize` to adjust the pointer target for dividers and
T-junction resize handles.

Resize handles expose stable styling attributes:

- `data-orientation="vertical" | "horizontal"` on dividers
- `data-resize-active` while a divider or junction is being dragged
- `data-resize-at-min` when a divider is at its minimum position
- `data-resize-at-max` when a divider is at its maximum position
- `data-resize-disabled` when a divider or junction cannot be resized

### Layout snapshots

`TileryLayoutSnapshot<TData>` is the serializable form returned by
`tilery.getLayout()`. Store it as JSON and pass it back to `initialLayout` or
`tilery.setLayout(snapshot)` to restore the same panel tree, tab order, active
tabs, fullscreen panel, panel size constraints, explicit layout behavior
booleans, and explicit tab behavior booleans. Snapshots do not emit `locked`;
they store layout `resizable`, `draggable`, and `droppable`, plus tab
`closeable` and `draggable`, directly.
For SSR, parse a saved cookie on the server and pass that snapshot as
`initialLayout`; for client-only persistence, read and write the snapshot from
`localStorage`.

```tsx
const saved =
  typeof window === 'undefined' ? null : localStorage.getItem('tilery-layout');

<Tilery
  ref={tileryRef}
  initialLayout={saved ? JSON.parse(saved) : defaultLayout}
  onChange={() => {
    const layout = tileryRef.current?.getLayout<MyTabData>();
    if (layout) localStorage.setItem('tilery-layout', JSON.stringify(layout));
  }}
  renderTabHeader={renderTabHeader}
  renderTabContent={renderTabContent}
/>;
```

### `TileryResizeEvent`

`onResize` fires for each pointer or keyboard resize that changes panel sizes.
`onResizeEnd` fires when that resize is committed: on pointer release for drag
resizes, and immediately after each keyboard resize.

```ts
type TileryResizeEvent = {
  phase: 'resize' | 'end';
  input: 'keyboard' | 'pointer';
  source:
    | {
        type: 'divider';
        dividerId: string;
        orientation: 'vertical' | 'horizontal';
        previousPosition: number;
        position: number;
      }
    | {
        type: 'junction';
        junctionId: string;
        previousX: number;
        previousY: number;
        x: number;
        y: number;
        verticalDividerId: string;
        horizontalDividerId: string;
      };
  changes: Array<{
    panelId: string;
    dimension: 'width' | 'height';
    previousSize: number;
    size: number;
    previousPixelSize?: number;
    pixelSize?: number;
  }>;
  previousState: TileryLayoutState;
  state: TileryLayoutState;
};
```

### Lifecycle events

Lifecycle events fire for state changes that activate, move, add, or remove
tabs and panels. Events include the action source, previous state, next state,
and compact tab or panel snapshots from the relevant side of the transition.
When a panel closes because its last tab moved out, `onPanelsClose` reports the
moved tab even though `onTabsClose` does not fire.

```ts
type TileryLifecycleSource =
  | 'PANEL_SPLIT'
  | 'PANEL_REMOVE'
  | 'TAB_APPEND'
  | 'TAB_INSERT'
  | 'TAB_ID_CHANGE'
  | 'TAB_REMOVE'
  | 'TAB_MOVE'
  | 'TAB_FLOAT'
  | 'TAB_POPOUT'
  | 'TAB_ACTIVE_SET'
  | 'STATE_REPLACE';

type TileryTabLifecycleChange<TData> = {
  id: string;
  panelId: string;
  data: TData;
  closeable: boolean;
  draggable: boolean;
};

type TileryPanelLifecycleChange = {
  id: string;
  tabIds: string[];
  activeTabId: string | null;
};

type TileryActiveTabChange = {
  panelId: string;
  previousTabId: string | null;
  tabId: string | null;
};

type TileryTabMoveChange<TData> = {
  id: string;
  previousPanelId: string;
  panelId: string;
  previousIndex: number;
  index: number;
  data: TData;
  closeable: boolean;
  draggable: boolean;
};

type TileryActiveTabChangeEvent = {
  source: TileryLifecycleSource;
  changes: TileryActiveTabChange[];
  previousState: TileryLayoutState;
  state: TileryLayoutState;
};

type TileryTabsMoveEvent<TData> = {
  source: TileryLifecycleSource;
  tabs: TileryTabMoveChange<TData>[];
  previousState: TileryLayoutState;
  state: TileryLayoutState;
};

type TileryPanelsOpenEvent<TData> = {
  source: TileryLifecycleSource;
  panels: TileryPanelLifecycleChange[];
  tabs: TileryTabLifecycleChange<TData>[];
  previousState: TileryLayoutState;
  state: TileryLayoutState;
};

type TileryPanelSplitEvent<TData> = {
  source: 'PANEL_SPLIT' | 'TAB_MOVE';
  splitPanelId: string;
  createdPanelId: string;
  direction: 'left' | 'right' | 'top' | 'bottom';
  size: number;
  splitPanel: TileryPanelLifecycleChange;
  createdPanel: TileryPanelLifecycleChange;
  tabs: TileryTabLifecycleChange<TData>[];
  previousState: TileryLayoutState;
  state: TileryLayoutState;
};

type TileryTabsOpenEvent<TData> = {
  source: TileryLifecycleSource;
  tabs: TileryTabLifecycleChange<TData>[];
  previousState: TileryLayoutState;
  state: TileryLayoutState;
};

type TileryTabsCloseEvent<TData> = {
  source: TileryLifecycleSource;
  tabs: TileryTabLifecycleChange<TData>[];
  panels: TileryPanelLifecycleChange[];
  previousState: TileryLayoutState;
  state: TileryLayoutState;
};

type TileryPanelsCloseEvent<TData> = {
  source: TileryLifecycleSource;
  panels: TileryPanelLifecycleChange[];
  tabs: TileryTabLifecycleChange<TData>[];
  previousState: TileryLayoutState;
  state: TileryLayoutState;
};
```

A fullscreen panel renders over the full Tilery container, suppresses
dividers and panel drop zones until it is restored.

### `TileryController`

The controller exposed via `ref`. Use it for programmatic layout manipulation.

| Method                                  | Description                                   |
| --------------------------------------- | --------------------------------------------- |
| `getPanel(id)`                          | Returns a `TileryPanel` or `null`             |
| `getTab(id)`                            | Returns a `TileryTab` or `null`               |
| `getPanels()`                           | Returns all `TileryPanel[]`                   |
| `getTabs()`                             | Returns all `TileryTab[]`                     |
| `movePanel(panelId, target)`            | Moves a panel while preserving its identity   |
| `splitPanel(panelId, direction, opts?)` | Splits a panel, returns the new `TileryPanel` |
| `removePanel(panelId)`                  | Removes a panel (redistributes space)         |
| `maximizePanel(panelId)`                | Shows one panel fullscreen                    |
| `restorePanel(panelId)`                 | Restores a fullscreen panel                   |
| `appendTab(panelId, tab, opts?)`        | Appends a tab to a panel                      |
| `insertTab(panelId, tab, index, opts?)` | Inserts a tab at a specific index             |
| `removeTab(tabId)`                      | Removes a tab (removes panel if last)         |
| `moveTab(tabId, target)`                | Moves a tab to a target location              |
| `setTabBehavior(tabId, behavior)`       | Updates tab close and drag behavior           |
| `setActiveTab(tabId)`                   | Activates a tab                               |
| `swapPanels(panelA, panelB)`            | Swaps two panels' positions                   |
| `getLayout()`                           | Returns a serializable `TileryLayoutSnapshot` |
| `setLayout(layout)`                     | Restores a `TileryLayoutSnapshot`             |
| `getState()`                            | Returns the current `TileryLayoutState`       |

### `TileryPanel`

Returned by `getPanel()` and `getPanels()`. Provides panel-scoped operations.

| Property/Method                | Description                                        |
| ------------------------------ | -------------------------------------------------- |
| `id`                           | Panel identifier                                   |
| `inset`                        | Current `{ top, right, bottom, left }` percentages |
| `tabs`                         | Array of `TileryTab` for this panel                |
| `activeTab`                    | The active `TileryTab` or `null`                   |
| `fullScreen`                   | Whether this panel is currently fullscreen         |
| `minSize`                      | Panel minimum size constraint, if set              |
| `maxSize`                      | Panel maximum size constraint, if set              |
| `appendTab(tab, opts?)`        | Append a tab to this panel                         |
| `insertTab(tab, index, opts?)` | Insert a tab at index                              |
| `moveTo(target)`               | Move this panel while preserving its identity      |
| `split(direction, opts?)`      | Split this panel                                   |
| `remove()`                     | Remove this panel                                  |
| `maximize()`                   | Show this panel fullscreen                         |
| `restore()`                    | Restore this panel from fullscreen                 |
| `setActiveTab(tabId)`          | Set the active tab                                 |

### `TileryTab<TData>`

Returned by `getTab()`, `getTabs()`, and panel tab properties. Provides tab-scoped operations.

| Property/Method         | Description                          |
| ----------------------- | ------------------------------------ |
| `id`                    | Tab identifier                       |
| `panel`                 | The parent `TileryPanel`             |
| `index`                 | Position within the panel's tab list |
| `data`                  | The `TData` payload                  |
| `closeable`             | Whether close actions are allowed    |
| `draggable`             | Whether move actions are allowed     |
| `setData(data)`         | Update the tab's data                |
| `setBehavior(behavior)` | Update tab close and drag behavior   |
| `moveTo(target)`        | Move to a target location            |
| `activate()`            | Make this the active tab             |
| `remove()`              | Remove this tab                      |

### `TileryMoveTarget`

Used with `moveTab()` and `tab.moveTo()`:

```ts
type TileryMoveTarget =
  | { panel: TileryPanelId; index?: number } // Move to panel at index
  | { beforeTab: TileryTabId } // Insert before a tab
  | { afterTab: TileryTabId } // Insert after a tab
  | ({
      splitPanel: TileryPanelId;
      direction: TileryDirection;
      size?: number;
      minSize?: number;
      maxSize?: number;
    } & TileryLayoutBehaviorConfig) // Split into new panel
  | ({
      splitRoot: true;
      direction: TileryDirection;
      size?: number;
      minSize?: number;
      maxSize?: number;
    } & TileryLayoutBehaviorConfig); // Split the root into a new panel
```

### `TileryPanelMoveTarget`

Used with `movePanel()` and `panel.moveTo()`:

```ts
type TileryPanelMoveTarget =
  | ({
      splitPanel: TileryPanelId;
      direction: TileryDirection;
      size?: number;
      minSize?: number;
      maxSize?: number;
    } & TileryLayoutBehaviorConfig)
  | ({
      splitRoot: true;
      direction: TileryDirection;
      size?: number;
      minSize?: number;
      maxSize?: number;
    } & TileryLayoutBehaviorConfig);
```

### `TileryDirection`

```ts
type TileryDirection = 'left' | 'right' | 'top' | 'bottom';
```

## Packages

| Package           | Description                                                  |
| ----------------- | ------------------------------------------------------------ |
| `tilery`          | Framework-agnostic types, state reducer, drag logic, and CSS |
| `@tileryjs/react` | React adapter (components, hooks)                            |

## Development

```sh
pnpm install
pnpm dev          # Start the docs site
pnpm build        # Build packages
pnpm test         # Run tests
pnpm test:coverage # Run tests with coverage
pnpm check        # Lint + format check
```

## License

MIT
