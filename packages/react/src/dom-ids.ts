/**
 * DOM id helpers for Tilery panel elements.
 *
 * Provides a stable, URI-safe mapping between panel IDs and their
 * corresponding HTML element IDs.
 */

/**
 * Returns the `id` attribute value for the root DOM element of the given
 * panel, used to locate the element without traversing the React tree.
 */
export function tileryPanelDomId(panelId: string): string {
  return `tilery-panel-${encodeURIComponent(panelId)}`;
}

/**
 * Returns the `id` for a tab's trigger element. The tab's content panel
 * references it via `aria-labelledby` to name the panel after its tab.
 */
export function tileryTabDomId(tabId: string): string {
  return `tilery-tab-${encodeURIComponent(tabId)}`;
}

/**
 * Returns the `id` for a tab's content panel (`role="tabpanel"`), referenced by
 * the owning tab's `aria-controls`.
 */
export function tileryTabPanelDomId(tabId: string): string {
  return `tilery-tabpanel-${encodeURIComponent(tabId)}`;
}
