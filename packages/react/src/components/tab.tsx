'use client';

import { useCallback } from 'react';
import type { TileryTabHandle } from 'tilery/internal';

export type TabProps = {
  tab: TileryTabHandle;
  isActive: boolean;
  renderHeader: (
    tab: TileryTabHandle,
    ctx: { isActive: boolean },
  ) => React.ReactNode;
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
  return (
    <div
      ref={handleRef}
      className="tilery__tab"
      data-active={isActive}
      data-closeable={tab.closeable}
      data-tab-id={tab.id}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      role="tab"
      aria-selected={isActive}>
      <span className="tilery__tab-header">
        {renderHeader(tab, { isActive })}
      </span>
      {tab.closeable && (
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
