'use client';

import { useEffect, useRef, useState } from 'react';

const MAX_CODE_BLOCK_HEIGHT = 360;

export function CodeBlockFrame({ html }: { html: string }) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const updateCanExpand = () => {
      const nextCanExpand = content.scrollHeight > MAX_CODE_BLOCK_HEIGHT + 1;
      setCanExpand(nextCanExpand);

      if (!nextCanExpand) {
        setExpanded(false);
      }
    };

    updateCanExpand();
    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(updateCanExpand);
    observer?.observe(content);
    window.addEventListener('resize', updateCanExpand);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', updateCanExpand);
    };
  }, [html]);

  return (
    <div
      className={
        expanded
          ? 'code-block code-block--expanded'
          : canExpand
            ? 'code-block code-block--collapsed code-block--can-expand'
            : 'code-block code-block--collapsed'
      }>
      <div
        ref={contentRef}
        className="code-block__content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {canExpand ? (
        <button
          type="button"
          className="code-block__toggle"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}>
          {expanded ? 'Collapse' : 'Show full code'}
        </button>
      ) : null}
    </div>
  );
}
