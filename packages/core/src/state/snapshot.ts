import type {
  TileryInitialLayout,
  TileryLayoutSnapshot,
  TileryLayoutState,
  TileryLayoutTree,
} from '../types';

type NonEmptyLayout<TData> = Exclude<
  TileryInitialLayout<TData>,
  { type: 'empty' }
>;

export function tileryCreateLayoutSnapshot<TData = unknown>(
  state: TileryLayoutState,
): TileryLayoutSnapshot<TData> {
  const snapshot = state.layout
    ? layoutToSnapshot<TData>(state.layout, state)
    : null;
  return snapshot ?? { type: 'empty' };
}

function layoutToSnapshot<TData>(
  layout: TileryLayoutTree,
  state: TileryLayoutState,
): NonEmptyLayout<TData> | null {
  if (layout.kind === 'split') {
    const children = layout.children
      .map((child) => layoutToSnapshot<TData>(child, state))
      .filter((child): child is NonEmptyLayout<TData> => Boolean(child));
    /* v8 ignore next 2 -- normalized layouts do not keep empty splits. */
    if (children.length === 0) return null;
    if (children.length === 1) return { ...children[0]!, size: layout.size };
    return {
      type: 'split',
      id: layout.id,
      direction: layout.direction,
      size: layout.size,
      children,
    };
  }

  const panel = state.panels[layout.panelId];
  /* v8 ignore next -- normalized layouts only reference existing panels. */
  if (!panel) return null;
  return {
    type: 'panel',
    id: panel.id,
    size: layout.size,
    activeTabId: panel.activeTabId ?? undefined,
    fullScreen: panel.fullScreen,
    minSize: panel.minSize,
    maxSize: panel.maxSize,
    tabs: panel.tabs.map((tabId) => {
      const tab = state.tabs[tabId]!;
      return {
        id: tab.id,
        data: tab.data as TData,
        closeable: tab.closeable,
      };
    }),
  };
}
