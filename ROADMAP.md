# Roadmap

This roadmap tracks gaps between `tilery` and the original `react-tiling`
implementation in `~/Developer/greatfrontend/gfe/apps/web/src/react-tiling`.

## Current baseline

`tilery` already has several foundations that go beyond the app-local
`react-tiling` implementation:

- Package-ready monorepo with `tilery` core, `@tilery/react`, demo app, README,
  tests, and build scripts.
- Framework-agnostic core state and drag logic.
- React adapter with portal-based tab content preservation.
- Tab drag/reorder/drop, tab moves between panels, and drag into new splits.
- Programmatic split/remove/append/insert/move/activate APIs.
- Nested split-tree layout model with flat panel insets derived for rendering.
- Divider resizing against one-dimensional split boundaries.

## Missing parity with `react-tiling`

### P0: Panel mode state (partial)

`react-tiling` supports panel-level mode fields that are not represented in
`tilery` state:

- `collapsed`
- `collapsedTitle`
- `collapsible`
- `fullScreen`

Implemented behavior:

- Fullscreen panel metadata is represented on `TileryPanelState` and
  `TileryPanelInit`.
- Reducer actions and handle APIs support maximizing and restoring panels.
- Fullscreen panels render over the full container without mutating stored
  insets.
- Dividers and panel drop zones are suppressed while a panel is
  fullscreen; tab-bar reordering remains available for the fullscreen panel.

Deferred behavior:

- `collapsed`, `collapsedTitle`, and `collapsible` need a cleaner design before
  being added to public state or handles.

### P0: Built-in panel action UI (implemented)

`react-tiling` includes an action menu for panel operations. `tilery` previously
only rendered tabs, content, dividers, and drag overlays.

Implemented behavior:

- `showActionsButton` enables built-in split, close, and maximize/restore menu
  actions.
- `showNewTabButton` plus `onNewTab` supports host-supplied tab creation.
- `renderPanelActions` appends custom actions/components to the panel action
  menu.
- `renderActionsButtonIcon` customizes the action menu trigger icon.

### P1: Tab metadata parity

`react-tiling` tab config supports metadata not modeled directly in `tilery`:

- `href`
- `allowOverflow`

Needed work:

- Decide whether these belong in core tab state or should remain consumer-owned
  `data`.
- If first-class, add typed fields to `TileryTabState` and `TileryTabInit`.
- If consumer-owned, document recommended patterns for link tabs and overflow
  handling.

### P1: High-level tab workflows

`react-tiling` has app-level actions/utilities that do not have direct `tilery`
equivalents:

- `tab-change-id`
- `tab-set-active-otherwise-open`
- `queryTabByPattern`
- `getActiveTabIdByPanelId`
- `activeTabScrollIntoView`

Needed work:

- Add `changeTabId(oldTabId, newTabId)` or equivalent.
- Add an optional helper for "activate if open, otherwise open near a related
  tab".
- Add query helpers for tabs by predicate or pattern.
- Add active-tab lookup by panel ID as a public convenience API.
- Add controlled active-tab scroll behavior for overflowing tab bars.

### P1: Open/close lifecycle callbacks

`react-tiling` actions can report opened/closed tabs through `onTabsOpen` and
`onTabsClose`. `tilery` currently exposes only root-level `onChange`.

Needed work:

- Add lifecycle callbacks for tab open, close, and panel close.
- Ensure callbacks report all affected tabs when closing a panel or moving all
  tabs out of a panel.
- Decide whether imperative methods should return created/removed IDs or only
  invoke callbacks.

### P2: Config compatibility layer

`react-tiling` uses recursive `group` / `item` layout config with `defaultSize`.
`tilery` uses flat panels with percentage-based absolute insets.

Needed work:

- Add a converter from `TilesPanelConfig`-style recursive layouts to
  `TileryInitialLayout`.
- Consider a reverse converter if existing persisted `react-tiling` layouts need
  to round-trip.
- Document limitations around `defaultSize`, nested group identity, and omitted
  panel mode state.

### P2: Richer tab row behavior

`react-tiling` has richer horizontal tab row behavior, including active tab
scroll-into-view and link-style tabs. `tilery` only provides base overflow
styling and custom tab header rendering.

Needed work:

- Add optional active tab scroll-into-view behavior.
- Add tab-row wheel handling for horizontal scrolling.
- Document or expose a first-class link-tab rendering path.

## Explicitly not missing

These areas already exist in `tilery` and should not be duplicated as
`react-tiling` parity work:

- Tab drag and reorder.
- Moving tabs between panels.
- Dragging tabs into panel split zones.
- Moving all tabs from a panel via panel drag behavior.
- Splitting and removing panels.
- Closeable tabs.
- Active tab state.
- Resizable dividers.
- Nested split-tree state with flat DOM rendering.
- Demo site and package documentation.
