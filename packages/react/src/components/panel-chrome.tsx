'use client';

import {
  tileryPanelBehaviorFromState,
  type TileryPanelHandle,
  type TileryTabHandle,
} from 'tilery/internal';
import { tileryPanelDomId } from '../dom-ids';
import { TabBar, type TabBarProps } from './tab-bar';

export type PanelChromeProps = Omit<TabBarProps, 'panel' | 'renderHeader'> & {
  panel: TileryPanelHandle;
  renderHeader: (
    tab: TileryTabHandle,
    ctx: { isActive: boolean },
  ) => React.ReactNode;
  registerPanel: (el: HTMLElement | null) => void;
  registerContentSlot: (el: HTMLElement | null) => void;
  popoutWindow?: boolean;
  onPanelPointerDown?: (e: React.PointerEvent, panelId: string) => void;
  onFloatingResizePointerDown?: (
    e: React.PointerEvent,
    panelId: string,
    edge: TileryFloatingResizeEdge,
  ) => void;
};

export type TileryFloatingResizeEdge =
  | 'top'
  | 'right'
  | 'bottom'
  | 'left'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

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

export function PanelChrome({
  panel,
  tilery,
  renderHeader,
  registerPanel,
  registerContentSlot,
  popoutWindow = false,
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
