export function CodeBlock({
  code,
  language = 'tsx',
}: {
  code: string;
  language?: string;
}) {
  return (
    <pre data-language={language}>
      <code>{code.trim()}</code>
    </pre>
  );
}
