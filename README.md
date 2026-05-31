# Tilery

A tiling panel layout engine for React. Build IDE-like interfaces, dashboard builders, or any multi-panel application with fluid panel management, drag-and-drop tab reordering, and resizable dividers.

[Demo](https://tilery.vercel.app) | [GitHub](https://github.com/yangshun/tilery)

## Features

- Drag tabs between panels or into new splits
- Resize panels via dividers and 2D junction handles
- Maximize one panel fullscreen
- Preserves React state across tab moves (portal-based rendering)
- Framework-agnostic core with a React adapter
- Fully customizable tab headers and content
- Zero dependencies (React is a peer dep)
- TypeScript-first with full type coverage

## Installation

```sh
npm install @tilery/react
```

`tilery` (the core package) is included as a dependency automatically.

## Quick Start

```tsx
import { Tilery } from '@tilery/react';
import '@tilery/react/style.css';
import type { TileryInitialLayout, TileryTabHandle } from '@tilery/react';

type MyTabData = { title: string };

const layout: TileryInitialLayout<MyTabData> = {
  panels: [
    {
      id: 'sidebar',
      inset: { top: 0, right: 70, bottom: 0, left: 0 },
      tabs: [{ id: 'explorer', data: { title: 'Explorer' } }],
    },
    {
      id: 'editor',
      inset: { top: 0, right: 0, bottom: 0, left: 30 },
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
import '@tilery/react/style.css';
```

All visual properties are customizable via CSS variables:

| Variable                 | Default     | Description                                 |
| ------------------------ | ----------- | ------------------------------------------- |
| `--tilery-bg`            | `#0e0f12`   | Root background                             |
| `--tilery-fg`            | `#d9dde3`   | Root text color                             |
| `--tilery-font`          | `inherit`   | Font family                                 |
| `--tilery-panel-bg`      | `#1a1c20`   | Panel background                            |
| `--tilery-panel-border`  | `#2a2d33`   | Panel/tab-bar borders                       |
| `--tilery-panel-gap`     | `4px`       | Gap between panels                          |
| `--tilery-outer-gap`     | (panel-gap) | Gap around the outer edge                   |
| `--tilery-tabbar-bg`     | `#16181c`   | Tab bar background                          |
| `--tilery-tab-fg`        | `#9aa1ab`   | Inactive tab text                           |
| `--tilery-tab-active-fg` | `#f3f4f7`   | Active tab text                             |
| `--tilery-menu-bg`       | `#1f2228`   | Panel action menu background                |
| `--tilery-accent`        | `#3884ff`   | Accent color (active indicator, drop zones) |

## API

### `<Tilery>`

The main component. Renders a tiling panel layout.

```tsx
<Tilery
  initialLayout={layout}
  renderTabHeader={renderTabHeader}
  renderTabContent={renderTabContent}
  onChange={handleChange}
  minPanelSizePercent={10}
  showActionsButton
  showNewTabButton={(panel) => panel.id === 'editor'}
  onNewTab={(panel) => ({ data: { title: 'Untitled' } })}
  renderPanelActions={renderPanelActions}
  renderActionsButtonIcon={renderActionsButtonIcon}
  ref={tileryRef}
/>
```

#### Props

| Prop                      | Type                                                                     | Required | Description                                        |
| ------------------------- | ------------------------------------------------------------------------ | -------- | -------------------------------------------------- |
| `initialLayout`           | `TileryInitialLayout<TData>`                                             | Yes      | The initial panel and tab configuration            |
| `renderTabHeader`         | `(tab: TileryTabHandle<TData>, ctx: { isActive: boolean }) => ReactNode` | Yes      | Renders the tab button content                     |
| `renderTabContent`        | `(tab: TileryTabHandle<TData>) => ReactNode`                             | Yes      | Renders the tab panel content                      |
| `onChange`                | `(state: TileryLayoutState) => void`                                     | No       | Called after every state change                    |
| `minPanelSizePercent`     | `number`                                                                 | No       | Minimum panel size as a percentage (default: `10`) |
| `showActionsButton`       | `boolean \| (panel: TileryPanelHandle) => boolean`                       | No       | Shows the built-in panel action menu               |
| `showNewTabButton`        | `boolean \| (panel: TileryPanelHandle) => boolean`                       | No       | Shows the optional new-tab button                  |
| `onNewTab`                | `(panel, ctx) => TileryTabInit<TData> \| void`                           | No       | Handles the new-tab button                         |
| `renderPanelActions`      | `(panel, ctx) => ReactNode`                                              | No       | Appends custom content to the panel action menu    |
| `renderActionsButtonIcon` | `(panel) => ReactNode`                                                   | No       | Customizes the action menu button icon             |
| `ref`                     | `Ref<TileryHandle>`                                                      | No       | Imperative handle for programmatic control         |

### `TileryInitialLayout<TData>`

Describes the initial panel arrangement.

```ts
type TileryInitialLayout<TData> = {
  panels: TileryPanelInit<TData>[];
};

type TileryPanelInit<TData> = {
  id?: string;
  inset: { top: number; right: number; bottom: number; left: number };
  tabs: TileryTabInit<TData>[];
  activeTabId?: string;
  fullScreen?: boolean;
};

type TileryTabInit<TData> = {
  id?: string;
  data: TData;
};
```

Panels are positioned via `inset` — percentage-based offsets from each edge of the container (like CSS `inset` but in `%`). For example, a panel taking the left 40% would be `{ top: 0, right: 60, bottom: 0, left: 0 }`.

A fullscreen panel renders over the full Tilery container, suppresses
dividers/junctions, and disables panel drop zones until it is restored.

### `TileryHandle`

The imperative API exposed via `ref`. Use it for programmatic layout manipulation.

| Method                                  | Description                                         |
| --------------------------------------- | --------------------------------------------------- |
| `getPanel(id)`                          | Returns a `TileryPanelHandle` or `null`             |
| `getTab(id)`                            | Returns a `TileryTabHandle` or `null`               |
| `getPanels()`                           | Returns all `TileryPanelHandle[]`                   |
| `getTabs()`                             | Returns all `TileryTabHandle[]`                     |
| `splitPanel(panelId, direction, opts?)` | Splits a panel, returns the new `TileryPanelHandle` |
| `removePanel(panelId)`                  | Removes a panel (redistributes space)               |
| `maximizePanel(panelId)`                | Shows one panel fullscreen                          |
| `restorePanel(panelId)`                 | Restores a fullscreen panel                         |
| `appendTab(panelId, tab, opts?)`        | Appends a tab to a panel                            |
| `insertTab(panelId, tab, index, opts?)` | Inserts a tab at a specific index                   |
| `removeTab(tabId)`                      | Removes a tab (removes panel if last)               |
| `moveTab(tabId, target)`                | Moves a tab to a target location                    |
| `setActiveTab(tabId)`                   | Activates a tab                                     |
| `swapPanels(panelA, panelB)`            | Swaps two panels' positions                         |
| `getState()`                            | Returns the current `TileryLayoutState`             |

### `TileryPanelHandle`

Returned by `getPanel()`. Provides panel-scoped operations.

| Property/Method                | Description                                        |
| ------------------------------ | -------------------------------------------------- |
| `id`                           | Panel identifier                                   |
| `inset`                        | Current `{ top, right, bottom, left }` percentages |
| `tabs`                         | Array of `TileryTabHandle` for this panel          |
| `activeTab`                    | The active `TileryTabHandle` or `null`             |
| `fullScreen`                   | Whether this panel is currently fullscreen         |
| `appendTab(tab, opts?)`        | Append a tab to this panel                         |
| `insertTab(tab, index, opts?)` | Insert a tab at index                              |
| `split(direction, opts?)`      | Split this panel                                   |
| `remove()`                     | Remove this panel                                  |
| `maximize()`                   | Show this panel fullscreen                         |
| `restore()`                    | Restore this panel from fullscreen                 |
| `setActiveTab(tabId)`          | Set the active tab                                 |

### `TileryTabHandle<TData>`

Returned by `getTab()`. Provides tab-scoped operations.

| Property/Method  | Description                          |
| ---------------- | ------------------------------------ |
| `id`             | Tab identifier                       |
| `panel`          | The parent `TileryPanelHandle`       |
| `index`          | Position within the panel's tab list |
| `data`           | The `TData` payload                  |
| `setData(data)`  | Update the tab's data                |
| `moveTo(target)` | Move to a target location            |
| `activate()`     | Make this the active tab             |
| `remove()`       | Remove this tab                      |

### `TileryMoveTarget`

Used with `moveTab()` and `tabHandle.moveTo()`:

```ts
type TileryMoveTarget =
  | { panel: TileryPanelId; index?: number } // Move to panel at index
  | { beforeTab: TileryTabId } // Insert before a tab
  | { afterTab: TileryTabId } // Insert after a tab
  | {
      splitPanel: TileryPanelId;
      direction: TileryDirection;
      sizePercent?: number;
    }; // Split into new panel
```

### `TileryDirection`

```ts
type TileryDirection = 'left' | 'right' | 'top' | 'bottom';
```

## Packages

| Package         | Description                                                  |
| --------------- | ------------------------------------------------------------ |
| `tilery`        | Framework-agnostic types, state reducer, drag logic, and CSS |
| `@tilery/react` | React adapter (components, hooks)                            |

## Development

```sh
pnpm install
pnpm dev          # Start the demo site
pnpm build        # Build packages
pnpm test         # Run tests
pnpm test:coverage # Run tests with coverage
pnpm check        # Lint + format check
```

## License

MIT
