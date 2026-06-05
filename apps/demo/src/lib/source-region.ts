/**
 * Extracts the source between `// source-region <region>` and
 * `// end-source-region <region>` markers in a file's text, trimmed of the
 * marker lines. Returns `null` when the markers are missing or malformed.
 *
 * Used to show a focused slice of an example's actual `.tsx` source — the same
 * file whose component is rendered live — so displayed code is never
 * duplicated.
 */
export function extractSourceRegion(
  source: string,
  region: string,
): string | null {
  const startMarker = `// source-region ${region}`;
  const endMarker = `// end-source-region ${region}`;
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker);
  if (start === -1 || end === -1 || end <= start) return null;
  return source.slice(start + startMarker.length, end).trim();
}
