import type { Metadata } from 'next';
import { docs, docsBySlug } from '../../../content/docs';
import { ContentPage } from '../../../components/content-page';

type DocPageParams = { slug: string[] };

export function generateStaticParams() {
  return docs.map((d) => ({ slug: d.slug.split('/') }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<DocPageParams>;
}): Promise<Metadata> {
  const { slug: slugParts } = await params;
  const page = docsBySlug.get(slugParts.join('/'));
  if (!page) return {};

  return {
    title: page.title,
    description: page.description,
  };
}

export default function DocPage({
  params,
}: {
  params: Promise<DocPageParams>;
}) {
  return (
    <ContentPage
      params={params}
      dataMap={docsBySlug}
      resolveSlug={(p) => p.slug.join('/')}
      hrefPrefix="/docs"
      wrapperClassName="doc-page max-w-[800px]"
    />
  );
}
