# Roadmap

This roadmap tracks remaining gaps and completed parity work between `tilery`
and comparable panel systems.

## Compared Libraries

| Library                  | Why it matters                                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `react-tiling`           | Original app-local target for tabs, panel modes, and app workflow parity.                                                 |
| `react-resizable-panels` | Best resize API benchmark: units, constraints, collapse, callbacks, and accessible separators.                            |
| Dockview                 | Closest IDE-layout benchmark: dock groups, floating groups, popout windows, serialization, and multi-framework core.      |
| FlexLayout               | Mature React docking benchmark: tabsets, border tabsets, popouts, submodels, overflow, and rich layout model actions.     |
| rc-dock                  | React dock-layout benchmark with controlled/uncontrolled layouts, floatbox/dockbox model, save/load, and tab update APIs. |
| GoldenLayout             | Established docking benchmark for popup windows, load/save layouts, focus, theming, and framework integration.            |
| react-mosaic             | Tree-layout benchmark for controlled/uncontrolled tiling, drag-rearrange, toolbar controls, and migration helpers.        |
| Allotment                | Splitter UX benchmark: min/max/preferred sizes, snapping, reset, visibility, and sash states.                             |
| React-Grid-Layout        | Dashboard-grid benchmark: responsive breakpoints, item constraints, static widgets, packing, and serialization.           |
| Gridstack                | Dashboard-grid benchmark: nested grids, responsive layout, drag/resize toggles, and framework-agnostic usage.             |

## Feature Gaps

| Priority | Feature                                 | Covered by                                                                                                        | Tilery status | Remaining work                                                                                                                                                                                                 |
| -------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0       | Collapsed panel modes                   | `react-tiling`, `react-resizable-panels`, Allotment, Dockview Paneview                                            | Gap           | Add `collapsed`, `collapsedTitle`, `collapsible`, `collapsedSize`, drag-to-collapse rules, pre-collapse restore size, and panel handle APIs for `collapse()`, `expand()`, `isCollapsed()`, and `resize(size)`. |
| P1       | Flexible size units                     | `react-resizable-panels`, Allotment                                                                               | Partial       | Evolve `size` beyond percentage numbers to support pixels, percentages, font-relative units, and viewport-relative units without another rename.                                                               |
| P1       | Unit-aware resize constraints           | `react-resizable-panels`, Allotment, React-Grid-Layout, Gridstack, Dockview                                       | Partial       | Numeric per-panel `minSize` and `maxSize` constraints exist. Add unit-aware constraints and clamp them against the measured container.                                                                         |
| P1       | Container resize behavior               | `react-resizable-panels`, Allotment, React-Grid-Layout                                                            | Gap           | Add behavior for preserving relative size versus pixel size when the container changes; test mixed-unit and zero-size edge cases.                                                                              |
| P1       | Layout persistence API                  | Dockview, FlexLayout, rc-dock, GoldenLayout, `react-resizable-panels`, react-mosaic, React-Grid-Layout, Gridstack | Partial       | Add `getLayout()` / `setLayout(layout)` for persisted layout restoration without replacing full app state. Document localStorage and cookie/SSR restoration patterns.                                          |
| P1       | Resize handle states and hit targets    | `react-resizable-panels`, Allotment                                                                               | Partial       | Add stable data attributes for hover, drag, focus, disabled, minimum, and maximum states. Add configurable hit-target sizing for fine and coarse pointers.                                                     |
| P1       | Resize disabling and locking            | `react-resizable-panels`, Allotment, rc-dock, Dockview, FlexLayout, React-Grid-Layout, Gridstack                  | Gap           | Add global resize disable, per-panel resize disable, per-divider/per-junction disable, and panel/tab locking rules that block direct and indirect moves where appropriate.                                     |
| P1       | Double-click reset and snapping         | `react-resizable-panels`, Allotment                                                                               | Gap           | Add double-click reset to a panel's default/preferred size, separator opt-out, and snap-to-zero/collapse semantics.                                                                                            |
| P1       | Floating detached panels                | Dockview, FlexLayout, rc-dock, GoldenLayout                                                                       | Gap           | Add floating groups/panels inside the same browser window, with serialization, focus behavior, z-ordering, and docking back into the tree.                                                                     |
| P2       | Native popout windows                   | Dockview, FlexLayout, rc-dock, GoldenLayout                                                                       | Gap           | Add browser-window popouts only after same-document floating is stable. Define same-origin host page requirements, style copying, owner-document-safe events, and fallback behavior when popups are blocked.   |
| P1       | Edge and border groups                  | Dockview, FlexLayout                                                                                              | Gap           | Add pinned edge/border tabsets or sidebars that can hold tabs independently from the main tiled grid.                                                                                                          |
| P1       | Tab overflow and tab-row scrolling      | `react-tiling`, FlexLayout                                                                                        | Partial       | Add active-tab scroll-into-view, tab-row wheel handling, overflow menu behavior, and tests for narrow tab bars.                                                                                                |
| P1       | Link tabs and tab metadata              | `react-tiling`, FlexLayout, rc-dock                                                                               | Partial       | Decide whether `href` and `allowOverflow` belong in first-class tab state or documented consumer-owned `data`.                                                                                                 |
| P1       | High-level tab workflow APIs            | `react-tiling`, FlexLayout, rc-dock, Dockview                                                                     | Partial       | Add `changeTabId(oldTabId, newTabId)` and an optional helper for "activate if open, otherwise open near a related tab".                                                                                        |
| P1       | Open/close lifecycle callbacks          | `react-tiling`, FlexLayout, Dockview, rc-dock                                                                     | Gap           | Add lifecycle callbacks for tab open, tab close, and panel close. Report all affected tabs when closing a panel or moving all tabs out.                                                                        |
| P2       | Controlled layout mode                  | rc-dock, react-mosaic, React-Grid-Layout                                                                          | Partial       | Decide whether `tilery` should expose a fully controlled `layout` prop in addition to `initialLayout`, or keep mutation through handles and callbacks only.                                                    |
| P2       | External drag sources                   | Dockview, React-Grid-Layout, Gridstack                                                                            | Gap           | Add a documented path for dragging tabs/panels from outside Tilery into a target panel, split zone, or tab row.                                                                                                |
| P2       | Nested Tilery instances and sub-layouts | FlexLayout, Dockview, react-mosaic                                                                                | Partial       | Document supported nested usage, event isolation, drag boundary behavior, and serialization strategy for nested layouts.                                                                                       |
| P3       | Responsive dashboard-grid behavior      | React-Grid-Layout, Gridstack                                                                                      | Deferred      | Consider only if Tilery explicitly expands beyond IDE-style panel layouts into dashboard builders. Candidate scope: breakpoints, per-breakpoint layouts, packing/collision rules, and nested dashboard grids.  |
| P3       | Cross-junction resizing                 | Dockview/Gridview-style layout systems                                                                            | Deferred      | T-junction resizing exists. Cross junctions still need a resolver for competing horizontal and vertical divider groups before enabling handles at four-way intersections.                                      |

## Done

| Feature                    | Covered by                                                        | Completed work                                                                                                                                                                                                               |
| -------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accessible resize handles  | `react-resizable-panels`                                          | Divider handles have keyboard resizing, separator ARIA state/value attributes, focus styling, and 24px targets. T-junction shortcuts stay pointer-only; the underlying dividers provide the standards-aligned keyboard path. |
| Resize lifecycle callbacks | `react-resizable-panels`, Allotment, React-Grid-Layout, Gridstack | `onResize` reports high-frequency pointer and keyboard resize changes. `onResizeEnd` reports committed resize changes with source metadata, affected panel size deltas, and measured pixel sizes when available.             |

## References

- [react-resizable-panels](https://react-resizable-panels.vercel.app/)
- [Dockview](https://dockview.dev/docs/overview/introduction/)
- [FlexLayout](https://github.com/caplin/FlexLayout)
- [rc-dock](https://ticlo.github.io/rc-dock/)
- [GoldenLayout](https://github.com/golden-layout/golden-layout)
- [react-mosaic](https://nomcopter.github.io/react-mosaic/)
- [Allotment](https://github.com/johnwalley/allotment)
- [React-Grid-Layout](https://github.com/react-grid-layout/react-grid-layout)
- [Gridstack](https://gridstackjs.com/)
