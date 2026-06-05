/**
 * Public type surface of Tilery core: the layout, snapshot, controller, panel,
 * and tab shapes that consumers author, persist, and drive imperatively.
 */

/** Stable identifier for a panel, unique within a workspace. */
export type TileryPanelId = string;
/** Stable identifier for a tab, unique within a workspace. */
export type TileryTabId = string;

/**
 * A size value: a bare number, a percentage string (`'50%'`), or a pixel
 * string (`'320px'`). Bare numbers are treated as percentages of the parent.
 */
export type TilerySize = number | `${number}%` | `${number}px`;

/**
 * Dimensions of the container a {@link TilerySize} is resolved against, used to
 * convert percentage and pixel sizes into concrete values.
 */
export type TilerySizeResolutionContext = {
  /** Available width in pixels. */
  width?: number;
  /** Available height in pixels. */
  height?: number;
};

/** A direction a split or move can grow toward. */
export type TileryDirection = 'left' | 'right' | 'top' | 'bottom';

/** The side of the root a pinned edge panel attaches to. */
export type TileryEdge = TileryDirection;

/** Distances from each side of the root, expressed as percentages. */
export type TileryInset = {
  /** Inset from the top edge, in percent. */
  top: number;
  /** Inset from the right edge, in percent. */
  right: number;
  /** Inset from the bottom edge, in percent. */
  bottom: number;
  /** Inset from the left edge, in percent. */
  left: number;
};

/** Position and size of a floating panel, as percentages of the root. */
export type TileryFloatingPanelBounds = {
  /** Left offset, in percent. */
  x: number;
  /** Top offset, in percent. */
  y: number;
  /** Width, in percent. */
  width: number;
  /** Height, in percent. */
  height: number;
};

/** Partial floating bounds; omitted fields fall back to defaults. */
export type TileryFloatingPanelBoundsInit = Partial<TileryFloatingPanelBounds>;

/** A grip on a floating panel that can be dragged to resize it. */
export type TileryFloatingResizeEdge =
  | 'top'
  | 'right'
  | 'bottom'
  | 'left'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

/** Position and size of a popped-out native window, in pixels. */
export type TileryPopoutWindowBounds = {
  /** Window left, in pixels. */
  left: number;
  /** Window top, in pixels. */
  top: number;
  /** Window width, in pixels. */
  width: number;
  /** Window height, in pixels. */
  height: number;
};

/** Partial popout window bounds; omitted fields fall back to defaults. */
export type TileryPopoutWindowBoundsInit = Partial<TileryPopoutWindowBounds>;

/** Where a popped-out panel's native window is placed. */
export type TileryPopoutPanelPlacement = {
  /** The native window's position and size, in pixels. */
  windowBounds: TileryPopoutWindowBounds;
};

/**
 * Pop-out request for an authored floating panel: `true` to pop out with
 * defaults, or an object to seed the native window bounds.
 */
export type TileryPopoutPanelConfig =
  | boolean
  | {
      windowBounds?: TileryPopoutWindowBoundsInit;
    };

/** Options for `floatPanel()` / `panel.float()`: starting bounds plus behavior. */
export type TileryFloatPanelOptions = TileryFloatingPanelBoundsInit &
  TileryLayoutBehaviorConfig;

/** Options for `popoutPanel()` / `panel.popout()`: floating fallback bounds, native window bounds, and behavior. */
export type TileryPopoutPanelOptions = {
  /** Bounds used if the panel later returns to the in-page floating layer. */
  floatingBounds?: TileryFloatingPanelBoundsInit;
  /** Initial native window position and size. */
  windowBounds?: TileryPopoutWindowBoundsInit;
} & TileryLayoutBehaviorConfig;

/** Options for `floatTab()` / `tab.float()`: the new floating panel's id, bounds, and behavior. */
export type TileryFloatTabOptions = {
  /** Id to assign the floating panel that wraps the extracted tab. */
  panelId?: TileryPanelId;
  /** Starting bounds for the new floating panel. */
  bounds?: TileryFloatingPanelBoundsInit;
} & TileryLayoutBehaviorConfig;

/** Options for `popoutTab()` / `tab.popout()`: the wrapping panel's id plus popout options. */
export type TileryPopoutTabOptions = TileryPopoutPanelOptions & {
  /** Id to assign the panel that wraps the extracted tab. */
  panelId?: TileryPanelId;
};

/** Resolved placement of a floating panel: its bounds, stacking order, and optional popout state. */
export type TileryFloatingPanelPlacement = {
  /** Current floating position and size. */
  bounds: TileryFloatingPanelBounds;
  /** Stacking order among floating panels; higher sits on top. */
  zIndex: number;
  /** Present when the floating panel is popped out into a native window. */
  popout?: TileryPopoutPanelPlacement;
};

/** Resolved placement of a pinned edge panel: its side and pinned extent. */
export type TileryEdgePanelPlacement = {
  /** Edge the panel is pinned to. */
  side: TileryEdge;
  /** Pinned width or height, as a percentage of the root. */
  size: number;
  /** Reset target used when double-clicking the edge divider. */
  defaultSize?: number;
};

/** Fields shared by every panel runtime state regardless of kind. */
type TileryPanelStateBase = {
  /** Panel identifier. */
  id: TileryPanelId;
  /** Current distances from each root edge, in percent. */
  inset: TileryInset;
  /** Ids of the tabs in this panel, in display order. */
  tabs: TileryTabId[];
  /** Id of the active tab, or `null` when the panel is empty. */
  activeTabId: TileryTabId | null;
  /** Whether this panel is currently shown fullscreen. */
  fullScreen?: boolean;
  /** Minimum size constraint, if set. */
  minSize?: TilerySize;
  /** Maximum size constraint, if set. */
  maxSize?: TilerySize;
};

/** Runtime state of a normal tiled panel living in the docked tree. */
export type TileryTiledPanelState = TileryPanelStateBase & {
  kind: 'tiled';
  floating?: never;
  behavior?: never;
};

/** Runtime state of a detached floating panel, including its placement and behavior. */
export type TileryFloatingPanelState = TileryPanelStateBase & {
  kind: 'floating';
  /** Floating placement: bounds, z-index, and optional popout. */
  floating: TileryFloatingPanelPlacement;
  /** Resolved resize/drag/drop behavior. */
  behavior: TileryLayoutBehavior;
};

/** Runtime state of a pinned edge panel, including its edge placement and behavior. */
export type TileryEdgePanelState = TileryPanelStateBase & {
  kind: 'edge';
  /** Edge placement: side and pinned size. */
  edge: TileryEdgePanelPlacement;
  /** Resolved resize/drag/drop behavior. */
  behavior: TileryLayoutBehavior;
  floating?: never;
};

/** Runtime state of a panel, discriminated by `kind`. */
export type TileryPanelState =
  | TileryTiledPanelState
  | TileryFloatingPanelState
  | TileryEdgePanelState;

/** Runtime state of a single tab and its data payload. */
export type TileryTabState<TData = unknown> = {
  /** Tab identifier. */
  id: TileryTabId;
  /** Id of the panel that currently owns this tab. */
  panelId: TileryPanelId;
  /** Application-supplied payload for the tab. */
  data: TData;
  /** Whether close actions are allowed on this tab. */
  closable: boolean;
  /** Whether this tab may be dragged or moved. */
  draggable: boolean;
};

/** Resolved tab behavior: explicit close and drag permissions. */
export type TileryTabBehavior = {
  /** Whether close actions are allowed. */
  closable: boolean;
  /** Whether move/drag actions are allowed. */
  draggable: boolean;
};

/**
 * Authoring shorthand for tab behavior. `locked: true` disables both close and
 * drag; otherwise set `closable`/`draggable` individually.
 */
export type TileryTabBehaviorConfig =
  | {
      locked: true;
      closable?: never;
      draggable?: never;
    }
  | {
      locked?: false;
      closable?: boolean;
      draggable?: boolean;
    };

/**
 * Behavior patch passed to `setTabBehavior()` / `tab.setBehavior()`. Identical
 * to {@link TileryTabBehaviorConfig} — the same `locked` shorthand as authoring.
 */
export type TileryTabBehaviorUpdate = TileryTabBehaviorConfig;

/** Resolved layout behavior: explicit resize, drag, and drop permissions. */
export type TileryLayoutBehavior = {
  /** Whether the item can be resized via its dividers. */
  resizable: boolean;
  /** Whether the item can be dragged to a new location. */
  draggable: boolean;
  /** Whether other content can be dropped onto the item. */
  droppable: boolean;
};

/**
 * Authoring shorthand for layout behavior. `locked: true` disables resize,
 * drag, and drop; otherwise set each permission individually.
 */
export type TileryLayoutBehaviorConfig =
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

/**
 * Internal binary tree describing how the docked area is divided: either a leaf
 * referencing a panel, or a split node containing nested children.
 */
export type TileryLayoutTree =
  | {
      kind: 'panel';
      panelId: TileryPanelId;
      size?: number;
      defaultSize?: number;
      resizable?: boolean;
      draggable?: boolean;
      droppable?: boolean;
    }
  | {
      kind: 'split';
      id: string;
      direction: 'horizontal' | 'vertical';
      size?: number;
      defaultSize?: number;
      resizable?: boolean;
      draggable?: boolean;
      droppable?: boolean;
      children: TileryLayoutTree[];
    };

/**
 * Live working state exposed to callbacks and `getState()`. Reflects the current
 * panels, tabs, and tree; meant for inspection, not persistence.
 */
export type TileryLayoutState = {
  /** All panels keyed by id. */
  panels: Record<TileryPanelId, TileryPanelState>;
  /** Render order of docked panels. */
  panelOrder: TileryPanelId[];
  /** Render order of pinned edge panels, if any. */
  edgePanelOrder?: TileryPanelId[];
  /** Stacking order of floating panels, if any. */
  floatingPanelOrder?: TileryPanelId[];
  /** All tabs keyed by id. */
  tabs: Record<TileryTabId, TileryTabState>;
  /** The docked split tree, or `null`/absent when the main area is empty. */
  layout?: TileryLayoutTree | null;
};

/** Authored tab: an optional id, its data payload, and behavior shorthand. */
export type TileryTabInit<TData = unknown> = {
  /** Tab id; generated when omitted. */
  id?: TileryTabId;
  /** Application payload for the tab. */
  data: TData;
} & TileryTabBehaviorConfig;

/** An empty slot in an authored layout, rendered as a drop target. */
export type TileryEmptyInit = {
  type: 'empty';
};

/** Authored tiled panel: its tabs, sizing, and behavior shorthand. */
export type TileryPanelInit<TData = unknown> = {
  type: 'panel';
  /** Panel id; generated when omitted. */
  id?: TileryPanelId;
  /** Allocation within the parent group; equal share when omitted. */
  size?: number;
  /** Divider reset target; falls back to `size` when omitted. */
  defaultSize?: number;
  /** Tabs to create in this panel. */
  tabs: TileryTabInit<TData>[];
  /** Id of the tab to activate initially. */
  activeTabId?: TileryTabId;
  /** Start this panel fullscreen. */
  fullScreen?: boolean;
  /** Minimum size constraint. */
  minSize?: TilerySize;
  /** Maximum size constraint. */
  maxSize?: TilerySize;
} & TileryLayoutBehaviorConfig;

/** Authored split group: a row or column of nested children. */
export type TileryGroupInit<TData = unknown> = {
  type: 'group';
  /** Group id; generated when omitted. */
  id?: string;
  /** Whether children are laid out as a row or a column. */
  direction: 'horizontal' | 'vertical';
  /** Allocation within the parent group; equal share when omitted. */
  size?: number;
  /** Divider reset target; falls back to `size` when omitted. */
  defaultSize?: number;
  /** Ordered child panels or nested groups. */
  children: TileryDockedLayoutInit<TData>[];
} & TileryLayoutBehaviorConfig;

/** Any node of an authored docked layout: empty, panel, or group. */
export type TileryDockedLayoutInit<TData = unknown> =
  | TileryEmptyInit
  | TileryPanelInit<TData>
  | TileryGroupInit<TData>;

/** Authored floating panel: starting bounds, stacking, popout request, and tabs. */
export type TileryFloatingPanelInit<TData = unknown> = {
  type: 'floatingPanel';
  /** Panel id; generated when omitted. */
  id?: TileryPanelId;
  /** Initial floating bounds. */
  bounds?: TileryFloatingPanelBoundsInit;
  /** Initial stacking order among floating panels. */
  zIndex?: number;
  /** Pop the panel straight into a native window on boot. */
  popout?: TileryPopoutPanelConfig;
  /** Tabs to create in this panel. */
  tabs: TileryTabInit<TData>[];
  /** Id of the tab to activate initially. */
  activeTabId?: TileryTabId;
  /** Start this panel fullscreen. */
  fullScreen?: boolean;
  /** Minimum size constraint. */
  minSize?: TilerySize;
  /** Maximum size constraint. */
  maxSize?: TilerySize;
} & TileryLayoutBehaviorConfig;

/** Authored pinned edge panel: the sidebar's size, tabs, and behavior. */
export type TileryEdgePanelInit<TData = unknown> = {
  type: 'edgePanel';
  /** Panel id; generated when omitted. */
  id?: TileryPanelId;
  /** Pinned width or height, as a percentage of the root. */
  size?: number;
  /** Divider reset target; falls back to `size` when omitted. */
  defaultSize?: number;
  /** Tabs to create in this panel. */
  tabs: TileryTabInit<TData>[];
  /** Id of the tab to activate initially. */
  activeTabId?: TileryTabId;
  /** Start this panel fullscreen. */
  fullScreen?: boolean;
  /** Minimum size constraint. */
  minSize?: TilerySize;
  /** Maximum size constraint. */
  maxSize?: TilerySize;
} & TileryLayoutBehaviorConfig;

/** Authored root: a main docked area plus optional pinned edges and floating panels. */
export type TileryRootInit<TData = unknown> = {
  type: 'root';
  /** The central docked layout. */
  main: TileryDockedLayoutInit<TData>;
  /** Pinned edge panels keyed by side. */
  edges?: Partial<Record<TileryEdge, TileryEdgePanelInit<TData>>>;
  /** Floating panels overlaid on the root. */
  floating?: TileryFloatingPanelInit<TData>[];
};

/**
 * Layout you pass to boot or replace the workspace, via `initialLayout` or
 * `setLayout()`. Accepts authoring shorthand like `locked: true`.
 */
export type TileryInitialLayout<TData = unknown> =
  | TileryDockedLayoutInit<TData>
  | TileryRootInit<TData>;

/** Persisted tiled panel: like its init counterpart but with explicit behavior booleans. */
export type TileryPanelSnapshot<TData = unknown> = {
  type: 'panel';
  /** Panel id, preserved across the round trip. */
  id?: TileryPanelId;
  /** Allocation within the parent group. */
  size?: number;
  /** Divider reset target. */
  defaultSize?: number;
  /** Tabs in display order. */
  tabs: TileryTabSnapshot<TData>[];
  /** Id of the active tab. */
  activeTabId?: TileryTabId;
  /** Whether the panel was fullscreen. */
  fullScreen?: boolean;
  /** Minimum size constraint. */
  minSize?: TilerySize;
  /** Maximum size constraint. */
  maxSize?: TilerySize;
} & TileryLayoutBehavior;

/** Persisted tab: its id, data, and explicit close/drag booleans (never `locked`). */
export type TileryTabSnapshot<TData = unknown> = {
  /** Tab id, preserved across the round trip. */
  id?: TileryTabId;
  /** Application payload for the tab. */
  data: TData;
} & TileryTabBehavior;

/** Persisted split group: a row or column of nested snapshot children. */
export type TileryGroupSnapshot<TData = unknown> = {
  type: 'group';
  /** Group id, preserved across the round trip. */
  id?: string;
  /** Whether children form a row or a column. */
  direction: 'horizontal' | 'vertical';
  /** Allocation within the parent group. */
  size?: number;
  /** Divider reset target. */
  defaultSize?: number;
  /** Ordered child snapshots. */
  children: TileryDockedLayoutSnapshot<TData>[];
} & TileryLayoutBehavior;

/** Any node of a persisted docked layout: empty, panel, or group. */
export type TileryDockedLayoutSnapshot<TData = unknown> =
  | TileryEmptyInit
  | TileryPanelSnapshot<TData>
  | TileryGroupSnapshot<TData>;

/** Persisted floating panel: concrete bounds, z-order, popout state, and tabs. */
export type TileryFloatingPanelSnapshot<TData = unknown> = {
  type: 'floatingPanel';
  /** Panel id, preserved across the round trip. */
  id?: TileryPanelId;
  /** Floating position and size. */
  bounds: TileryFloatingPanelBounds;
  /** Stacking order among floating panels. */
  zIndex: number;
  /** Present when the panel was popped out into a native window. */
  popout?: TileryPopoutPanelPlacement;
  /** Tabs in display order. */
  tabs: TileryTabSnapshot<TData>[];
  /** Id of the active tab. */
  activeTabId?: TileryTabId;
  /** Whether the panel was fullscreen. */
  fullScreen?: boolean;
  /** Minimum size constraint. */
  minSize?: TilerySize;
  /** Maximum size constraint. */
  maxSize?: TilerySize;
} & TileryLayoutBehavior;

/** Persisted pinned edge panel: its side size, tabs, and explicit behavior. */
export type TileryEdgePanelSnapshot<TData = unknown> = {
  type: 'edgePanel';
  /** Panel id, preserved across the round trip. */
  id?: TileryPanelId;
  /** Pinned width or height, as a percentage of the root. */
  size: number;
  /** Divider reset target. */
  defaultSize?: number;
  /** Tabs in display order. */
  tabs: TileryTabSnapshot<TData>[];
  /** Id of the active tab. */
  activeTabId?: TileryTabId;
  /** Whether the panel was fullscreen. */
  fullScreen?: boolean;
  /** Minimum size constraint. */
  minSize?: TilerySize;
  /** Maximum size constraint. */
  maxSize?: TilerySize;
} & TileryLayoutBehavior;

/** Persisted root: the main docked snapshot plus pinned edges and floating panels. */
export type TileryRootSnapshot<TData = unknown> = {
  type: 'root';
  /** The central docked layout snapshot. */
  main: TileryDockedLayoutSnapshot<TData>;
  /** Pinned edge panel snapshots keyed by side. */
  edges?: Partial<Record<TileryEdge, TileryEdgePanelSnapshot<TData>>>;
  /** Floating panel snapshots. */
  floating: TileryFloatingPanelSnapshot<TData>[];
};

/**
 * Serializable snapshot returned by `getLayout()`. Persist it, then feed it back
 * to `initialLayout` or `setLayout()` to restore the workspace exactly.
 */
export type TileryLayoutSnapshot<TData = unknown> =
  | TileryDockedLayoutSnapshot<TData>
  | TileryRootSnapshot<TData>;

/**
 * Move target that splits one existing panel, placing the moved tab in a new
 * panel beside it on the given side.
 */
export type TilerySplitMoveTarget = {
  /** The panel to split. */
  splitPanel: TileryPanelId;
  /** Side of the split panel the new panel grows toward. */
  direction: TileryDirection;
  /** Size of the new panel; equal share when omitted. */
  size?: number;
  /** Minimum size constraint for the new panel. */
  minSize?: TilerySize;
  /** Maximum size constraint for the new panel. */
  maxSize?: TilerySize;
} & TileryLayoutBehaviorConfig;

/**
 * Move target that splits the whole main layout, making the new panel a
 * full-width or full-height row or column around it.
 */
export type TileryRootSplitMoveTarget = {
  /** Marks this as a root-level split. */
  splitRoot: true;
  /** Side of the root the new row or column grows toward. */
  direction: TileryDirection;
  /** Size of the new panel; equal share of the resulting rows/columns when omitted. */
  size?: number;
  /** Minimum size constraint for the new panel. */
  minSize?: TilerySize;
  /** Maximum size constraint for the new panel. */
  maxSize?: TilerySize;
} & TileryLayoutBehaviorConfig;

/**
 * Destination for `moveTab()` / `tab.moveTo()`: an index in a panel, before or
 * after a tab, or a split of an existing panel or the whole root.
 */
export type TileryMoveTarget =
  | { panel: TileryPanelId; index?: number }
  | { beforeTab: TileryTabId }
  | { afterTab: TileryTabId }
  | TilerySplitMoveTarget
  | TileryRootSplitMoveTarget;

/**
 * Insertion target for the open path of `openOrActivateTab()`: an index in a
 * panel, or before/after an existing tab.
 */
export type TileryOpenTabTarget =
  | { panel: TileryPanelId; index?: number }
  | { beforeTab: TileryTabId }
  | { afterTab: TileryTabId };

/**
 * Destination for `dockPanel()` / `panel.dock()`. With no fields the panel docks
 * at a default spot; `splitPanel` + `direction` dock it beside a target panel.
 */
export type TileryDockPanelTarget = {
  /** Existing panel to dock beside. */
  splitPanel?: TileryPanelId;
  /** Side of the target panel to dock on. */
  direction?: TileryDirection;
  /** Size of the docked panel; equal share when omitted. */
  size?: number;
  /** Minimum size constraint. */
  minSize?: TilerySize;
  /** Maximum size constraint. */
  maxSize?: TilerySize;
} & TileryLayoutBehaviorConfig;

/** Whether a divider runs vertically or horizontally. */
export type TileryDividerOrientation = 'vertical' | 'horizontal';

/** A draggable boundary between panels, with the panels it resizes on each side. */
export type TileryDivider = {
  /** Divider identifier. */
  id: string;
  /** Orientation of the divider. */
  orientation: TileryDividerOrientation;
  /** Position along the cross axis, in percent. */
  position: number;
  /** Start of the divider's span along its length, in percent. */
  start: number;
  /** End of the divider's span along its length, in percent. */
  end: number;
  /** Panels on the leading side that shrink as the divider moves toward them. */
  beforePanels: TileryPanelId[];
  /** Panels on the trailing side that shrink as the divider moves toward them. */
  afterPanels: TileryPanelId[];
  /** Id of the split this divider belongs to, if any. */
  splitId?: string;
  /** Whether dragging is disabled (e.g. a locked neighbor). */
  disabled?: boolean;
};

/** A T-shaped meeting point of a vertical and a horizontal divider that can be dragged in both axes. */
export type TileryJunction = {
  /** Junction identifier. */
  id: string;
  /** Junction shape; currently always a T-junction. */
  kind: 't';
  /** Horizontal position, in percent. */
  x: number;
  /** Vertical position, in percent. */
  y: number;
  /** Id of the vertical divider meeting here. */
  verticalDividerId: string;
  /** Id of the horizontal divider meeting here. */
  horizontalDividerId: string;
  /** Whether dragging is disabled. */
  disabled?: boolean;
};

/**
 * Imperative handle exposed through the Tilery ref. Use it when the application,
 * rather than a direct drag gesture, needs to change the workspace.
 */
export type TileryController = {
  /**
   * Looks up a panel by id.
   * @returns The panel, or `null` if no panel has that id.
   */
  getPanel(id: TileryPanelId): TileryPanel | null;
  /**
   * Looks up a tab by id.
   * @returns The tab, or `null` if no tab has that id.
   */
  getTab(id: TileryTabId): TileryTab | null;
  /** Returns every panel in the workspace. */
  getPanels(): TileryPanel[];
  /** Returns every tab in the workspace. */
  getTabs(): TileryTab[];
  /** Splits a panel and returns the new panel created beside it. */
  splitPanel(
    panelId: TileryPanelId,
    direction: TileryDirection,
    opts?: {
      size?: number;
      minSize?: TilerySize;
      maxSize?: TilerySize;
      tabs?: TileryTabInit[];
      activate?: boolean;
    } & TileryLayoutBehaviorConfig,
  ): TileryPanel;
  /** Removes a panel and its tabs, redistributing the freed space to neighbors. */
  removePanel(panelId: TileryPanelId): void;
  /** Shows a single panel fullscreen, hiding the rest. */
  maximizePanel(panelId: TileryPanelId): void;
  /** Restores a fullscreen panel to its tiled position. */
  restorePanel(panelId: TileryPanelId): void;
  /** Detaches a panel into the floating layer, optionally setting bounds and behavior. */
  floatPanel(panelId: TileryPanelId, opts?: TileryFloatPanelOptions): void;
  /** Opens a panel in a native same-origin browser window. */
  popoutPanel(panelId: TileryPanelId, opts?: TileryPopoutPanelOptions): void;
  /** Returns a popped-out panel to the in-page floating layer. */
  returnPanelToFloating(
    panelId: TileryPanelId,
    bounds?: TileryFloatingPanelBoundsInit,
  ): void;
  /** Docks a floating panel back into the tiled tree. */
  dockPanel(panelId: TileryPanelId, target?: TileryDockPanelTarget): void;
  /** Raises a floating panel above its peers. */
  focusPanel(panelId: TileryPanelId): void;
  /**
   * Sets a floating panel's position and size. Accepts a partial bounds —
   * omitted fields keep their current value.
   */
  setFloatingPanelBounds(
    panelId: TileryPanelId,
    bounds: TileryFloatingPanelBoundsInit,
  ): void;
  /** Stores the native window position and size for a popped-out panel. */
  setPopoutWindowBounds(
    panelId: TileryPanelId,
    bounds: TileryPopoutWindowBounds,
  ): void;
  /** Appends a tab to the end of a panel's tab row. */
  appendTab(
    panelId: TileryPanelId,
    tab: TileryTabInit,
    opts?: { activate?: boolean },
  ): TileryTab;
  /** Inserts a tab into a panel at a specific index. */
  insertTab(
    panelId: TileryPanelId,
    tab: TileryTabInit,
    index: number,
    opts?: { activate?: boolean },
  ): TileryTab;
  /**
   * Idempotently opens a tab keyed by stable id (file path, route, issue id). If
   * the id already exists, activates that tab without touching its data; if it
   * is missing, inserts it at the target and activates it.
   * @returns The activated or inserted tab, or `null` if it could not be opened.
   */
  openOrActivateTab(
    tab: TileryTabInit,
    target: TileryOpenTabTarget,
  ): TileryTab | null;
  /**
   * Renames a tab's id in place, preserving its data, order, and active state.
   * @returns The renamed tab, or `null` if the old id is missing or the new id
   * is already in use.
   */
  changeTabId(oldTabId: TileryTabId, newTabId: TileryTabId): TileryTab | null;
  /** Removes a tab; also removes its panel when it was the panel's last tab. */
  removeTab(tabId: TileryTabId): void;
  /** Moves a tab to another panel, index, or split target. */
  moveTab(tabId: TileryTabId, target: TileryMoveTarget): void;
  /**
   * Extracts a tab into a new floating panel.
   * @returns The new floating panel, or `null` if the tab could not be extracted.
   */
  floatTab(
    tabId: TileryTabId,
    opts?: TileryFloatTabOptions,
  ): TileryPanel | null;
  /**
   * Extracts a tab into a new panel opened in a native window.
   * @returns The new panel, or `null` if the tab could not be extracted.
   */
  popoutTab(
    tabId: TileryTabId,
    opts?: TileryPopoutTabOptions,
  ): TileryPanel | null;
  /** Updates a tab's close and drag behavior. */
  setTabBehavior(tabId: TileryTabId, behavior: TileryTabBehaviorUpdate): void;
  /** Activates a tab within its panel. */
  setActiveTab(tabId: TileryTabId): void;
  /** Swaps the positions of two panels. */
  swapPanels(panelA: TileryPanelId, panelB: TileryPanelId): void;
  /** Returns a serializable snapshot of the whole workspace for persistence. */
  getLayout<TData = unknown>(): TileryLayoutSnapshot<TData>;
  /** Replaces the workspace with the given layout or restored snapshot. */
  setLayout<TData = unknown>(layout: TileryInitialLayout<TData>): void;
  /** Returns the current live working state for inspection. */
  getState(): TileryLayoutState;
};

/**
 * Live handle to a single panel, returned by `getPanel()` and `getPanels()`. Its
 * methods are shorthands for the matching {@link TileryController} call.
 */
export type TileryPanel = {
  /** Panel identifier. */
  readonly id: TileryPanelId;
  /** Whether this panel is tiled, pinned to an edge, or floating. */
  readonly kind: TileryPanelState['kind'];
  /** Current distances from each root edge, in percent. */
  readonly inset: Readonly<TileryInset>;
  /** Edge side for a pinned panel; `undefined` unless `kind === 'edge'`. */
  readonly edge: TileryEdge | undefined;
  /** Pinned width or height for an edge panel; `undefined` unless `kind === 'edge'`. */
  readonly edgeSize: number | undefined;
  /** Edge default size for an edge panel, if set; otherwise `undefined`. */
  readonly edgeDefaultSize: number | undefined;
  /** Whether this panel is detached (floating or popped out). */
  readonly floating: boolean;
  /** Floating position and size; `undefined` unless detached. */
  readonly floatingBounds: Readonly<TileryFloatingPanelBounds> | undefined;
  /** Current floating z-index; `undefined` unless detached. */
  readonly floatingZIndex: number | undefined;
  /** Whether this detached panel lives in a native window. */
  readonly poppedOut: boolean;
  /** Native window bounds; `undefined` unless popped out. */
  readonly popoutWindowBounds: Readonly<TileryPopoutWindowBounds> | undefined;
  /** Tabs in this panel, in display order. */
  readonly tabs: readonly TileryTab[];
  /** The active tab, or `null` when the panel is empty. */
  readonly activeTab: TileryTab | null;
  /** Whether this panel is currently fullscreen. */
  readonly fullScreen: boolean;
  /** Minimum size constraint, if set. */
  readonly minSize: TilerySize | undefined;
  /** Maximum size constraint, if set. */
  readonly maxSize: TilerySize | undefined;
  /** Shorthand for controller.appendTab(this.id, tab, opts). */
  appendTab(tab: TileryTabInit, opts?: { activate?: boolean }): TileryTab;
  /** Shorthand for controller.insertTab(this.id, tab, index, opts). */
  insertTab(
    tab: TileryTabInit,
    index: number,
    opts?: { activate?: boolean },
  ): TileryTab;
  /** Shorthand for controller.splitPanel(this.id, direction, opts). */
  split(
    direction: TileryDirection,
    opts?: {
      size?: number;
      minSize?: TilerySize;
      maxSize?: TilerySize;
      tabs?: TileryTabInit[];
      activate?: boolean;
    } & TileryLayoutBehaviorConfig,
  ): TileryPanel;
  /** Shorthand for controller.removePanel(this.id). */
  remove(): void;
  /** Shorthand for controller.maximizePanel(this.id). */
  maximize(): void;
  /** Shorthand for controller.restorePanel(this.id). */
  restore(): void;
  /** Shorthand for controller.floatPanel(this.id, opts). */
  float(opts?: TileryFloatPanelOptions): void;
  /** Shorthand for controller.popoutPanel(this.id, opts). */
  popout(opts?: TileryPopoutPanelOptions): void;
  /** Shorthand for controller.returnPanelToFloating(this.id, bounds). */
  returnToFloating(bounds?: TileryFloatingPanelBoundsInit): void;
  /** Shorthand for controller.dockPanel(this.id, target). */
  dock(target?: TileryDockPanelTarget): void;
  /** Shorthand for controller.focusPanel(this.id). */
  focus(): void;
  /** Shorthand for controller.setFloatingPanelBounds(this.id, bounds). */
  setFloatingBounds(bounds: TileryFloatingPanelBoundsInit): void;
  /** Shorthand for controller.setPopoutWindowBounds(this.id, bounds). */
  setPopoutWindowBounds(bounds: TileryPopoutWindowBounds): void;
  /** Shorthand for controller.setActiveTab(id) scoped to this panel. */
  setActiveTab(id: TileryTabId): void;
};

/**
 * Live handle to a single tab, returned by `getTab()`, `getTabs()`, and panel tab
 * properties. Its methods are shorthands for the matching {@link TileryController} call.
 */
export type TileryTab<TData = unknown> = {
  /** Tab identifier. */
  readonly id: TileryTabId;
  /** The panel that currently owns this tab. */
  readonly panel: TileryPanel;
  /** Position of this tab within its panel's tab row. */
  readonly index: number;
  /** Application-supplied payload for the tab. */
  readonly data: TData;
  /** Whether close actions are allowed on this tab. */
  readonly closable: boolean;
  /** Whether this tab may be dragged or moved. */
  readonly draggable: boolean;
  /** Replaces this tab's data payload. */
  setData(data: TData): void;
  /** Shorthand for controller.setTabBehavior(this.id, behavior). */
  setBehavior(behavior: TileryTabBehaviorUpdate): void;
  /** Shorthand for controller.moveTab(this.id, target). */
  moveTo(target: TileryMoveTarget): void;
  /** Shorthand for controller.floatTab(this.id, opts). */
  float(opts?: TileryFloatTabOptions): TileryPanel | null;
  /** Shorthand for controller.popoutTab(this.id, opts). */
  popout(opts?: TileryPopoutTabOptions): TileryPanel | null;
  /** Shorthand for controller.setActiveTab(this.id). */
  activate(): void;
  /** Shorthand for controller.removeTab(this.id). */
  remove(): void;
};
