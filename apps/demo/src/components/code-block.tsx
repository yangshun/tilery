import { codeToHtml } from 'shiki';
import { CodeBlockFrame } from './code-block-frame';

export async function CodeBlock({
  code,
  language = 'tsx',
}: {
  code: string;
  language?: string;
}) {
  const trimmedCode = code.trim();
  const html = await codeToHtml(trimmedCode, {
    lang: language,
    theme: 'github-dark-default',
  });

  return <CodeBlockFrame code={trimmedCode} html={html} />;
}
