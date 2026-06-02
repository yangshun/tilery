import Link from 'next/link';
import { Children, isValidElement, type ReactNode } from 'react';
import { CodeBlock } from './components/code-block';

type MdxComponentMap = Record<string, unknown>;

function textContent(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textContent).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return textContent(node.props.children);
  }
  return '';
}

function languageFromClassName(className: unknown) {
  if (typeof className !== 'string') return 'tsx';
  return className.match(/language-([\w-]+)/)?.[1] ?? 'tsx';
}

function MdxAnchor({
  href,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (href?.startsWith('/')) return <Link href={href} {...props} />;
  return <a href={href} {...props} />;
}

async function MdxPre({ children }: { children?: ReactNode }) {
  const child = Children.only(children);

  if (isValidElement<{ className?: string; children?: ReactNode }>(child)) {
    return (
      <CodeBlock
        code={textContent(child.props.children)}
        language={languageFromClassName(child.props.className)}
      />
    );
  }

  return <pre>{children}</pre>;
}

export function useMDXComponents(components: MdxComponentMap): MdxComponentMap {
  return {
    a: MdxAnchor,
    pre: MdxPre,
    ...components,
  };
}
