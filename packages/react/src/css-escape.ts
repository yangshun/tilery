/**
 * Escape a string for safe use inside a CSS attribute selector. Prefers the
 * native `CSS.escape`, falling back to a backslash-escaping regex where it is
 * unavailable (older or non-DOM environments).
 */
export function tileryCssEscape(value: string): string {
  /* v8 ignore next 3 */
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value);
  }
  return value.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
}
