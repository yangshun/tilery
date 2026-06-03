'use client';

/**
 * Panel frame: tab bar + content host.
 */

import {
  tileryPanelBehaviorFromState,
  type TileryFloatingResizeEdge,
  type TileryPanel,
  type TileryTab,
} from 'tilery/internal';
import { tileryPanelDomId } from '../dom-ids';
import { TabBar, type TabBarProps } from './tab-bar';

/**
 * Props for the {@link PanelChrome} component.
 */
export type PanelChromeProps = Omit<TabBarProps, 'panel' | 'renderHeader'> & {
  /** The panel model that drives layout, behavior flags, and tab list. */
  panel: TileryPanel;
  /**
   * Renders the visible header content (title, icon, etc.) for a single tab
   * both in the tab strip and in the overflow menu.
   */
  renderHeader: (tab: TileryTab, ctx: { isActive: boolean }) => React.ReactNode;
  /** Callback ref that registers the panel's root DOM element. */
  registerPanel: (el: HTMLElement | null) => void;
  /** Callback ref that registers the empty slot where panel content is
   *  portal-rendered. */
  registerContentSlot: (el: HTMLElement | null) => void;
  /**
   * Set to `true` when the component is rendered inside a native pop-out
   * window, causing the panel to fill the entire viewport.
   * @defaultValue false
   */
  popoutWindow?: boolean;
  /**
   * Explicit inline styles that override the auto-computed inset placement.
   * Primarily used for edge panels that are sized by an external handle.
   */
  placementStyle?: React.CSSProperties;
  /** Called when a pointer-down event occurs on the panel root. */
  onPanelPointerDown?: (e: React.PointerEvent, panelId: string) => void;
  /**
   * Called when a pointer-down event occurs on one of the floating-panel
   * resize edge handles.
   */
  onFloatingResizePointerDown?: (
    e: React.PointerEvent,
    panelId: string,
    edge: TileryFloatingResizeEdge,
  ) => void;
};

const floatingResizeEdges: TileryFloatingResizeEdge[] = [
  'top',
  'right',
  'bottom',
  'left',
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
];

/**
 * Outer shell of a single panel: computes the panel's CSS position from the
 * layout state (tiled inset, floating bounds, full-screen, or popout),
 * renders the {@link TabBar} and an empty content slot, and attaches floating
 * resize handles when the panel is in floating mode.
 */
export function PanelChrome({
  panel,
  tilery,
  renderHeader,
  renderTabTrigger,
  registerPanel,
  registerContentSlot,
  popoutWindow = false,
  placementStyle,
  onPanelPointerDown,
  onFloatingResizePointerDown,
  ...tabBarProps
}: PanelChromeProps) {
  const { top, right, bottom, left } = panel.inset;
  const isFullScreen = panel.fullScreen;
  const floatingBounds = panel.floatingBounds;
  const isFloating = panel.floating && Boolean(floatingBounds);
  const isNativePopout = popoutWindow && panel.poppedOut;
  const behavior = tileryPanelBehaviorFromState(tilery.getState(), panel.id);
  const style = isFullScreen
    ? {
        top: '0%',
        right: '0%',
        bottom: '0%',
        left: '0%',
      }
    : isNativePopout
      ? {
          top: '0%',
          right: '0%',
          bottom: '0%',
          left: '0%',
        }
      : isFloating && floatingBounds
        ? {
            top: `${floatingBounds.y}%`,
            left: `${floatingBounds.x}%`,
            width: `${floatingBounds.width}%`,
            height: `${floatingBounds.height}%`,
            zIndex: panel.floatingZIndex,
          }
        : placementStyle
          ? placementStyle
          : {
              top: `${top}%`,
              right: `${right}%`,
              bottom: `${bottom}%`,
              left: `${left}%`,
            };
  return (
    <div
      id={tileryPanelDomId(panel.id)}
      ref={registerPanel}
      className="tilery__panel"
      data-panel-id={panel.id}
      data-floating={isFloating}
      data-edge={panel.edge}
      data-popout={panel.poppedOut}
      data-full-screen={isFullScreen}
      data-resizable={behavior.resizable}
      data-draggable={behavior.draggable}
      data-droppable={behavior.droppable}
      style={style}
      onPointerDown={(e) => onPanelPointerDown?.(e, panel.id)}>
      <TabBar
        panel={panel}
        tilery={tilery}
        renderHeader={renderHeader}
        renderTabTrigger={renderTabTrigger}
        {...tabBarProps}
      />
      <div ref={registerContentSlot} className="tilery__panel-content" />
      {isFloating && !isNativePopout && !isFullScreen && behavior.resizable
        ? floatingResizeEdges.map((edge) => (
            <div
              key={edge}
              className="tilery__floating-resize-handle"
              data-floating-resize-edge={edge}
              onPointerDown={(e) =>
                onFloatingResizePointerDown?.(e, panel.id, edge)
              }
              onPointerMove={tabBarProps.onTabPointerMove}
              onPointerUp={tabBarProps.onTabBarPointerUp}
              onPointerCancel={tabBarProps.onTabPointerCancel}
            />
          ))
        : null}
    </div>
  );
}
