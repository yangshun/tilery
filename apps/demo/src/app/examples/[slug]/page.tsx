import type { Metadata } from 'next';
import { examples, examplesBySlug } from '../../../content/examples';
import { ContentPage } from '../../../components/content-page';
import pageStyles from './page.module.css';

type ExamplePageParams = { slug: string };

export function generateStaticParams() {
  return examples.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<ExamplePageParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = examplesBySlug.get(slug);
  if (!page) return {};

  return {
    title: page.title,
    description: page.description,
  };
}

export default function ExamplePage({
  params,
}: {
  params: Promise<ExamplePageParams>;
}) {
  return (
    <ContentPage
      params={params}
      dataMap={examplesBySlug}
      resolveSlug={(p) => p.slug}
      hrefPrefix="/examples"
      styles={pageStyles}
    />
  );
}
