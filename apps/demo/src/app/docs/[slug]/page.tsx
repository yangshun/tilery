import { notFound } from 'next/navigation';
import { docs } from '../../../content/docs';
import { CodeBlock } from '../../../components/code-block';

export function generateStaticParams() {
  return docs.map((d) => ({ slug: d.slug }));
}

export default async function DocPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = docs.find((d) => d.slug === slug);
  if (!page) notFound();

  return (
    <article>
      <h1>{page.title}</h1>
      <p className="doc-description">{page.description}</p>
      {page.sections.map((section, i) => (
        <section key={i}>
          {section.heading && <h2>{section.heading}</h2>}
          {section.body?.map((paragraph, j) => (
            <p key={j}>{paragraph}</p>
          ))}
          {section.code && (
            <CodeBlock code={section.code} language={section.language} />
          )}
          {section.table && (
            <table>
              <thead>
                <tr>
                  {section.table.headers.map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {section.table.rows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci}>
                        <code>{cell}</code>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ))}
    </article>
  );
}
