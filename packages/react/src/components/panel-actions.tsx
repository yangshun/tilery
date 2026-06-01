'use client';

import { useCallback, useState } from 'react';
import type {
  TileryDirection,
  TileryHandle,
  TileryPanelHandle,
  TileryTabInit,
} from 'tilery/internal';

export type TileryPanelActionsRenderContext = {
  tilery: TileryHandle;
  closeMenu: () => void;
};

export type PanelActionsProps = {
  panel: TileryPanelHandle;
  tilery: TileryHandle;
  showActionsButton: boolean;
  showNewTabButton: boolean;
  onNewTab?: (
    panel: TileryPanelHandle,
    ctx: { tilery: TileryHandle },
  ) => TileryTabInit | void;
  renderPanelActions?: (
    panel: TileryPanelHandle,
    ctx: TileryPanelActionsRenderContext,
  ) => React.ReactNode;
  renderActionsButtonIcon?: (panel: TileryPanelHandle) => React.ReactNode;
};

const splitDirections: { direction: TileryDirection; label: string }[] = [
  { direction: 'left', label: 'Split left' },
  { direction: 'right', label: 'Split right' },
  { direction: 'top', label: 'Split top' },
  { direction: 'bottom', label: 'Split bottom' },
];

function EllipsisIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="16"
      height="16"
      viewBox="0 0 16 16">
      <circle cx="4" cy="8" r="1.25" fill="currentColor" />
      <circle cx="8" cy="8" r="1.25" fill="currentColor" />
      <circle cx="12" cy="8" r="1.25" fill="currentColor" />
    </svg>
  );
}

function MinimizeIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="16"
      height="16"
      viewBox="0 0 16 16">
      <path
        d="M5 2.75V5H2.75M11 2.75V5h2.25M5 13.25V11H2.75M11 13.25V11h2.25"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function PanelActions({
  panel,
  tilery,
  showActionsButton,
  showNewTabButton,
  onNewTab,
  renderPanelActions,
  renderActionsButtonIcon,
}: PanelActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const closeMenu = useCallback(() => setIsOpen(false), []);
  const runAction = useCallback(
    (fn: () => void) => {
      fn();
      closeMenu();
    },
    [closeMenu],
  );
  const handleNewTab = useCallback(() => {
    if (!onNewTab) return;
    const tab = onNewTab(panel, { tilery });
    if (tab) panel.appendTab(tab);
  }, [onNewTab, panel, tilery]);

  if (!showNewTabButton && !showActionsButton) return null;

  if (panel.fullScreen) {
    if (!showActionsButton) return null;
    return (
      <div
        className="tilery__panel-actions"
        data-tilery-panel-actions=""
        onPointerDown={(e) => {
          e.stopPropagation();
        }}>
        <button
          type="button"
          className="tilery__panel-action-button"
          aria-label="Minimize panel"
          title="Minimize panel"
          onClick={() => panel.restore()}>
          <MinimizeIcon />
        </button>
      </div>
    );
  }

  const customActions = renderPanelActions?.(panel, { tilery, closeMenu });

  return (
    <div
      className="tilery__panel-actions"
      data-tilery-panel-actions=""
      onPointerDown={(e) => {
        e.stopPropagation();
      }}>
      {showNewTabButton && (
        <button
          type="button"
          className="tilery__panel-action-button"
          aria-label="New tab"
          disabled={!onNewTab}
          title={onNewTab ? 'New tab' : 'New tab handler not provided'}
          onClick={handleNewTab}>
          +
        </button>
      )}
      {showActionsButton && (
        <div className="tilery__panel-menu-shell">
          <button
            type="button"
            className="tilery__panel-action-button"
            aria-label="Panel actions"
            aria-haspopup="menu"
            aria-expanded={isOpen}
            onClick={() => setIsOpen((open) => !open)}>
            {renderActionsButtonIcon?.(panel) ?? <EllipsisIcon />}
          </button>
          {isOpen && (
            <div
              className="tilery__panel-menu"
              role="menu"
              onKeyDown={(e) => {
                if (e.key === 'Escape') closeMenu();
              }}>
              {!panel.floating && (
                <div className="tilery__panel-menu-section">
                  {splitDirections.map(({ direction, label }) => (
                    <button
                      key={direction}
                      type="button"
                      className="tilery__panel-menu-item"
                      role="menuitem"
                      onClick={() => runAction(() => panel.split(direction))}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
              <div className="tilery__panel-menu-section">
                <button
                  type="button"
                  className="tilery__panel-menu-item"
                  role="menuitem"
                  onClick={() =>
                    runAction(() =>
                      panel.floating ? panel.dock() : panel.float(),
                    )
                  }>
                  {panel.floating ? 'Dock panel' : 'Float panel'}
                </button>
                <button
                  type="button"
                  className="tilery__panel-menu-item"
                  role="menuitem"
                  onClick={() => runAction(() => panel.maximize())}>
                  Maximize
                </button>
                <button
                  type="button"
                  className="tilery__panel-menu-item"
                  role="menuitem"
                  onClick={() => runAction(() => panel.remove())}>
                  Close panel
                </button>
              </div>
              {customActions && (
                <div className="tilery__panel-menu-section">
                  {customActions}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
