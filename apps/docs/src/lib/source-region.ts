/**
 * Extracts the source between `source-region <region>` and
 * `end-source-region <region>` markers in a file's text, trimmed and dedented.
 *
 * Markers may be plain TypeScript comments:
 *
 * ```ts
 * // source-region example
 * // end-source-region example
 * ```
 *
 * Or JSX comments:
 *
 * ```tsx
 * {/* source-region example *\/}
 * {/* end-source-region example *\/}
 * ```
 *
 * Used to show a focused slice of an example's actual `.tsx` source — the same
 * file whose component is rendered live — so displayed code is never
 * duplicated.
 */
export function extractSourceRegion(
  source: string,
  region: string,
): string | null {
  const lines = source.split(/\r?\n/);
  let startLine = -1;

  for (const [index, line] of lines.entries()) {
    const marker = readSourceRegionMarker(line);

    if (startLine === -1) {
      if (marker?.kind === 'start' && marker.region === region) {
        startLine = index;
      }
      continue;
    }

    if (marker?.kind === 'end' && marker.region === region) {
      return dedentSource(lines.slice(startLine + 1, index).join('\n'));
    }
  }

  return null;
}

export function extractSourceRegions(
  source: string,
  regions: readonly string[],
): string | null {
  const extracted = regions.map((region) =>
    extractSourceRegion(source, region),
  );
  if (extracted.some((region) => region === null)) return null;
  return extracted.join('\n\n');
}

function readSourceRegionMarker(
  line: string,
): { kind: 'end' | 'start'; region: string } | null {
  const trimmed = line.trim();
  const lineCommentMatch = trimmed.match(
    /^\/\/\s*(end-)?source-region\s+(\S+)$/,
  );
  if (lineCommentMatch) {
    return {
      kind: lineCommentMatch[1] ? 'end' : 'start',
      region: lineCommentMatch[2],
    };
  }

  const jsxCommentMatch = trimmed.match(
    /^\{\/\*\s*(end-)?source-region\s+(\S+)\s*\*\/\}$/,
  );
  if (jsxCommentMatch) {
    return {
      kind: jsxCommentMatch[1] ? 'end' : 'start',
      region: jsxCommentMatch[2],
    };
  }

  return null;
}

function dedentSource(source: string): string {
  const lines = trimBlankLines(source.split('\n'));
  const indent = Math.min(
    ...lines
      .filter((line) => line.trim().length > 0)
      .map((line) => line.match(/^\s*/)?.[0].length ?? 0),
  );

  if (!Number.isFinite(indent) || indent === 0) return lines.join('\n');
  return lines.map((line) => line.slice(indent)).join('\n');
}

function trimBlankLines(lines: string[]) {
  let start = 0;
  let end = lines.length;

  while (start < end && lines[start].trim() === '') start += 1;
  while (end > start && lines[end - 1].trim() === '') end -= 1;

  return lines.slice(start, end);
}
