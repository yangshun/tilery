import { notFound } from 'next/navigation';
import type { ComponentType } from 'react';
import { getAdjacentSiteNavigation } from '../content/navigation';
import { PageNavigation } from './page-navigation';

export type ContentPageData = {
  slug: string;
  title: string;
  description: string;
  Content: ComponentType;
};

export type ContentPageProps<P> = {
  params: Promise<P>;
  dataMap: Map<string, ContentPageData>;
  resolveSlug: (params: P) => string;
  hrefPrefix: string;
  wrapperClassName: string;
};

export async function ContentPage<P>({
  params,
  dataMap,
  resolveSlug,
  hrefPrefix,
  wrapperClassName,
}: ContentPageProps<P>) {
  const resolvedParams = await params;
  const page = dataMap.get(resolveSlug(resolvedParams));
  if (!page) notFound();
  const navigation = getAdjacentSiteNavigation(`${hrefPrefix}/${page.slug}`);
  const Content = page.Content;

  return (
    <article className={wrapperClassName}>
      <h1>{page.title}</h1>
      <p className={`${wrapperClassName}__description`}>{page.description}</p>
      <Content />
      <PageNavigation previous={navigation.previous} next={navigation.next} />
    </article>
  );
}
