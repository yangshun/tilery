export type TileryPanelId = string;
export type TileryTabId = string;

export type TilerySize = number | `${number}%` | `${number}px`;

export type TilerySizeResolutionContext = {
  width?: number;
  height?: number;
};

export type TileryDirection = 'left' | 'right' | 'top' | 'bottom';

export type TileryInset = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type TileryFloatingPanelBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type TileryFloatingPanelBoundsInit = Partial<TileryFloatingPanelBounds>;

export type TileryFloatingResizeEdge =
  | 'top'
  | 'right'
  | 'bottom'
  | 'left'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export type TileryPopoutWindowBounds = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type TileryPopoutWindowBoundsInit = Partial<TileryPopoutWindowBounds>;

export type TileryPopoutPanelPlacement = {
  windowBounds: TileryPopoutWindowBounds;
};

export type TileryPopoutPanelConfig =
  | boolean
  | {
      windowBounds?: TileryPopoutWindowBoundsInit;
    };

export type TileryFloatPanelOptions = TileryFloatingPanelBoundsInit &
  TileryLayoutBehaviorConfig;

export type TileryPopoutPanelOptions = {
  floatingBounds?: TileryFloatingPanelBoundsInit;
  windowBounds?: TileryPopoutWindowBoundsInit;
} & TileryLayoutBehaviorConfig;

export type TileryFloatTabOptions = {
  panelId?: TileryPanelId;
  bounds?: TileryFloatingPanelBoundsInit;
} & TileryLayoutBehaviorConfig;

export type TileryPopoutTabOptions = TileryPopoutPanelOptions & {
  panelId?: TileryPanelId;
};

export type TileryFloatingPanelPlacement = {
  bounds: TileryFloatingPanelBounds;
  zIndex: number;
  popout?: TileryPopoutPanelPlacement;
};

type TileryPanelStateBase = {
  id: TileryPanelId;
  inset: TileryInset;
  tabs: TileryTabId[];
  activeTabId: TileryTabId | null;
  fullScreen?: boolean;
  minSize?: TilerySize;
  maxSize?: TilerySize;
};

export type TileryTiledPanelState = TileryPanelStateBase & {
  kind: 'tiled';
  floating?: never;
  behavior?: never;
};

export type TileryFloatingPanelState = TileryPanelStateBase & {
  kind: 'floating';
  floating: TileryFloatingPanelPlacement;
  behavior: TileryLayoutBehavior;
};

export type TileryPanelState = TileryTiledPanelState | TileryFloatingPanelState;

export type TileryTabState<TData = unknown> = {
  id: TileryTabId;
  panelId: TileryPanelId;
  data: TData;
  closeable: boolean;
  draggable: boolean;
};

export type TileryTabBehavior = {
  closeable: boolean;
  draggable: boolean;
};

export type TileryTabBehaviorConfig =
  | {
      locked: true;
      closeable?: never;
      draggable?: never;
    }
  | {
      locked?: false;
      closeable?: boolean;
      draggable?: boolean;
    };

export type TileryTabBehaviorUpdate =
  | {
      locked: true;
      closeable?: never;
      draggable?: never;
    }
  | {
      locked?: false;
      closeable?: boolean;
      draggable?: boolean;
    };

export type TileryLayoutBehavior = {
  resizable: boolean;
  draggable: boolean;
  droppable: boolean;
};

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

export type TileryLayoutState = {
  panels: Record<TileryPanelId, TileryPanelState>;
  panelOrder: TileryPanelId[];
  floatingPanelOrder?: TileryPanelId[];
  tabs: Record<TileryTabId, TileryTabState>;
  layout?: TileryLayoutTree | null;
};

export type TileryTabInit<TData = unknown> = {
  id?: TileryTabId;
  data: TData;
} & TileryTabBehaviorConfig;

export type TileryEmptyInit = {
  type: 'empty';
};

export type TileryPanelInit<TData = unknown> = {
  type: 'panel';
  id?: TileryPanelId;
  size?: number;
  defaultSize?: number;
  tabs: TileryTabInit<TData>[];
  activeTabId?: TileryTabId;
  fullScreen?: boolean;
  minSize?: TilerySize;
  maxSize?: TilerySize;
} & TileryLayoutBehaviorConfig;

export type TileryGroupInit<TData = unknown> = {
  type: 'group';
  id?: string;
  direction: 'horizontal' | 'vertical';
  size?: number;
  defaultSize?: number;
  children: TileryDockedLayoutInit<TData>[];
} & TileryLayoutBehaviorConfig;

export type TileryDockedLayoutInit<TData = unknown> =
  | TileryEmptyInit
  | TileryPanelInit<TData>
  | TileryGroupInit<TData>;

export type TileryFloatingPanelInit<TData = unknown> = {
  type: 'floatingPanel';
  id?: TileryPanelId;
  bounds?: TileryFloatingPanelBoundsInit;
  zIndex?: number;
  popout?: TileryPopoutPanelConfig;
  tabs: TileryTabInit<TData>[];
  activeTabId?: TileryTabId;
  fullScreen?: boolean;
  minSize?: TilerySize;
  maxSize?: TilerySize;
} & TileryLayoutBehaviorConfig;

export type TileryRootInit<TData = unknown> = {
  type: 'root';
  main: TileryDockedLayoutInit<TData>;
  floating?: TileryFloatingPanelInit<TData>[];
};

export type TileryInitialLayout<TData = unknown> =
  | TileryDockedLayoutInit<TData>
  | TileryRootInit<TData>;

export type TileryPanelSnapshot<TData = unknown> = {
  type: 'panel';
  id?: TileryPanelId;
  size?: number;
  defaultSize?: number;
  tabs: TileryTabSnapshot<TData>[];
  activeTabId?: TileryTabId;
  fullScreen?: boolean;
  minSize?: TilerySize;
  maxSize?: TilerySize;
} & TileryLayoutBehavior;

export type TileryTabSnapshot<TData = unknown> = {
  id?: TileryTabId;
  data: TData;
} & TileryTabBehavior;

export type TileryGroupSnapshot<TData = unknown> = {
  type: 'group';
  id?: string;
  direction: 'horizontal' | 'vertical';
  size?: number;
  defaultSize?: number;
  children: TileryDockedLayoutSnapshot<TData>[];
} & TileryLayoutBehavior;

export type TileryDockedLayoutSnapshot<TData = unknown> =
  | TileryEmptyInit
  | TileryPanelSnapshot<TData>
  | TileryGroupSnapshot<TData>;

export type TileryFloatingPanelSnapshot<TData = unknown> = {
  type: 'floatingPanel';
  id?: TileryPanelId;
  bounds: TileryFloatingPanelBounds;
  zIndex: number;
  popout?: TileryPopoutPanelPlacement;
  tabs: TileryTabSnapshot<TData>[];
  activeTabId?: TileryTabId;
  fullScreen?: boolean;
  minSize?: TilerySize;
  maxSize?: TilerySize;
} & TileryLayoutBehavior;

export type TileryRootSnapshot<TData = unknown> = {
  type: 'root';
  main: TileryDockedLayoutSnapshot<TData>;
  floating: TileryFloatingPanelSnapshot<TData>[];
};

export type TileryLayoutSnapshot<TData = unknown> =
  | TileryDockedLayoutSnapshot<TData>
  | TileryRootSnapshot<TData>;

export type TilerySplitMoveTarget = {
  splitPanel: TileryPanelId;
  direction: TileryDirection;
  size?: number;
  minSize?: TilerySize;
  maxSize?: TilerySize;
} & TileryLayoutBehaviorConfig;

export type TileryMoveTarget =
  | { panel: TileryPanelId; index?: number }
  | { beforeTab: TileryTabId }
  | { afterTab: TileryTabId }
  | TilerySplitMoveTarget;

export type TileryOpenTabTarget =
  | { panel: TileryPanelId; index?: number }
  | { beforeTab: TileryTabId }
  | { afterTab: TileryTabId };

export type TileryDockPanelTarget = {
  splitPanel?: TileryPanelId;
  direction?: TileryDirection;
  size?: number;
  minSize?: TilerySize;
  maxSize?: TilerySize;
} & TileryLayoutBehaviorConfig;

export type TileryDividerOrientation = 'vertical' | 'horizontal';

export type TileryDivider = {
  id: string;
  orientation: TileryDividerOrientation;
  position: number;
  start: number;
  end: number;
  beforePanels: TileryPanelId[];
  afterPanels: TileryPanelId[];
  splitId?: string;
  disabled?: boolean;
};

export type TileryJunction = {
  id: string;
  kind: 't';
  x: number;
  y: number;
  verticalDividerId: string;
  horizontalDividerId: string;
  disabled?: boolean;
};

export type TileryController = {
  getPanel(id: TileryPanelId): TileryPanel | null;
  getTab(id: TileryTabId): TileryTab | null;
  getPanels(): TileryPanel[];
  getTabs(): TileryTab[];
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
  removePanel(panelId: TileryPanelId): void;
  maximizePanel(panelId: TileryPanelId): void;
  restorePanel(panelId: TileryPanelId): void;
  floatPanel(panelId: TileryPanelId, opts?: TileryFloatPanelOptions): void;
  popoutPanel(panelId: TileryPanelId, opts?: TileryPopoutPanelOptions): void;
  returnPanelToFloating(
    panelId: TileryPanelId,
    bounds?: TileryFloatingPanelBoundsInit,
  ): void;
  dockPanel(panelId: TileryPanelId, target?: TileryDockPanelTarget): void;
  focusPanel(panelId: TileryPanelId): void;
  setFloatingPanelBounds(
    panelId: TileryPanelId,
    bounds: TileryFloatingPanelBounds,
  ): void;
  setPopoutWindowBounds(
    panelId: TileryPanelId,
    bounds: TileryPopoutWindowBounds,
  ): void;
  appendTab(
    panelId: TileryPanelId,
    tab: TileryTabInit,
    opts?: { activate?: boolean },
  ): TileryTab;
  insertTab(
    panelId: TileryPanelId,
    tab: TileryTabInit,
    index: number,
    opts?: { activate?: boolean },
  ): TileryTab;
  openOrActivateTab(
    tab: TileryTabInit,
    target: TileryOpenTabTarget,
  ): TileryTab | null;
  changeTabId(oldTabId: TileryTabId, newTabId: TileryTabId): TileryTab | null;
  removeTab(tabId: TileryTabId): void;
  moveTab(tabId: TileryTabId, target: TileryMoveTarget): void;
  floatTab(
    tabId: TileryTabId,
    opts?: TileryFloatTabOptions,
  ): TileryPanel | null;
  popoutTab(
    tabId: TileryTabId,
    opts?: TileryPopoutTabOptions,
  ): TileryPanel | null;
  setTabBehavior(tabId: TileryTabId, behavior: TileryTabBehaviorUpdate): void;
  setActiveTab(tabId: TileryTabId): void;
  swapPanels(panelA: TileryPanelId, panelB: TileryPanelId): void;
  getLayout<TData = unknown>(): TileryLayoutSnapshot<TData>;
  setLayout<TData = unknown>(layout: TileryInitialLayout<TData>): void;
  getState(): TileryLayoutState;
};

export type TileryPanel = {
  readonly id: TileryPanelId;
  readonly kind: TileryPanelState['kind'];
  readonly inset: Readonly<TileryInset>;
  readonly floating: boolean;
  readonly floatingBounds: Readonly<TileryFloatingPanelBounds> | undefined;
  readonly floatingZIndex: number | undefined;
  readonly poppedOut: boolean;
  readonly popoutWindowBounds: Readonly<TileryPopoutWindowBounds> | undefined;
  readonly tabs: readonly TileryTab[];
  readonly activeTab: TileryTab | null;
  readonly fullScreen: boolean;
  readonly minSize: TilerySize | undefined;
  readonly maxSize: TilerySize | undefined;
  appendTab(tab: TileryTabInit, opts?: { activate?: boolean }): TileryTab;
  insertTab(
    tab: TileryTabInit,
    index: number,
    opts?: { activate?: boolean },
  ): TileryTab;
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
  remove(): void;
  maximize(): void;
  restore(): void;
  float(opts?: TileryFloatPanelOptions): void;
  popout(opts?: TileryPopoutPanelOptions): void;
  returnToFloating(bounds?: TileryFloatingPanelBoundsInit): void;
  dock(target?: TileryDockPanelTarget): void;
  focus(): void;
  setFloatingBounds(bounds: TileryFloatingPanelBounds): void;
  setPopoutWindowBounds(bounds: TileryPopoutWindowBounds): void;
  setActiveTab(id: TileryTabId): void;
};

export type TileryTab<TData = unknown> = {
  readonly id: TileryTabId;
  readonly panel: TileryPanel;
  readonly index: number;
  readonly data: TData;
  readonly closeable: boolean;
  readonly draggable: boolean;
  setData(data: TData): void;
  setBehavior(behavior: TileryTabBehaviorUpdate): void;
  moveTo(target: TileryMoveTarget): void;
  float(opts?: TileryFloatTabOptions): TileryPanel | null;
  popout(opts?: TileryPopoutTabOptions): TileryPanel | null;
  activate(): void;
  remove(): void;
};
