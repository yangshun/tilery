# @tileryjs/react

React adapter for Tilery, a panel layout engine for flexible interfaces that
split, resize, and rearrange. Use it to build multi-panel product surfaces with
draggable tabs, persistent layouts, floating panels, and popout windows.

[Website](https://tileryjs.com) |
[GitHub](https://github.com/yangshun/tilery)

## Features

- Drag tabs between panels or into new splits
- Resize panels with pointer and keyboard-accessible dividers
- Preserve React state across tab moves with portal-based rendering
- Customize tab headers, tab triggers, panel content, and panel actions
- Persist and restore serializable layout snapshots
- Support locked panels, tab behavior controls, floating panels, and popout
  windows
- TypeScript-first API with core Tilery types re-exported from the adapter

## Installation

```sh
npm install @tileryjs/react
```

Import the stylesheet once in your app:

```ts
import '@tileryjs/react/style.css';
```

## Quick Start

```tsx
import { Tilery } from '@tileryjs/react';
import '@tileryjs/react/style.css';
import type { TileryInitialLayout } from '@tileryjs/react';

type MyTab = { title: string };

const layout: TileryInitialLayout<MyTab> = {
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

export function App() {
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

## Core Concepts

Tilery layouts are authored as group trees:

- A `group` lays out child panels or groups horizontally or vertically.
- A `panel` owns tabs and one active tab.
- A `tab` contains your application data and is rendered through your tab
  header and content functions.

The layout can be converted into a serializable snapshot with the controller and
restored later:

```tsx
import { useRef } from 'react';
import { Tilery, type TileryController } from '@tileryjs/react';

const controllerRef = useRef<TileryController | null>(null);

<Tilery
  ref={controllerRef}
  initialLayout={layout}
  onChange={() => {
    const snapshot = controllerRef.current?.getLayout<MyTab>();
    if (snapshot) {
      localStorage.setItem('tilery-layout', JSON.stringify(snapshot));
    }
  }}
  renderTabHeader={(tab) => <span>{tab.data.title}</span>}
  renderTabContent={(tab) => <div>{tab.data.title} content</div>}
/>;
```

## Common Props

| Prop                 | Description                                     |
| -------------------- | ----------------------------------------------- |
| `initialLayout`      | Initial panel tree and tabs                     |
| `renderTabHeader`    | Renders each tab button label                   |
| `renderTabContent`   | Renders each active tab's content               |
| `renderTabTrigger`   | Replaces the tab trigger for links/router tabs  |
| `onChange`           | Runs after each state change                    |
| `onResize`           | Runs during pointer or keyboard resize          |
| `onResizeEnd`        | Runs when a resize interaction commits          |
| `onTabsMove`         | Runs when tabs move between panels or positions |
| `showActionsButton`  | Shows the built-in panel action menu            |
| `showNewTabButton`   | Shows the optional new-tab button               |
| `renderPanelActions` | Adds custom content to the panel action menu    |
| `ref`                | Exposes the imperative `TileryController` API   |

## Styling

The stylesheet defines the panel chrome, tab bar, resize handles, drag overlay,
menus, and focus states. Customize the visual system with CSS variables:

```css
.workspace {
  --tilery-bg: #0e0f12;
  --tilery-panel-bg: #1a1c20;
  --tilery-panel-border: #2a2d33;
  --tilery-accent: #3884ff;
  --tilery-tabbar-height: 32px;
}
```

## Related Packages

- `tilery`: framework-agnostic core types and CSS
- `@tileryjs/react`: React component, hooks, events, and controller API

## Links

- Website: https://tileryjs.com
- Repository: https://github.com/yangshun/tilery
- Core package: https://www.npmjs.com/package/tilery
