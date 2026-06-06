import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ReactNode } from 'react';
import { CodeBlock } from './code-block';
import { DemoMount } from './demo-mount';
import { DemoSurface, type DemoSurfaceMode } from './demo-surface';
import {
  extractSourceRegion,
  extractSourceRegions,
} from '../lib/source-region';

/**
 * Renders a live example demo beside its source code.
 *
 * The displayed code is read at build time from the *same* `.tsx` file the demo
 * component is imported from, so it can never drift from what renders:
 *
 * ```mdx
 * import { DraculaThemeExample } from './themes/example';
 * <Demo source="themes/example.tsx" region="dracula" surface="plain">
 *   <DraculaThemeExample />
 * </Demo>
 * ```
 *
 * `source` is relative to `src/content/examples/`. Prefer `region` or
 * `regions` so displayed snippets stay focused on usage code. A missing region
 * throws, to fail loudly on authoring typos. The live demo is passed as
 * `children` and rendered through a client mount gate.
 */
export function Demo({
  source,
  region,
  regions,
  surface = 'boxed',
  children,
}: {
  source: string;
  region?: string;
  regions?: readonly string[];
  surface?: DemoSurfaceMode;
  children: ReactNode;
}) {
  const filePath = resolve(process.cwd(), 'src/content/examples', source);
  const fileSource = readFileSync(filePath, 'utf-8');
  const code = resolveDemoSourceCode({ fileSource, region, regions, source });

  return (
    <section className="example-preview__case">
      <DemoSurface surface={surface}>
        <DemoMount>{children}</DemoMount>
      </DemoSurface>
      <div className="example-preview__source">
        <CodeBlock code={code} />
      </div>
    </section>
  );
}

export function resolveDemoSourceCode({
  fileSource,
  source,
  region,
  regions,
}: {
  fileSource: string;
  source: string;
  region?: string;
  regions?: readonly string[];
}) {
  if (region && regions) {
    throw new Error('<Demo>: use either `region` or `regions`, not both');
  }

  if (region) {
    const extracted = extractSourceRegion(fileSource, region);
    if (extracted === null) {
      throw new Error(
        `<Demo>: source-region "${region}" not found in ${source}`,
      );
    }
    return extracted;
  }

  if (regions) {
    const extracted = extractSourceRegions(fileSource, regions);
    if (extracted === null) {
      const missing = regions.find(
        (currentRegion) =>
          extractSourceRegion(fileSource, currentRegion) === null,
      );
      throw new Error(
        `<Demo>: source-region "${missing ?? regions.join(', ')}" not found in ${source}`,
      );
    }
    return extracted;
  }

  return fileSource.trim();
}
