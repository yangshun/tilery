import type { TileryDirection } from '../types';

export type TileryPanelZone = TileryDirection | 'center';

export function tileryZoneAt(
  rect: { left: number; top: number; width: number; height: number },
  x: number,
  y: number,
  edgeFraction: number = 0.25,
): TileryPanelZone | null {
  const localX = x - rect.left;
  const localY = y - rect.top;
  if (localX < 0 || localX > rect.width || localY < 0 || localY > rect.height) {
    return null;
  }
  const fx = localX / rect.width;
  const fy = localY / rect.height;
  if (fx < edgeFraction) {
    if (fy < fx) return 'top';
    if (1 - fy < fx) return 'bottom';
    return 'left';
  }
  if (1 - fx < edgeFraction) {
    const fxFromRight = 1 - fx;
    if (fy < fxFromRight) return 'top';
    if (1 - fy < fxFromRight) return 'bottom';
    return 'right';
  }
  if (fy < edgeFraction) return 'top';
  if (1 - fy < edgeFraction) return 'bottom';
  return 'center';
}

export function tileryEdgeZoneAt(
  rect: { left: number; top: number; width: number; height: number },
  x: number,
  y: number,
  edgeSize: number = 24,
): TileryDirection | null {
  const localX = x - rect.left;
  const localY = y - rect.top;
  if (localX < 0 || localX > rect.width || localY < 0 || localY > rect.height) {
    return null;
  }
  const clampedEdgeSize = Math.max(0, edgeSize);
  if (localY < clampedEdgeSize) return 'top';
  if (rect.height - localY < clampedEdgeSize) return 'bottom';
  if (localX < clampedEdgeSize) return 'left';
  if (rect.width - localX < clampedEdgeSize) return 'right';
  return null;
}

export type TileryTabBarHit =
  | { kind: 'before'; tabId: string }
  | { kind: 'after'; tabId: string }
  | { kind: 'append' };

export function tileryTabBarDropAt(
  tabRects: { tabId: string; left: number; right: number }[],
  x: number,
): TileryTabBarHit {
  for (const tr of tabRects) {
    if (x < tr.left) continue;
    if (x <= tr.right) {
      const mid = (tr.left + tr.right) / 2;
      return x < mid
        ? { kind: 'before', tabId: tr.tabId }
        : { kind: 'after', tabId: tr.tabId };
    }
  }
  return { kind: 'append' };
}

export function tileryZoneToSplitInset(
  zone: TileryDirection,
  panelRect: { left: number; top: number; width: number; height: number },
): { left: number; top: number; width: number; height: number } {
  const half =
    zone === 'left' || zone === 'right'
      ? { w: panelRect.width / 2, h: panelRect.height }
      : { w: panelRect.width, h: panelRect.height / 2 };
  switch (zone) {
    case 'left':
      return {
        left: panelRect.left,
        top: panelRect.top,
        width: half.w,
        height: half.h,
      };
    case 'right':
      return {
        left: panelRect.left + panelRect.width - half.w,
        top: panelRect.top,
        width: half.w,
        height: half.h,
      };
    case 'top':
      return {
        left: panelRect.left,
        top: panelRect.top,
        width: half.w,
        height: half.h,
      };
    case 'bottom':
      return {
        left: panelRect.left,
        top: panelRect.top + panelRect.height - half.h,
        width: half.w,
        height: half.h,
      };
  }
}
