import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { examples, examplesBySlug } from '../../../content/examples';
import { PageNavigation } from '../../../components/page-navigation';
import { getAdjacentSiteNavigation } from '../../../content/navigation';

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
  const page = examplesBySlug.get(slug);
  if (!page) notFound();

  return {
    title: page.title,
    description: page.description,
  };
}

export default async function Page({ params }: ExampleRouteProps) {
  const { slug } = await params;
  const page = examplesBySlug.get(slug);
  if (!page) notFound();
  const navigation = getAdjacentSiteNavigation(`/examples/${slug}`);
  const Content = page.Content;

  return (
    <div className="example-preview">
      <h1>{page.title}</h1>
      <p className="example-preview__description">{page.description}</p>
      <Content />
      <PageNavigation previous={navigation.previous} next={navigation.next} />
    </div>
  );
}
