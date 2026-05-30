export type PanelId = string;
export type TabId = string;

export type Direction = 'left' | 'right' | 'top' | 'bottom';

export type Inset = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type PanelState = {
  id: PanelId;
  kind: 'tiled';
  inset: Inset;
  tabs: TabId[];
  activeTabId: TabId | null;
};

export type TabState<TData = unknown> = {
  id: TabId;
  panelId: PanelId;
  data: TData;
};

export type LayoutState = {
  panels: Record<PanelId, PanelState>;
  panelOrder: PanelId[];
  tabs: Record<TabId, TabState>;
};

export type TabInit<TData = unknown> = {
  id?: TabId;
  data: TData;
};

export type PanelInit<TData = unknown> = {
  id?: PanelId;
  inset: Inset;
  tabs: TabInit<TData>[];
  activeTabId?: TabId;
};

export type InitialLayout<TData = unknown> = {
  panels: PanelInit<TData>[];
};

export type MoveTarget =
  | { panel: PanelId; index?: number }
  | { beforeTab: TabId }
  | { afterTab: TabId }
  | { splitPanel: PanelId; direction: Direction; sizePercent?: number };

export type DividerOrientation = 'vertical' | 'horizontal';

export type Divider = {
  id: string;
  orientation: DividerOrientation;
  position: number;
  start: number;
  end: number;
  beforePanels: PanelId[];
  afterPanels: PanelId[];
};

export type TileryHandle = {
  getPanel(id: PanelId): PanelHandle | null;
  getTab(id: TabId): TabHandle | null;
  getPanels(): PanelHandle[];
  getTabs(): TabHandle[];
  splitPanel(
    panelId: PanelId,
    direction: Direction,
    opts?: {
      sizePercent?: number;
      tabs?: TabInit[];
      activate?: boolean;
    },
  ): PanelHandle;
  removePanel(panelId: PanelId): void;
  appendTab(
    panelId: PanelId,
    tab: TabInit,
    opts?: { activate?: boolean },
  ): TabHandle;
  insertTab(
    panelId: PanelId,
    tab: TabInit,
    index: number,
    opts?: { activate?: boolean },
  ): TabHandle;
  removeTab(tabId: TabId): void;
  moveTab(tabId: TabId, target: MoveTarget): void;
  setActiveTab(tabId: TabId): void;
  swapPanels(panelA: PanelId, panelB: PanelId): void;
  getState(): LayoutState;
};

export type PanelHandle = {
  readonly id: PanelId;
  readonly inset: Readonly<Inset>;
  readonly tabs: readonly TabHandle[];
  readonly activeTab: TabHandle | null;
  appendTab(tab: TabInit, opts?: { activate?: boolean }): TabHandle;
  insertTab(
    tab: TabInit,
    index: number,
    opts?: { activate?: boolean },
  ): TabHandle;
  split(
    direction: Direction,
    opts?: {
      sizePercent?: number;
      tabs?: TabInit[];
      activate?: boolean;
    },
  ): PanelHandle;
  remove(): void;
  setActiveTab(id: TabId): void;
};

export type TabHandle<TData = unknown> = {
  readonly id: TabId;
  readonly panel: PanelHandle;
  readonly index: number;
  readonly data: TData;
  setData(data: TData): void;
  moveTo(target: MoveTarget): void;
  activate(): void;
  remove(): void;
};
