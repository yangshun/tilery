import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ReactNode } from 'react';
import { CodeBlock } from './code-block';
import { DemoMount } from './demo-mount';
import { DemoSurface, type DemoSurfaceMode } from './demo-surface';
import { extractSourceRegion } from '../lib/source-region';

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
 * `source` is relative to `src/content/examples/`. Omit `region` to show the
 * whole file; otherwise it must match a `// source-region <region>` marker
 * pair (a missing region throws, to fail loudly on authoring typos). The live
 * demo is passed as `children` and rendered through a client mount gate.
 */
export function Demo({
  source,
  region,
  surface = 'boxed',
  children,
}: {
  source: string;
  region?: string;
  surface?: DemoSurfaceMode;
  children: ReactNode;
}) {
  const filePath = resolve(process.cwd(), 'src/content/examples', source);
  const fileSource = readFileSync(filePath, 'utf-8');

  let code: string;
  if (region) {
    const extracted = extractSourceRegion(fileSource, region);
    if (extracted === null) {
      throw new Error(
        `<Demo>: source-region "${region}" not found in ${source}`,
      );
    }
    code = extracted;
  } else {
    code = fileSource.trim();
  }

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
