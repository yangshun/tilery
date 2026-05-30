import { notFound } from 'next/navigation';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { codeToHtml } from 'shiki';
import { examples } from '../../../content/examples';
import { ExamplePage } from './example-page';

export function generateStaticParams() {
  return examples.map((e) => ({ slug: e.slug }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const meta = examples.find((e) => e.slug === slug);
  if (!meta) notFound();

  const filePath = resolve(
    process.cwd(),
    `src/content/examples/${slug}/example.tsx`,
  );
  const source = readFileSync(filePath, 'utf-8');
  const highlightedHtml = await codeToHtml(source.trim(), {
    lang: 'tsx',
    theme: 'github-dark-default',
  });

  return (
    <ExamplePage slug={slug} title={meta.title} sourceHtml={highlightedHtml} />
  );
}
