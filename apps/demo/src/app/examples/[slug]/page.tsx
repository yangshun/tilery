import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { codeToHtml } from 'shiki';
import { examples } from '../../../content/examples';
import { getAdjacentSiteNavigation } from '../../../content/navigation';
import { ExamplePage } from './example-page';

type ExampleRouteProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return examples.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: ExampleRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const meta = examples.find((e) => e.slug === slug);
  if (!meta) notFound();

  return {
    title: meta.title,
    description: meta.description,
  };
}

export default async function Page({ params }: ExampleRouteProps) {
  const { slug } = await params;
  const meta = examples.find((e) => e.slug === slug);
  if (!meta) notFound();
  const pageNavigation = getAdjacentSiteNavigation(`/examples/${slug}`);

  const filePath = resolve(
    process.cwd(),
    `src/content/examples/${slug}/example.tsx`,
  );
  const source = readFileSync(filePath, 'utf-8');
  const demos = await Promise.all(
    (meta.demos ?? [{ id: 'default' }]).map(async (demo) => {
      const sourceRegion = 'sourceRegion' in demo ? demo.sourceRegion : demo.id;

      return {
        id: demo.id,
        sourceHtml: await codeToHtml(
          extractSourceRegion(source, sourceRegion) ?? source.trim(),
          {
            lang: 'tsx',
            theme: 'github-dark-default',
          },
        ),
      };
    }),
  );

  return (
    <ExamplePage
      slug={slug}
      title={meta.title}
      description={meta.description}
      guide={meta.guide}
      demos={demos}
      navigation={pageNavigation}
    />
  );
}

function extractSourceRegion(source: string, region: string) {
  const startMarker = `// source-region ${region}`;
  const endMarker = `// end-source-region ${region}`;
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker);

  if (start === -1 || end === -1 || end <= start) return null;
  return source.slice(start + startMarker.length, end).trim();
}
