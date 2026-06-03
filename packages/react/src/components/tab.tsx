'use client';

import { useCallback } from 'react';
import type { TileryTab } from 'tilery/internal';
import type {
  TileryTabTriggerProps,
  TileryTabTriggerRenderer,
} from '../tilery';

export type TabProps = {
  tab: TileryTab;
  isActive: boolean;
  renderHeader: (tab: TileryTab, ctx: { isActive: boolean }) => React.ReactNode;
  renderTrigger?: TileryTabTriggerRenderer;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerCancel: (e: React.PointerEvent) => void;
  registerTab: (tabId: string, el: HTMLElement | null) => void;
  onClose: () => void;
};

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
