import { codeToHtml } from 'shiki';

/**
 * Highlight code with both light and dark Shiki themes. Tokens carry
 * `--shiki-light` / `--shiki-dark` CSS variables (no baked-in color), and
 * globals.css picks the active set based on the `data-theme` attribute.
 */
export function highlightCode(code: string, language = 'tsx') {
  return codeToHtml(code, {
    lang: language,
    themes: {
      light: 'github-light',
      dark: 'github-dark-default',
    },
    defaultColor: false,
  });
}
