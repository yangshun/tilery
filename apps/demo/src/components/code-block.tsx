import { codeToHtml } from 'shiki';
import { CodeBlockFrame } from './code-block-frame';

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

  return <CodeBlockFrame html={html} />;
}
