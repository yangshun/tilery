/* v8 ignore start -- test fixture helper */
import type {
  TileryInset,
  TileryLayoutState,
  TileryPanelState,
  TileryTabId,
} from 'tilery/internal';
import {
  tileryBuildLayoutTreeFromPanels,
  tileryNextId,
  tilerySyncLayoutPanels,
} from 'tilery/internal';

type FlatPanelInit = {
  id?: string;
  inset: TileryInset;
  tabs: { id?: string; data: unknown; closeable?: boolean }[];
  activeTabId?: string;
  fullScreen?: boolean;
};

export function createStateFromPanels(initial: {
  panels: FlatPanelInit[];
}): TileryLayoutState {
  const state: TileryLayoutState = {
    panels: {},
    panelOrder: [],
    tabs: {},
    layout: null,
  };
  let hasFullScreenPanel = false;
  for (const init of initial.panels) {
    const panelId = init.id ?? tileryNextId('p');
    const tabs: TileryTabId[] = [];
    for (const tabInit of init.tabs) {
      const tabId = tabInit.id ?? tileryNextId('t');
      state.tabs[tabId] = {
        id: tabId,
        panelId,
        data: tabInit.data,
        closeable: tabInit.closeable ?? true,
      };
      tabs.push(tabId);
    }
    const fullScreen = Boolean(init.fullScreen && !hasFullScreenPanel);
    if (fullScreen) hasFullScreenPanel = true;
    state.panels[panelId] = {
      id: panelId,
      kind: 'tiled',
      inset: { ...init.inset },
      tabs,
      activeTabId:
        init.activeTabId && tabs.includes(init.activeTabId)
          ? init.activeTabId
          : (tabs[0] ?? null),
      fullScreen,
    } satisfies TileryPanelState;
    state.panelOrder.push(panelId);
  }
  const layout = tileryBuildLayoutTreeFromPanels(
    state.panelOrder.map((id) => state.panels[id]!).filter(Boolean),
  );
  return layout ? tilerySyncLayoutPanels({ ...state, layout }, layout) : state;
}
/* v8 ignore stop */
