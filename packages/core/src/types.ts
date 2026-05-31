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
  closeable?: boolean;
};

export type TileryLayoutTree =
  | {
      kind: 'panel';
      panelId: TileryPanelId;
      size?: number;
    }
  | {
      kind: 'split';
      id: string;
      direction: 'horizontal' | 'vertical';
      size?: number;
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
  closeable?: boolean;
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
};

export type TilerySplitInit<TData = unknown> = {
  type: 'split';
  id?: string;
  direction: 'horizontal' | 'vertical';
  size?: number;
  children: TileryInitialLayout<TData>[];
};

export type TileryInitialLayout<TData = unknown> =
  | TileryPanelInit<TData>
  | TilerySplitInit<TData>;

export type TileryMoveTarget =
  | { panel: TileryPanelId; index?: number }
  | { beforeTab: TileryTabId }
  | { afterTab: TileryTabId }
  | {
      splitPanel: TileryPanelId;
      direction: TileryDirection;
      size?: number;
      minSize?: number;
      maxSize?: number;
    };

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
};

export type TileryJunction = {
  id: string;
  kind: 't';
  x: number;
  y: number;
  verticalDividerId: string;
  horizontalDividerId: string;
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
    },
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
    },
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
  setData(data: TData): void;
  moveTo(target: TileryMoveTarget): void;
  activate(): void;
  remove(): void;
};
