'use client';

import { useEffect, useRef, useState } from 'react';

const MAX_CODE_BLOCK_HEIGHT = 360;

export function CodeBlockFrame({ code, html }: { code: string; html: string }) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const copyTimeoutRef = useRef<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const [copyState, setCopyState] = useState<'copied' | 'failed' | 'idle'>(
    'idle',
  );

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

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const resetCopyState = () => {
    if (copyTimeoutRef.current) {
      window.clearTimeout(copyTimeoutRef.current);
    }

    copyTimeoutRef.current = window.setTimeout(() => {
      setCopyState('idle');
      copyTimeoutRef.current = null;
    }, 1600);
  };

  const handleCopy = async () => {
    try {
      window.focus();
      await copyCode(code);
      setCopyState('copied');
      resetCopyState();
    } catch {
      setCopyState('failed');
      resetCopyState();
    }
  };

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
      <button
        type="button"
        className="code-block__copy"
        aria-label={
          copyState === 'copied'
            ? 'Copied code'
            : copyState === 'failed'
              ? 'Copy failed'
              : 'Copy code'
        }
        title={
          copyState === 'copied'
            ? 'Copied'
            : copyState === 'failed'
              ? 'Copy failed'
              : 'Copy code'
        }
        data-state={copyState}
        onClick={handleCopy}>
        {copyState === 'copied' ? <CheckIcon /> : <CopyIcon />}
      </button>
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

function CopyIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round">
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

async function copyCode(code: string) {
  const clipboard = window.navigator?.clipboard;

  try {
    copyCodeWithFallback(code);
    return;
  } catch (error) {
    if (!clipboard?.writeText || !window.isSecureContext) {
      throw error;
    }
  }

  if (clipboard?.writeText && window.isSecureContext) {
    await clipboard.writeText(code);
  }
}

function copyCodeWithFallback(code: string) {
  const textarea = document.createElement('textarea');
  textarea.value = code;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '-9999px';
  textarea.style.left = '-9999px';
  textarea.style.width = '1px';
  textarea.style.height = '1px';
  document.body.append(textarea);
  textarea.focus({ preventScroll: true });
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  const copied = document.execCommand('copy');
  textarea.remove();

  if (!copied) {
    throw new Error('Copy failed');
  }
}
