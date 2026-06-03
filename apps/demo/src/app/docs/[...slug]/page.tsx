import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { docs, docsBySlug } from '../../../content/docs';
import { PageNavigation } from '../../../components/page-navigation';
import { getAdjacentSiteNavigation } from '../../../content/navigation';

type DocPageProps = {
  params: Promise<{ slug: string[] }>;
};

export function generateStaticParams() {
  return docs.map((d) => ({ slug: d.slug.split('/') }));
}

export async function generateMetadata({
  params,
}: DocPageProps): Promise<Metadata> {
  const { slug: slugParts } = await params;
  const slug = slugParts.join('/');
  const page = docsBySlug.get(slug);
  if (!page) notFound();

  return {
    title: page.title,
    description: page.description,
  };
}

export default async function DocPage({ params }: DocPageProps) {
  const { slug: slugParts } = await params;
  const slug = slugParts.join('/');
  const page = docsBySlug.get(slug);
  if (!page) notFound();
  const navigation = getAdjacentSiteNavigation(`/docs/${page.slug}`);
  const Content = page.Content;

  return (
    <article className="doc-page">
      <h1>{page.title}</h1>
      <p className="doc-description">{page.description}</p>
      <Content />
      <PageNavigation previous={navigation.previous} next={navigation.next} />
    </article>
  );
}
