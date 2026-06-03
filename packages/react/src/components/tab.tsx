'use client';

/**
 * A single tab trigger + close control.
 */

import { useCallback } from 'react';
import type { TileryTab } from 'tilery/internal';
import type {
  TileryTabTriggerProps,
  TileryTabTriggerRenderer,
} from '../tilery';

/**
 * Props for the {@link Tab} component.
 */
export type TabProps = {
  /** The tab model that provides id, closable, and draggable flags. */
  tab: TileryTab;
  /** Whether this tab is currently selected. */
  isActive: boolean;
  /**
   * Renders the visible header content (title, icon, etc.) inside the tab
   * trigger.
   */
  renderHeader: (tab: TileryTab, ctx: { isActive: boolean }) => React.ReactNode;
  /**
   * Replaces the default `<div>` trigger element with a custom component.
   * When provided, pointer event handlers are attached to the custom element
   * via `props` rather than to the outer tab wrapper.
   */
  renderTrigger?: TileryTabTriggerRenderer;
  /** Called on pointer-down over the tab trigger. */
  onPointerDown: (e: React.PointerEvent) => void;
  /** Called on pointer-move during a drag gesture. */
  onPointerMove: (e: React.PointerEvent) => void;
  /** Called on pointer-up to end a drag or confirm a click. */
  onPointerUp: (e: React.PointerEvent) => void;
  /** Called on pointer-cancel to clean up an interrupted gesture. */
  onPointerCancel: (e: React.PointerEvent) => void;
  /** Callback ref that registers the tab's root DOM element by ID. */
  registerTab: (tabId: string, el: HTMLElement | null) => void;
  /** Called when the close button is clicked. */
  onClose: () => void;
};

/**
 * Renders a single tab entry in the tab strip. Supports a default `<div>`
 * trigger or a fully custom trigger via `renderTrigger`, and appends a close
 * button when `tab.closable` is true.
 */
export function Tab({
  tab,
  isActive,
  renderHeader,
  renderTrigger,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  registerTab,
  onClose,
}: TabProps) {
  const tabId = tab.id;
  const handleRef = useCallback(
    (el: HTMLElement | null) => registerTab(tabId, el),
    [registerTab, tabId],
  );
  const handleTriggerRef = useCallback(
    (_el: HTMLElement | null) => undefined,
    [],
  );
  const usesCustomTrigger = renderTrigger != null;
  const triggerProps: TileryTabTriggerProps = {
    ref: handleTriggerRef,
    className: 'tilery__tab-trigger',
    'data-active': isActive,
    'data-closable': tab.closable,
    'data-draggable': tab.draggable,
    'data-tab-id': tab.id,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    role: 'tab',
    'aria-selected': isActive,
  };
  const triggerChildren = (
    <span className="tilery__tab-header">
      {renderHeader(tab, { isActive })}
    </span>
  );
  const trigger = renderTrigger ? (
    renderTrigger({
      tab,
      isActive,
      props: triggerProps,
      children: triggerChildren,
    })
  ) : (
    <div className="tilery__tab-trigger">{triggerChildren}</div>
  );
  const tabInteractionProps = usesCustomTrigger
    ? {}
    : {
        onPointerDown,
        onPointerMove,
        onPointerUp,
        onPointerCancel,
        role: 'tab',
        'aria-selected': isActive,
      };

  return (
    <div
      ref={handleRef}
      className="tilery__tab"
      data-active={isActive}
      data-closable={tab.closable}
      data-draggable={tab.draggable}
      data-tab-id={tab.id}
      {...tabInteractionProps}>
      {trigger}
      {tab.closable && (
        <button
          type="button"
          className="tilery__tab-close"
          aria-label="Close tab"
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}>
          ×
        </button>
      )}
    </div>
  );
}
