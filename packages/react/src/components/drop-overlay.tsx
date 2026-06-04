'use client';

/**
 * Renders drag drop-zone highlights and the tab insertion bar.
 */

import type { TileryDragState } from 'tilery/internal';
import { tileryCssEscape as cssEscape } from '../css-escape';

/**
 * Props for the {@link DropOverlay} component.
 */
export type DropOverlayProps = {
  /** Current drag state that drives which overlay variant is rendered. */
  drag: TileryDragState;
  /** Ref to the root layout container, used to convert DOM rects to
   *  relative coordinates. */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Map from panel ID to its root DOM element, used to locate panel
   *  drop zones. */
  panelEls: Map<string, HTMLElement>;
  /** Content rendered inside the floating drag ghost element. */
  ghostLabel?: React.ReactNode;
};

const INSERTION_BAR_WIDTH = 3;

/**
 * Absolute-positioned overlay layer rendered on top of the layout during a
 * drag operation. Displays a highlighted zone (root edge, panel half, or tab
 * insertion bar) based on the current hover target, plus a floating ghost
 * label that follows the pointer.
 */
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
  } else if (drag.hoverRootZone) {
    overlay = renderRootZone(container, drag, cRect);
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

function renderRootZone(
  container: HTMLElement,
  drag: TileryDragState,
  cRect: DOMRect,
): React.ReactNode {
  const zone = drag.hoverRootZone;
  /* v8 ignore next -- renderRootZone is only called when a root zone is set. */
  if (!zone) return null;
  const mainLayer = container.querySelector<HTMLElement>('.tilery__main-layer');
  if (!mainLayer) return null;
  const rect = mainLayer.getBoundingClientRect();
  const fraction = clampPercent(drag.hoverRootSize ?? 50) / 100;
  let left = rect.left;
  let top = rect.top;
  let width = rect.width;
  let height = rect.height;

  if (zone === 'left') {
    width = rect.width * fraction;
  } else if (zone === 'right') {
    width = rect.width * fraction;
    left = rect.right - width;
  } else if (zone === 'top') {
    height = rect.height * fraction;
  } else {
    height = rect.height * fraction;
    top = rect.bottom - height;
  }

  return (
    <div
      className="tilery__drop-overlay"
      data-zone={zone}
      data-root-zone="true"
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

function clampPercent(value: number) {
  /* v8 ignore next -- hoverRootSize is always a finite number or defaulted. */
  return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 50));
}

function renderTabBarInsertion(
  hoverTabBar: NonNullable<TileryDragState['hoverTabBar']>,
  container: HTMLElement,
  cRect: DOMRect,
): React.ReactNode {
  const { panelId, hit } = hoverTabBar;
  const tabBar = container.querySelector<HTMLElement>(
    `.tilery__panel[data-panel-id="${cssEscape(panelId)}"] .tilery__tab-list, .tilery__panel[data-panel-id="${cssEscape(panelId)}"] .tilery__tab-bar`,
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
  zone: NonNullable<TileryDragState['hoverZone']>,
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
