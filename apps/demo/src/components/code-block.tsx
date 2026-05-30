import { codeToHtml } from 'shiki';

export async function CodeBlock({
  code,
  language = 'tsx',
}: {
  code: string;
  language?: string;
}) {
  const html = await codeToHtml(code.trim(), {
    lang: language,
    theme: 'github-dark-default',
  });

  return (
    <div className="code-block" dangerouslySetInnerHTML={{ __html: html }} />
  );
}
