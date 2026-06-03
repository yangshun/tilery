/**
 * Resolve TilerySize values (number / '%' / 'px') to percentages.
 */
import type { TilerySize, TilerySizeResolutionContext } from '../types';

type Axis = 'horizontal' | 'vertical';

const SIZE_RE = /^(-?(?:\d+|\d*\.\d+))\s*(%|px)$/;

/**
 * Converts a `TilerySize` value to a percentage of the containing axis.
 * Accepts three forms: a bare `number` (treated as a percentage directly),
 * a `'%'`-suffixed string (e.g. `'25%'`), or a `'px'`-suffixed string
 * (e.g. `'120px'`, resolved via `axisPixels`). Returns `null` when `size`
 * is undefined, non-finite, unparseable, or a pixel string and `axisPixels`
 * is absent or non-positive.
 */
export function tileryResolveSizePercent(
  size: TilerySize | undefined,
  axisPixels: number | undefined,
): number | null {
  if (typeof size === 'number') {
    return Number.isFinite(size) ? Math.max(0, size) : null;
  }
  if (typeof size !== 'string') return null;
  const match = SIZE_RE.exec(size.trim());
  if (!match) return null;
  const value = Number(match[1]);
  /* v8 ignore next -- retained for malformed runtime values beyond the public size syntax. */
  if (!Number.isFinite(value)) return null;
  if (match[2] === '%') return Math.max(0, value);
  if (!axisPixels || axisPixels <= 0) return null;
  return Math.max(0, (value / axisPixels) * 100);
}

/**
 * Computes the pixel length of a span along `axis` given a size-resolution
 * context and an optional `spanPercent` (defaults to 100 %). Returns
 * `undefined` when the context is absent or the root pixel dimension is
 * non-positive.
 */
export function tileryAxisPixels(
  context: TilerySizeResolutionContext | undefined,
  axis: Axis,
  spanPercent = 100,
): number | undefined {
  const rootPixels = axis === 'horizontal' ? context?.width : context?.height;
  if (!rootPixels || rootPixels <= 0) return undefined;
  return (rootPixels * Math.max(0, spanPercent)) / 100;
}
