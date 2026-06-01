export type TileryPanelId = string;
export type TileryTabId = string;

export type TileryDirection = 'left' | 'right' | 'top' | 'bottom';

export type TileryInset = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type TileryPanelState = {
  id: TileryPanelId;
  kind: 'tiled';
  inset: TileryInset;
  tabs: TileryTabId[];
  activeTabId: TileryTabId | null;
  fullScreen?: boolean;
  minSize?: number;
  maxSize?: number;
};

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
      resizable?: boolean;
      draggable?: boolean;
      droppable?: boolean;
    }
  | {
      kind: 'split';
      id: string;
      direction: 'horizontal' | 'vertical';
      size?: number;
      resizable?: boolean;
      draggable?: boolean;
      droppable?: boolean;
      children: TileryLayoutTree[];
    };

export type TileryLayoutState = {
  panels: Record<TileryPanelId, TileryPanelState>;
  panelOrder: TileryPanelId[];
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
  tabs: TileryTabInit<TData>[];
  activeTabId?: TileryTabId;
  fullScreen?: boolean;
  minSize?: number;
  maxSize?: number;
} & TileryLayoutBehaviorConfig;

export type TilerySplitInit<TData = unknown> = {
  type: 'split';
  id?: string;
  direction: 'horizontal' | 'vertical';
  size?: number;
  children: TileryInitialLayout<TData>[];
} & TileryLayoutBehaviorConfig;

export type TileryInitialLayout<TData = unknown> =
  | TileryEmptyInit
  | TileryPanelInit<TData>
  | TilerySplitInit<TData>;

export type TileryPanelSnapshot<TData = unknown> = {
  type: 'panel';
  id?: TileryPanelId;
  size?: number;
  tabs: TileryTabSnapshot<TData>[];
  activeTabId?: TileryTabId;
  fullScreen?: boolean;
  minSize?: number;
  maxSize?: number;
} & TileryLayoutBehavior;

export type TileryTabSnapshot<TData = unknown> = {
  id?: TileryTabId;
  data: TData;
} & TileryTabBehavior;

export type TilerySplitSnapshot<TData = unknown> = {
  type: 'split';
  id?: string;
  direction: 'horizontal' | 'vertical';
  size?: number;
  children: TileryLayoutSnapshot<TData>[];
} & TileryLayoutBehavior;

export type TileryLayoutSnapshot<TData = unknown> =
  | TileryEmptyInit
  | TileryPanelSnapshot<TData>
  | TilerySplitSnapshot<TData>;

export type TilerySplitMoveTarget = {
  splitPanel: TileryPanelId;
  direction: TileryDirection;
  size?: number;
  minSize?: number;
  maxSize?: number;
} & TileryLayoutBehaviorConfig;

export type TileryMoveTarget =
  | { panel: TileryPanelId; index?: number }
  | { beforeTab: TileryTabId }
  | { afterTab: TileryTabId }
  | TilerySplitMoveTarget;

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

export type TileryHandle = {
  getPanel(id: TileryPanelId): TileryPanelHandle | null;
  getTab(id: TileryTabId): TileryTabHandle | null;
  getPanels(): TileryPanelHandle[];
  getTabs(): TileryTabHandle[];
  splitPanel(
    panelId: TileryPanelId,
    direction: TileryDirection,
    opts?: {
      size?: number;
      minSize?: number;
      maxSize?: number;
      tabs?: TileryTabInit[];
      activate?: boolean;
    } & TileryLayoutBehaviorConfig,
  ): TileryPanelHandle;
  removePanel(panelId: TileryPanelId): void;
  maximizePanel(panelId: TileryPanelId): void;
  restorePanel(panelId: TileryPanelId): void;
  appendTab(
    panelId: TileryPanelId,
    tab: TileryTabInit,
    opts?: { activate?: boolean },
  ): TileryTabHandle;
  insertTab(
    panelId: TileryPanelId,
    tab: TileryTabInit,
    index: number,
    opts?: { activate?: boolean },
  ): TileryTabHandle;
  removeTab(tabId: TileryTabId): void;
  moveTab(tabId: TileryTabId, target: TileryMoveTarget): void;
  setActiveTab(tabId: TileryTabId): void;
  swapPanels(panelA: TileryPanelId, panelB: TileryPanelId): void;
  getLayout<TData = unknown>(): TileryLayoutSnapshot<TData>;
  setLayout<TData = unknown>(layout: TileryInitialLayout<TData>): void;
  getState(): TileryLayoutState;
};

export type TileryPanelHandle = {
  readonly id: TileryPanelId;
  readonly inset: Readonly<TileryInset>;
  readonly tabs: readonly TileryTabHandle[];
  readonly activeTab: TileryTabHandle | null;
  readonly fullScreen: boolean;
  readonly minSize: number | undefined;
  readonly maxSize: number | undefined;
  appendTab(tab: TileryTabInit, opts?: { activate?: boolean }): TileryTabHandle;
  insertTab(
    tab: TileryTabInit,
    index: number,
    opts?: { activate?: boolean },
  ): TileryTabHandle;
  split(
    direction: TileryDirection,
    opts?: {
      size?: number;
      minSize?: number;
      maxSize?: number;
      tabs?: TileryTabInit[];
      activate?: boolean;
    } & TileryLayoutBehaviorConfig,
  ): TileryPanelHandle;
  remove(): void;
  maximize(): void;
  restore(): void;
  setActiveTab(id: TileryTabId): void;
};

export type TileryTabHandle<TData = unknown> = {
  readonly id: TileryTabId;
  readonly panel: TileryPanelHandle;
  readonly index: number;
  readonly data: TData;
  readonly closeable: boolean;
  readonly draggable: boolean;
  setData(data: TData): void;
  moveTo(target: TileryMoveTarget): void;
  activate(): void;
  remove(): void;
};
