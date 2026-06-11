import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ReactNode } from 'react';
import { CodeBlock } from './ui/code-block';
import { DemoMount } from './demo-mount';
import { DemoSurface, type DemoSurfaceMode } from './demo-surface';
import {
  extractSourceRegion,
  extractSourceRegions,
} from '../lib/source-region';

export function Demo({
  source,
  region,
  regions,
  surface = 'boxed',
  height,
  children,
}: {
  source: string;
  region?: string;
  regions?: readonly string[];
  surface?: DemoSurfaceMode;
  height?: number;
  children: ReactNode;
}) {
  const filePath = resolve(process.cwd(), 'src/content/examples', source);
  const fileSource = readFileSync(filePath, 'utf-8');
  const code = resolveDemoSourceCode({ fileSource, region, regions, source });

  return (
    <section className="min-w-0 my-12">
      <DemoSurface surface={surface} height={height}>
        <DemoMount>{children}</DemoMount>
      </DemoSurface>
      <div className="mt-4">
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
