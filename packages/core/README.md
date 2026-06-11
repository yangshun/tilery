# tilery

Framework-agnostic types and layout primitives for Tilery.

Most application developers should install the React adapter instead:

```sh
npm install @tileryjs/react
```

`@tileryjs/react` includes this package as a dependency and exports the public
Tilery types from its main entry point.

## When To Use This Package Directly

Use `tilery` directly when you are building framework integrations, tooling, or
shared type definitions around Tilery's layout model.

```ts
import type {
  TileryInitialLayout,
  TileryLayoutSnapshot,
  TileryPanelId,
  TileryTabInit,
} from 'tilery';
```

The package also exposes `tilery/style.css`, which contains the base CSS used by
the React adapter.

```ts
import 'tilery/style.css';
```

## Layout Model

Tilery layouts are trees of panels and groups:

```ts
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
      tabs: [{ id: 'file-a', data: { title: 'index.ts' } }],
    },
  ],
};
```

Snapshots use the same shape and are safe to serialize:

```ts
import type { TileryLayoutSnapshot } from 'tilery';

function saveLayout<TData>(snapshot: TileryLayoutSnapshot<TData>) {
  localStorage.setItem('tilery-layout', JSON.stringify(snapshot));
}
```

## Exports

- `tilery` exports the public TypeScript type surface.
- `tilery/style.css` exports the base stylesheet.
- `tilery/internal` is used by framework adapters and should not be treated as
  stable application API.

## Links

- Website: https://tileryjs.com
- Repository: https://github.com/yangshun/tilery
- React adapter: https://www.npmjs.com/package/@tileryjs/react
