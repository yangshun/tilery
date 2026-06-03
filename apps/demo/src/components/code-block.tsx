import { highlightCode } from '../lib/highlight';
import { CodeBlockFrame } from './code-block-frame';

export async function CodeBlock({
  code,
  language = 'tsx',
}: {
  code: string;
  language?: string;
}) {
  const trimmedCode = code.trim();
  const html = await highlightCode(trimmedCode, language);

  return <CodeBlockFrame code={trimmedCode} html={html} />;
}
