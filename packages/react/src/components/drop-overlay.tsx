'use client';

import type { DragState } from 'tilery';

export type DropOverlayProps = {
  drag: DragState;
  containerRef: React.RefObject<HTMLDivElement | null>;
  panelEls: Map<string, HTMLElement>;
  ghostLabel?: React.ReactNode;
};

const INSERTION_BAR_WIDTH = 3;

export function DropOverlay({
  drag,
  containerRef,
  panelEls,
  ghostLabel,
}: DropOverlayProps) {
  const container = containerRef.current;
  if (!container) return null;
  const cRect = container.getBoundingClientRect();

  let overlay: React.ReactNode = null;

  if (drag.hoverTabBar) {
    overlay = renderTabBarInsertion(drag.hoverTabBar, container, cRect);
  } else if (drag.hoverPanelId && drag.hoverZone) {
    const panelEl = panelEls.get(drag.hoverPanelId);
    if (panelEl) {
      overlay = renderPanelZone(panelEl, drag.hoverZone, cRect);
    }
  }

  return (
    <>
      {overlay}
      <div
        className="tilery__drag-ghost"
        aria-hidden="true"
        style={{
          left: drag.x - cRect.left + 12,
          top: drag.y - cRect.top + 12,
        }}>
        {ghostLabel ?? 'Tab'}
      </div>
    </>
  );
}

function renderTabBarInsertion(
  hoverTabBar: NonNullable<DragState['hoverTabBar']>,
  container: HTMLElement,
  cRect: DOMRect,
): React.ReactNode {
  const { panelId, hit } = hoverTabBar;
  const tabBar = container.querySelector<HTMLElement>(
    `.tilery__panel[data-panel-id="${cssEscape(panelId)}"] .tilery__tab-bar`,
  );
  if (!tabBar) return null;
  const barRect = tabBar.getBoundingClientRect();

  let x = barRect.left;
  if (hit.kind === 'before') {
    const tabEl = container.querySelector<HTMLElement>(
      `[data-tab-id="${cssEscape(hit.tabId)}"]`,
    );
    if (tabEl) x = tabEl.getBoundingClientRect().left;
  } else if (hit.kind === 'after') {
    const tabEl = container.querySelector<HTMLElement>(
      `[data-tab-id="${cssEscape(hit.tabId)}"]`,
    );
    if (tabEl) x = tabEl.getBoundingClientRect().right;
  } else {
    const tabs = tabBar.querySelectorAll<HTMLElement>('[data-tab-id]');
    if (tabs.length > 0) {
      x = tabs[tabs.length - 1]!.getBoundingClientRect().right;
    } else {
      x = barRect.left + 2;
    }
  }

  return (
    <div
      className="tilery__drop-insertion"
      aria-hidden="true"
      style={{
        left: x - cRect.left - INSERTION_BAR_WIDTH / 2,
        top: barRect.top - cRect.top,
        width: INSERTION_BAR_WIDTH,
        height: barRect.height,
      }}
    />
  );
}

function renderPanelZone(
  panelEl: HTMLElement,
  zone: NonNullable<DragState['hoverZone']>,
  cRect: DOMRect,
): React.ReactNode {
  const panelRect = panelEl.getBoundingClientRect();
  const tabBar = panelEl.querySelector<HTMLElement>('.tilery__tab-bar');
  const gap = readPanelGap(panelEl);
  const tabBarBottom = tabBar
    ? tabBar.getBoundingClientRect().bottom
    : panelRect.top + gap;

  const contentLeft = panelRect.left + gap;
  const contentTop = tabBarBottom;
  const contentWidth = panelRect.width - gap * 2;
  const contentHeight = panelRect.bottom - tabBarBottom - gap;

  let left = contentLeft;
  let top = contentTop;
  let width = contentWidth;
  let height = contentHeight;

  if (zone === 'left') {
    width = contentWidth / 2;
  } else if (zone === 'right') {
    left = contentLeft + contentWidth / 2;
    width = contentWidth / 2;
  } else if (zone === 'top') {
    height = contentHeight / 2;
  } else if (zone === 'bottom') {
    top = contentTop + contentHeight / 2;
    height = contentHeight / 2;
  }

  return (
    <div
      className="tilery__drop-overlay"
      data-zone={zone}
      aria-hidden="true"
      style={{
        left: left - cRect.left,
        top: top - cRect.top,
        width,
        height,
      }}
    />
  );
}

function readPanelGap(panelEl: HTMLElement): number {
  const value = getComputedStyle(panelEl).borderTopWidth;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function cssEscape(value: string): string {
  /* v8 ignore next 3 */
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value);
  }
  return value.replace(/[^a-zA-Z0-9_-]/g, (c) => `\\${c}`);
}
