/**
 * Hit-test pointer position to panel/edge/tab-bar drop zones.
 * Pure geometry helpers that map raw pixel coordinates to zone descriptors
 * consumed by the drag commit logic.
 */
import type { TileryDirection } from '../types';

/** A directional split zone or the center (tab-merge) zone within a panel. */
export type TileryPanelZone = TileryDirection | 'center';

/**
 * Map a pointer position inside a panel rect to its drop zone. Edge zones are
 * determined by an angular threshold within `edgeFraction` of each side;
 * corner regions resolve to `top` or `bottom` rather than the nearest edge.
 *
 * @returns The zone, or `null` when the pointer is outside the rect.
 */
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

/**
 * Test whether a pointer is within the outer `edgeSize` pixels of a rect on
 * any side, returning that direction.
 *
 * @returns The edge direction, or `null` when the pointer is in the interior
 *   or outside the rect entirely.
 */
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

/**
 * Resolved drop position within a tab bar: insert before or after a specific
 * tab, or append to the end.
 */
export type TileryTabBarHit =
  | { kind: 'before'; tabId: string }
  | { kind: 'after'; tabId: string }
  | { kind: 'append' };

/**
 * Determine where a dragged tab should be inserted in a tab bar given the
 * current horizontal tab rects and pointer position. The midpoint of each tab
 * splits the before/after regions; positions past all tabs resolve to append.
 */
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
