import { notFound } from 'next/navigation';
import type { ComponentType } from 'react';
import { getAdjacentSiteNavigation } from '../content/navigation';
import { PageNavigation } from './page-navigation';
import { cn } from '../lib/cn';

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
  wrapperClassName?: string;
  descriptionClassName?: string;
};

export async function ContentPage<P>({
  params,
  dataMap,
  resolveSlug,
  hrefPrefix,
  wrapperClassName,
  descriptionClassName,
}: ContentPageProps<P>) {
  const resolvedParams = await params;
  const page = dataMap.get(resolveSlug(resolvedParams));
  if (!page) notFound();
  const navigation = getAdjacentSiteNavigation(`${hrefPrefix}/${page.slug}`);
  const Content = page.Content;

  return (
    <article
      className={cn(
        'content-page mx-auto px-10 py-8 max-lg:px-5 max-lg:pt-7 max-lg:pb-13',
        wrapperClassName,
      )}>
      <h1>{page.title}</h1>
      <p
        className={cn(
          'text-[15px] text-site-muted mb-6',
          descriptionClassName,
        )}>
        {page.description}
      </p>
      <Content />
      <PageNavigation previous={navigation.previous} next={navigation.next} />
    </article>
  );
}
